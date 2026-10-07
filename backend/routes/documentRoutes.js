// ========================================================
// Document Routes (Gated Invoice & Ticket Downloads)
// ========================================================

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Download Invoice PDF (Attendee, Organizer, Admin)
router.get('/invoices/:id/download', verifyToken, documentController.downloadInvoice);

// 2. Download Ticket PDF (Attendee, Organizer, Admin)
router.get('/tickets/:id/download', verifyToken, documentController.downloadTicket);

module.exports = router;
