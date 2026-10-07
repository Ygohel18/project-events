// User Routes: /api/users
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');

// Protected profile endpoints
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, uploadProfilePhoto, userController.updateProfile);

module.exports = router;
