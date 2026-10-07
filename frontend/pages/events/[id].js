import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faMapMarkerAlt,
  faCheckCircle,
  faShareAlt,
  faHeart,
  faUsers,
  faArrowLeft,
  faBuilding,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faFilePdf,
  faDownload,
  faClock,
  faMoneyBillWave,
  faExternalLinkAlt,
  faCertificate,
  faAward,
  faGraduationCap,
  faLaptopCode,
  faLightbulb,
  faComments,
  faTrophy,
  faCoffee,
  faStar,
  faBullhorn,
  faHandshake,
  faRocket,
  faBookOpen,
  faGlobe,
  faCopy,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faTelegram } from '@fortawesome/free-brands-svg-icons';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { eventAPI, registrationAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

const iconMap = {
  faUsers,
  faCertificate,
  faAward,
  faGraduationCap,
  faLaptopCode,
  faLightbulb,
  faComments,
  faTrophy,
  faCoffee,
  faStar,
  faBullhorn,
  faHandshake,
  faRocket,
  faBookOpen,
  faGlobe,
  faCheckCircle
};

function getBenefitIcon(iconName) {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return faCheckCircle;
}

// Screen 5: Event Details Page
// Dynamic route for /events/:id displaying live event details, registration CTA, and tabs from MySQL
export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();

  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [newRegId, setNewRegId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // 1. Fetch live event details from database
  useEffect(() => {
    if (!id) return;

    async function fetchEventDetails() {
      try {
        setLoading(true);
        setError('');
        const response = await eventAPI.getEventById(id);
        if (response.data?.success && response.data?.data) {
          setEvent(response.data.data);
        } else {
          setError('Event not found.');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.response?.data?.message || 'Event not found or has been removed.');
      } finally {
        setLoading(false);
      }
    }

    fetchEventDetails();
  }, [id]);

  // 2. Check if logged-in user is already registered for this event
  useEffect(() => {
    if (!id || !isAuthenticated) {
      setIsRegistered(false);
      setUserRegistration(null);
      return;
    }

    async function checkUserRegistration() {
      try {
        const response = await eventAPI.getMyRegistration(id);
        if (response.data?.success && response.data.registered) {
          setUserRegistration(response.data);
          setIsRegistered(response.data.registration_status === 'Confirmed');
        } else {
          setUserRegistration(null);
          setIsRegistered(false);
        }
      } catch (err) {
        console.error('Error checking registration status:', err);
      }
    }

    checkUserRegistration();
  }, [id, isAuthenticated]);

  // 3. Handle live event registration
  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const eventFee = Number(event?.registration_fee != null ? event.registration_fee : (event?.price != null ? event.price : 0));
    const isPaid = Boolean(event?.payment_required) || eventFee > 0;

    // For paid events: navigate directly to Complete Registration page without creating DB records!
    if (isPaid) {
      router.push(`/payment/${id}`);
      return;
    }

    // For free events: execute direct registration
    setRegistering(true);
    try {
      const response = await eventAPI.registerForEvent(id);
      if (response.data?.success) {
        setIsRegistered(true);
        setUserRegistration(response.data.data || { status: 'Confirmed', registration_status: 'Confirmed', payment_status: 'not_required' });
        setShowSuccessModal(true);
        // Increment registered attendee count locally
        if (event) {
          setEvent((prev) => ({
            ...prev,
            registeredCount: Number(prev.registeredCount || 0) + 1
          }));
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to complete registration. Please try again.';
      triggerToast(message, 'warning');
      if (message.toLowerCase().includes('already registered')) {
        setIsRegistered(true);
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Layout>
      <div className="container py-4">
        {/* Back Link */}
        <div className="mb-3">
          <Link
            href="/events"
            className="text-secondary text-decoration-none small d-inline-flex align-items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to All Events</span>
          </Link>
        </div>

        {/* Global Toast Alert */}
        {toastMsg && (
          <div
            className={`alert alert-${
              toastType === 'warning' ? 'warning' : 'success'
            } alert-dismissible fade show shadow-sm py-2 px-3 small mb-3`}
            role="alert"
          >
            <span>{toastMsg}</span>
            <button
              type="button"
              className="btn-close btn-close-sm"
              onClick={() => setToastMsg('')}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card border bg-white p-5 text-center rounded-4 shadow-sm my-4">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading event...</span>
            </div>
            <h5 className="fw-semibold text-secondary">Loading event details...</h5>
          </div>
        )}

        {/* Error / 404 State */}
        {!loading && (error || !event) && (
          <div className="card border bg-white p-5 text-center rounded-4 shadow-sm my-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="display-4 text-warning mb-3"
            />
            <h4 className="fw-bold text-dark">404 - Event Not Found</h4>
            <p className="text-secondary small mb-4">
              {error || 'The event you are looking for does not exist or may have been deleted.'}
            </p>
            <div>
              <Link href="/events" className="btn btn-primary px-4">
                Explore Available Events
              </Link>
            </div>
          </div>
        )}

        {/* Event Content */}
        {!loading && event && (
          <>
            {/* ================= HERO BANNER & HEADER CARD ================= */}
            {/* Status alerts */}
            {event.status === 'Cancelled' && (
              <div className="alert alert-danger shadow-sm d-flex align-items-center gap-3 mb-4 rounded-3 p-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="fs-4 text-danger" />
                <div>
                  <h6 className="fw-bold mb-1">This Event Has Been Cancelled</h6>
                  <p className="small mb-0 text-danger-emphasis">
                    The organizer has cancelled this event. Registrations are closed and registered attendees have been notified.
                  </p>
                </div>
              </div>
            )}

            {event.status === 'Draft' && (
              <div className="alert alert-secondary shadow-sm d-flex align-items-center gap-3 mb-4 rounded-3 p-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="fs-4 text-secondary" />
                <div>
                  <h6 className="fw-bold mb-1">Draft Event (Unpublished)</h6>
                  <p className="small mb-0">
                    This event is currently saved as a draft and is not open for public registrations.
                  </p>
                </div>
              </div>
            )}

            {/* Event Hero Card */}
            <div className="card border shadow-sm overflow-hidden mb-4 rounded-4">
              {/* Large Image Banner */}
              <div className="position-relative" style={{ height: '360px' }}>
                <img
                  src={getMediaUrl(event.image)}
                  alt={event.title}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-4"
                  style={{ background: 'linear-gradient(transparent, rgba(18, 59, 112, 0.9))' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-primary text-white px-3 py-1">
                      {event.category}
                    </span>
                    {event.status && event.status !== 'Published' && (
                      <span className={`badge px-3 py-1 ${
                        event.status === 'Cancelled' ? 'bg-danger text-white' : event.status === 'Completed' ? 'bg-info text-dark' : 'bg-secondary text-white'
                      }`}>
                        {event.status}
                      </span>
                    )}
                    {!event.registration_open && (
                      <span className="badge bg-warning text-dark px-3 py-1">
                        Registration Closed
                      </span>
                    )}
                  </div>
                  <h2 className="text-white fw-bold mb-0">{event.title}</h2>
                </div>
              </div>

              {/* Quick Info & Registration Bar */}
              <div className="card-body p-4 bg-white">
                <div className="row align-items-center gy-3">
                  <div className="col-12 col-md-7">
                    <div className="d-flex flex-wrap gap-4 text-secondary small">
                      <div className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-primary fs-5" />
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            DATE & TIME
                          </div>
                          <strong className="text-dark">
                            {event.date} • {event.time}
                          </strong>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger fs-5" />
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            LOCATION
                          </div>
                          <strong className="text-dark">{event.location}</strong>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faUsers} className="text-success fs-5" />
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            ATTENDING
                          </div>
                          <strong className="text-dark">
                            {event.registeredCount || 0} / {event.maxParticipants || 100}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA Button */}
                  <div className="col-12 col-md-5 text-md-end d-flex align-items-center justify-content-md-end gap-3 flex-wrap">
                    <div className="text-md-end">
                      <div className="text-muted small">TICKET PRICE</div>
                      <div className="fs-4 fw-bold text-primary">
                        {Boolean(event.payment_required) || Number(event.registration_fee || event.price || 0) > 0 ? (
                          Number(event.registration_fee || event.price || 0) > 0 ? (
                            `₹ ${Number(event.registration_fee || event.price).toLocaleString()}`
                          ) : (
                            'Paid'
                          )
                        ) : (
                          'FREE'
                        )}
                      </div>
                    </div>

                    {/* PDF Brochure Button */}
                    {event.brochure && (
                      <a
                        href={getMediaUrl(event.brochure)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-danger px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                        title="View or Download Event Brochure"
                      >
                        <FontAwesomeIcon icon={faFilePdf} />
                        <span className="d-none d-sm-inline">Brochure (PDF)</span>
                      </a>
                    )}

                    {/* Admin/Organizer Attendance Link */}
                    {(user?.role === 'admin' || user?.role === 'organizer') && (
                      <Link
                        href={`/admin/attendance?eventId=${event.id}`}
                        className="btn btn-outline-primary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                        title="Take Event Attendance"
                      >
                        <FontAwesomeIcon icon={faUsers} />
                        <span>Attendance</span>
                      </Link>
                    )}

                    {event.status === 'Cancelled' ? (
                      <button
                        className="btn btn-danger px-4 py-2"
                        disabled
                      >
                        Event Cancelled
                      </button>
                    ) : event.status === 'Completed' ? (
                      <button
                        className="btn btn-secondary px-4 py-2"
                        disabled
                      >
                        Event Completed
                      </button>
                    ) : event.status === 'Draft' ? (
                      <button
                        className="btn btn-secondary px-4 py-2"
                        disabled
                      >
                        Unpublished Draft
                      </button>
                    ) : event.status === 'Hidden' ? (
                      <button
                        className="btn btn-secondary px-4 py-2"
                        disabled
                      >
                        Hidden Event
                      </button>
                    ) : userRegistration?.registration_status === 'Confirmed' || userRegistration?.status === 'Confirmed' ? (
                      <Link
                        href="/registrations"
                        className="btn btn-success px-4 py-2 d-inline-flex align-items-center gap-2 fw-semibold text-decoration-none shadow-sm"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Registered • View Ticket</span>
                      </Link>
                    ) : userRegistration?.payment_status === 'rejected' || userRegistration?.paymentReviewStatus === 'rejected' ? (
                      <Link
                        href={`/payment/${id}`}
                        className="btn btn-danger px-4 py-2 d-inline-flex align-items-center gap-2 fw-semibold text-decoration-none shadow-sm"
                      >
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>Resubmit Payment</span>
                      </Link>
                    ) : userRegistration?.registration_status === 'Pending' || userRegistration?.status === 'Pending' || userRegistration?.payment_status === 'pending' || userRegistration?.paymentReviewStatus === 'pending' ? (
                      <Link
                        href={`/payment/${id}`}
                        className="btn btn-warning text-dark px-4 py-2 d-inline-flex align-items-center gap-2 fw-semibold text-decoration-none shadow-sm"
                      >
                        <FontAwesomeIcon icon={faClock} />
                        <span>Payment Under Review</span>
                      </Link>
                    ) : !event.registration_open ? (
                      <button
                        className="btn btn-secondary px-4 py-2 fw-semibold"
                        disabled
                      >
                        Registration Closed
                      </button>
                    ) : !isAuthenticated ? (
                      <Link
                        href="/login"
                        className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm text-decoration-none"
                      >
                        <span>Login to Register</span>
                      </Link>
                    ) : Boolean(event.payment_required) || Number(event.registration_fee || event.price || 0) > 0 ? (
                      Number(event.registration_fee || event.price || 0) <= 0 && !event.payment_instructions ? (
                        <button className="btn btn-secondary px-4 py-2 fw-semibold" disabled>
                          Registration Temporarily Unavailable
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                          onClick={handleRegister}
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                          <span>Register for ₹{Number(event.registration_fee || event.price || 0)}</span>
                        </button>
                      )
                    ) : (
                      <button
                        className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                        disabled={registering}
                        onClick={handleRegister}
                      >
                        {registering ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Register Free</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= CONTENT TABS & HIGHLIGHTS ================= */}
            <div className="row g-4">
              {/* Main Tab Area */}
              <div className="col-12 col-lg-8">
                <div className="card border shadow-sm p-4 bg-white rounded-4">
                  {/* Tab Navigation */}
                  <ul className="nav nav-pills mb-4 gap-2">
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-3 px-3 py-2 fw-semibold ${
                          activeTab === 'about' ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab('about')}
                      >
                        About Event
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-3 px-3 py-2 fw-semibold ${
                          activeTab === 'location' ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab('location')}
                      >
                        Venue & Location
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-3 px-3 py-2 fw-semibold ${
                          activeTab === 'organizer' ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab('organizer')}
                      >
                        Organizer
                      </button>
                    </li>
                  </ul>

                  {/* Tab 1: About */}
                  {activeTab === 'about' && (
                    <div>
                      <h5 className="fw-bold text-dark mb-3">Event Overview</h5>
                      <p className="text-secondary leading-relaxed mb-4">{event.description}</p>

                      {Array.isArray(event.benefits) && event.benefits.length > 0 && (
                        <>
                          <h6 className="fw-bold text-dark mb-3">Why You Should Attend</h6>
                          <div className="row g-3">
                            {event.benefits.map((benefit, idx) => (
                              <div className="col-12 col-sm-6" key={benefit.id || idx}>
                                <div className="p-3 bg-light rounded-3 h-100">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <FontAwesomeIcon
                                      icon={getBenefitIcon(benefit.icon)}
                                      className="text-primary"
                                    />
                                    <strong className="text-dark">{benefit.title}</strong>
                                  </div>
                                  {benefit.description && (
                                    <p className="text-muted small mb-0">{benefit.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Location */}
                  {activeTab === 'location' && (
                    <div>
                      <h5 className="fw-bold text-dark mb-2">Venue & Location</h5>
                      <p className="text-secondary mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-2" />
                        <strong>{event.location}</strong>
                      </p>
                      {event.address && (
                        <p className="text-muted small mb-3">
                          {event.address}
                        </p>
                      )}

                      {event.map_embed_url ? (
                        <div className="rounded-3 overflow-hidden border mb-3 shadow-sm" style={{ height: '320px' }}>
                          <iframe
                            src={event.map_embed_url}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Google Maps embed for ${event.title}`}
                          />
                        </div>
                      ) : (
                        <div
                          className="bg-light rounded-3 d-flex align-items-center justify-content-center text-secondary border p-4 mb-3"
                          style={{ minHeight: '120px' }}
                        >
                          <div className="text-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="display-6 text-primary mb-2" />
                            <p className="small mb-0">Venue details confirmed for {event.location}</p>
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-end">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.location || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                          <span>Open in Google Maps</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Organizer */}
                  {activeTab === 'organizer' && (
                    <div>
                      <h5 className="fw-bold text-dark mb-3">Organized by</h5>
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                        <img
                          src={getMediaUrl(event.organizer_image, 'profile', event.organizer_email)}
                          alt={event.organizer_name || 'Organizer'}
                          className="rounded-circle border shadow-sm"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="fw-bold text-dark mb-1">
                            {event.organizer_name || 'Event Organizer'}
                          </h6>
                          <p className="text-muted small mb-0">
                            {event.organizer_email || 'Verified Campus Organizer'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Highlights & Quick Details Card */}
              <div className="col-12 col-lg-4">
                {Array.isArray(event.highlights) && event.highlights.length > 0 && (
                  <div className="card border shadow-sm p-4 mb-4 bg-white rounded-4">
                    <h5 className="fw-bold text-dark mb-3">Event Highlights</h5>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                      {event.highlights.map((highlight, idx) => (
                        <li key={highlight.id || idx} className="d-flex align-items-start gap-2 small text-secondary">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success mt-1" />
                          <span>{highlight.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Invite Your Friends Section */}
                <div className="card border shadow-sm p-4 bg-white rounded-4">
                  <div className="text-center mb-3">
                    <h5 className="fw-bold text-dark mb-1">Invite Your Friends</h5>
                    <p className="text-muted small mb-0">
                      Share this event with your friends and invite them to join you.
                    </p>
                  </div>

                  <div className="d-grid gap-2">
                    <div className="row g-2">
                      <div className="col-6">
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Check out "${event.title}" happening on ${event.date ? new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''} at ${event.venue || 'Campus'}! Join me here: ${typeof window !== 'undefined' ? window.location.href : ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="fs-6" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                      <div className="col-6">
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(
                            typeof window !== 'undefined' ? window.location.href : ''
                          )}&text=${encodeURIComponent(
                            `Check out "${event.title}" happening on ${event.date ? new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''} at ${event.venue || 'Campus'}!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-info btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 text-dark"
                        >
                          <FontAwesomeIcon icon={faTelegram} className="fs-6" />
                          <span>Telegram</span>
                        </a>
                      </div>
                      <div className="col-6">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                          onClick={async () => {
                            try {
                              const url = typeof window !== 'undefined' ? window.location.href : '';
                              await navigator.clipboard.writeText(url);
                              triggerToast('Link copied');
                            } catch (err) {
                              triggerToast('Failed to copy link', 'warning');
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faCopy} className="fs-6" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                      <div className="col-6">
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`Invitation to ${event.title}`)}&body=${encodeURIComponent(
                            `Hey,\n\nI thought you might be interested in attending "${event.title}" on ${event.date ? new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''} at ${event.venue || 'Campus'}.\n\nCheck out the event details and register here:\n${typeof window !== 'undefined' ? window.location.href : ''}\n`
                          )}`}
                          className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                        >
                          <FontAwesomeIcon icon={faEnvelope} className="fs-6" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Registration Confirmation Modal */}
      {showSuccessModal && event && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4 rounded-4 shadow-lg border-0">
              <div className="mb-3">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className={needsPayment ? 'text-warning display-3' : 'text-success display-3'}
                />
              </div>
              <h4 className="fw-bold text-dark">
                {needsPayment ? 'Payment Required to Confirm Seat!' : 'Registration Confirmed!'}
              </h4>
              <p className="text-secondary small mb-4">
                {needsPayment ? (
                  <>
                    You have reserved a slot for <strong>{event.title}</strong> (Fee: ₹{parseFloat(event.registration_fee || 0).toFixed(2)}). Please upload your offline payment proof (UPI/Bank screenshot) so the organizer can approve your ticket.
                  </>
                ) : (
                  <>
                    You have successfully registered for <strong>{event.title}</strong>. Your event pass has been issued and is ready for download in My Registrations.
                  </>
                )}
              </p>
              <div className="d-flex gap-2 justify-content-center">
                {needsPayment && newRegId ? (
                  <Link href={`/payment/${newRegId}`} className="btn btn-warning fw-semibold px-4 text-dark">
                    Submit Payment Proof
                  </Link>
                ) : (
                  <Link href="/registrations" className="btn btn-primary px-4">
                    View My Registrations
                  </Link>
                )}
                <button
                  className="btn btn-outline-secondary px-3"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
