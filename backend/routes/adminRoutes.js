// Admin Routes: /api/admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All admin endpoints require authentication and admin role
router.use(verifyToken, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAdminUsers);
router.post('/users', adminController.createAdminUser);
router.put('/users/:id', adminController.updateAdminUser);
router.delete('/users/:id', adminController.deleteAdminUser);
router.get('/events', adminController.getAdminEvents);
router.get('/registrations', adminController.getAdminRegistrations);
router.put('/registrations/:id/status', adminController.updateRegistrationStatus);

module.exports = router;
