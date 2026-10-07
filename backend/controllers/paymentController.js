// ========================================================
// Payment Controller (Offline Payment Verification Workflow)
// ========================================================

const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

// 1. POST /api/payments/:registrationId or POST /api/payments (Submit Payment Proof)
async function submitPaymentProof(req, res) {
  try {
    let targetRegId = req.params.registrationId || req.body.registration_id;
    const { transaction_number, event_id } = req.body;
    const userId = req.user.id;

    if (!transaction_number || !transaction_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction reference number.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a payment screenshot (JPG or PNG only).'
      });
    }

    // If registration_id not provided, resolve via event_id
    if (!targetRegId && event_id) {
      const [existingReg] = await pool.query(
        'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ? AND status != "Cancelled"',
        [userId, event_id]
      );
      if (existingReg.length > 0) {
        targetRegId = existingReg[0].id;
      } else {
        const [evRows] = await pool.query('SELECT id, status FROM events WHERE id = ?', [event_id]);
        if (evRows.length === 0 || evRows[0].status !== 'Published') {
          return res.status(400).json({ success: false, message: 'Invalid or unpublished event.' });
        }
        const [insertRes] = await pool.query(
          'INSERT INTO registrations (user_id, event_id, status, payment_status) VALUES (?, ?, "Pending", "pending")',
          [userId, event_id]
        );
        targetRegId = insertRes.insertId;
      }
    }

    if (!targetRegId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID or Event ID is required to submit payment proof.'
      });
    }

    const registrationId = targetRegId;

    // Check if registration exists and belongs to the user (or admin)
    const [regs] = await pool.query(
      `SELECT r.*, e.id AS event_id, e.title, e.registration_fee, e.organizer_id, e.payment_required
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ?`,
      [registrationId]
    );

    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const reg = regs[0];
    if (reg.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this registration.' });
    }

    const screenshotPath = '/uploads/payments/' + req.file.filename;

    // Check if transaction number is already used by another payment
    const [existingTx] = await pool.query(
      'SELECT id, registration_id FROM payments WHERE transaction_number = ?',
      [transaction_number.trim()]
    );

    if (existingTx.length > 0 && existingTx[0].registration_id != registrationId) {
      return res.status(400).json({
        success: false,
        message: 'This transaction reference number has already been submitted for another registration.'
      });
    }

    // Check if a payment record already exists for this registration
    const [existingPayment] = await pool.query(
      'SELECT id, status, payment_screenshot FROM payments WHERE registration_id = ?',
      [registrationId]
    );

    let paymentId = null;

    if (existingPayment.length > 0) {
      if (existingPayment[0].status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Payment for this registration has already been approved!'
        });
      }

      // If re-submitting after rejection or updating pending submission
      paymentId = existingPayment[0].id;

      // Clean up previous screenshot file if replacing
      if (existingPayment[0].payment_screenshot) {
        const oldFile = path.join(__dirname, '..', existingPayment[0].payment_screenshot);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) { console.error('Error removing old screenshot:', e); }
        }
      }

      await pool.query(
        `UPDATE payments SET
           transaction_number = ?,
           payment_screenshot = ?,
           amount = ?,
           status = 'pending',
           submitted_at = CURRENT_TIMESTAMP,
           rejection_reason = NULL,
           verified_at = NULL,
           verified_by = NULL
         WHERE id = ?`,
        [transaction_number.trim(), screenshotPath, reg.registration_fee, paymentId]
      );
    } else {
      // First submission
      const [insertResult] = await pool.query(
        `INSERT INTO payments 
           (registration_id, user_id, event_id, amount, transaction_number, payment_screenshot, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [registrationId, reg.user_id, reg.event_id, reg.registration_fee, transaction_number.trim(), screenshotPath]
      );
      paymentId = insertResult.insertId;
    }

    // Update registration payment status
    await pool.query(
      'UPDATE registrations SET payment_status = "pending", status = "Pending" WHERE id = ?',
      [registrationId]
    );

    // Notify participant
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "info")',
      [
        reg.user_id,
        'Payment Proof Submitted',
        `Your payment proof for "${reg.title}" has been submitted and is under verification.`
      ]
    );

    // Notify organizer
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "info")',
      [
        reg.organizer_id,
        'New Payment Proof Submitted',
        `A participant submitted offline payment proof for "${reg.title}". Reference: ${transaction_number.trim()}.`
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Payment proof submitted successfully! Organizer verification is pending.',
      data: {
        paymentId,
        registrationId: Number(registrationId),
        transaction_number: transaction_number.trim(),
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('submitPaymentProof error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting payment proof.' });
  }
}

// 2. GET /api/payments/:id/proof (Gated access to payment screenshot)
async function getProofFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [rows] = await pool.query(
      `SELECT p.*, e.organizer_id
       FROM payments p
       JOIN events e ON p.event_id = e.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = rows[0];

    // Authorization check: User must be participant, organizer of event, or admin
    if (payment.user_id !== userId && payment.organizer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this payment proof.' });
    }

    if (!payment.payment_screenshot) {
      return res.status(404).json({ success: false, message: 'Payment screenshot file not found.' });
    }

    const filePath = path.join(__dirname, '..', payment.payment_screenshot);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical screenshot file is missing from disk.' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('getProofFile error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving proof file.' });
  }
}

// 3. GET /api/payments/my-payments (Participant's submitted payments)
async function getMyPayments(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         p.*, 
         e.title AS event_title, 
         e.date AS event_date, 
         e.time AS event_time, 
         e.location AS event_location,
         i.id AS invoice_id,
         i.invoice_number,
         t.id AS ticket_id,
         t.ticket_number
       FROM payments p
       JOIN events e ON p.event_id = e.id
       LEFT JOIN invoices i ON i.payment_id = p.id
       LEFT JOIN tickets t ON t.registration_id = p.registration_id
       WHERE p.user_id = ?
       ORDER BY p.submitted_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('getMyPayments error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving your payments.' });
  }
}

// 4. GET /api/payments/organizer (Organizer's event payments)
async function getOrganizerPayments(req, res) {
  try {
    const organizerId = req.user.id;
    const { status, eventId } = req.query;

    let query = `
      SELECT 
        p.*, 
        u.name AS user_name, 
        u.email AS user_email, 
        e.title AS event_title, 
        e.date AS event_date,
        i.invoice_number,
        i.id AS invoice_id,
        t.ticket_number,
        t.id AS ticket_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      LEFT JOIN invoices i ON i.payment_id = p.id
      LEFT JOIN tickets t ON t.registration_id = p.registration_id
      WHERE e.organizer_id = ?
    `;
    const params = [organizerId];

    if (status && ['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
      query += ' AND p.status = ?';
      params.push(status.toLowerCase());
    }

    if (eventId) {
      query += ' AND p.event_id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY p.submitted_at DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('getOrganizerPayments error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving payments.' });
  }
}

// 5. GET /api/payments/admin (Admin views all payments)
async function getAdminPayments(req, res) {
  try {
    const { status, eventId } = req.query;

    let query = `
      SELECT 
        p.*, 
        u.name AS user_name, 
        u.email AS user_email, 
        e.title AS event_title, 
        e.date AS event_date,
        org.name AS organizer_name,
        i.invoice_number,
        i.id AS invoice_id,
        t.ticket_number,
        t.id AS ticket_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      JOIN users org ON e.organizer_id = org.id
      LEFT JOIN invoices i ON i.payment_id = p.id
      LEFT JOIN tickets t ON t.registration_id = p.registration_id
      WHERE 1=1
    `;
    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
      query += ' AND p.status = ?';
      params.push(status.toLowerCase());
    }

    if (eventId) {
      query += ' AND p.event_id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY p.submitted_at DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('getAdminPayments error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin payments.' });
  }
}

// 6. PUT /api/payments/:id/approve (Verify & Approve Payment)
async function approvePayment(req, res) {
  try {
    const { id } = req.params;
    const verifierId = req.user.id;
    const userRole = req.user.role;

    // Fetch payment, registration, user and event details
    const [rows] = await pool.query(
      `SELECT 
         p.*, 
         u.id AS participant_id, u.name AS participant_name, u.email AS participant_email, u.phone AS participant_phone,
         e.id AS event_id, e.title AS event_title, e.date AS event_date, e.time AS event_time, e.location AS event_location,
         e.registration_fee, e.organizer_id,
         r.id AS reg_id, r.status AS reg_status
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN events e ON p.event_id = e.id
       JOIN registrations r ON p.registration_id = r.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = rows[0];

    // Check authorization: organizer of event or admin
    if (payment.organizer_id !== verifierId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to approve payments for this event.' });
    }

    // 1. Update payment record
    await pool.query(
      `UPDATE payments SET
         status = 'approved',
         verified_at = CURRENT_TIMESTAMP,
         verified_by = ?,
         rejection_reason = NULL
       WHERE id = ?`,
      [verifierId, id]
    );

    // 2. Update registration status to Confirmed & payment_status to approved
    await pool.query(
      'UPDATE registrations SET status = "Confirmed", payment_status = "approved" WHERE id = ?',
      [payment.registration_id]
    );

    // 3. Ensure attendance record exists
    await pool.query(
      'INSERT INTO attendance (registration_id, status) VALUES (?, "absent") ON DUPLICATE KEY UPDATE status = "absent"',
      [payment.registration_id]
    );

    // 4. Generate Invoice PDF
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(payment.id).padStart(5, '0')}`;
    const invoiceDate = new Date();

    const invoiceFilePath = await pdfService.generateInvoicePDF({
      invoiceNumber,
      invoiceDate,
      payment: {
        id: payment.id,
        amount: payment.amount,
        transaction_number: payment.transaction_number
      },
      registration: { id: payment.registration_id },
      user: {
        name: payment.participant_name,
        email: payment.participant_email,
        phone: payment.participant_phone
      },
      event: {
        title: payment.event_title,
        date: payment.event_date,
        time: payment.event_time,
        location: payment.event_location,
        registration_fee: payment.registration_fee
      }
    });

    // Save invoice to database (or update if already exists)
    const [existingInv] = await pool.query('SELECT id FROM invoices WHERE payment_id = ?', [payment.id]);
    let invoiceId = null;
    if (existingInv.length > 0) {
      invoiceId = existingInv[0].id;
      await pool.query(
        'UPDATE invoices SET invoice_number = ?, file_path = ?, amount = ? WHERE id = ?',
        [invoiceNumber, invoiceFilePath, payment.amount, invoiceId]
      );
    } else {
      const [invRes] = await pool.query(
        `INSERT INTO invoices (registration_id, payment_id, invoice_number, invoice_date, amount, file_path)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [payment.registration_id, payment.id, invoiceNumber, invoiceDate, payment.amount, invoiceFilePath]
      );
      invoiceId = invRes.insertId;
    }

    // 5. Generate Ticket PDF with QR code
    const ticketNumber = `TKT-${currentYear}-${String(payment.registration_id).padStart(5, '0')}`;
    const verificationToken = `VTK-${currentYear}-${String(payment.registration_id).padStart(5, '0')}`;
    const ticketFilePath = await pdfService.generateTicketPDF({
      ticketNumber,
      verificationToken,
      registration: { id: payment.registration_id },
      user: {
        name: payment.participant_name,
        email: payment.participant_email
      },
      event: {
        title: payment.event_title,
        date: payment.event_date,
        time: payment.event_time,
        location: payment.event_location
      },
      payment: {
        amount: payment.amount,
        transaction_number: payment.transaction_number
      }
    });

    // Save ticket to database (or update if already exists)
    const [existingTkt] = await pool.query('SELECT id FROM tickets WHERE registration_id = ?', [payment.registration_id]);
    let ticketId = null;
    if (existingTkt.length > 0) {
      ticketId = existingTkt[0].id;
      await pool.query(
        'UPDATE tickets SET ticket_number = ?, verification_token = ?, status = "valid", file_path = ?, generated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [ticketNumber, verificationToken, ticketFilePath, ticketId]
      );
    } else {
      const [tktRes] = await pool.query(
        `INSERT INTO tickets (registration_id, ticket_number, verification_token, status, file_path)
         VALUES (?, ?, ?, 'valid', ?)`,
        [payment.registration_id, ticketNumber, verificationToken, ticketFilePath]
      );
      ticketId = tktRes.insertId;
    }

    // 6. In-app Notification for Participant
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "success")',
      [
        payment.participant_id,
        'Payment Verified & Registration Confirmed!',
        `Your payment for "${payment.event_title}" has been approved. Your invoice and scannable event ticket are now ready for download!`
      ]
    );

    // 7. Send Payment Approval Email
    emailService.sendPaymentApprovalEmail(
      { name: payment.participant_name, email: payment.participant_email },
      { title: payment.event_title, date: payment.event_date, time: payment.event_time, location: payment.event_location },
      { amount: payment.amount, transaction_number: payment.transaction_number },
      invoiceNumber,
      ticketNumber
    ).catch((err) => {
      console.error('sendPaymentApprovalEmail error:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Payment approved successfully! Registration confirmed, invoice and ticket generated.',
      data: {
        paymentId: payment.id,
        invoiceNumber,
        invoiceId,
        ticketNumber,
        ticketId
      }
    });
  } catch (error) {
    console.error('approvePayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error approving payment.' });
  }
}

// 7. PUT /api/payments/:id/reject (Reject Payment)
async function rejectPayment(req, res) {
  try {
    const { id } = req.params;
    const reason = (req.body.reason || req.body.rejection_reason || req.body.notes || '').trim();
    const verifierId = req.user.id;
    const userRole = req.user.role;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason for payment rejection.'
      });
    }

    const [rows] = await pool.query(
      `SELECT 
         p.*, 
         u.id AS participant_id, u.name AS participant_name, u.email AS participant_email,
         e.id AS event_id, e.title AS event_title, e.organizer_id
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN events e ON p.event_id = e.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = rows[0];

    // Check authorization: organizer of event or admin
    if (payment.organizer_id !== verifierId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reject payments for this event.' });
    }

    // 1. Update payment record
    await pool.query(
      `UPDATE payments SET
         status = 'rejected',
         verified_at = CURRENT_TIMESTAMP,
         verified_by = ?,
         rejection_reason = ?
       WHERE id = ?`,
      [verifierId, reason.trim(), id]
    );

    // 2. Update registration status
    await pool.query(
      'UPDATE registrations SET payment_status = "rejected", status = "Pending" WHERE id = ?',
      [payment.registration_id]
    );

    // 3. In-app Notification for Participant
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "error")',
      [
        payment.participant_id,
        'Payment Proof Rejected',
        `Your payment proof for "${payment.event_title}" was rejected: ${reason.trim()}. You may re-upload corrected payment details.`
      ]
    );

    // 4. Send Payment Rejection Email
    emailService.sendPaymentRejectionEmail(
      { name: payment.participant_name, email: payment.participant_email },
      { title: payment.event_title },
      reason.trim()
    ).catch((err) => {
      console.error('sendPaymentRejectionEmail error:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Payment rejected. Participant has been notified to re-upload proof.',
      data: {
        paymentId: payment.id,
        status: 'rejected',
        reason: reason.trim()
      }
    });
  } catch (error) {
    console.error('rejectPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting payment.' });
  }
}

module.exports = {
  submitPaymentProof,
  getProofFile,
  getMyPayments,
  getOrganizerPayments,
  getAdminPayments,
  approvePayment,
  rejectPayment
};
