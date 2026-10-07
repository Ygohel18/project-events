// Ticket Controller: Verification, Check-In, and Details
const { pool } = require('../config/database');

/**
 * 1. GET /api/tickets/verify/:token
 * Verify a ticket by token, ticket number, or ID
 */
async function verifyTicket(req, res) {
  try {
    const { token } = req.params;
    const { eventId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Ticket token or number is required.'
      });
    }

    const cleanToken = token.trim();

    // Query ticket with all related records
    const [rows] = await pool.query(
      `SELECT 
         t.id AS ticket_id,
         t.ticket_number,
         t.verification_token,
         t.status AS ticket_status,
         t.file_path AS ticket_file_path,
         t.generated_at,
         r.id AS registration_id,
         r.status AS registration_status,
         r.payment_status,
         r.registration_date,
         e.id AS event_id,
         e.title AS event_title,
         e.date AS event_date,
         e.time AS event_time,
         e.location AS event_location,
         e.location AS event_venue,
         e.status AS event_status,
         e.registration_fee,
         e.payment_required,
         e.organizer_id,
         u.id AS attendee_id,
         u.name AS attendee_name,
         u.email AS attendee_email,
         u.phone AS attendee_phone,
         COALESCE(a.status, 'absent') AS attendance_status,
         a.check_in_time,
         a.checked_in_by,
         staff.name AS checked_in_by_name
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN attendance a ON r.id = a.registration_id
       LEFT JOIN users staff ON a.checked_in_by = staff.id
       WHERE t.verification_token = ? OR t.ticket_number = ? OR t.id = ?`,
      [cleanToken, cleanToken, isNaN(cleanToken) ? -1 : Number(cleanToken)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid Ticket: No matching ticket record could be found.'
      });
    }

    const t = rows[0];

    // Authorization: Organizers can only verify tickets for their own events; Admins can verify all
    if (userRole !== 'admin' && t.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        valid: false,
        message: 'Unauthorized: This ticket belongs to an event managed by another organizer.',
        wrong_event: true,
        event_title: t.event_title
      });
    }

    // Event-specific scanner check (if scanner is locked to a particular event)
    if (eventId && Number(eventId) !== t.event_id) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Wrong Event: This ticket belongs to "${t.event_title}", not the selected event.`,
        wrong_event: true,
        actual_event: { id: t.event_id, title: t.event_title }
      });
    }

    // Check Event Status
    if (t.event_status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Ticket Not Valid: The event has been cancelled.',
        reason: 'Event Cancelled'
      });
    }

    // Check Registration Status
    if (t.registration_status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Ticket Not Valid: The registration was cancelled.',
        reason: 'Registration Cancelled'
      });
    }

    // Check Payment Status for Paid Events
    const isPaid = Number(t.registration_fee) > 0 || t.payment_required;
    const paymentApproved = t.payment_status === 'approved' || t.payment_status === 'verified' || t.payment_status === 'not_required';
    if (isPaid && !paymentApproved) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Payment Not Verified: Offline payment proof has not been approved.',
        reason: 'Payment Not Verified'
      });
    }

    // Sanitized ticket response
    const isAlreadyCheckedIn = t.attendance_status === 'present';

    return res.status(200).json({
      success: true,
      valid: true,
      already_checked_in: isAlreadyCheckedIn,
      alreadyCheckedIn: isAlreadyCheckedIn,
      ticket: {
        ticket_id: t.ticket_id,
        ticket_number: t.ticket_number,
        verification_token: t.verification_token,
        registration_id: `REG-${new Date().getFullYear()}-${String(t.registration_id).padStart(5, '0')}`,
        raw_registration_id: t.registration_id,
        event: {
          id: t.event_id,
          title: t.event_title,
          date: t.event_date,
          time: t.event_time,
          venue: t.event_venue || t.event_location
        },
        attendee: {
          id: t.attendee_id,
          name: t.attendee_name,
          email: t.attendee_email,
          phone: t.attendee_phone
        },
        pass_type: isPaid ? `Paid Pass (₹${Number(t.registration_fee).toFixed(2)})` : 'Free Admission',
        status: t.registration_status,
        attendance: isAlreadyCheckedIn ? 'present' : 'absent',
        check_in_time: t.check_in_time,
        checked_in_by: t.checked_in_by_name
      },
      event: {
        id: t.event_id,
        title: t.event_title,
        date: t.event_date,
        time: t.event_time,
        venue: t.event_venue || t.event_location
      },
      attendee: {
        id: t.attendee_id,
        name: t.attendee_name,
        email: t.attendee_email,
        phone: t.attendee_phone
      },
      attendance: {
        status: isAlreadyCheckedIn ? 'present' : 'absent',
        check_in_time: t.check_in_time,
        checked_in_by: t.checked_in_by_name
      }
    });
  } catch (error) {
    console.error('verifyTicket error:', error);
    return res.status(500).json({ success: false, valid: false, message: 'Server error verifying ticket.' });
  }
}

/**
 * 2. POST /api/tickets/:id/check-in
 * Check in an attendee using their ticket
 */
async function checkInTicket(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Look up ticket
    const [rows] = await pool.query(
      `SELECT 
         t.id AS ticket_id,
         t.ticket_number,
         t.status AS ticket_status,
         r.id AS registration_id,
         r.status AS registration_status,
         r.payment_status,
         e.id AS event_id,
         e.title AS event_title,
         e.organizer_id,
         e.status AS event_status,
         e.registration_fee,
         e.payment_required,
         u.name AS attendee_name,
         u.email AS attendee_email,
         COALESCE(a.status, 'absent') AS attendance_status,
         a.check_in_time,
         a.id AS attendance_id
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN attendance a ON r.id = a.registration_id
       WHERE t.id = ? OR t.ticket_number = ? OR t.verification_token = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const t = rows[0];

    // Check organizer permissions
    if (userRole !== 'admin' && t.organizer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to check in tickets for this event.' });
    }

    // Check event cancellation
    if (t.event_status === 'Cancelled' || t.registration_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot check in: Event or registration is cancelled.' });
    }

    // Prevent duplicate check-in
    if (t.attendance_status === 'present') {
      return res.status(409).json({
        success: false,
        already_checked_in: true,
        alreadyCheckedIn: true,
        message: 'Attendee has already been checked in.',
        check_in_time: t.check_in_time,
        attendee: t.attendee_name
      });
    }

    const checkInTime = new Date();

    // Upsert into attendance table
    if (t.attendance_id) {
      await pool.query(
        'UPDATE attendance SET status = "present", check_in_time = ?, checked_in_by = ? WHERE id = ?',
        [checkInTime, userId, t.attendance_id]
      );
    } else {
      await pool.query(
        'INSERT INTO attendance (registration_id, status, check_in_time, checked_in_by) VALUES (?, "present", ?, ?)',
        [t.registration_id, checkInTime, userId]
      );
    }

    // Update ticket status
    await pool.query('UPDATE tickets SET status = "checked_in" WHERE id = ?', [t.ticket_id]);

    return res.status(200).json({
      success: true,
      message: `Check-in successful! Welcome, ${t.attendee_name}.`,
      data: {
        ticket_number: t.ticket_number,
        attendee_name: t.attendee_name,
        attendee_email: t.attendee_email,
        event_title: t.event_title,
        status: 'present',
        check_in_time: checkInTime
      }
    });
  } catch (error) {
    console.error('checkInTicket error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing check-in.' });
  }
}

/**
 * 3. GET /api/tickets/:id
 * Retrieve single ticket details for preview
 */
async function getTicketDetails(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [rows] = await pool.query(
      `SELECT 
         t.id AS ticket_id,
         t.ticket_number,
         t.verification_token,
         t.status AS ticket_status,
         t.file_path,
         t.generated_at,
         r.id AS registration_id,
         r.user_id,
         r.status AS registration_status,
         r.payment_status,
         r.registration_date,
         e.id AS event_id,
         e.title AS event_title,
         e.date AS event_date,
         e.time AS event_time,
         e.location AS event_location,
         e.location AS event_venue,
         e.category_id,
         c.name AS category_name,
         e.organizer_id,
         e.registration_fee,
         u.name AS attendee_name,
         u.email AS attendee_email,
         u.phone AS attendee_phone,
         COALESCE(a.status, 'absent') AS attendance_status,
         a.check_in_time
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       LEFT JOIN categories c ON e.category_id = c.id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN attendance a ON r.id = a.registration_id
       WHERE t.id = ? OR t.ticket_number = ? OR t.registration_id = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket record not found.' });
    }

    const t = rows[0];

    // Authorization: Attendee owner, event organizer, or admin
    if (t.user_id !== userId && t.organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket.' });
    }

    return res.status(200).json({
      success: true,
      data: t,
      ticket: {
        ...t,
        id: t.ticket_id
      }
    });
  } catch (error) {
    console.error('getTicketDetails error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving ticket.' });
  }
}

/**
 * 4. GET /api/tickets/recent-checkins
 * Retrieve recently checked-in attendees
 */
async function getRecentCheckIns(req, res) {
  try {
    const { eventId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        a.id AS attendance_id,
        a.check_in_time,
        a.status AS attendance_status,
        u.name AS attendee_name,
        u.email AS attendee_email,
        e.id AS event_id,
        e.title AS event_title,
        t.ticket_number,
        staff.name AS checked_in_by
      FROM attendance a
      JOIN registrations r ON a.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN tickets t ON t.registration_id = r.id
      LEFT JOIN users staff ON a.checked_in_by = staff.id
      WHERE a.status = 'present'
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (eventId) {
      query += ' AND e.id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY a.check_in_time DESC LIMIT 20';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getRecentCheckIns error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving recent check-ins.' });
  }
}

module.exports = {
  verifyTicket,
  checkInTicket,
  getTicketDetails,
  getRecentCheckIns
};
