import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faArrowRight,
  faUserTie,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

// Screen 3: Sign Up Page
// Two-column split layout with role selection, connected to live MariaDB backend
export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { settings } = useSettings();

  // 1. Form state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'organizer'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 2. Handle sign up submit to live backend
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Simple validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      password,
      role
    });

    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    // Success response
    setSuccessMsg(`Welcome to ${settings.brand_name || 'CampusEvents'}, ${result.user.name}! Redirecting...`);
    setTimeout(() => {
      if (result.user.role === 'organizer') {
        router.push('/create-event');
      } else {
        router.push('/events');
      }
    }, 1200);
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card border shadow-sm overflow-hidden rounded-4">
              <div className="row g-0">
                {/* Left Side: Welcome Illustration Banner */}
                <div
                  className="col-12 col-md-5 d-flex flex-column justify-content-center align-items-center text-center p-4 p-md-5"
                  style={{ backgroundColor: '#EFF6FF', borderRight: '1px solid #DCE7F3' }}
                >
                  <div
                    className="rounded-circle bg-white shadow-sm p-4 mb-4 d-flex align-items-center justify-content-center"
                    style={{ width: '120px', height: '120px' }}
                  >
                    <FontAwesomeIcon icon={faUser} className="text-primary display-4" />
                  </div>
                  <h3 className="fw-bold text-dark mb-2">Join {settings.brand_name || 'CampusEvents'}</h3>
                  <p className="text-secondary small mb-4">
                    Create an account to attend workshops, buy concert tickets, book business summits, or organize your own events!
                  </p>
                </div>

                {/* Right Side: Registration Form */}
                <div className="col-12 col-md-7 p-4 p-md-5 bg-white">
                  <div className="text-center text-md-start mb-4">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-primary fs-4" />
                      <span className="fs-4 fw-bold text-dark">{settings.brand_name || 'CampusEvents'}</span>
                    </div>
                    <h4 className="fw-bold text-dark mb-1">Create Your Account</h4>
                    <p className="text-muted small">Join us and be a part of exciting events</p>
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

                  {/* Registration Form */}
                  <form onSubmit={handleSignUp}>
                    {/* Full Name */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Full Name *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                          type="text"
                          required
                          className="form-control border-start-0 ps-0"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Email Address *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input
                          type="email"
                          required
                          className="form-control border-start-0 ps-0"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faPhone} />
                        </span>
                        <input
                          type="tel"
                          className="form-control border-start-0 ps-0"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-3">
                      <label className="form-label fw-medium small text-dark">Register As *</label>
                      <div className="row g-2">
                        <div className="col-6">
                          <button
                            type="button"
                            className={`btn w-100 py-2 small d-flex align-items-center justify-content-center gap-2 ${role === 'user' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                              }`}
                            onClick={() => setRole('user')}
                          >
                            <FontAwesomeIcon icon={faUser} />
                            <span>Student / Attendee</span>
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            type="button"
                            className={`btn w-100 py-2 small d-flex align-items-center justify-content-center gap-2 ${role === 'organizer' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                              }`}
                            onClick={() => setRole('organizer')}
                          >
                            <FontAwesomeIcon icon={faUserTie} />
                            <span>Event Organizer</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                      <label className="form-label fw-medium small text-dark">Password *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input
                          type="password"
                          required
                          className="form-control border-start-0 ps-0"
                          placeholder="Create a password (min. 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Sign Up CTA */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                    >
                      {loading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign Up</span>
                          <FontAwesomeIcon icon={faArrowRight} />
                        </>
                      )}
                    </button>

                    {/* Switch to Login */}
                    <div className="text-center small text-muted">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary fw-semibold text-decoration-none">
                        Login
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
