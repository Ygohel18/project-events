import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheckCircle,
  faInfoCircle,
  faExclamationTriangle,
  faBullhorn,
  faTrashAlt,
  faCheckDouble,
  faCircle,
  faFilter,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import ProfileSidebar from '../components/dashboard/ProfileSidebar';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { notificationAPI } from '../services/api';

// Screen 12: Notifications Page
// Displays live user alerts, event updates, and announcements with read/unread statuses from MySQL
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Load live notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        const response = await notificationAPI.getNotifications();
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setNotifications(response.data.data);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: 1 } : item))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read: 1 }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Helper to get icon and color styles based on notification type
  const getTypeDetails = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: faCheckCircle,
          color: '#16A34A',
          bgColor: '#DCFCE7'
        };
      case 'warning':
        return {
          icon: faExclamationTriangle,
          color: '#D97706',
          bgColor: '#FEF3C7'
        };
      case 'info':
        return {
          icon: faInfoCircle,
          color: '#2563EB',
          bgColor: '#EFF6FF'
        };
      default:
        return {
          icon: faBullhorn,
          color: '#4F46E5',
          bgColor: '#EEF2FF'
        };
    }
  };

  // Filter list based on selected filter
  const displayedNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'read') return item.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container py-4">
          {/* Page Title */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">
              <FontAwesomeIcon icon={faBell} className="text-primary me-2" />
              Notifications
            </h2>
            <p className="text-secondary small mb-0">
              Stay updated with your latest event registrations, schedule changes, and alerts
            </p>
          </div>

          <div className="row g-4">
            {/* Left Sidebar (Profile & Account links) */}
            <div className="col-12 col-md-4 col-lg-3">
              <ProfileSidebar />
            </div>

            {/* Right Main Notifications Content */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="card border shadow-sm bg-white overflow-hidden rounded-4">
                {/* Header with filters and quick action buttons */}
                <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark">Inbox</span>
                    {unreadCount > 0 ? (
                      <span className="badge bg-primary rounded-pill">
                        {unreadCount} unread
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border">
                        All caught up
                      </span>
                    )}
                  </div>

                  {/* Filter and action buttons */}
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {/* Filter tabs */}
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${
                          filter === 'all' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setFilter('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`btn ${
                          filter === 'unread' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setFilter('unread')}
                      >
                        Unread
                      </button>
                      <button
                        type="button"
                        className={`btn ${
                          filter === 'read' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setFilter('read')}
                      >
                        Read
                      </button>
                    </div>

                    {/* Mark all as read button */}
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        onClick={handleMarkAllAsRead}
                      >
                        <FontAwesomeIcon icon={faCheckDouble} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Loading state */}
                {loading && (
                  <div className="p-5 text-center">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading notifications...</span>
                    </div>
                    <p className="text-muted small">Loading notifications...</p>
                  </div>
                )}

                {/* Notifications List */}
                {!loading && (
                  <div className="list-group list-group-flush">
                    {displayedNotifications.length > 0 ? (
                      displayedNotifications.map((item) => {
                        const details = getTypeDetails(item.type);
                        const isUnread = !item.read;

                        return (
                          <div
                            key={item.id}
                            className={`list-group-item p-3 transition-colors ${
                              isUnread ? 'bg-primary-subtle bg-opacity-10' : ''
                            }`}
                            style={{
                              borderLeft: isUnread ? '4px solid #2563EB' : '4px solid transparent'
                            }}
                          >
                            <div className="d-flex align-items-start gap-3">
                              {/* Type Icon Badge */}
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  backgroundColor: details.bgColor,
                                  color: details.color
                                }}
                              >
                                <FontAwesomeIcon icon={details.icon} className="fs-6" />
                              </div>

                              {/* Notification Text */}
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6
                                    className={`mb-0 ${
                                      isUnread ? 'fw-bold text-dark' : 'fw-medium text-dark'
                                    }`}
                                  >
                                    {item.title}
                                  </h6>
                                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                    {item.time ? new Date(item.time).toLocaleDateString() : 'Recent'}
                                  </span>
                                </div>
                                <p className="text-secondary small mb-2">{item.message}</p>

                                {/* Action buttons */}
                                <div className="d-flex align-items-center gap-3">
                                  {isUnread && (
                                    <button
                                      type="button"
                                      className="btn btn-link btn-sm p-0 text-primary small text-decoration-none"
                                      onClick={() => handleMarkAsRead(item.id)}
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                  <Link
                                    href="/registrations"
                                    className="small text-decoration-none text-muted"
                                  >
                                    View Bookings →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Empty state */
                      <div className="text-center py-5 p-4">
                        <FontAwesomeIcon icon={faBell} className="display-5 text-muted mb-3" />
                        <h6 className="fw-bold text-dark">No Notifications</h6>
                        <p className="text-secondary small mb-0">
                          {filter === 'unread'
                            ? "You don't have any unread notifications."
                            : 'You have no notifications in your inbox at the moment.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
