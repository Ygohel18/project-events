import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faTicketAlt,
  faBell,
  faKey,
  faSignOutAlt,
  faCheckCircle,
  faLock,
  faShieldHalved,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/media';

export default function ProfileSidebar() {
  const router = useRouter();
  const { user, role, logout } = useAuth();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      setErrorMsg('Please complete all password fields.');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('Password updated successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }, 1500);
  };

  const avatar = getMediaUrl(user?.profile_image, 'profile', user?.email);

  return (
    <>
      <div className="dashboard-sidebar bg-white p-3 rounded-4 border shadow-sm">
        {/* User Header */}
        <div className="text-center p-3 border-bottom mb-3">
          <img
            src={avatar}
            alt={user?.name || 'User'}
            className="rounded-circle border border-primary border-2 mb-2"
            style={{ width: '70px', height: '70px', objectFit: 'cover' }}
          />
          <h6 className="fw-bold mb-0 text-dark">{user?.name || 'My Account'}</h6>
          <p className="text-muted small mb-1 text-truncate">{user?.email}</p>
          <span
            className={`badge ${
              role === 'admin'
                ? 'bg-danger-subtle text-danger'
                : role === 'organizer'
                ? 'bg-success-subtle text-success'
                : 'bg-primary-subtle text-primary'
            }`}
            style={{ fontSize: '0.72rem' }}
          >
            {role === 'admin'
              ? 'Administrator'
              : role === 'organizer'
              ? 'Organizer'
              : 'Student'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="d-flex flex-column gap-1">
          <Link
            href="/profile"
            className={`sidebar-nav-link text-decoration-none ${
              router.pathname === '/profile' ? 'active' : ''
            }`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>My Profile</span>
          </Link>

          <Link
            href="/registrations"
            className={`sidebar-nav-link text-decoration-none ${
              router.pathname === '/registrations' ? 'active' : ''
            }`}
          >
            <FontAwesomeIcon icon={faTicketAlt} />
            <span>My Registrations</span>
          </Link>

          {(role === 'organizer' || role === 'admin') && (
            <Link
              href="/create-event"
              className={`sidebar-nav-link text-decoration-none ${
                router.pathname === '/create-event' ? 'active' : ''
              }`}
            >
              <FontAwesomeIcon icon={faPlus} className="text-success" />
              <span>Create Event</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin"
              className="sidebar-nav-link text-decoration-none text-danger fw-semibold"
            >
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>Admin Portal</span>
            </Link>
          )}

          <Link
            href="/notifications"
            className={`sidebar-nav-link text-decoration-none ${
              router.pathname === '/notifications' ? 'active' : ''
            }`}
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Notifications</span>
          </Link>

          <button
            type="button"
            className="sidebar-nav-link border-0 bg-transparent text-start w-100"
            onClick={() => {
              setErrorMsg('');
              setSuccessMsg('');
              setShowPasswordModal(true);
            }}
          >
            <FontAwesomeIcon icon={faKey} />
            <span>Change Password</span>
          </button>

          <hr className="my-2 border-secondary-subtle" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="sidebar-nav-link text-danger border-0 bg-transparent text-start w-100"
            style={{ color: '#DC2626' }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <FontAwesomeIcon icon={faLock} className="text-primary me-2" />
                  Change Account Password
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPasswordModal(false)}
                />
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-body p-4">
                  {errorMsg && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="alert alert-success d-flex align-items-center gap-2 py-2 small mb-3">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Current Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">New Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Confirm New Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
