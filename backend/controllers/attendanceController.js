// ========================================================
// Attendance Controller
// Handles participant attendance tracking for events
// ========================================================

const { pool } = require('../config/database');

// 1. GET /api/attendance/event/:eventId (Get all participants with attendance for an event)
async function getEventAttendance(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify event exists and check organizer permission
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (userRole !== 'admin' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to manage attendance for this event.' });
    }

    // Query participants, registration info, and attendance status
    const [rows] = await pool.query(`
      SELECT 
        r.id AS registration_id,
        r.user_id,
        r.event_id,
        r.registration_date,
        r.status AS registration_status,
        u.name AS participant_name,
        u.email AS participant_email,
        u.phone AS participant_phone,
        COALESCE(a.status, 'absent') AS attendance_status,
        a.check_in_time,
        a.id AS attendance_id
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE r.event_id = ?
      ORDER BY r.id ASC
    `, [eventId]);

    // Calculate attendance summary
    const total = rows.length;
    const present = rows.filter((r) => r.attendance_status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      },
      summary: {
        total,
        present,
        absent,
        percentage
      },
      data: rows
    });
  } catch (error) {
    console.error('getEventAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving attendance.' });
  }
}

// 2. PUT /api/attendance/:registrationId (Mark Present or Absent)
async function updateAttendance(req, res) {
  try {
    const { registrationId } = req.params;
    const { status } = req.body; // 'present' or 'absent'
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either "present" or "absent".' });
    }

    // Check registration & event ownership
    const [regs] = await pool.query(`
      SELECT r.id, r.event_id, e.organizer_id
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [registrationId]);

    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const reg = regs[0];
    if (userRole !== 'admin' && reg.organizer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to record attendance for this event.' });
    }

    const checkInTime = status === 'present' ? new Date() : null;

    // Upsert into attendance table
    const [existing] = await pool.query('SELECT id FROM attendance WHERE registration_id = ?', [registrationId]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE attendance SET status = ?, check_in_time = ? WHERE registration_id = ?',
        [status, checkInTime, registrationId]
      );
    } else {
      await pool.query(
        'INSERT INTO attendance (registration_id, status, check_in_time) VALUES (?, ?, ?)',
        [registrationId, status, checkInTime]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Participant marked as ${status}.`,
      data: {
        registrationId: Number(registrationId),
        status,
        checkInTime
      }
    });
  } catch (error) {
    console.error('updateAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating attendance.' });
  }
}

module.exports = {
  getEventAttendance,
  updateAttendance
};
