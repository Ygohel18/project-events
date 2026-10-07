import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faCheckCircle, faSpinner, faKey } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authAPI.forgotPassword(email.trim());
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Password reset link sent to your email!');
        setEmail('');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
                  className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faKey} className="fs-4" />
                </div>
                <h3 className="fw-bold text-dark mb-1">Forgot Password?</h3>
                <p className="text-secondary small">
                  Enter your email address and we will send you a link to reset your password.
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

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 shadow-none ps-0"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
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
