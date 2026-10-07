// Registration Controller
// Handles user bookings and cancellation
const { pool } = require('../config/database');

// 1. GET /api/registrations/my (Logged-in user bookings)
async function getMyRegistrations(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        r.id AS registrationId,
        r.event_id AS eventId,
        e.title AS eventName,
        e.date,
        e.time,
        e.location,
        e.image,
        e.registration_fee AS price,
        e.payment_required AS paymentRequired,
        e.payment_instructions AS paymentInstructions,
        r.status,
        r.payment_status AS paymentStatus,
        r.registration_date AS registrationDate,
        p.id AS paymentId,
        p.status AS paymentReviewStatus,
        p.transaction_number AS transactionNumber,
        p.rejection_reason AS rejectionReason,
        inv.id AS invoiceId,
        inv.invoice_number AS invoiceNumber,
        tkt.id AS ticketId,
        tkt.ticket_number AS ticketNumber
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN payments p ON p.registration_id = r.id
      LEFT JOIN invoices inv ON inv.registration_id = r.id
      LEFT JOIN tickets tkt ON tkt.registration_id = r.id
      WHERE r.user_id = ?
      ORDER BY r.id DESC
    `, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getMyRegistrations error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving registrations.' });
  }
}

// 2. PUT /api/registrations/:id/cancel (Cancel booking)
async function cancelRegistration(req, res) {
  try {
    const registrationId = req.params.id;
    const userId = req.user.id;

    // Check ownership
    const [rows] = await pool.query(`
      SELECT r.id, r.user_id, e.title 
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [registrationId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const reg = rows[0];

    // Ensure user owns this registration (or admin)
    if (reg.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this registration.' });
    }

    // Update status to 'Cancelled' (soft cancel, do not delete)
    await pool.query('UPDATE registrations SET status = "Cancelled" WHERE id = ?', [registrationId]);

    // Send notification
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (?, ?, ?, 'warning', 0)
    `, [
      reg.user_id,
      'Registration Cancelled',
      `Your registration for "${reg.title}" has been cancelled.`
    ]);

    return res.status(200).json({
      success: true,
      message: `Registration for "${reg.title}" has been successfully cancelled.`
    });
  } catch (error) {
    console.error('cancelRegistration error:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling registration.' });
  }
}

// 3. GET /api/registrations/:id (Get single registration detail)
async function getRegistrationById(req, res) {
  try {
    const registrationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.id AS registrationId,
        r.user_id,
        r.event_id,
        r.status,
        r.payment_status,
        r.registration_date,
        e.title,
        e.date,
        e.time,
        e.location,
        e.organizer_id,
        e.registration_fee,
        e.payment_required,
        e.payment_instructions,
        p.id AS payment_id,
        p.status AS payment_review_status,
        p.transaction_number,
        p.rejection_reason,
        p.rejection_reason AS admin_notes,
        inv.id AS invoice_id,
        inv.file_path AS invoice_pdf,
        tkt.id AS ticket_id,
        tkt.file_path AS ticket_pdf
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN payments p ON p.registration_id = r.id
      LEFT JOIN invoices inv ON inv.registration_id = r.id
      LEFT JOIN tickets tkt ON tkt.registration_id = r.id
      WHERE r.id = ?
    `, [registrationId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const reg = rows[0];

    // Only owner, organizer, or admin can view
    if (reg.user_id !== userId && reg.organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this registration.' });
    }

    return res.status(200).json({
      success: true,
      data: reg
    });
  } catch (error) {
    console.error('getRegistrationById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving registration.' });
  }
}

module.exports = {
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration
};
