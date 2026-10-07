// Admin Controller
// Powers administrative dashboard metrics, user lists, event rosters, and registration tracking
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// 1. GET /api/admin/dashboard (Single endpoint for dashboard metrics)
async function getDashboard(req, res) {
  try {
    // Total Users count
    const [userCountRows] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const totalUsers = userCountRows[0].total;

    // Total Events count
    const [eventCountRows] = await pool.query('SELECT COUNT(*) AS total FROM events');
    const totalEvents = eventCountRows[0].total;

    // Total Registrations count
    const [regCountRows] = await pool.query('SELECT COUNT(*) AS total FROM registrations');
    const totalRegistrations = regCountRows[0].total;

    // Recent Registrations (top 5)
    const [recentRegistrations] = await pool.query(`
      SELECT 
        r.id,
        u.name AS user,
        e.title AS event,
        e.date,
        r.status
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.id DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin dashboard data.' });
  }
}

// 2. GET /api/admin/users
async function getAdminUsers(req, res) {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.profile_image AS avatar,
        'Active' AS status,
        COUNT(r.id) AS registeredEvents,
        u.created_at AS joinedDate
      FROM users u
      LEFT JOIN registrations r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('getAdminUsers error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving user list.' });
  }
}

// 3. GET /api/admin/events
async function getAdminEvents(req, res) {
  try {
    const [events] = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.category_id,
        c.name AS category,
        e.date,
        e.time,
        e.location,
        e.image,
        e.brochure,
        e.organizer_id,
        u.name AS organizer_name,
        e.registration_fee AS price,
        e.max_participants AS maxParticipants,
        e.status,
        COUNT(r.id) AS registeredCount
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'Cancelled'
      GROUP BY e.id
      ORDER BY e.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('getAdminEvents error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin events.' });
  }
}

// 4. GET /api/admin/registrations
async function getAdminRegistrations(req, res) {
  try {
    const [registrations] = await pool.query(`
      SELECT 
        r.id,
        CONCAT('TKT-', LPAD(r.id, 4, '0')) AS ticketNumber,
        u.name AS user,
        u.email,
        e.title AS event,
        e.date,
        CASE 
          WHEN e.registration_fee = 0 THEN 'Free' 
          ELSE CONCAT('₹ ', e.registration_fee) 
        END AS amount,
        r.status
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('getAdminRegistrations error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin registrations.' });
  }
}

// 5. PUT /api/admin/registrations/:id/status
async function updateRegistrationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    await pool.query('UPDATE registrations SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      success: true,
      message: `Registration status updated to ${status}.`
    });
  } catch (error) {
    console.error('updateRegistrationStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating registration status.' });
  }
}

// 6. POST /api/admin/users
async function createAdminUser(req, res) {
  try {
    const { name, email, phone, role, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const cleanRole = role === 'Attendee' ? 'user' : (role || 'user').toLowerCase();

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), phone || null, cleanRole, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully!',
      userId: result.insertId
    });
  } catch (error) {
    console.error('createAdminUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating user.' });
  }
}

// 7. PUT /api/admin/users/:id
async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    const cleanRole = role === 'Attendee' ? 'user' : (role ? role.toLowerCase() : undefined);

    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE id = ?',
      [name ? name.trim() : null, email ? email.trim().toLowerCase() : null, phone || null, cleanRole || null, id]
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.'
    });
  } catch (error) {
    console.error('updateAdminUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user.' });
  }
}

// 8. DELETE /api/admin/users/:id
async function deleteAdminUser(req, res) {
  try {
    const { id } = req.params;

    // Remove user bookings and notifications first
    await pool.query('DELETE FROM registrations WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('deleteAdminUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
}

module.exports = {
  getDashboard,
  getAdminUsers,
  getAdminEvents,
  getAdminRegistrations,
  updateRegistrationStatus,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
};
