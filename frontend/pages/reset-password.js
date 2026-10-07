import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheckCircle, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token, email } = router.query;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token || !email) {
      setErrorMsg('Invalid or missing password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await authAPI.resetPassword({
        email: String(email),
        token: String(token),
        newPassword
      });

      if (res.data?.success) {
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card border shadow-sm rounded-4 p-4 p-md-5 bg-white">
              <div className="text-center mb-4">
                <div
                  className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faLock} className="fs-4" />
                </div>
                <h3 className="fw-bold text-dark mb-1">Set New Password</h3>
                <p className="text-secondary small">
                  Create a strong new password for your account: {email || ''}
                </p>
              </div>

              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 small py-2 mb-3" role="alert">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleReset}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-dark">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || Boolean(successMsg)}
                  className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <Link href="/login" className="text-primary text-decoration-none small fw-semibold d-inline-flex align-items-center gap-1">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
