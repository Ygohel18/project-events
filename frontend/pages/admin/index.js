import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faTicketAlt,
  faCheck,
  faShieldHalved,
  faArrowRight,
  faTags,
  faPlus,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { adminAPI } from '../../services/api';

// Screen 11: Admin Dashboard (Main Overview)
// Dedicated administrative console with metrics, quick management portals, and real registrations from MySQL
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load live metrics on mount
  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboard();
        if (response.data?.success && response.data?.data) {
          const { totalUsers, totalEvents, totalRegistrations, recentRegistrations: recent } =
            response.data.data;
          setStats({ totalUsers, totalEvents, totalRegistrations });
          setRecentRegistrations(recent || []);
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardMetrics();
  }, []);

  // Status update handler for admin
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminAPI.updateRegistrationStatus(id, newStatus);
      setRecentRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status: newStatus } : reg))
      );
    } catch (err) {
      console.error('Error updating registration status:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container py-4">
          {/* Admin Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary me-2" />
                Admin Dashboard
              </h2>
              <p className="text-secondary small mb-0">
                Live overview of platform performance, user registrations, and events from MySQL
              </p>
            </div>
            <Link
              href="/create-event"
              className="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add New Event</span>
            </Link>
          </div>

          <div className="row g-4">
            {/* Left Admin Sidebar */}
            <div className="col-12 col-lg-3">
              <AdminSidebar currentPath="/admin" />
            </div>

            {/* Right Main Dashboard Area */}
            <div className="col-12 col-lg-9">
              {/* Loading Indicator */}
              {loading && (
                <div className="card border bg-white p-4 text-center rounded-4 shadow-sm mb-4">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading metrics...</span>
                  </div>
                  <p className="text-muted small mb-0">Calculating statistics from database...</p>
                </div>
              )}

              {/* 1. Statistics Cards */}
              <div className="row g-3 mb-4">
                {/* Total Users */}
                <div className="col-12 col-sm-4">
                  <div className="card border shadow-sm p-3 bg-white h-100 rounded-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center"
                        style={{ width: '54px', height: '54px' }}
                      >
                        <FontAwesomeIcon icon={faUsers} className="fs-4" />
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Total Users</span>
                        <h3 className="fw-bold text-dark mb-0">{stats.totalUsers}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Events */}
                <div className="col-12 col-sm-4">
                  <div className="card border shadow-sm p-3 bg-white h-100 rounded-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 bg-info-subtle text-info p-3 d-flex align-items-center justify-content-center"
                        style={{ width: '54px', height: '54px' }}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} className="fs-4" />
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Total Events</span>
                        <h3 className="fw-bold text-dark mb-0">{stats.totalEvents}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Registrations */}
                <div className="col-12 col-sm-4">
                  <div className="card border shadow-sm p-3 bg-white h-100 rounded-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center"
                        style={{ width: '54px', height: '54px' }}
                      >
                        <FontAwesomeIcon icon={faTicketAlt} className="fs-4" />
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Total Registrations</span>
                        <h3 className="fw-bold text-dark mb-0">{stats.totalRegistrations}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Quick Navigation Shortcut Cards */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <Link
                    href="/admin/events"
                    className="card border p-3 bg-white text-decoration-none h-100 card-hover rounded-3"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-primary fs-5" />
                      <FontAwesomeIcon icon={faArrowRight} className="text-muted small" />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Manage Events</h6>
                    <p className="text-muted small mb-0">View event catalog &amp; dates</p>
                  </Link>
                </div>

                <div className="col-6 col-md-3">
                  <Link
                    href="/admin/users"
                    className="card border p-3 bg-white text-decoration-none h-100 card-hover rounded-3"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <FontAwesomeIcon icon={faUsers} className="text-info fs-5" />
                      <FontAwesomeIcon icon={faArrowRight} className="text-muted small" />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Manage Users</h6>
                    <p className="text-muted small mb-0">Accounts &amp; role permissions</p>
                  </Link>
                </div>

                <div className="col-6 col-md-3">
                  <Link
                    href="/admin/registrations"
                    className="card border p-3 bg-white text-decoration-none h-100 card-hover rounded-3"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <FontAwesomeIcon icon={faTicketAlt} className="text-success fs-5" />
                      <FontAwesomeIcon icon={faArrowRight} className="text-muted small" />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Registrations</h6>
                    <p className="text-muted small mb-0">Booking approvals &amp; tickets</p>
                  </Link>
                </div>

                <div className="col-6 col-md-3">
                  <Link
                    href="/admin/categories"
                    className="card border p-3 bg-white text-decoration-none h-100 card-hover rounded-3"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <FontAwesomeIcon icon={faTags} className="text-warning fs-5" />
                      <FontAwesomeIcon icon={faArrowRight} className="text-muted small" />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Categories</h6>
                    <p className="text-muted small mb-0">Classifications &amp; tags</p>
                  </Link>
                </div>
              </div>

              {/* 3. Recent Registrations Table from MySQL */}
              <div className="card border shadow-sm p-4 bg-white rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Recent Registrations</h5>
                  <Link
                    href="/admin/registrations"
                    className="small text-primary text-decoration-none fw-medium"
                  >
                    View All Registrations →
                  </Link>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table align-middle table-hover mb-0">
                    <thead className="table-light">
                      <tr className="text-secondary small">
                        <th scope="col" className="ps-3 py-2">
                          User
                        </th>
                        <th scope="col" className="py-2">
                          Event
                        </th>
                        <th scope="col" className="py-2">
                          Date
                        </th>
                        <th scope="col" className="py-2">
                          Status
                        </th>
                        <th scope="col" className="py-2 text-end pe-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRegistrations.length > 0 ? (
                        recentRegistrations.map((item) => (
                          <tr key={item.id}>
                            <td className="ps-3 py-3 fw-medium text-dark">{item.user}</td>
                            <td className="py-3 text-secondary">{item.event}</td>
                            <td className="py-3 text-secondary small">{item.date}</td>
                            <td className="py-3">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="py-3 text-end pe-3">
                              {item.status === 'Pending' ? (
                                <button
                                  className="btn btn-outline-success btn-sm px-2 py-1"
                                  onClick={() => handleUpdateStatus(item.id, 'Confirmed')}
                                  title="Approve Registration"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                                  Approve
                                </button>
                              ) : (
                                <span className="badge bg-light text-muted border">
                                  {item.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted small">
                            No recent registrations in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
