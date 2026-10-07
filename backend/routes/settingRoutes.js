// Settings Routes: /api/settings
const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { uploadBrandMedia } = require('../middleware/uploadMiddleware');

// Public route: Non-sensitive brand & contact info
router.get('/public', settingController.getPublicSettings);

// Admin routes: Full platform configuration
router.get('/admin', verifyToken, requireAdmin, settingController.getAdminSettings);
router.put('/admin', verifyToken, requireAdmin, uploadBrandMedia, settingController.updateAdminSettings);

module.exports = router;
