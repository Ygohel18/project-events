// Attendance Routes: /api/attendance
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Organizer & Admin attendance management
router.get(
  '/event/:eventId',
  verifyToken,
  requireRole('organizer', 'admin'),
  attendanceController.getEventAttendance
);

router.put(
  '/:registrationId',
  verifyToken,
  requireRole('organizer', 'admin'),
  attendanceController.updateAttendance
);

module.exports = router;
