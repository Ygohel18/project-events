// User Profile Controller
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// 1. GET /api/users/profile
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, address, role, profile_image, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
}

// 2. PUT /api/users/profile (Updates profile info & handles avatar file upload)
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Fetch existing user
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const current = existing[0];
    const updatedName = name ? name.trim() : current.name;
    const updatedPhone = phone !== undefined ? phone : current.phone;
    const updatedAddress = address !== undefined ? address : current.address;

    let updatedImage = current.profile_image;

    // If new avatar file was uploaded
    if (req.file) {
      updatedImage = '/uploads/profiles/' + req.file.filename;

      // Delete previous uploaded avatar if it was in /uploads/profiles/
      if (current.profile_image && current.profile_image.startsWith('/uploads/profiles/')) {
        const oldPath = path.join(__dirname, '..', current.profile_image);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error removing old avatar:', e); }
        }
      }
    } else if (req.body.profile_image) {
      updatedImage = req.body.profile_image;
    }

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, profile_image = ? WHERE id = ?',
      [updatedName, updatedPhone, updatedAddress, updatedImage, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        id: userId,
        name: updatedName,
        email: current.email,
        phone: updatedPhone,
        address: updatedAddress,
        role: current.role,
        profile_image: updatedImage
      }
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
