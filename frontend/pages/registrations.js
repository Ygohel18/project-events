import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faEye,
  faTimesCircle,
  faFilter,
  faTicketAlt,
  faSpinner,
  faFileInvoice,
  faMoneyBillWave,
  faDownload,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import StatusBadge from '../components/common/StatusBadge';
import { registrationAPI, documentAPI } from '../services/api';
import { getMediaUrl } from '../utils/media';

// Screen 6: My Registrations Page
// Displays table of user's live event bookings with statuses and cancellation actions
export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [regToCancel, setRegToCancel] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch live registrations on mount
  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const response = await registrationAPI.getMyRegistrations();
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setRegistrations(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  // Download ticket handler
  const handleDownloadTicket = async (ticketRef) => {
    try {
      setToastMessage('Preparing your PDF ticket...');
      const res = await documentAPI.downloadTicket(ticketRef);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ticket-${ticketRef}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToastMessage('Ticket downloaded successfully!');
    } catch (err) {
      console.error('Download ticket error:', err);
      setToastMessage('Failed to download ticket. Please ensure your payment has been approved.');
    }
  };

  // Download invoice handler
  const handleDownloadInvoice = async (invoiceRef) => {
    try {
      setToastMessage('Preparing your PDF invoice...');
      const res = await documentAPI.downloadInvoice(invoiceRef);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceRef}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToastMessage('Invoice downloaded successfully!');
    } catch (err) {
      console.error('Download invoice error:', err);
      setToastMessage('Failed to download invoice. Please ensure payment has been verified.');
    }
  };

  // Cancel registration action
  const handleConfirmCancel = async () => {
    if (!regToCancel) return;
    const targetId = regToCancel.registrationId || regToCancel.id;
    setCancelling(true);

    try {
      const response = await registrationAPI.cancelRegistration(targetId);
      if (response.data?.success) {
        // Update status in state immediately
        setRegistrations((prev) =>
          prev.map((reg) =>
            (reg.registrationId || reg.id) === targetId
              ? { ...reg, status: 'Cancelled' }
              : reg
          )
        );
        const eventName = regToCancel.eventName;
        setToastMessage(`Registration for "${eventName}" has been cancelled.`);
      }
    } catch (err) {
      console.error('Error cancelling registration:', err);
      setToastMessage(
        err.response?.data?.message || 'Failed to cancel registration. Please try again.'
      );
    } finally {
      setCancelling(false);
      setRegToCancel(null);
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  // Filter registrations by status
  const displayedRegistrations = registrations.filter((reg) => {
    if (statusFilter === 'All') return true;
    return reg.status === statusFilter;
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container py-4">
          {/* Header Bar */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faTicketAlt} className="text-primary me-2" />
                My Registrations
              </h2>
              <p className="text-secondary small mb-0">
                Track and manage your upcoming event bookings, offline payments, and tickets
              </p>
            </div>

            {/* Status Filter Pill buttons */}
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted d-none d-sm-inline">
                <FontAwesomeIcon icon={faFilter} className="me-1" />
                Status:
              </span>
              {['All', 'Confirmed', 'Pending', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${
                    statusFilter === st ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* In-app Toast Banner */}
          {toastMessage && (
            <div
              className="alert alert-info d-flex align-items-center justify-content-between py-2 px-3 mb-4 shadow-sm"
              role="alert"
            >
              <span className="small fw-semibold">{toastMessage}</span>
              <button
                type="button"
                className="btn-close btn-close-sm"
                onClick={() => setToastMessage('')}
              />
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="card border bg-white p-5 text-center rounded-4 shadow-sm mb-4">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Loading registrations...</span>
              </div>
              <p className="text-muted small">Loading your tickets from database...</p>
            </div>
          )}

          {/* Registrations Table */}
          {!loading && (
            <div className="card border shadow-sm overflow-hidden rounded-4 mb-4 bg-white">
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light">
                    <tr className="text-secondary small">
                      <th scope="col" className="ps-4 py-3">
                        Event Name
                      </th>
                      <th scope="col" className="py-3">
                        Date &amp; Time
                      </th>
                      <th scope="col" className="py-3">
                        Location
                      </th>
                      <th scope="col" className="py-3">
                        Status &amp; Payment
                      </th>
                      <th scope="col" className="py-3 text-end pe-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRegistrations.length > 0 ? (
                      displayedRegistrations.map((item) => {
                        const isPaid = parseFloat(item.price) > 0;
                        const isPaymentApproved = item.paymentStatus === 'approved' || item.paymentReviewStatus === 'approved';
                        const isPaymentRejected = item.paymentStatus === 'rejected' || item.paymentReviewStatus === 'rejected';
                        const isPaymentPending = isPaid && !isPaymentApproved && !isPaymentRejected;

                        return (
                          <tr key={item.registrationId || item.id}>
                            <td className="ps-4 py-3">
                              <div className="d-flex align-items-center gap-3">
                                <img
                                  src={getMediaUrl(item.image)}
                                  alt={item.eventName}
                                  className="rounded-3"
                                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                />
                                <div>
                                  <span className="fw-semibold text-dark d-block">
                                    {item.eventName}
                                  </span>
                                  <span className="text-muted small">
                                    Ticket #{item.registrationId || item.id} •{' '}
                                    {!isPaid ? 'Free' : `₹ ${parseFloat(item.price).toFixed(2)}`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-secondary small">
                              <div>{item.date}</div>
                              <div className="text-muted">{item.time}</div>
                            </td>
                            <td className="py-3 text-secondary small">{item.location}</td>
                            <td className="py-3">
                              <div className="d-flex flex-column gap-1">
                                <div>
                                  <StatusBadge status={item.status} />
                                </div>
                                {isPaid && (
                                  <div>
                                    {isPaymentApproved ? (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle small py-1 px-2">
                                        Payment Verified
                                      </span>
                                    ) : isPaymentRejected ? (
                                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle small py-1 px-2">
                                        Payment Rejected
                                      </span>
                                    ) : (
                                      <span className="badge bg-warning-subtle text-dark border border-warning-subtle small py-1 px-2">
                                        Verification Pending
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-end pe-4">
                              <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                                {/* Upload / Resubmit Proof button for paid events */}
                                {isPaid && !isPaymentApproved && item.status !== 'Cancelled' && (
                                  <Link
                                    href={`/payment/${item.registrationId || item.id}`}
                                    className={`btn btn-sm px-2 ${
                                      isPaymentRejected ? 'btn-danger' : 'btn-warning text-dark fw-semibold'
                                    }`}
                                    title="Submit / Update Payment Proof"
                                  >
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
                                    <span>{isPaymentRejected ? 'Resubmit Proof' : 'Upload Proof'}</span>
                                  </Link>
                                )}

                                {/* Download Ticket Button */}
                                {(isPaymentApproved || !isPaid) && item.status === 'Confirmed' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm px-2"
                                    onClick={() => handleDownloadTicket(item.ticketId || item.registrationId || item.id)}
                                    title="Download Scannable PDF Ticket"
                                  >
                                    <FontAwesomeIcon icon={faTicketAlt} className="me-1" />
                                    <span>Ticket</span>
                                  </button>
                                )}

                                {/* Download Invoice Button */}
                                {isPaid && isPaymentApproved && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleDownloadInvoice(item.invoiceId || item.registrationId || item.id)}
                                    title="Download PDF Tax Invoice"
                                  >
                                    <FontAwesomeIcon icon={faFileInvoice} className="me-1" />
                                    <span>Invoice</span>
                                  </button>
                                )}

                                <Link
                                  href={`/events/${item.eventId || item.id}`}
                                  className="btn btn-outline-primary btn-sm px-2"
                                  title="View Event Details"
                                >
                                  <FontAwesomeIcon icon={faEye} className="me-1" />
                                  <span>Details</span>
                                </Link>

                                {item.status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm px-2"
                                    onClick={() => setRegToCancel(item)}
                                    title="Cancel Registration"
                                  >
                                    <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                    <span>Cancel</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <FontAwesomeIcon
                            icon={faTicketAlt}
                            className="display-6 text-muted mb-3"
                          />
                          <h6 className="fw-bold text-dark">No Registrations Found</h6>
                          <p className="text-muted small mb-3">
                            {statusFilter === 'All'
                              ? "You haven't registered for any events yet."
                              : `No registrations found with status "${statusFilter}".`}
                          </p>
                          <Link href="/events" className="btn btn-primary btn-sm px-3">
                            Browse Upcoming Events
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {regToCancel && (
            <div
              className="modal show d-block"
              tabIndex="-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 shadow-lg border-0">
                  <div className="modal-header border-bottom">
                    <h5 className="modal-title fw-bold text-dark">Cancel Registration?</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setRegToCancel(null)}
                    />
                  </div>
                  <div className="modal-body p-4">
                    <p className="text-secondary mb-1">
                      Are you sure you want to cancel your registration for:
                    </p>
                    <p className="fw-bold text-dark fs-5 mb-3">{regToCancel.eventName}</p>
                    <div className="alert alert-light border small text-muted mb-0">
                      ℹ️ Your booking status will be marked as cancelled in the database.
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-top">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setRegToCancel(null)}
                    >
                      Keep Ticket
                    </button>
                    <button
                      type="button"
                      disabled={cancelling}
                      className="btn btn-danger px-4"
                      onClick={handleConfirmCancel}
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel Ticket'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
