import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faTicketAlt,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faCheckCircle,
  faArrowLeft,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { ticketAPI, documentAPI } from '../../services/api';

export default function TicketPreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function loadTicket() {
      try {
        setLoading(true);
        setError(null);
        const res = await ticketAPI.getDetails(id);
        setTicket(res.data?.data);
      } catch (err) {
        console.error('Failed to load ticket:', err);
        setError(err.response?.data?.message || 'Could not load ticket details.');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      const res = await documentAPI.downloadTicket(ticket?.ticket_number || id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticket?.ticket_number || 'event-ticket'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ticket PDF:', err);
      alert('Could not download ticket PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>
          {ticket ? `${ticket.ticket_number} • Ticket Preview` : 'Event Ticket'} | Event Management System
        </title>
      </Head>

      <div className="container py-4 py-md-5" style={{ maxWidth: '680px' }}>
        {/* Navigation Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            onClick={() => router.back()}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back</span>
          </button>

          <Link href="/registrations" className="small text-decoration-none text-muted">
            My Registrations
          </Link>
        </div>

        {loading ? (
          <div className="card shadow-sm border-0 py-5 text-center">
            <div className="card-body">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-3" />
              <p className="text-muted small mb-0">Loading ticket pass details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger shadow-sm border-0" role="alert">
            <h6 className="fw-bold mb-1">Ticket Unavailable</h6>
            <p className="small mb-0">{error}</p>
          </div>
        ) : ticket ? (
          <div>
            {/* Visual Admission Ticket Card */}
            <div className="card shadow border-0 overflow-hidden mb-4" style={{ borderRadius: '16px' }}>
              {/* Ticket Header Banner */}
              <div className="bg-dark text-white p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-0 text-white tracking-wide">EVENT MANAGEMENT SYSTEM</h6>
                  <span className="text-white-50" style={{ fontSize: '0.75rem' }}>
                    OFFICIAL ADMISSION PASS
                  </span>
                </div>
                <span className="badge bg-primary px-3 py-2 text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  {ticket.category_name || 'Event'}
                </span>
              </div>

              {/* Event Body */}
              <div className="p-4 bg-white">
                <h3 className="fw-bold text-dark mb-3">{ticket.event_title}</h3>

                <div className="row g-2 p-3 bg-light rounded-3 mb-4 text-secondary small">
                  <div className="col-sm-4">
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>DATE</div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-primary" />
                      <span>{ticket.event_date}</span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>TIME</div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                      <FontAwesomeIcon icon={faClock} className="text-primary" />
                      <span>{ticket.event_time}</span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>VENUE</div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary" />
                      <span className="text-truncate">{ticket.event_venue || ticket.event_location}</span>
                    </div>
                  </div>
                </div>

                {/* Perforation Divider */}
                <div className="position-relative my-4">
                  <hr className="border-secondary border-opacity-25 border-dashed my-0" />
                  <div
                    className="position-absolute rounded-circle bg-light border border-secondary border-opacity-25"
                    style={{ width: '20px', height: '20px', left: '-26px', top: '-10px' }}
                  />
                  <div
                    className="position-absolute rounded-circle bg-light border border-secondary border-opacity-25"
                    style={{ width: '20px', height: '20px', right: '-26px', top: '-10px' }}
                  />
                </div>

                {/* Attendee Details & Verification Ref */}
                <div className="row g-4 align-items-center mb-4">
                  <div className="col-sm-7">
                    <div className="mb-3">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>ATTENDEE</div>
                      <div className="fw-bold text-dark h5 mb-0">{ticket.attendee_name}</div>
                      <div className="text-secondary small">{ticket.attendee_email}</div>
                    </div>

                    <div className="row g-2 small">
                      <div className="col-6">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>REGISTRATION</div>
                        <div className="fw-semibold text-dark">
                          REG-{new Date().getFullYear()}-{String(ticket.registration_id).padStart(5, '0')}
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>PASS TYPE</div>
                        <div className="fw-semibold text-dark">
                          {Number(ticket.registration_fee) > 0 ? `Paid (₹${ticket.registration_fee})` : 'Free Pass'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-5 text-center">
                    <div className="p-3 bg-light rounded-3 border d-inline-block">
                      <div className="font-monospace fw-bold text-primary small mb-1">{ticket.ticket_number}</div>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                        Gate Verification Identifier
                      </div>
                      <div className="mt-2 text-muted" style={{ fontSize: '0.7rem' }}>
                        <FontAwesomeIcon icon={faTicketAlt} className="text-primary me-1" />
                        Scannable on Official PDF
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Strip */}
                <div className="alert alert-success d-flex align-items-center justify-content-between p-3 mb-0" role="alert">
                  <div>
                    <div className="fw-bold d-flex align-items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>CONFIRMED & VALID</span>
                    </div>
                    <div className="small text-success mt-1" style={{ fontSize: '0.75rem' }}>
                      ✓ Payment Verified • ✓ Registration Confirmed
                    </div>
                  </div>
                  <span className="badge bg-success">Admission Pass</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="card-footer bg-light p-3 text-center border-top">
                <span className="text-muted small">
                  Please present this ticket or download the PDF pass to show at the entry gate.
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-primary btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm py-3"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Preparing PDF Download...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Download Official PDF Ticket (A5)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
