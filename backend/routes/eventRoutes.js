// Event Routes: /api/events
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, optionalAuth, requireOrganizerOrAdmin } = require('../middleware/authMiddleware');
const { uploadEventMedia } = require('../middleware/uploadMiddleware');
const { uploadPaymentScreenshot } = require('../middleware/paymentUpload');

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', optionalAuth, eventController.getEventById);

// Protected routes
router.post('/', verifyToken, requireOrganizerOrAdmin, uploadEventMedia, eventController.createEvent);
router.put('/:id', verifyToken, requireOrganizerOrAdmin, uploadEventMedia, eventController.updateEvent);
router.put('/:id/cancel', verifyToken, requireOrganizerOrAdmin, eventController.cancelEvent);
router.delete('/:id', verifyToken, requireOrganizerOrAdmin, eventController.deleteEvent);

// Attendee event registration & status
router.get('/:id/my-registration', verifyToken, eventController.getMyRegistration);
router.post('/:id/register', verifyToken, uploadPaymentScreenshot, eventController.registerForEvent);

module.exports = router;
