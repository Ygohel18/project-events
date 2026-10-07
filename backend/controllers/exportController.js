// Export Controller: Dynamic CSV and Excel (.xlsx) Data Exports
const XLSX = require('xlsx');
const { pool } = require('../config/database');

/**
 * Helper to escape CSV values per RFC 4180
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Helper to send formatted CSV or Excel response
 */
function sendExport(res, data, baseFilename, format = 'csv') {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${baseFilename}-${dateStr}`;

  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.status(200).send(buffer);
  }

  // Default: CSV format
  if (data.length === 0) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.status(200).send('');
  }

  const headers = Object.keys(data[0]);
  let csv = headers.map(escapeCsv).join(',') + '\n';

  for (const row of data) {
    csv += headers.map((h) => escapeCsv(row[h])).join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  return res.status(200).send(csv);
}

// 1. GET /api/export/events
async function exportEvents(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { status, categoryId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.id AS "Event ID",
        e.title AS "Event Name",
        COALESCE(c.name, 'Uncategorized') AS "Category",
        e.date AS "Date",
        e.time AS "Time",
        e.location AS "Venue",
        org.name AS "Organizer",
        e.registration_fee AS "Registration Fee",
        CASE WHEN e.payment_required = 1 THEN 'Yes' ELSE 'No' END AS "Payment Required",
        e.status AS "Status",
        COUNT(r.id) AS "Total Registrations",
        e.created_at AS "Created Date"
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN users org ON e.organizer_id = org.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'Cancelled'
      WHERE 1=1
    `;
    const params = [];

    // Organizer permission scoping
    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }

    query += ' GROUP BY e.id ORDER BY e.id DESC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'events-export', format);
  } catch (error) {
    console.error('exportEvents error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting events.' });
  }
}

// 2. GET /api/export/participants
async function exportParticipants(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { eventId, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        u.id AS "Participant ID",
        u.name AS "Name",
        u.email AS "Email",
        COALESCE(u.phone, 'N/A') AS "Phone",
        e.title AS "Event",
        r.id AS "Registration ID",
        r.registration_date AS "Registration Date",
        r.status AS "Registration Status",
        r.payment_status AS "Payment Status",
        COALESCE(a.status, 'absent') AS "Attendance Status",
        a.check_in_time AS "Check-in Time"
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE 1=1
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (eventId) {
      query += ' AND e.id = ?';
      params.push(eventId);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.id DESC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'participants-export', format);
  } catch (error) {
    console.error('exportParticipants error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting participants.' });
  }
}

// 3. GET /api/export/registrations
async function exportRegistrations(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { eventId, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        r.id AS "Registration ID",
        u.name AS "Participant",
        u.email AS "Email",
        e.title AS "Event",
        e.date AS "Event Date",
        r.registration_date AS "Registration Date",
        r.status AS "Status",
        r.payment_status AS "Payment Status",
        COALESCE(p.transaction_number, 'N/A') AS "Transaction Number",
        COALESCE(a.status, 'absent') AS "Attendance Status"
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      LEFT JOIN payments p ON r.id = p.registration_id
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE 1=1
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (eventId) {
      query += ' AND e.id = ?';
      params.push(eventId);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.id DESC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'registrations-export', format);
  } catch (error) {
    console.error('exportRegistrations error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting registrations.' });
  }
}

// 4. GET /api/export/payments
async function exportPayments(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { status, eventId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        p.id AS "Payment ID",
        u.name AS "Participant",
        u.email AS "Email",
        e.title AS "Event",
        p.amount AS "Amount",
        p.transaction_number AS "Transaction Number",
        p.status AS "Payment Status",
        p.submitted_at AS "Submitted Date",
        p.verified_at AS "Verified Date",
        COALESCE(verifier.name, 'Pending') AS "Verified By"
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      LEFT JOIN users verifier ON p.verified_by = verifier.id
      WHERE 1=1
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (eventId) {
      query += ' AND p.event_id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY p.submitted_at DESC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'payments-export', format);
  } catch (error) {
    console.error('exportPayments error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting payments.' });
  }
}

// 5. GET /api/export/attendance
async function exportAttendance(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { eventId, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.title AS "Event",
        u.name AS "Participant",
        u.email AS "Email",
        r.id AS "Registration ID",
        COALESCE(t.ticket_number, 'N/A') AS "Ticket Number",
        COALESCE(a.status, 'absent') AS "Attendance Status",
        a.check_in_time AS "Check-in Time",
        COALESCE(staff.name, 'N/A') AS "Checked In By"
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN attendance a ON r.id = a.registration_id
      LEFT JOIN tickets t ON r.id = t.registration_id
      LEFT JOIN users staff ON a.checked_in_by = staff.id
      WHERE 1=1
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (eventId) {
      query += ' AND e.id = ?';
      params.push(eventId);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.id ASC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'attendance-export', format);
  } catch (error) {
    console.error('exportAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting attendance.' });
  }
}

// 6. GET /api/export/tickets
async function exportTickets(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { eventId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        t.id AS "Ticket ID",
        t.ticket_number AS "Ticket Number",
        COALESCE(t.verification_token, '') AS "Verification Token",
        r.id AS "Registration ID",
        u.name AS "Participant",
        u.email AS "Email",
        e.title AS "Event",
        e.date AS "Event Date",
        t.status AS "Ticket Status",
        COALESCE(a.status, 'absent') AS "Attendance Status",
        t.generated_at AS "Generated Date"
      FROM tickets t
      JOIN registrations r ON t.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN attendance a ON r.id = a.registration_id
      WHERE 1=1
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' AND e.organizer_id = ?';
      params.push(userId);
    }

    if (eventId) {
      query += ' AND e.id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY t.id DESC';

    const [rows] = await pool.query(query, params);
    return sendExport(res, rows, 'tickets-export', format);
  } catch (error) {
    console.error('exportTickets error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting tickets.' });
  }
}

// 7. GET /api/export/reports/:type
async function exportReports(req, res) {
  try {
    const { type } = req.params; // 'registrations', 'attendance', 'revenue'
    const format = (req.query.format || 'csv').toLowerCase();
    const userId = req.user.id;
    const userRole = req.user.role;

    if (type === 'registrations') {
      let query = `
        SELECT 
          e.title AS "Event Title",
          COALESCE(c.name, 'General') AS "Category",
          e.date AS "Date",
          COUNT(r.id) AS "Total Registrations",
          SUM(CASE WHEN r.status = 'Confirmed' THEN 1 ELSE 0 END) AS "Confirmed",
          SUM(CASE WHEN r.status = 'Cancelled' THEN 1 ELSE 0 END) AS "Cancelled"
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE 1=1
      `;
      const params = [];

      if (userRole !== 'admin') {
        query += ' AND e.organizer_id = ?';
        params.push(userId);
      }

      query += ' GROUP BY e.id ORDER BY e.id DESC';

      const [rows] = await pool.query(query, params);
      return sendExport(res, rows, 'registration-report', format);
    }

    if (type === 'attendance') {
      let query = `
        SELECT 
          e.title AS "Event Title",
          e.date AS "Event Date",
          COUNT(r.id) AS "Registered Attendees",
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS "Present",
          SUM(CASE WHEN a.status = 'absent' OR a.status IS NULL THEN 1 ELSE 0 END) AS "Absent"
        FROM events e
        JOIN registrations r ON e.id = r.event_id AND r.status = 'Confirmed'
        LEFT JOIN attendance a ON r.id = a.registration_id
        WHERE 1=1
      `;
      const params = [];

      if (userRole !== 'admin') {
        query += ' AND e.organizer_id = ?';
        params.push(userId);
      }

      query += ' GROUP BY e.id ORDER BY e.id DESC';

      const [rows] = await pool.query(query, params);
      return sendExport(res, rows, 'attendance-report', format);
    }

    if (type === 'revenue') {
      let query = `
        SELECT 
          e.title AS "Event Title",
          e.registration_fee AS "Ticket Fee",
          COUNT(p.id) AS "Completed Transactions",
          COALESCE(SUM(p.amount), 0) AS "Total Revenue"
        FROM events e
        LEFT JOIN payments p ON e.id = p.event_id AND p.status = 'approved'
        WHERE e.payment_required = 1
      `;
      const params = [];

      if (userRole !== 'admin') {
        query += ' AND e.organizer_id = ?';
        params.push(userId);
      }

      query += ' GROUP BY e.id ORDER BY e.id DESC';

      const [rows] = await pool.query(query, params);
      return sendExport(res, rows, 'revenue-report', format);
    }

    return res.status(400).json({ success: false, message: 'Invalid report export type.' });
  } catch (error) {
    console.error('exportReports error:', error);
    return res.status(500).json({ success: false, message: 'Server error exporting report.' });
  }
}

module.exports = {
  exportEvents,
  exportParticipants,
  exportRegistrations,
  exportPayments,
  exportAttendance,
  exportTickets,
  exportReports
};
