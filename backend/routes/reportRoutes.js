// Reports Routes: /api/reports
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Organizer and Admin reports access
router.get(
  '/registrations',
  verifyToken,
  requireRole('organizer', 'admin'),
  reportController.getRegistrationReport
);

router.get(
  '/attendance',
  verifyToken,
  requireRole('organizer', 'admin'),
  reportController.getAttendanceReport
);

router.get(
  '/revenue',
  verifyToken,
  requireRole('organizer', 'admin'),
  reportController.getRevenueReport
);

router.get(
  '/events/:id',
  verifyToken,
  requireRole('organizer', 'admin'),
  reportController.getEventPerformanceReport
);

router.get(
  '/export/:type',
  verifyToken,
  requireRole('organizer', 'admin'),
  reportController.exportReportCSV
);

module.exports = router;
