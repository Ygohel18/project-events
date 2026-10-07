// ========================================================
// Document Controller (Secure Gated Invoices & Tickets)
// ========================================================

const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');
const pdfService = require('../services/pdfService');

/**
 * 1. GET /api/invoices/:id/download
 * Secure gated download for PDF Invoice
 */
async function downloadInvoice(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Look up by id, invoice_number, or registration_id
    const [rows] = await pool.query(
      `SELECT 
         i.*, 
         r.user_id AS participant_id, 
         e.organizer_id,
         e.title AS event_title
       FROM invoices i
       JOIN registrations r ON i.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       WHERE i.id = ? OR i.invoice_number = ? OR i.registration_id = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const invoice = rows[0];

    // Authorization: attendee, organizer of event, or admin
    if (invoice.participant_id !== userId && invoice.organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this invoice.' });
    }

    if (!invoice.file_path) {
      return res.status(404).json({ success: false, message: 'Invoice file record is missing.' });
    }

    const filePath = path.join(__dirname, '..', invoice.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Invoice PDF file not found on disk.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    return res.download(filePath, `${invoice.invoice_number || 'invoice'}.pdf`);
  } catch (error) {
    console.error('downloadInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Server error downloading invoice.' });
  }
}

/**
 * 2. GET /api/tickets/:id/download
 * Secure gated download for PDF Ticket
 */
async function downloadTicket(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Look up by id, ticket_number, or registration_id
    const [rows] = await pool.query(
      `SELECT 
         t.*, 
         r.user_id AS participant_id, 
         e.organizer_id,
         e.title AS event_title,
         e.date AS event_date,
         e.time AS event_time,
         e.location AS event_location,
         e.registration_fee,
         u.name AS attendee_name,
         u.email AS attendee_email
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       JOIN users u ON r.user_id = u.id
       WHERE t.id = ? OR t.ticket_number = ? OR t.registration_id = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const ticket = rows[0];

    // Authorization: attendee, organizer of event, or admin
    if (ticket.participant_id !== userId && ticket.organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this ticket.' });
    }

    let filePath = ticket.file_path ? path.join(__dirname, '..', ticket.file_path) : '';
    if (!filePath || !fs.existsSync(filePath)) {
      const generatedRelPath = await pdfService.generateTicketPDF({
        ticketNumber: ticket.ticket_number,
        verificationToken: ticket.verification_token,
        eventTitle: ticket.event_title,
        eventDate: ticket.event_date,
        eventTime: ticket.event_time,
        eventVenue: ticket.event_location,
        attendeeName: ticket.attendee_name,
        attendeeEmail: ticket.attendee_email,
        registrationId: ticket.registration_id,
        price: ticket.registration_fee
      });
      filePath = path.join(__dirname, '..', generatedRelPath);
      await pool.query('UPDATE tickets SET file_path = ? WHERE id = ?', [generatedRelPath, ticket.id]);
    }

    res.setHeader('Content-Type', 'application/pdf');
    return res.download(filePath, `${ticket.ticket_number || 'ticket'}.pdf`);
  } catch (error) {
    console.error('downloadTicket error:', error);
    return res.status(500).json({ success: false, message: 'Server error downloading ticket.' });
  }
}

module.exports = {
  downloadInvoice,
  downloadTicket
};
