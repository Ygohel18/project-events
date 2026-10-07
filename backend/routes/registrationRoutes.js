// Registration Routes: /api/registrations
const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Logged-in user routes
router.get('/my', verifyToken, registrationController.getMyRegistrations);
router.get('/:id', verifyToken, registrationController.getRegistrationById);
router.put('/:id/cancel', verifyToken, registrationController.cancelRegistration);

module.exports = router;
