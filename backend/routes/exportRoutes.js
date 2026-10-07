// Export Routes: /api/export
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All exports are restricted to authenticated Organizer and Admin roles
router.use(verifyToken, requireRole('organizer', 'admin'));

router.get('/events', exportController.exportEvents);
router.get('/participants', exportController.exportParticipants);
router.get('/registrations', exportController.exportRegistrations);
router.get('/payments', exportController.exportPayments);
router.get('/attendance', exportController.exportAttendance);
router.get('/tickets', exportController.exportTickets);
router.get('/reports/:type', exportController.exportReports);

module.exports = router;
