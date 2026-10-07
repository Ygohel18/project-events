import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faArrowLeft,
  faSpinner,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

// Beginner-friendly Route Protection Component
// Checks if user is logged in and whether their role is permitted
export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const { user, isAuthenticated, loading, role } = useAuth();

  // 1. Still loading authentication state from localStorage
  if (loading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-secondary fw-normal">Checking permissions...</h5>
      </div>
    );
  }

  // 2. User is NOT logged in: prompt to login
  if (!isAuthenticated) {
    return (
      <div className="container py-5 my-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <div className="card border shadow-sm p-4 p-md-5 rounded-4 bg-white">
              <div
                className="rounded-circle bg-warning-subtle text-warning p-3 mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: '70px', height: '70px' }}
              >
                <FontAwesomeIcon icon={faLock} className="fs-2" />
              </div>
              <h4 className="fw-bold text-dark mb-2">Login Required</h4>
              <p className="text-secondary small mb-4">
                You must be logged in to view this page. Please sign in to your account.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Link href="/" className="btn btn-outline-secondary btn-sm px-3">
                  Back to Home
                </Link>
                <Link href="/login" className="btn btn-primary btn-sm px-4">
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is logged in, but role is NOT allowed
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="container py-5 my-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 text-center">
            <div className="card border border-danger-subtle shadow-sm p-4 p-md-5 rounded-4 bg-white">
              <div
                className="rounded-circle bg-danger-subtle text-danger p-3 mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: '70px', height: '70px' }}
              >
                <FontAwesomeIcon icon={faShieldHalved} className="fs-2" />
              </div>
              <h4 className="fw-bold text-dark mb-2">403 - Access Denied</h4>
              <p className="text-secondary small mb-3">
                You do not have permission to access this area.
              </p>
              <div className="alert alert-light border small text-muted mb-4 py-2">
                Required Role:{' '}
                <span className="fw-bold text-dark text-capitalize">
                  {allowedRoles.join(' or ')}
                </span>{' '}
                | Your Current Role:{' '}
                <span className="fw-bold text-danger text-capitalize">{role}</span>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Link href="/" className="btn btn-primary btn-sm px-4 d-inline-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: render the page contents
  return <>{children}</>;
}
