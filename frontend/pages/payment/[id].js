import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faUpload,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faReceipt,
  faTicketAlt,
  faArrowLeft,
  faInfoCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { documentAPI, eventAPI } from '../../services/api';

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Fetch event details and existing registration status (NO registration created on load)
  const fetchPaymentInfo = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // 1. Fetch event information
      const eventRes = await eventAPI.getEventById(id);
      if (eventRes.data?.success && eventRes.data.data) {
        setEventData(eventRes.data.data);
      } else {
        setToast({ type: 'danger', message: 'Event details could not be found.' });
      }

      // 2. Fetch user's existing registration status for this event
      const regRes = await eventAPI.getMyRegistration(id);
      if (regRes.data?.success && regRes.data.registered) {
        setRegistration(regRes.data);
        if (regRes.data.transaction_number) {
          setTransactionNumber(regRes.data.transaction_number);
        }
      } else {
        setRegistration(null);
      }
    } catch (err) {
      console.error('Error fetching event or registration details:', err);
      setToast({ type: 'danger', message: 'Failed to load event or registration details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentInfo();
  }, [id]);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type: JPG / JPEG / PNG
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setToast({ type: 'danger', message: 'Payment screenshot must be JPG or PNG and must not exceed 10 MB.' });
      return;
    }

    // Validate size <= 10MB
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'danger', message: 'Payment screenshot must be JPG or PNG and must not exceed 10 MB.' });
      return;
    }

    setScreenshotFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setToast({ type: '', message: '' });
  };

  // Submit complete registration with payment proof
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transactionNumber.trim()) {
      setToast({ type: 'danger', message: 'Please enter your Transaction Reference Number / UTR.' });
      return;
    }

    if (!screenshotFile && !registration?.transaction_number) {
      setToast({ type: 'danger', message: 'Please upload a screenshot of your payment transfer.' });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('transaction_number', transactionNumber.trim());
      if (screenshotFile) {
        formData.append('payment_screenshot', screenshotFile);
      }

      // Call single complete registration endpoint
      const res = await eventAPI.registerForEvent(id, formData);
      if (res.data?.success) {
        setSubmittedSuccess(true);
        setToast({
          type: 'success',
          message: 'Registration & payment proof submitted successfully!'
        });
        await fetchPaymentInfo();
      }
    } catch (err) {
      console.error('Error submitting registration & payment:', err);
      setToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to submit registration. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Download handlers
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const res = await documentAPI.downloadInvoice(invoiceId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ type: 'danger', message: 'Failed to download invoice.' });
    }
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      const res = await documentAPI.downloadTicket(ticketId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ticket-${ticketId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ type: 'danger', message: 'Failed to download event ticket.' });
    }
  };

  const eventTitle = eventData?.title || registration?.eventName || 'Event Registration';
  const eventFee = parseFloat(eventData?.registration_fee || registration?.price || 0).toFixed(2);
  const paymentInstructions = eventData?.payment_instructions || registration?.paymentInstructions;
  const isApproved = registration?.payment_status === 'approved' || registration?.registration_status === 'Confirmed';
  const isRejected = registration?.payment_status === 'rejected';
  const isPending = registration?.payment_status === 'pending' || submittedSuccess;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link
              href={id ? `/events/${id}` : '/events'}
              className="btn btn-outline-secondary btn-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
              Back to Event Details
            </Link>

            <Link href="/registrations" className="btn btn-light btn-sm text-secondary">
              My Registrations
            </Link>
          </div>

          {toast.message && (
            <div className={`alert alert-${toast.type} alert-dismissible fade show shadow-sm`} role="alert">
              <span className="small fw-semibold">{toast.message}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setToast({ type: '', message: '' })}
              />
            </div>
          )}

          {loading ? (
            <div className="card border bg-white p-5 text-center rounded-4 shadow-sm">
              <div className="spinner-border text-primary mb-2" role="status" />
              <p className="text-muted small">Loading event registration details...</p>
            </div>
          ) : !eventData ? (
            <div className="card border bg-white p-5 text-center rounded-4 shadow-sm">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning display-5 mb-3" />
              <h5 className="fw-bold">Event Details Not Found</h5>
              <p className="text-muted small">Could not find record for event ID #{id}.</p>
              <div>
                <Link href="/events" className="btn btn-primary btn-sm px-3">
                  Browse Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Left Column: Event Summary & Payment Instructions */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                  <h5 className="fw-bold text-dark mb-1">
                    <FontAwesomeIcon icon={faReceipt} className="text-primary me-2" />
                    Complete Registration
                  </h5>
                  <p className="small text-muted mb-3">
                    Complete your payment to submit your registration for this event.
                  </p>

                  <div className="p-3 bg-light rounded-3 mb-3">
                    <h6 className="fw-bold text-primary mb-1">{eventTitle}</h6>
                    {eventData.date && (
                      <div className="small text-muted mb-1">
                        <strong>Date &amp; Time:</strong> {eventData.date} at {eventData.time}
                      </div>
                    )}
                    {eventData.location && (
                      <div className="small text-muted mb-2">
                        <strong>Venue:</strong> {eventData.location}
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="fw-bold text-dark">Registration Fee:</span>
                      <span className="fs-5 fw-bold text-success">
                        ₹ {eventFee}
                      </span>
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mb-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-info me-2" />
                    Payment Instructions
                  </h6>
                  <div className="p-3 border rounded-3 bg-white text-secondary small mb-3">
                    <p className="mb-2">
                      Pay <strong>₹ {eventFee}</strong> using the payment method below:
                    </p>
                    {paymentInstructions ? (
                      <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                        {paymentInstructions}
                      </p>
                    ) : (
                      <p className="mb-0">
                        <strong>UPI ID:</strong> eventpayments@upi<br />
                        <strong>Bank:</strong> State Bank of India<br />
                        <strong>Account No:</strong> 9876543210123<br />
                        <strong>IFSC Code:</strong> SBIN0001234
                      </p>
                    )}
                  </div>

                  <div className="small text-muted">
                    <p className="mb-1"><strong>How this registration works:</strong></p>
                    <ol className="ps-3 mb-0">
                      <li>Pay exact amount of ₹{eventFee} externally via UPI or Bank.</li>
                      <li>Save a screenshot of your successful transaction.</li>
                      <li>Enter your Transaction / UTR Number and upload screenshot below.</li>
                      <li>Your registration and payment will be submitted together for organizer review.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Status & Upload Form */}
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                  <h5 className="fw-bold text-dark mb-3">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-success me-2" />
                    Payment Details &amp; Submission
                  </h5>

                  {/* Status Banner */}
                  {isApproved ? (
                    <div className="alert alert-success d-flex align-items-center p-3 rounded-3 mb-4">
                      <FontAwesomeIcon icon={faCheckCircle} className="fs-3 text-success me-3" />
                      <div>
                        <h6 className="fw-bold mb-1">Registration Confirmed ✓</h6>
                        <p className="small mb-0">
                          Your payment of ₹{eventFee} has been verified and your admission ticket has been issued!
                        </p>
                      </div>
                    </div>
                  ) : isRejected ? (
                    <div className="alert alert-danger d-flex align-items-start p-3 rounded-3 mb-4">
                      <FontAwesomeIcon icon={faTimesCircle} className="fs-3 text-danger me-3 mt-1" />
                      <div>
                        <h6 className="fw-bold mb-1">Payment Rejected</h6>
                        <p className="small mb-2">
                          <strong>Reason:</strong> {registration?.rejection_reason || 'Transaction could not be verified.'}
                        </p>
                        <p className="small mb-0 text-muted">
                          Please verify your payment transaction details and resubmit a clear screenshot below.
                        </p>
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="alert alert-warning p-3 rounded-3 mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <FontAwesomeIcon icon={faClock} className="fs-4 text-warning me-2" />
                        <h6 className="fw-bold mb-0">Payment Under Review</h6>
                      </div>
                      <p className="small mb-2">
                        Your payment proof has been submitted and is currently under review by the organizer.
                      </p>
                      <div className="p-2 bg-white rounded border small mb-2">
                        <strong>Transaction:</strong> <code>{registration?.transaction_number || transactionNumber}</code><br />
                        <strong>Amount:</strong> ₹{eventFee}<br />
                        <strong>Payment Status:</strong> <span className="text-warning fw-semibold">Under Review</span>
                      </div>
                      <p className="extra-small text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                        You will receive an email once your payment is verified and your ticket is issued.
                      </p>
                    </div>
                  ) : (
                    <div className="alert alert-info d-flex align-items-center p-3 rounded-3 mb-4">
                      <FontAwesomeIcon icon={faInfoCircle} className="fs-3 text-info me-3" />
                      <div>
                        <h6 className="fw-bold mb-1">One-Step Registration &amp; Payment</h6>
                        <p className="small mb-0">
                          Submit your transaction reference and screenshot below to complete registration.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* If Approved: Display Download Buttons */}
                  {isApproved ? (
                    <div className="p-4 border rounded-3 bg-light text-center mb-3">
                      <h6 className="fw-bold text-dark mb-3">Your Event Documents Are Ready</h6>
                      <div className="d-flex flex-wrap justify-content-center gap-3">
                        <button
                          type="button"
                          className="btn btn-primary px-4 py-2"
                          onClick={() => handleDownloadTicket(registration?.ticket_id || registration?.registration_id)}
                        >
                          <FontAwesomeIcon icon={faTicketAlt} className="me-2" />
                          Download Event Ticket
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-success px-4 py-2"
                          onClick={() => handleDownloadInvoice(registration?.invoice_id || registration?.payment_id)}
                        >
                          <FontAwesomeIcon icon={faReceipt} className="me-2" />
                          Download Invoice
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* If Not Approved: Display Upload Form */
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-dark">
                          Transaction Number / UTR <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. TXN123456 or UPI/123456789012"
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value)}
                          required
                        />
                        <div className="form-text small">
                          The reference number or UTR ID shown on your payment receipt.
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-dark">
                          Payment Screenshot (JPG or PNG only, max 10MB) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={handleFileChange}
                          required={!registration?.transaction_number}
                        />
                        <div className="form-text small">
                          JPG or PNG only. Maximum 10 MB.
                        </div>
                      </div>

                      {previewUrl && (
                        <div className="mb-4">
                          <label className="form-label fw-semibold small text-dark d-block">Screenshot Preview:</label>
                          <div className="border rounded-3 p-2 bg-light text-center" style={{ maxWidth: '320px' }}>
                            <img
                              src={previewUrl}
                              alt="Payment Proof Preview"
                              className="img-fluid rounded-2"
                              style={{ maxHeight: '200px', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 fw-semibold w-100"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                            Submitting Registration &amp; Payment...
                          </>
                        ) : isRejected ? (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="me-2" />
                            Resubmit Payment
                          </>
                        ) : isPending ? (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="me-2" />
                            Update Payment Proof
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="me-2" />
                            Submit Registration &amp; Payment
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
