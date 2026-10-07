// Contact Messages Routes: /api/contact
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public contact submission
router.post('/', contactController.submitContactMessage);

// Admin view messages
router.get('/', verifyToken, requireRole('admin'), contactController.getContactMessages);

module.exports = router;
