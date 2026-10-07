// Notification Controller
const { pool } = require('../config/database');

// 1. GET /api/notifications (User's notifications)
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        id, 
        title, 
        message, 
        type, 
        is_read AS \`read\`, 
        created_at AS time
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
    `, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
}

// 2. PUT /api/notifications/:id/read (Mark single as read)
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
}

// 3. PUT /api/notifications/read-all (Mark all as read)
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
