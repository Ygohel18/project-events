// ========================================================
// Reports & Analytics Controller
// Generates registration, attendance, event performance,
// and revenue reports, with one-click CSV export.
// ========================================================

const { pool } = require('../config/database');

// Helper to sanitize and escape CSV cell values
function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. GET /api/reports/registrations
async function getRegistrationReport(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.id AS event_id,
        e.title AS event_title,
        c.name AS category,
        e.date AS event_date,
        COUNT(r.id) AS total_registrations,
        SUM(CASE WHEN r.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN r.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN r.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN registrations r ON e.id = r.event_id
    `;

    const params = [];
    if (userRole !== 'admin') {
      query += ` WHERE e.organizer_id = ? `;
      params.push(userId);
    }

    query += ` GROUP BY e.id ORDER BY e.id DESC `;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getRegistrationReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating registration report.' });
  }
}

// 2. GET /api/reports/attendance
async function getAttendanceReport(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.id AS event_id,
        e.title AS event_title,
        c.name AS category,
        e.date AS event_date,
        COUNT(r.id) AS total_registered,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent' OR a.status IS NULL THEN 1 ELSE 0 END) AS absent_count
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'Confirmed'
      LEFT JOIN attendance a ON r.id = a.registration_id
    `;

    const params = [];
    if (userRole !== 'admin') {
      query += ` WHERE e.organizer_id = ? `;
      params.push(userId);
    }

    query += ` GROUP BY e.id ORDER BY e.id DESC `;

    const [rows] = await pool.query(query, params);

    // Compute attendance percentage
    const formatted = rows.map((row) => {
      const total = Number(row.total_registered) || 0;
      const present = Number(row.present_count) || 0;
      const absent = Number(row.absent_count) || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        ...row,
        total_registered: total,
        present_count: present,
        absent_count: absent,
        attendance_percentage: percentage
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('getAttendanceReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating attendance report.' });
  }
}

// 3. GET /api/reports/revenue
async function getRevenueReport(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.id AS event_id,
        e.title AS event_title,
        e.registration_fee AS fee,
        COUNT(r.id) AS paid_registrations,
        (COUNT(r.id) * e.registration_fee) AS total_revenue
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'Confirmed'
    `;

    const params = [];
    if (userRole !== 'admin') {
      query += ` WHERE e.organizer_id = ? `;
      params.push(userId);
    }

    query += ` GROUP BY e.id ORDER BY total_revenue DESC `;

    const [rows] = await pool.query(query, params);

    const totalRevenueSum = rows.reduce((acc, curr) => acc + Number(curr.total_revenue || 0), 0);

    return res.status(200).json({
      success: true,
      totalRevenue: totalRevenueSum,
      data: rows
    });
  } catch (error) {
    console.error('getRevenueReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating revenue report.' });
  }
}

// 4. GET /api/reports/events/:id (Single Event Performance)
async function getEventPerformanceReport(req, res) {
  try {
    const { id } = req.params;

    const [events] = await pool.query(`
      SELECT 
        e.*,
        c.name AS category_name,
        u.name AS organizer_name
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];

    // Compute stats
    const [regs] = await pool.query(`
      SELECT 
        COUNT(r.id) AS total,
        SUM(CASE WHEN r.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN r.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM registrations r
      WHERE r.event_id = ?
    `, [id]);

    const [att] = await pool.query(`
      SELECT 
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent' OR a.status IS NULL THEN 1 ELSE 0 END) AS absent
      FROM registrations r
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE r.event_id = ? AND r.status = 'Confirmed'
    `, [id]);

    const totalReg = Number(regs[0].total || 0);
    const confirmedReg = Number(regs[0].confirmed || 0);
    const cancelledReg = Number(regs[0].cancelled || 0);
    const presentCount = Number(att[0].present || 0);
    const absentCount = Number(att[0].absent || 0);
    const attendancePct = confirmedReg > 0 ? Math.round((presentCount / confirmedReg) * 100) : 0;
    const revenue = confirmedReg * Number(event.registration_fee || 0);

    return res.status(200).json({
      success: true,
      data: {
        event,
        metrics: {
          totalRegistrations: totalReg,
          confirmedRegistrations: confirmedReg,
          cancelledRegistrations: cancelledReg,
          presentCount,
          absentCount,
          attendancePercentage: attendancePct,
          totalRevenue: revenue
        }
      }
    });
  } catch (error) {
    console.error('getEventPerformanceReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving event performance.' });
  }
}

// 5. GET /api/reports/export/:type (Stream CSV Export)
async function exportReportCSV(req, res) {
  try {
    const { type } = req.params; // 'registrations', 'attendance', 'revenue'

    let csvData = '';
    const now = new Date().toISOString().split('T')[0];

    if (type === 'registrations') {
      const [rows] = await pool.query(`
        SELECT 
          e.title AS event_title,
          c.name AS category,
          e.date AS event_date,
          COUNT(r.id) AS total_registrations,
          SUM(CASE WHEN r.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed,
          SUM(CASE WHEN r.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY e.id
        ORDER BY e.id DESC
      `);

      csvData += 'Event Title,Category,Date,Total Registrations,Confirmed,Cancelled\n';
      rows.forEach((r) => {
        csvData += `${escapeCsv(r.event_title)},${escapeCsv(r.category)},${escapeCsv(r.event_date)},${r.total_registrations || 0},${r.confirmed || 0},${r.cancelled || 0}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-report-${now}.csv"`);
      return res.status(200).send(csvData);
    }

    if (type === 'attendance') {
      const [rows] = await pool.query(`
        SELECT 
          e.title AS event_title,
          e.date AS event_date,
          COUNT(r.id) AS total_registered,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN a.status = 'absent' OR a.status IS NULL THEN 1 ELSE 0 END) AS absent_count
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'Confirmed'
        LEFT JOIN attendance a ON r.id = a.registration_id
        GROUP BY e.id
        ORDER BY e.id DESC
      `);

      csvData += 'Event Title,Date,Registered,Present,Absent,Attendance %\n';
      rows.forEach((r) => {
        const total = Number(r.total_registered) || 0;
        const present = Number(r.present_count) || 0;
        const absent = Number(r.absent_count) || 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        csvData += `${escapeCsv(r.event_title)},${escapeCsv(r.event_date)},${total},${present},${absent},${pct}%\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${now}.csv"`);
      return res.status(200).send(csvData);
    }

    if (type === 'revenue') {
      const [rows] = await pool.query(`
        SELECT 
          e.title AS event_title,
          e.registration_fee AS fee,
          COUNT(r.id) AS paid_registrations,
          (COUNT(r.id) * e.registration_fee) AS total_revenue
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'Confirmed'
        GROUP BY e.id
        ORDER BY total_revenue DESC
      `);

      csvData += 'Event Title,Registration Fee,Paid Registrations,Total Revenue (INR)\n';
      rows.forEach((r) => {
        csvData += `${escapeCsv(r.event_title)},${r.fee || 0},${r.paid_registrations || 0},${r.total_revenue || 0}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${now}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(400).json({ success: false, message: 'Invalid report type for export.' });
  } catch (error) {
    console.error('exportReportCSV error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating CSV export.' });
  }
}

module.exports = {
  getRegistrationReport,
  getAttendanceReport,
  getRevenueReport,
  getEventPerformanceReport,
  exportReportCSV
};
