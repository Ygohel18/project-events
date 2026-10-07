import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faBell,
  faPlus,
  faBars,
  faTimes,
  faUser,
  faShieldHalved,
  faSignOutAlt,
  faTicketAlt,
  faAngleDown,
  faUsers,
  faChartPie,
  faMoneyBillWave,
  faQrcode
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { notificationAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { settings } = useSettings();
  const [unreadCount, setUnreadCount] = useState(0);

  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // User profile dropdown toggle
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notification count from live database
  useEffect(() => {
    if (isAuthenticated) {
      notificationAPI
        .getNotifications()
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data?.data)) {
            const count = res.data.data.filter((n) => !n.read).length;
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, router.pathname]);

  // Helper to check if a route is currently active
  const isActive = (path) => router.pathname === path;

  // Avatar with local/Gravatar fallback based on email
  const avatarImage = getMediaUrl(user?.profile_image, 'profile', user?.email);

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top py-2 shadow-sm">
      <div className="container">
        {/* Brand Logo */}
        <Link href="/" className="navbar-brand fs-4 fw-bold text-decoration-none d-flex align-items-center">
          {settings.logo ? (
            <img
              src={settings.logo.startsWith('http') ? settings.logo : `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001'}${settings.logo}`}
              alt={settings.brand_name || 'Brand Logo'}
              style={{ maxHeight: '36px', maxWidth: '140px', objectFit: 'contain' }}
              className="me-2 rounded"
            />
          ) : (
            <FontAwesomeIcon icon={faCalendarCheck} className="text-primary me-2" />
          )}
          <span>{settings.brand_name || 'CampusEvents'}</span>
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <FontAwesomeIcon
            icon={isMobileMenuOpen ? faTimes : faBars}
            className="fs-5 text-secondary"
          />
        </button>

        {/* Navigation Links */}
        <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show mt-3 mt-lg-0' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-lg-1">
            {/* 1. Home (All) */}
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link text-nowrap ${isActive('/') ? 'active text-primary fw-semibold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>

            {/* 2. Events (All) */}
            <li className="nav-item">
              <Link
                href="/events"
                className={`nav-link text-nowrap ${isActive('/events') ? 'active text-primary fw-semibold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Events
              </Link>
            </li>

            {/* 3. Role-Specific Primary Nav Item */}
            {isAuthenticated && role === 'admin' && (
              <li className="nav-item">
                <Link
                  href="/admin"
                  className={`nav-link text-nowrap ${router.pathname.startsWith('/admin') ? 'active text-primary fw-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={faShieldHalved} className="me-1 text-primary small" />
                  Admin Console
                </Link>
              </li>
            )}

            {isAuthenticated && role === 'organizer' && (
              <li className="nav-item">
                <Link
                  href="/create-event"
                  className={`nav-link text-nowrap ${isActive('/create-event') ? 'active text-primary fw-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1 text-primary small" />
                  Create Event
                </Link>
              </li>
            )}

            {isAuthenticated && role === 'user' && (
              <li className="nav-item">
                <Link
                  href="/registrations"
                  className={`nav-link text-nowrap ${isActive('/registrations') ? 'active text-primary fw-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Registrations
                </Link>
              </li>
            )}

            {/* 4. About (All) */}
            <li className="nav-item">
              <Link
                href="/about"
                className={`nav-link text-nowrap ${isActive('/about') ? 'active text-primary fw-semibold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
            </li>

            {/* 5. Contact (All) */}
            <li className="nav-item">
              <Link
                href="/contact"
                className={`nav-link text-nowrap ${isActive('/contact') ? 'active text-primary fw-semibold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* Right Actions */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Unauthenticated Visitor Options */}
            {!isAuthenticated ? (
              <div className="d-flex align-items-center gap-2">
                <Link href="/login" className="btn btn-outline-primary btn-sm px-3 text-nowrap">
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm px-3 text-nowrap">
                  Sign Up
                </Link>
              </div>
            ) : (
              /* Authenticated User Options */
              <div className="d-flex align-items-center gap-2 gap-md-3">
                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="btn btn-light rounded-circle text-secondary position-relative d-flex align-items-center justify-content-center shadow-none border-0"
                  style={{ width: '38px', height: '38px' }}
                  title="Notifications"
                >
                  <FontAwesomeIcon icon={faBell} />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '0.65rem' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="btn btn-light border d-flex align-items-center gap-2 py-1 px-2 rounded-pill shadow-sm"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                  >
                    <img
                      src={avatarImage}
                      alt={user?.name || 'User'}
                      className="rounded-circle"
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                    />
                    <span className="small fw-semibold text-dark d-none d-sm-inline">
                      {user?.name?.split(' ')[0] || 'Account'}
                    </span>
                    {role === 'admin' && (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle ms-1 d-none d-md-inline" style={{ fontSize: '0.65rem' }}>
                        Admin
                      </span>
                    )}
                    {role === 'organizer' && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle ms-1 d-none d-md-inline" style={{ fontSize: '0.65rem' }}>
                        Organizer
                      </span>
                    )}
                    <FontAwesomeIcon icon={faAngleDown} className="small text-muted ms-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="position-absolute end-0 mt-2 bg-white rounded-3 shadow border p-2"
                      style={{ minWidth: '220px', zIndex: 1050 }}
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2 border-bottom mb-1">
                        <div className="fw-bold text-dark small">{user?.name}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                          {user?.email}
                        </div>
                        <span
                          className={`badge mt-1 ${
                            role === 'admin'
                              ? 'bg-danger-subtle text-danger'
                              : role === 'organizer'
                              ? 'bg-success-subtle text-success'
                              : 'bg-primary-subtle text-primary'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {role === 'admin'
                            ? 'Administrator'
                            : role === 'organizer'
                            ? 'Event Organizer'
                            : 'Student'}
                        </span>
                      </div>

                      {/* Menu Links */}
                      <Link
                        href="/profile"
                        className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faUser} className="text-primary" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/registrations"
                        className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faTicketAlt} className="text-info" />
                        <span>My Registrations</span>
                      </Link>

                      {/* Organizer or Admin: Create Event, Attendance, Reports */}
                      {(role === 'organizer' || role === 'admin') && (
                        <>
                          <Link
                            href="/create-event"
                            className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-success" />
                            <span>Create Event</span>
                          </Link>
                          <Link
                            href="/admin/attendance"
                            className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FontAwesomeIcon icon={faUsers} className="text-primary" />
                            <span>Attendance</span>
                          </Link>
                          <Link
                            href="/admin/payments"
                            className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-warning" />
                            <span>Verify Payments</span>
                          </Link>
                          <Link
                            href="/scan-ticket"
                            className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FontAwesomeIcon icon={faQrcode} className="text-primary" />
                            <span>QR Scanner</span>
                          </Link>
                          <Link
                            href="/admin/reports"
                            className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FontAwesomeIcon icon={faChartPie} className="text-info" />
                            <span>Reports & CSV</span>
                          </Link>
                        </>
                      )}

                      {/* Admin Portal Link */}
                      {role === 'admin' && (
                        <Link
                          href="/admin"
                          className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-dark"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FontAwesomeIcon icon={faShieldHalved} className="text-danger" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <hr className="my-1 border-secondary-subtle" />

                      {/* Logout */}
                      <button
                        type="button"
                        className="dropdown-item py-2 px-3 small rounded d-flex align-items-center gap-2 text-danger border-0 bg-transparent w-100 text-start"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
