// ========================================================
// Event Controller
// Handles event discovery, advanced search & filtering,
// CRUD operations, publishing, cancellation, and registration.
// ========================================================

const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// Helper: Sanitize Google Maps embed URL (extracts src if iframe pasted, validates HTTPS Google Maps URL)
function sanitizeMapEmbedUrl(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return null;
  }
  let url = input.trim();
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1].trim();
  }
  const isGoogleMaps =
    url.startsWith('https://www.google.com/maps/embed') ||
    url.startsWith('https://maps.google.com/maps') ||
    url.startsWith('https://www.google.com/maps');
  if (!isGoogleMaps) {
    throw new Error('Invalid Map URL: Must be a valid Google Maps embed URL.');
  }
  return url;
}

// Helper: Save repeatable benefits ("Why You Should Attend") and event highlights
async function saveEventBenefitsAndHighlights(connection, eventId, benefitsInput, highlightsInput) {
  if (benefitsInput !== undefined) {
    await connection.query('DELETE FROM event_benefits WHERE event_id = ?', [eventId]);
    let benefitsList = [];
    if (typeof benefitsInput === 'string') {
      try { benefitsList = JSON.parse(benefitsInput); } catch (e) { benefitsList = []; }
    } else if (Array.isArray(benefitsInput)) {
      benefitsList = benefitsInput;
    }
    if (Array.isArray(benefitsList) && benefitsList.length > 0) {
      for (let i = 0; i < benefitsList.length; i++) {
        const item = benefitsList[i];
        if (item && (item.title || item.description)) {
          await connection.query(
            'INSERT INTO event_benefits (event_id, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
            [
              eventId,
              item.icon || '🎯',
              item.title ? String(item.title).trim() : 'Benefit',
              item.description ? String(item.description).trim() : '',
              item.sort_order !== undefined ? Number(item.sort_order) : i
            ]
          );
        }
      }
    }
  }

  if (highlightsInput !== undefined) {
    await connection.query('DELETE FROM event_highlights WHERE event_id = ?', [eventId]);
    let highlightsList = [];
    if (typeof highlightsInput === 'string') {
      try { highlightsList = JSON.parse(highlightsInput); } catch (e) { highlightsList = []; }
    } else if (Array.isArray(highlightsInput)) {
      highlightsList = highlightsInput;
    }
    if (Array.isArray(highlightsList) && highlightsList.length > 0) {
      for (let i = 0; i < highlightsList.length; i++) {
        const item = highlightsList[i];
        const title = typeof item === 'string' ? item.trim() : (item?.title ? String(item.title).trim() : '');
        if (title) {
          await connection.query(
            'INSERT INTO event_highlights (event_id, title, sort_order) VALUES (?, ?, ?)',
            [
              eventId,
              title,
              item?.sort_order !== undefined ? Number(item.sort_order) : i
            ]
          );
        }
      }
    }
  }
}

// 1. GET /api/events (Search & Filter)
async function getEvents(req, res) {
  try {
    const { search, category, location, date, date_filter, status, includeDrafts } = req.query;

    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.category_id,
        c.name AS category,
        e.date,
        e.time,
        e.location,
        e.address,
        e.map_embed_url,
        e.image,
        e.brochure,
        e.organizer_id,
        u.name AS organizer_name,
        e.registration_fee AS price,
        e.max_participants AS maxParticipants,
        e.status,
        e.registration_open,
        COUNT(r.id) AS registeredCount
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'Cancelled'
      WHERE 1=1
    `;

    const params = [];

    // Filter by general search query (title, description, or location)
    if (search && search.trim()) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    // Filter by specific category name or ID
    if (category && category.trim() && category !== 'All') {
      if (!isNaN(category)) {
        query += ` AND e.category_id = ?`;
        params.push(Number(category));
      } else {
        query += ` AND c.name = ?`;
        params.push(category.trim());
      }
    }

    // Filter by specific location
    if (location && location.trim()) {
      query += ` AND e.location LIKE ?`;
      params.push(`%${location.trim()}%`);
    }

    // Filter by specific date
    if (date && date.trim()) {
      query += ` AND e.date LIKE ?`;
      params.push(`%${date.trim()}%`);
    }

    // Quick Date Filters: 'today', 'tomorrow', 'this_week', 'upcoming'
    if (date_filter) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (date_filter === 'today') {
        query += ` AND (e.date LIKE ? OR e.date LIKE '%Today%')`;
        params.push(`%${todayStr}%`);
      } else if (date_filter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomStr = tomorrow.toISOString().split('T')[0];
        query += ` AND (e.date LIKE ? OR e.date LIKE '%Tomorrow%')`;
        params.push(`%${tomStr}%`);
      } else if (date_filter === 'upcoming') {
        // Returns active upcoming events
        query += ` AND e.status = 'Published'`;
      }
    }

    // Status filter: default to Published unless specific status requested or includeDrafts is true
    if (status && status !== 'All') {
      query += ` AND e.status = ?`;
      params.push(status);
    } else if (!includeDrafts) {
      query += ` AND e.status = 'Published'`;
    }

    query += ` GROUP BY e.id ORDER BY e.id DESC`;

    const [events] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving events.' });
  }
}

// 2. GET /api/events/:id (Single Event Details)
async function getEventById(req, res) {
  try {
    const { id } = req.params;

    const [events] = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.category_id,
        c.name AS category,
        e.date,
        e.time,
        e.location,
        e.address,
        e.map_embed_url,
        e.image,
        e.brochure,
        e.organizer_id,
        u.name AS organizer_name,
        u.email AS organizer_email,
        u.profile_image AS organizer_image,
        e.registration_fee AS price,
        e.max_participants AS maxParticipants,
        e.status,
        e.registration_open,
        COUNT(r.id) AS registeredCount
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'Cancelled'
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];

    // Check visibility authorization for Draft and Hidden events
    const isStaff = req.user && (req.user.role === 'admin' || req.user.id === event.organizer_id);
    if ((event.status === 'Draft' || event.status === 'Hidden') && !isStaff) {
      return res.status(404).json({
        success: false,
        message: 'This event is not currently available.'
      });
    }

    // Dynamic benefits ("Why You Should Attend")
    const [benefits] = await pool.query(
      'SELECT id, icon, title, description, sort_order FROM event_benefits WHERE event_id = ? ORDER BY sort_order ASC, id ASC',
      [id]
    );

    // Dynamic highlights
    const [highlights] = await pool.query(
      'SELECT id, title, sort_order FROM event_highlights WHERE event_id = ? ORDER BY sort_order ASC, id ASC',
      [id]
    );

    event.benefits = benefits;
    event.highlights = highlights;

    return res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving event details.' });
  }
}

// 3. POST /api/events (Create Event - Organizer / Admin)
async function createEvent(req, res) {
  try {
    const organizerId = req.user.id;
    const {
      title,
      description,
      category_id,
      date,
      time,
      location,
      address,
      map_embed_url,
      registration_fee,
      max_participants,
      status,
      registration_open,
      payment_required,
      payment_instructions,
      benefits,
      highlights
    } = req.body;

    let targetCategoryId = category_id || req.body.category;
    if (targetCategoryId && isNaN(Number(targetCategoryId))) {
      const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [targetCategoryId]);
      if (catRows.length > 0) {
        targetCategoryId = catRows[0].id;
      }
    }

    if (!title || !targetCategoryId || !date || !time || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, category_id, date, time, and location.'
      });
    }

    // Sanitize Google Maps Embed URL
    let sanitizedMapUrl = null;
    try {
      sanitizedMapUrl = sanitizeMapEmbedUrl(map_embed_url);
    } catch (urlErr) {
      return res.status(400).json({
        success: false,
        message: urlErr.message
      });
    }

    // Process file uploads if present
    let imagePath = null;
    let brochurePath = null;

    if (req.files) {
      if (req.files['image'] && req.files['image'][0]) {
        imagePath = '/uploads/events/' + req.files['image'][0].filename;
      }
      if (req.files['brochure'] && req.files['brochure'][0]) {
        brochurePath = '/uploads/documents/' + req.files['brochure'][0].filename;
      }
    }

    // Fallback if client passed image as text path
    if (!imagePath && req.body.image) {
      imagePath = req.body.image;
    }

    const validStatuses = ['Draft', 'Published', 'Hidden', 'Cancelled', 'Completed'];
    const eventStatus = validStatuses.includes(status) ? status : 'Published';
    const isRegOpen = registration_open === false || registration_open === 'false' || registration_open === 0 ? 0 : 1;
    const isPaymentRequired = payment_required === true || payment_required === 'true' || (Number(registration_fee) > 0 && payment_required !== false && payment_required !== 'false');

    const [result] = await pool.query(`
      INSERT INTO events 
        (title, description, category_id, date, time, location, address, map_embed_url, image, brochure, organizer_id, registration_fee, max_participants, status, registration_open, payment_required, payment_instructions)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description ? description.trim() : '',
      targetCategoryId,
      date,
      time,
      location.trim(),
      address ? address.trim() : null,
      sanitizedMapUrl,
      imagePath,
      brochurePath,
      organizerId,
      Number(registration_fee) || 0.00,
      Number(max_participants) || 200,
      eventStatus,
      isRegOpen,
      isPaymentRequired ? 1 : 0,
      payment_instructions || null
    ]);

    const newEventId = result.insertId;

    // Save repeatable benefits and highlights
    await saveEventBenefitsAndHighlights(pool, newEventId, benefits, highlights);

    return res.status(201).json({
      success: true,
      message: eventStatus === 'Draft' ? 'Event saved as draft!' : 'Event published successfully!',
      eventId: newEventId,
      data: {
        id: newEventId,
        title: title.trim(),
        image: imagePath,
        brochure: brochurePath,
        status: eventStatus,
        registration_open: isRegOpen === 1
      },
      image: imagePath,
      brochure: brochurePath
    });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating event.' });
  }
}

// 4. PUT /api/events/:id (Update Event - Organizer / Admin)
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check ownership
    const [existing] = await pool.query('SELECT organizer_id, image, brochure, title, date, time, location FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (existing[0].organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this event.' });
    }

    const {
      title,
      description,
      category_id,
      date,
      time,
      location,
      address,
      map_embed_url,
      registration_fee,
      max_participants,
      status,
      registration_open,
      payment_required,
      payment_instructions,
      benefits,
      highlights
    } = req.body;

    let imagePath = undefined;
    let brochurePath = undefined;

    if (req.files) {
      if (req.files['image'] && req.files['image'][0]) {
        imagePath = '/uploads/events/' + req.files['image'][0].filename;

        // Delete old local file if replaced
        if (existing[0].image && existing[0].image.startsWith('/uploads/events/')) {
          const oldPath = path.join(__dirname, '..', existing[0].image);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting old event image:', e); }
          }
        }
      }

      if (req.files['brochure'] && req.files['brochure'][0]) {
        brochurePath = '/uploads/documents/' + req.files['brochure'][0].filename;

        // Delete old local brochure if replaced
        if (existing[0].brochure && existing[0].brochure.startsWith('/uploads/documents/')) {
          const oldPath = path.join(__dirname, '..', existing[0].brochure);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting old brochure:', e); }
          }
        }
      }
    }

    if (!imagePath && req.body.image) {
      imagePath = req.body.image;
    }

    let sanitizedMapUrl = undefined;
    if (map_embed_url !== undefined) {
      try {
        sanitizedMapUrl = sanitizeMapEmbedUrl(map_embed_url);
      } catch (urlErr) {
        return res.status(400).json({ success: false, message: urlErr.message });
      }
    }

    let parsedPaymentRequired = null;
    if (payment_required !== undefined) {
      parsedPaymentRequired = (payment_required === true || payment_required === 'true') ? 1 : 0;
    }

    let parsedRegOpen = null;
    if (registration_open !== undefined) {
      parsedRegOpen = (registration_open === false || registration_open === 'false' || registration_open === 0) ? 0 : 1;
    }

    await pool.query(`
      UPDATE events SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        location = COALESCE(?, location),
        address = COALESCE(?, address),
        map_embed_url = COALESCE(?, map_embed_url),
        image = COALESCE(?, image),
        brochure = COALESCE(?, brochure),
        registration_fee = COALESCE(?, registration_fee),
        max_participants = COALESCE(?, max_participants),
        status = COALESCE(?, status),
        registration_open = COALESCE(?, registration_open),
        payment_required = COALESCE(?, payment_required),
        payment_instructions = COALESCE(?, payment_instructions)
      WHERE id = ?
    `, [
      title || null,
      description || null,
      category_id || null,
      date || null,
      time || null,
      location || null,
      address !== undefined ? address : null,
      sanitizedMapUrl !== undefined ? sanitizedMapUrl : null,
      imagePath || null,
      brochurePath || null,
      registration_fee !== undefined ? Number(registration_fee) : null,
      max_participants !== undefined ? Number(max_participants) : null,
      status || null,
      parsedRegOpen,
      parsedPaymentRequired,
      payment_instructions !== undefined ? payment_instructions : null,
      id
    ]);

    // Save updated benefits and highlights if provided
    if (benefits !== undefined || highlights !== undefined) {
      await saveEventBenefitsAndHighlights(pool, id, benefits, highlights);
    }

    // If important details changed (date, time, or location), notify confirmed attendees
    const scheduleChanged = (date && date !== existing[0].date) ||
                            (time && time !== existing[0].time) ||
                            (location && location !== existing[0].location);

    if (scheduleChanged) {
      const [attendees] = await pool.query(`
        SELECT u.id, u.name, u.email
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ? AND r.status = 'Confirmed'
      `, [id]);

      const updatedEvent = {
        id,
        title: title || existing[0].title,
        date: date || existing[0].date,
        time: time || existing[0].time,
        location: location || existing[0].location
      };

      for (const att of attendees) {
        await pool.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, 'info')
        `, [
          att.id,
          `Event Updated: ${updatedEvent.title}`,
          `New schedule: ${updatedEvent.date} at ${updatedEvent.time}, Venue: ${updatedEvent.location}.`
        ]);

        emailService.sendEventUpdateEmail(att, updatedEvent, 'Schedule/venue update').catch(() => {});
      }
    }

    const [updatedRows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: updatedRows[0] || null
    });
  } catch (error) {
    console.error('updateEvent error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating event.' });
  }
}

// 5. PUT /api/events/:id/cancel (Cancel Event & Notify Attendees)
async function cancelEvent(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = existing[0];
    if (userRole !== 'admin' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this event.' });
    }

    // Set event status to Cancelled
    await pool.query('UPDATE events SET status = "Cancelled" WHERE id = ?', [id]);

    // Mark registrations as Cancelled
    await pool.query('UPDATE registrations SET status = "Cancelled" WHERE event_id = ?', [id]);

    // Find all registered attendees to notify
    const [attendees] = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
    `, [id]);

    for (const att of attendees) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'error')
      `, [
        att.id,
        `Event Cancelled: ${event.title}`,
        `Unfortunately, "${event.title}" has been cancelled. Reason: ${reason || 'Unforeseen circumstances'}.`
      ]);

      emailService.sendEventCancellationEmail(att, event, reason).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Event "${event.title}" cancelled. ${attendees.length} participants have been notified.`,
      notifiedCount: attendees.length,
      data: {
        id,
        status: 'Cancelled'
      }
    });
  } catch (error) {
    console.error('cancelEvent error:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling event.' });
  }
}

// 6. DELETE /api/events/:id (Delete Event - Organizer / Admin)
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existing] = await pool.query('SELECT organizer_id, image, brochure FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (existing[0].organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this event.' });
    }

    // Clean up local media files from disk if present
    if (existing[0].image && existing[0].image.startsWith('/uploads/events/')) {
      const oldPath = path.join(__dirname, '..', existing[0].image);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting event image:', e); }
      }
    }

    if (existing[0].brochure && existing[0].brochure.startsWith('/uploads/documents/')) {
      const oldPath = path.join(__dirname, '..', existing[0].brochure);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting brochure:', e); }
      }
    }

    await pool.query('DELETE FROM events WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully!'
    });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting event.' });
  }
}

// 7. POST /api/events/:id/register (Register for Event)
async function registerForEvent(req, res) {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if event exists and is Published
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];

    // Prevent registration if event is Cancelled, Completed, Draft, Hidden, or registration closed
    if (event.status === 'Draft' || event.status === 'Hidden') {
      return res.status(404).json({
        success: false,
        message: 'This event is not currently available.'
      });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Event Cancelled. Registration is disabled.'
      });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Event Completed. Registration is disabled.'
      });
    }

    if (!event.registration_open || event.registration_open === 0 || event.registration_open === 'false') {
      return res.status(400).json({
        success: false,
        message: 'Registration is currently closed.'
      });
    }

    // Check participant capacity
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM registrations WHERE event_id = ? AND status != "Cancelled"',
      [eventId]
    );

    if (countResult[0].total >= event.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Registration is full. Maximum participant capacity reached.'
      });
    }

    const isPaidEvent = Boolean(event.payment_required) && Number(event.registration_fee) > 0;

    // Check if user is already registered
    const [existing] = await pool.query(
      'SELECT id, status, payment_status FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (existing.length > 0 && existing[0].status !== 'Cancelled') {
      if (existing[0].status === 'Confirmed') {
        return res.status(400).json({
          success: false,
          message: 'You are already registered and confirmed for this event!'
        });
      }

      // If already pending review, inform attendee
      if (isPaidEvent && existing[0].status === 'Pending' && existing[0].payment_status === 'pending') {
        return res.status(400).json({
          success: false,
          paymentRequired: true,
          registrationId: existing[0].id,
          alreadyPending: true,
          message: 'Your payment proof has already been submitted and is currently under review.'
        });
      }
    }

    let registrationId = null;

    // Fetch user details for notification & email
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    const user = users.length > 0 ? users[0] : { id: userId, name: 'Participant', email: '' };

    if (isPaidEvent) {
      // --- PAID EVENT WORKFLOW ---
      // Strict requirement: transaction_number and payment screenshot must be present
      let screenshotFile = null;
      if (req.file) {
        screenshotFile = req.file;
      } else if (req.files) {
        if (req.files['payment_screenshot'] && req.files['payment_screenshot'][0]) {
          screenshotFile = req.files['payment_screenshot'][0];
        } else if (req.files['screenshot'] && req.files['screenshot'][0]) {
          screenshotFile = req.files['screenshot'][0];
        }
      }

      const txnNumber = (req.body.transaction_number || '').trim();

      if (!txnNumber || !screenshotFile) {
        return res.status(400).json({
          success: false,
          message: 'Payment proof is required for this paid event.'
        });
      }

      // Validate transaction number uniqueness across other registrations
      const targetRegId = existing.length > 0 ? existing[0].id : null;
      const [existingTx] = await pool.query(
        'SELECT id, registration_id FROM payments WHERE transaction_number = ?',
        [txnNumber]
      );

      if (existingTx.length > 0 && existingTx[0].registration_id != targetRegId) {
        return res.status(400).json({
          success: false,
          message: 'This transaction reference number has already been submitted for another registration.'
        });
      }

      const screenshotPath = '/uploads/payments/' + screenshotFile.filename;
      let paymentId = null;

      if (existing.length > 0 && existing[0].status !== 'Cancelled') {
        // Resubmission for existing pending/rejected registration
        registrationId = existing[0].id;

        await pool.query(
          'UPDATE registrations SET status = "Pending", payment_status = "pending", registration_date = CURRENT_TIMESTAMP WHERE id = ?',
          [registrationId]
        );

        const [paymentRows] = await pool.query('SELECT id FROM payments WHERE registration_id = ?', [registrationId]);
        if (paymentRows.length > 0) {
          paymentId = paymentRows[0].id;
          await pool.query(
            'UPDATE payments SET amount = ?, transaction_number = ?, payment_screenshot = ?, status = "pending", rejection_reason = NULL, submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
            [event.registration_fee, txnNumber, screenshotPath, paymentId]
          );
        } else {
          const [payInsert] = await pool.query(
            'INSERT INTO payments (registration_id, user_id, event_id, amount, transaction_number, payment_screenshot, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
            [registrationId, userId, eventId, event.registration_fee, txnNumber, screenshotPath]
          );
          paymentId = payInsert.insertId;
        }
      } else {
        // Fresh registration + payment proof creation in one step
        const [regInsert] = await pool.query(
          'INSERT INTO registrations (user_id, event_id, status, payment_status) VALUES (?, ?, "Pending", "pending")',
          [userId, eventId]
        );
        registrationId = regInsert.insertId;

        const [payInsert] = await pool.query(
          'INSERT INTO payments (registration_id, user_id, event_id, amount, transaction_number, payment_screenshot, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
          [registrationId, userId, eventId, event.registration_fee, txnNumber, screenshotPath]
        );
        paymentId = payInsert.insertId;
      }

      // Notify participant about offline payment proof submission
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "info")',
        [
          userId,
          'Payment Proof Submitted',
          `Your payment proof for "${event.title}" has been submitted and is under review.`
        ]
      );

      return res.status(201).json({
        success: true,
        paymentRequired: true,
        registrationId,
        paymentId,
        status: 'Pending',
        payment_status: 'pending',
        message: 'Registration submitted. Your payment proof is under review.',
        data: {
          id: registrationId,
          event_id: Number(eventId),
          user_id: userId,
          status: 'Pending',
          payment_status: 'pending',
          transaction_number: txnNumber
        }
      });
    } else {
      // --- FREE EVENT WORKFLOW ---
      // Automatically confirmed and ticket generated immediately
      if (existing.length > 0) {
        registrationId = existing[0].id;
        await pool.query(
          'UPDATE registrations SET status = "Confirmed", payment_status = "not_required", registration_date = CURRENT_TIMESTAMP WHERE id = ?',
          [registrationId]
        );
      } else {
        const [insertResult] = await pool.query(
          'INSERT INTO registrations (user_id, event_id, status, payment_status) VALUES (?, ?, "Confirmed", "not_required")',
          [userId, eventId]
        );
        registrationId = insertResult.insertId;
      }

      // Automatically create initial attendance record ('absent' until check-in)
      await pool.query(
        'INSERT INTO attendance (registration_id, status) VALUES (?, "absent") ON DUPLICATE KEY UPDATE status = "absent"',
        [registrationId]
      );

      // Generate Ticket PDF with QR code immediately for free event
      try {
        const currentYear = new Date().getFullYear();
        const ticketNumber = `TKT-${currentYear}-${String(registrationId).padStart(5, '0')}`;
        const verificationToken = `VTK-${currentYear}-${String(registrationId).padStart(5, '0')}`;
        const ticketFilePath = await pdfService.generateTicketPDF({
          ticketNumber,
          verificationToken,
          registration: { id: registrationId },
          user,
          event,
          payment: { amount: 0, transaction_number: 'FREE-EVENT' }
        });

        await pool.query(
          `INSERT INTO tickets (registration_id, ticket_number, verification_token, status, file_path) 
           VALUES (?, ?, ?, 'valid', ?) 
           ON DUPLICATE KEY UPDATE ticket_number = ?, verification_token = ?, status = 'valid', file_path = ?`,
          [registrationId, ticketNumber, verificationToken, ticketFilePath, ticketNumber, verificationToken, ticketFilePath]
        );
      } catch (pdfErr) {
        console.error('Error generating free ticket PDF:', pdfErr);
      }

      // Insert in-app notification
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "success")',
        [
          userId,
          'Registration Confirmed',
          `Your registration for "${event.title}" has been confirmed. Your ticket is ready!`
        ]
      );

      // Send confirmation email
      emailService.sendRegistrationConfirmation(user, event, registrationId).catch((err) => {
        console.error('Confirmation email error:', err.message);
      });

      return res.status(200).json({
        success: true,
        paymentRequired: false,
        registrationId,
        message: `Successfully registered for "${event.title}"! Your event pass has been issued.`,
        data: {
          id: registrationId,
          event_id: Number(eventId),
          user_id: userId,
          status: 'Confirmed',
          payment_status: 'not_required'
        }
      });
    }
  } catch (error) {
    console.error('registerForEvent error:', error);
    return res.status(500).json({ success: false, message: 'Server error completing registration.' });
  }
}

// 8. GET /api/events/:id/my-registration
async function getMyRegistration(req, res) {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        r.id AS registration_id,
        r.status AS registration_status,
        r.payment_status,
        r.registration_date,
        p.id AS payment_id,
        p.transaction_number,
        p.status AS payment_review_status,
        p.rejection_reason,
        t.id AS ticket_id,
        t.ticket_number,
        inv.id AS invoice_id,
        inv.invoice_number
      FROM registrations r
      LEFT JOIN payments p ON r.id = p.registration_id
      LEFT JOIN tickets t ON r.id = t.registration_id
      LEFT JOIN invoices inv ON r.id = inv.registration_id
      WHERE r.user_id = ? AND r.event_id = ? AND r.status != 'Cancelled'
      ORDER BY r.id DESC
      LIMIT 1
    `, [userId, eventId]);

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        registered: false,
        registration_status: null,
        payment_status: null,
        data: null
      });
    }

    const reg = rows[0];
    return res.status(200).json({
      success: true,
      registered: true,
      registration_id: reg.registration_id,
      registration_status: reg.registration_status,
      payment_status: reg.payment_status,
      transaction_number: reg.transaction_number || null,
      payment_review_status: reg.payment_review_status || null,
      rejection_reason: reg.rejection_reason || null,
      ticket_id: reg.ticket_id || null,
      ticket_number: reg.ticket_number || null,
      invoice_id: reg.invoice_id || null,
      invoice_number: reg.invoice_number || null,
      data: reg
    });
  } catch (error) {
    console.error('getMyRegistration error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving registration status.' });
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  registerForEvent,
  getMyRegistration
};
