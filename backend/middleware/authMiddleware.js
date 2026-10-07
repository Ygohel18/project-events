// JWT Authentication & Role Authorization Middleware

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'college_event_hub_secret_key_2025';

// 1. Verify if user is logged in via Bearer token and validate session in MySQL
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  // Expect header format: "Bearer <token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is missing.'
    });
  }

  // 1. Verify JWT signature & expiration first
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (jwtErr) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }

  // 2. Validate user and session against MySQL database (resilient to transient DB drops)
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.token_version,
              (SELECT setting_value FROM system_settings WHERE setting_key = 'auth_session_version' LIMIT 1) AS current_session_version
       FROM users u
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User session no longer exists. Please log in again.'
      });
    }

    const user = rows[0];

    // Check if database was reset or reseeded with an updated session version
    if (
      decoded.session_version &&
      user.current_session_version &&
      decoded.session_version !== user.current_session_version
    ) {
      return res.status(401).json({
        success: false,
        message: 'Database was reset. Your previous session has expired. Please log in again.'
      });
    }

    // Check individual user token_version if user was explicitly revoked
    if (
      decoded.token_version &&
      user.token_version &&
      decoded.token_version !== user.token_version
    ) {
      return res.status(401).json({
        success: false,
        message: 'Your login session has been invalidated. Please log in again.'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token_version: user.token_version
    };
    next();
  } catch (dbError) {
    console.error('⚠️ Database error in authMiddleware (preserving user session):', dbError.message);
    // Return 500 instead of 401 so frontend does NOT wipe user login tokens on DB connection drops
    return res.status(500).json({
      success: false,
      message: 'Database connection issue. Please retry in a moment.'
    });
  }
}

// 2. Require Admin Role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required.'
    });
  }
  next();
}

// 3. Require Organizer or Admin Role
function requireOrganizerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'organizer' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Organizer or Administrator privileges required.'
    });
  }
  next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
}

// 4. Optional authentication (attaches user if valid token present, otherwise req.user is null)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = null;
    return next();
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.token_version,
              (SELECT setting_value FROM system_settings WHERE setting_key = 'auth_session_version' LIMIT 1) AS current_session_version
       FROM users u
       WHERE u.id = ?`,
      [decoded.id]
    );
    if (rows.length > 0) {
      const user = rows[0];
      if (
        decoded.session_version === user.current_session_version &&
        decoded.token_version === user.token_version
      ) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireOrganizerOrAdmin,
  requireRole
};
