import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faKey,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

// Screen 2: Login Page
// Two-column split layout connected with MariaDB backend auth
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { settings } = useSettings();

  // 1. Form state variables
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill helper for testing / viva demo
  const fillDemoCredentials = (email, pwd) => {
    setEmailOrUser(email);
    setPassword(pwd);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 2. Handle login submit to live backend
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Basic validation
    if (!emailOrUser.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    const result = await login(emailOrUser.trim(), password);

    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    // Success response
    setSuccessMsg(`Welcome back, ${result.user.name}! Redirecting...`);

    setTimeout(() => {
      // Role-based redirect
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/events');
      }
    }, 1000);
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card border shadow-sm overflow-hidden rounded-4">
              <div className="row g-0">
                {/* Left Side: Friendly Welcome Illustration Banner */}
                <div
                  className="col-12 col-md-5 d-flex flex-column justify-content-center align-items-center text-center p-4 p-md-5"
                  style={{ backgroundColor: '#EFF6FF', borderRight: '1px solid #DCE7F3' }}
                >
                  <div
                    className="rounded-circle bg-white shadow-sm p-4 mb-4 d-flex align-items-center justify-content-center"
                    style={{ width: '120px', height: '120px' }}
                  >
                    <FontAwesomeIcon icon={faCalendarCheck} className="text-primary display-4" />
                  </div>
                  <h3 className="fw-bold text-dark mb-2">Welcome Back</h3>
                  <p className="text-secondary small mb-4">
                    Login to your account to explore upcoming events, manage your bookings, and connect with communities.
                  </p>

                  {/* Demo Accounts Quick-Select for Examiner / Viva */}
                  <div className="w-100 bg-white p-3 rounded-3 border text-start shadow-sm">
                    <div className="d-flex align-items-center gap-1 text-muted small fw-semibold mb-2">
                      <FontAwesomeIcon icon={faKey} className="text-primary" />
                      <span>Quick Demo Logins:</span>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm text-start py-1 px-2 d-flex justify-content-between align-items-center"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => fillDemoCredentials('admin@example.com', '1234567890')}
                      >
                        <span className="fw-bold">👑 Admin</span>
                        <span className="text-muted">admin@example.com</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm text-start py-1 px-2 d-flex justify-content-between align-items-center"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => fillDemoCredentials('organizer@example.com', '1234567890')}
                      >
                        <span className="fw-bold">🎪 Organizer</span>
                        <span className="text-muted">organizer@example.com</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm text-start py-1 px-2 d-flex justify-content-between align-items-center"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => fillDemoCredentials('user@example.com', '1234567890')}
                      >
                        <span className="fw-bold">🎓 Participant</span>
                        <span className="text-muted">user@example.com</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="col-12 col-md-7 p-4 p-md-5 bg-white">
                  <div className="text-center text-md-start mb-4">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-primary fs-4" />
                      <span className="fs-4 fw-bold text-dark">{settings.brand_name || 'CampusEvents'}</span>
                    </div>
                    <h4 className="fw-bold text-dark mb-1">Sign In</h4>
                    <p className="text-muted small">Enter your credentials to access your account</p>
                  </div>

                  {/* Feedback Messages */}
                  {errorMsg && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="alert alert-success py-2 small mb-3" role="alert">
                      {successMsg}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleLogin}>
                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input
                          type="email"
                          required
                          className="form-control border-start-0 ps-0"
                          placeholder="user@example.com"
                          value={emailOrUser}
                          onChange={(e) => setEmailOrUser(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Password with Eye Toggle */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="form-control border-start-0 border-end-0 ps-0"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="input-group-text bg-light text-muted border-start-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="d-flex justify-content-between align-items-center mb-4 small">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label className="form-check-label text-muted" htmlFor="rememberMe">
                          Remember Me
                        </label>
                      </div>
                      <Link href="/forgot-password" className="text-primary text-decoration-none">
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Login CTA Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                    >
                      {loading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Login</span>
                          <FontAwesomeIcon icon={faArrowRight} />
                        </>
                      )}
                    </button>

                    {/* Switch to Signup */}
                    <div className="text-center small text-muted">
                      Don&apos;t have an account?{' '}
                      <Link href="/signup" className="text-primary fw-semibold text-decoration-none">
                        Sign Up
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
