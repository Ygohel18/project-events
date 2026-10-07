// ========================================================
// Contact Messages Controller
// Handles website user inquiries and stores them in MySQL
// ========================================================

const { pool } = require('../config/database');
const emailService = require('../services/emailService');

// 1. POST /api/contact (Public message submission)
async function submitContactMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, and message.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject ? subject.trim() : 'General Inquiry';
    const cleanMessage = message.trim();

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [cleanName, cleanEmail, cleanSubject, cleanMessage]
    );

    // 1. Send email notification to ourselves (admin/team inbox)
    emailService
      .sendContactMessageNotification({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage
      })
      .catch((err) => console.error('⚠️ Failed to dispatch admin contact email:', err.message));

    // 2. Send acknowledgment auto-reply to the visitor
    emailService
      .sendContactMessageAutoReply({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject
      })
      .catch((err) => console.error('⚠️ Failed to dispatch visitor autoreply email:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received.',
      messageId: result.insertId
    });
  } catch (error) {
    console.error('submitContactMessage error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting contact message.' });
  }
}

// 2. GET /api/contact (Admin view messages)
async function getContactMessages(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM contact_messages ORDER BY id DESC'
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getContactMessages error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving contact messages.' });
  }
}

module.exports = {
  submitContactMessage,
  getContactMessages
};
