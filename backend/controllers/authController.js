// Authentication Controller (Register, Login, Forgot & Reset Password)

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { isValidEmail, isNotEmpty, isMinLength } = require('../utils/validation');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'college_event_hub_secret_key_2025';

// Helper to fetch active database session version
async function getAuthSessionVersion() {
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'auth_session_version' LIMIT 1"
    );
    if (rows.length > 0 && rows[0].setting_value) {
      return rows[0].setting_value;
    }
  } catch (err) {
    // Safe fallback if table is momentarily uninitialized
  }
  return 'default_session';
}

// 1. POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate inputs
    if (!isNotEmpty(name)) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!isMinLength(password, 6)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please login.' });
    }

    // Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role is 'user' unless specified
    const userRole = role === 'organizer' || role === 'admin' ? role : 'user';

    // Insert user into database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, hashedPassword, userRole]
    );

    const newUserId = result.insertId;

    // Dispatch welcome email asynchronously
    emailService.sendWelcomeEmail({
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: userRole
    }).catch((err) => console.error('Failed to dispatch welcome email:', err.message));

    // Generate JWT token with token_version and session_version
    const sessionVersion = await getAuthSessionVersion();
    const token = jwt.sign(
      {
        id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: userRole,
        token_version: 1,
        session_version: sessionVersion
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again later.' });
  }
}

// 2. POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both valid email and password.' });
    }

    // Find user in MySQL database
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token with token_version and session_version
    const sessionVersion = await getAuthSessionVersion();
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token_version: user.token_version || 1,
        session_version: sessionVersion
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again later.' });
  }
}

// 3. POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [cleanEmail]);

    if (users.length === 0) {
      // Don't leak user existence in production, but confirm email sent message
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    // Delete any previous unused reset tokens for this email
    await pool.query('DELETE FROM password_resets WHERE email = ?', [cleanEmail]);

    // Store token in MySQL
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [cleanEmail, resetToken, expiresAt]
    );

    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error sending password reset link.' });
  }
}

// 4. POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (!isMinLength(newPassword, 6)) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    let cleanEmail = email ? email.trim().toLowerCase() : null;

    // Verify token & expiry in database
    let query = 'SELECT id, email FROM password_resets WHERE token = ? AND expires_at > NOW()';
    let params = [token];
    if (cleanEmail) {
      query += ' AND email = ?';
      params.push(cleanEmail);
    }

    const [records] = await pool.query(query, params);

    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    cleanEmail = records[0].email;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in users table
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, cleanEmail]);

    // Delete used reset token
    await pool.query('DELETE FROM password_resets WHERE email = ?', [cleanEmail]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
