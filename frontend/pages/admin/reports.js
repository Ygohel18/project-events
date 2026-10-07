import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faFileCsv,
  faUsers,
  faClipboardCheck,
  faRupeeSign,
  faSpinner,
  faDownload,
  faFilter,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import ExportDropdown from '../../components/common/ExportDropdown';
import { reportAPI, exportAPI } from '../../services/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations', 'attendance', 'revenue'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Data states
  const [regData, setRegData] = useState([]);
  const [attData, setAttData] = useState([]);
  const [revData, setRevData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Load report data on mount and tab switch
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setErrorMsg('');

        if (activeTab === 'registrations') {
          const res = await reportAPI.getRegistrationReport();
          if (res.data?.success) setRegData(res.data.data);
        } else if (activeTab === 'attendance') {
          const res = await reportAPI.getAttendanceReport();
          if (res.data?.success) setAttData(res.data.data);
        } else if (activeTab === 'revenue') {
          const res = await reportAPI.getRevenueReport();
          if (res.data?.success) {
            setRevData(res.data.data);
            setTotalRevenue(res.data.totalRevenue || 0);
          }
        }
      } catch (err) {
        console.error('Error loading report:', err);
        setErrorMsg('Failed to fetch report data from server.');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [activeTab]);

  // Handle CSV export download
  const handleExportCSV = (type) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const exportUrl = `${reportAPI.exportCSVUrl(type)}`;
    
    // Fetch with authorization header and trigger browser download
    fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('CSV export failed:', err);
        alert('Failed to export CSV. Please try again.');
      });
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']}>
      <Layout>
        <div className="container py-4">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faChartLine} className="text-primary me-2" />
                Reports &amp; Analytics
              </h2>
              <p className="text-secondary small mb-0">
                Official reports for event registrations, attendee attendance, and ticket revenues
              </p>
            </div>
            <div>
              <ExportDropdown
                onExport={(format) => exportAPI.reports(activeTab, format)}
                baseFilename={`${activeTab}-report`}
                label={`Export ${activeTab.toUpperCase()}`}
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 rounded-4 bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-white-50">Total Registrations</span>
                    <h3 className="fw-bold mb-0">
                      {regData.reduce((acc, curr) => acc + Number(curr.total_registrations || 0), 0)}
                    </h3>
                  </div>
                  <FontAwesomeIcon icon={faUsers} className="fs-1 text-white-50" />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 rounded-4 bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-white-50">Total Checked In</span>
                    <h3 className="fw-bold mb-0">
                      {attData.reduce((acc, curr) => acc + Number(curr.present_count || 0), 0)}
                    </h3>
                  </div>
                  <FontAwesomeIcon icon={faClipboardCheck} className="fs-1 text-white-50" />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 rounded-4 text-white" style={{ backgroundColor: '#123B70' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-white-50">Total Revenue Calculated</span>
                    <h3 className="fw-bold mb-0">₹{totalRevenue.toLocaleString()}</h3>
                  </div>
                  <FontAwesomeIcon icon={faRupeeSign} className="fs-1 text-white-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Report Navigation Tabs */}
          <ul className="nav nav-pills mb-4 bg-white p-2 rounded-4 border shadow-sm gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-3 fw-semibold ${activeTab === 'registrations' ? 'active text-white' : ''}`}
                onClick={() => setActiveTab('registrations')}
              >
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Registration Report
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-3 fw-semibold ${activeTab === 'attendance' ? 'active text-white' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                Attendance Report
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-3 fw-semibold ${activeTab === 'revenue' ? 'active text-white' : ''}`}
                onClick={() => setActiveTab('revenue')}
              >
                <FontAwesomeIcon icon={faRupeeSign} className="me-2" />
                Revenue Report
              </button>
            </li>
          </ul>

          {/* Feedback Error Alert */}
          {errorMsg && (
            <div className="alert alert-danger py-2 small mb-4" role="alert">
              {errorMsg}
            </div>
          )}

          {/* Report Table Card */}
          <div className="card border shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-primary fs-4" />
                  <p className="small mt-2 mb-0">Computing report statistics from database...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  {/* TAB 1: REGISTRATIONS REPORT */}
                  {activeTab === 'registrations' && (
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-secondary">
                          <th className="ps-4 py-3">Event Title</th>
                          <th className="py-3">Category</th>
                          <th className="py-3">Date</th>
                          <th className="py-3 text-center">Total Bookings</th>
                          <th className="py-3 text-center">Confirmed</th>
                          <th className="py-3 text-center pe-4">Cancelled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regData.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted small">
                              No registration records available yet.
                            </td>
                          </tr>
                        ) : (
                          regData.map((r) => (
                            <tr key={r.event_id}>
                              <td className="ps-4 py-3 fw-bold text-dark">{r.event_title}</td>
                              <td><span className="badge bg-light text-primary border">{r.category}</span></td>
                              <td className="text-muted small">{r.event_date}</td>
                              <td className="text-center fw-bold">{r.total_registrations || 0}</td>
                              <td className="text-center text-success fw-semibold">{r.confirmed_count || 0}</td>
                              <td className="text-center text-danger pe-4 fw-semibold">{r.cancelled_count || 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* TAB 2: ATTENDANCE REPORT */}
                  {activeTab === 'attendance' && (
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-secondary">
                          <th className="ps-4 py-3">Event Title</th>
                          <th className="py-3">Date</th>
                          <th className="py-3 text-center">Registered</th>
                          <th className="py-3 text-center text-success">Present</th>
                          <th className="py-3 text-center text-danger">Absent</th>
                          <th className="py-3 text-center pe-4">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attData.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted small">
                              No attendance data available yet.
                            </td>
                          </tr>
                        ) : (
                          attData.map((a) => (
                            <tr key={a.event_id}>
                              <td className="ps-4 py-3 fw-bold text-dark">{a.event_title}</td>
                              <td className="text-muted small">{a.event_date}</td>
                              <td className="text-center fw-bold">{a.total_registered || 0}</td>
                              <td className="text-center text-success fw-bold">{a.present_count || 0}</td>
                              <td className="text-center text-danger fw-bold">{a.absent_count || 0}</td>
                              <td className="text-center pe-4">
                                <span className={`badge ${a.attendance_percentage >= 75 ? 'bg-success' : a.attendance_percentage >= 50 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                  {a.attendance_percentage}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* TAB 3: REVENUE REPORT */}
                  {activeTab === 'revenue' && (
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-secondary">
                          <th className="ps-4 py-3">Event Title</th>
                          <th className="py-3">Ticket / Registration Fee</th>
                          <th className="py-3 text-center">Paid Registrations</th>
                          <th className="py-3 text-end pe-4">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revData.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted small">
                              No revenue data recorded yet.
                            </td>
                          </tr>
                        ) : (
                          revData.map((rev) => (
                            <tr key={rev.event_id}>
                              <td className="ps-4 py-3 fw-bold text-dark">{rev.event_title}</td>
                              <td>₹{Number(rev.fee || 0).toFixed(2)}</td>
                              <td className="text-center fw-semibold">{rev.paid_registrations || 0}</td>
                              <td className="text-end pe-4 fw-bold text-success">
                                ₹{Number(rev.total_revenue || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
