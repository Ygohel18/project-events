import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQrcode,
  faCamera,
  faKeyboard,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faSpinner,
  faHistory,
  faArrowRotateRight,
  faBuilding,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faUser,
  faTicketAlt
} from '@fortawesome/free-solid-svg-icons';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { ticketAPI, eventAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScanTicketPage() {
  const router = useRouter();
  const { eventId: initialEventId } = router.query;
  const { user } = useAuth();

  // State
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  const [events, setEvents] = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { valid, ticket, error, message, already_checked_in, wrong_event }
  const [checkInSuccess, setCheckInSuccess] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'

  const html5QrCodeRef = useRef(null);
  const qrRegionId = 'qr-reader-region';

  // Load events for filter dropdown
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await eventAPI.getAll({ limit: 100 });
        const list = res.data?.data || res.data?.events || [];
        // If organizer, list only their events; if admin, list all
        const filtered = user?.role === 'organizer' 
          ? list.filter(e => e.organizer_id === user.id)
          : list;
        setEvents(filtered);
      } catch (err) {
        console.error('Failed to load events list:', err);
      }
    }
    fetchEvents();
  }, [user]);

  // Sync initial query parameter
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  // Load recent check-ins
  const fetchRecentCheckIns = async () => {
    try {
      const res = await ticketAPI.getRecentCheckIns(selectedEventId);
      setRecentCheckIns(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load recent check-ins:', err);
    }
  };

  useEffect(() => {
    fetchRecentCheckIns();
  }, [selectedEventId]);

  // Initialize and handle camera QR scanner
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // ignore already stopped error
        }
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Success callback
          console.log('Decoded QR code:', decodedText);
          handleVerify(decodedText);
          try {
            await html5QrCode.stop();
            setCameraActive(false);
          } catch (e) {}
        },
        () => {
          // Frame error (silently ignore per frame)
        }
      );
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraActive(false);
      setCameraError(
        'Camera access is required to scan tickets. If permission was denied or device has no camera, please use manual ticket verification below.'
      );
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
    }
    setCameraActive(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Verify ticket token or code
  const handleVerify = async (codeToVerify) => {
    const token = (codeToVerify || manualCode).trim();
    if (!token) return;

    setIsVerifying(true);
    setScanResult(null);
    setCheckInSuccess(null);

    try {
      const res = await ticketAPI.verify(token, selectedEventId);
      setScanResult(res.data);
    } catch (err) {
      const errData = err.response?.data || {};
      setScanResult({
        valid: false,
        error: true,
        message: errData.message || 'Ticket could not be verified.',
        wrong_event: errData.wrong_event,
        actual_event: errData.actual_event,
        reason: errData.reason
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Perform Check-In
  const handleCheckIn = async (ticketId) => {
    setIsCheckingIn(true);
    try {
      const res = await ticketAPI.checkIn(ticketId);
      setCheckInSuccess(res.data);
      // Update current result card
      setScanResult((prev) => prev ? {
        ...prev,
        already_checked_in: true,
        ticket: {
          ...prev.ticket,
          attendance: 'checked_in',
          check_in_time: res.data?.data?.check_in_time || new Date()
        }
      } : null);
      fetchRecentCheckIns();
    } catch (err) {
      const errData = err.response?.data || {};
      alert(errData.message || 'Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Reset and prepare for next scan
  const handleScanNext = () => {
    setScanResult(null);
    setCheckInSuccess(null);
    setManualCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']}>
      <Head>
        <title>QR Ticket Scanner | Event Management System</title>
      </Head>

      <div className="container py-4 py-md-5">
        {/* Header & Navigation */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom gap-3">
          <div>
            <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faQrcode} className="text-primary" />
              <span>Ticket Verification & QR Scanner</span>
            </h1>
            <p className="text-muted small mb-0">
              Verify participant entry passes, validate payments, and log gate attendance in real time.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/attendance" className="btn btn-outline-secondary btn-sm">
              Attendance Sheet
            </Link>
            <Link href="/admin" className="btn btn-light btn-sm border">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Event Scope Selector */}
        <div className="card shadow-sm border-0 mb-4 bg-light">
          <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '480px' }}>
              <label htmlFor="eventScopeSelect" className="small fw-semibold text-secondary text-nowrap mb-0">
                <FontAwesomeIcon icon={faBuilding} className="me-1" />
                Active Event:
              </label>
              <select
                id="eventScopeSelect"
                className="form-select form-select-sm"
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setScanResult(null);
                  setCheckInSuccess(null);
                }}
              >
                <option value="">All Events (Any Authorized)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="small text-muted">
              {selectedEventId ? (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Locked to specific event
                </span>
              ) : (
                <span className="badge bg-secondary-subtle text-secondary">
                  Scanning all assigned events
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column: Scanner & Verification Controls */}
          <div className="col-lg-7">
            {/* Tab Navigation: Camera vs Manual */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white p-2 border-bottom">
                <ul className="nav nav-pills nav-fill small">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 d-flex align-items-center justify-content-center gap-2 ${
                        activeTab === 'camera' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'
                      }`}
                      onClick={() => {
                        setActiveTab('camera');
                        if (!cameraActive) startCamera();
                      }}
                    >
                      <FontAwesomeIcon icon={faCamera} />
                      <span>Camera Scanner</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 d-flex align-items-center justify-content-center gap-2 ${
                        activeTab === 'manual' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'
                      }`}
                      onClick={() => {
                        setActiveTab('manual');
                        stopCamera();
                      }}
                    >
                      <FontAwesomeIcon icon={faKeyboard} />
                      <span>Manual Ticket Entry</span>
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body p-4">
                {/* 1. Camera Viewfinder */}
                {activeTab === 'camera' && (
                  <div>
                    <div
                      id={qrRegionId}
                      className="rounded bg-dark overflow-hidden mb-3 position-relative"
                      style={{ minHeight: '300px' }}
                    >
                      {!cameraActive && (
                        <div className="text-center text-white py-5 px-3">
                          <FontAwesomeIcon icon={faCamera} size="3x" className="text-secondary mb-3 opacity-50" />
                          <h6 className="fw-semibold">Camera is Stopped</h6>
                          <p className="text-white-50 small mb-3">
                            Click start to begin scanning tickets with your device camera.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-4 rounded-pill"
                            onClick={startCamera}
                          >
                            Start Camera Scanner
                          </button>
                        </div>
                      )}
                    </div>

                    {cameraActive && (
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted d-flex align-items-center gap-2">
                          <span className="spinner-grow spinner-grow-sm text-success" role="status" />
                          Viewfinder active. Point camera at ticket QR code.
                        </span>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={stopCamera}>
                          Stop Camera
                        </button>
                      </div>
                    )}

                    {cameraError && (
                      <div className="alert alert-warning small mt-3 mb-0" role="alert">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        {cameraError}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Manual Ticket Number Form */}
                {activeTab === 'manual' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerify();
                    }}
                  >
                    <label htmlFor="manualTicketInput" className="form-label small fw-semibold text-secondary">
                      Enter Ticket Number or Verification Reference
                    </label>
                    <div className="input-group mb-2">
                      <span className="input-group-text bg-light text-muted">
                        <FontAwesomeIcon icon={faTicketAlt} />
                      </span>
                      <input
                        id="manualTicketInput"
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="e.g. TKT-2026-00001 or VTK-2026-..."
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="btn btn-primary px-3 d-flex align-items-center gap-2"
                        disabled={isVerifying || !manualCode.trim()}
                      >
                        {isVerifying ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Verify Ticket</span>
                        )}
                      </button>
                    </div>
                    <div className="form-text small text-muted">
                      Works on desktop computers, external barcode scanners, or when camera is unavailable.
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Verification State Cards */}
            {isVerifying && (
              <div className="card shadow-sm border-0 text-center py-5">
                <div className="card-body">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-3" />
                  <h6 className="fw-semibold text-dark">Checking Ticket Validity...</h6>
                  <p className="text-muted small mb-0">Querying database registration and payment approval status...</p>
                </div>
              </div>
            )}

            {/* 1. Valid Ticket Card */}
            {scanResult && scanResult.valid && scanResult.ticket && (
              <div className="card shadow-sm border-0 border-top border-4 border-success mb-4">
                <div className="card-body p-4">
                  {/* Status Banner */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success fa-2x" />
                      <div>
                        <h5 className="fw-bold text-success mb-0">✓ VALID TICKET</h5>
                        <span className="badge bg-success-subtle text-success small">
                          Payment Verified • Registration Confirmed
                        </span>
                      </div>
                    </div>

                    <span className="badge bg-primary small px-2 py-1">
                      {scanResult.ticket.pass_type}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <h5 className="fw-bold text-dark mb-2">{scanResult.ticket.event.title}</h5>
                    <div className="row g-2 small text-secondary">
                      <div className="col-sm-6">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                        <span>{scanResult.ticket.event.date}</span>
                      </div>
                      <div className="col-sm-6">
                        <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                        <span>{scanResult.ticket.event.time}</span>
                      </div>
                      <div className="col-12">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                        <span>{scanResult.ticket.event.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendee Details */}
                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <div className="text-muted small">ATTENDEE</div>
                      <div className="fw-bold text-dark">{scanResult.ticket.attendee.name}</div>
                      <div className="small text-secondary">{scanResult.ticket.attendee.email}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">TICKET IDENTIFIERS</div>
                      <div className="fw-bold text-primary font-monospace">{scanResult.ticket.ticket_number}</div>
                      <div className="small text-secondary">{scanResult.ticket.registration_id}</div>
                    </div>
                  </div>

                  {/* Attendance State & Check-in Action */}
                  {scanResult.already_checked_in ? (
                    <div className="alert alert-warning d-flex align-items-center justify-content-between p-3 mb-3" role="alert">
                      <div>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <span>ALREADY CHECKED IN</span>
                        </div>
                        <div className="small text-muted mt-1">
                          Attendee was checked in at: {new Date(scanResult.ticket.check_in_time).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="badge bg-warning text-dark">Present</span>
                    </div>
                  ) : (
                    <div className="d-grid mb-3">
                      <button
                        type="button"
                        className="btn btn-success btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 py-3"
                        onClick={() => handleCheckIn(scanResult.ticket.ticket_id)}
                        disabled={isCheckingIn}
                      >
                        {isCheckingIn ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Recording Check-In...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Check In Attendee</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                      onClick={handleScanNext}
                    >
                      <FontAwesomeIcon icon={faArrowRotateRight} />
                      <span>Scan Next Ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Check-In Success State */}
            {checkInSuccess && (
              <div className="alert alert-success shadow-sm border-success p-3 mb-4 d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold text-success mb-1">✓ CHECK-IN RECORDED</h6>
                  <p className="small mb-0 text-dark">
                    <strong>{checkInSuccess.data?.attendee_name}</strong> is now marked as present.
                  </p>
                </div>
                <button type="button" className="btn btn-success btn-sm px-3" onClick={handleScanNext}>
                  Scan Next
                </button>
              </div>
            )}

            {/* 3. Invalid / Cancelled / Wrong Event Error Card */}
            {scanResult && !scanResult.valid && (
              <div className="card shadow-sm border-0 border-top border-4 border-danger mb-4">
                <div className="card-body p-4 text-center">
                  <FontAwesomeIcon icon={faTimesCircle} size="3x" className="text-danger mb-3" />
                  <h5 className="fw-bold text-danger mb-2">✕ TICKET NOT VALID</h5>
                  <p className="text-secondary mb-3">{scanResult.message}</p>

                  {scanResult.wrong_event && scanResult.actual_event && (
                    <div className="alert alert-warning small text-start mb-3">
                      <strong>Target mismatch:</strong> This ticket was issued for event:
                      <div className="fw-bold text-dark mt-1">"{scanResult.actual_event.title}"</div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-4"
                    onClick={handleScanNext}
                  >
                    Try Another Ticket
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Check-in Audit Feed */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 sticky-top" style={{ top: '1rem' }}>
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} className="text-primary" />
                  <span>Recent Gate Check-ins</span>
                </h6>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                  onClick={fetchRecentCheckIns}
                  title="Refresh check-ins"
                >
                  <FontAwesomeIcon icon={faArrowRotateRight} />
                </button>
              </div>

              <div className="card-body p-0" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {recentCheckIns.length === 0 ? (
                  <div className="text-center py-5 text-muted small">
                    <FontAwesomeIcon icon={faUser} size="2x" className="opacity-25 mb-2" />
                    <div>No gate check-ins recorded yet.</div>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {recentCheckIns.map((item) => (
                      <li key={item.attendance_id} className="list-group-item p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold text-dark small">{item.attendee_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {item.ticket_number} • {item.event_title}
                            </div>
                            {item.checked_in_by && (
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Verified by: {item.checked_in_by}
                              </div>
                            )}
                          </div>
                          <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.72rem' }}>
                            {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card-footer bg-light p-2 text-center border-top">
                <Link href="/admin/attendance" className="small text-decoration-none text-primary fw-semibold">
                  View Full Attendance Sheet →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
