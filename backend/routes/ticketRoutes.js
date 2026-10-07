// Ticket Routes: /api/tickets
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const documentController = require('../controllers/documentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// 1. Verify a ticket (Organizer & Admin)
router.get(
  '/verify/:token',
  verifyToken,
  requireRole('organizer', 'admin'),
  ticketController.verifyTicket
);

// 2. Check in attendee using ticket (Organizer & Admin)
router.post(
  '/:id/check-in',
  verifyToken,
  requireRole('organizer', 'admin'),
  ticketController.checkInTicket
);

// 3. Get recent check-ins list (Organizer & Admin)
router.get(
  '/recent-checkins',
  verifyToken,
  requireRole('organizer', 'admin'),
  ticketController.getRecentCheckIns
);

// 4. Download PDF ticket pass (Authenticated Attendee, Organizer, Admin)
router.get(
  '/:id/download',
  verifyToken,
  documentController.downloadTicket
);

// 5. Get ticket preview details (Attendee, Organizer, Admin)
router.get(
  '/:id',
  verifyToken,
  ticketController.getTicketDetails
);

module.exports = router;
