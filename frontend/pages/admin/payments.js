import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEye,
  faSearch,
  faFilter,
  faSpinner,
  faTicketAlt,
  faReceipt,
  faExclamationTriangle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import ExportDropdown from '../../components/common/ExportDropdown';
import { paymentAPI, eventAPI, documentAPI, exportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [eventFilter, setEventFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' });

  // Modal states
  const [selectedProofPayment, setSelectedProofPayment] = useState(null);
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch payments based on role (admin or organizer)
  const fetchPayments = async () => {
    try {
      setLoading(true);
      let res;
      if (user?.role === 'admin') {
        res = await paymentAPI.getAdminPayments();
      } else {
        res = await paymentAPI.getOrganizerPayments();
      }

      if (res.data?.success && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setToastMsg({ type: 'danger', text: 'Failed to load payments.' });
    } finally {
      setLoading(false);
    }
  };

  // Load events for filter
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await eventAPI.getEvents({ includeDrafts: true });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setEvents(res.data.data);
        }
      } catch (err) {
        console.error('Error loading events:', err);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  // View payment proof screenshot (authenticated blob)
  const handleViewProof = async (payment) => {
    setSelectedProofPayment(payment);
    setLoadingProof(true);
    setProofImageUrl(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(paymentAPI.getProofUrl(payment.id), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load screenshot');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setProofImageUrl(objectUrl);
    } catch (err) {
      console.error('Error loading proof:', err);
      setToastMsg({ type: 'danger', text: 'Failed to load payment proof screenshot.' });
    } finally {
      setLoadingProof(false);
    }
  };

  // Close proof modal
  const handleCloseProofModal = () => {
    if (proofImageUrl) {
      URL.revokeObjectURL(proofImageUrl);
    }
    setSelectedProofPayment(null);
    setProofImageUrl(null);
  };

  // Approve payment
  const handleApprove = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will confirm the registration, generate the invoice and ticket, and notify the participant.')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await paymentAPI.approvePayment(paymentId);
      if (res.data?.success) {
        setToastMsg({
          type: 'success',
          text: `Payment #${paymentId} approved! Invoice and ticket generated.`
        });
        await fetchPayments();
        if (selectedProofPayment?.id === paymentId) {
          handleCloseProofModal();
        }
      }
    } catch (err) {
      console.error('Approve payment error:', err);
      setToastMsg({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to approve payment.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject modal
  const handleOpenRejectModal = (payment) => {
    setRejectingPayment(payment);
    setRejectionReason('Invalid or unclear payment screenshot.');
  };

  // Submit rejection
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this payment.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await paymentAPI.rejectPayment(rejectingPayment.id, rejectionReason.trim());
      if (res.data?.success) {
        setToastMsg({
          type: 'warning',
          text: `Payment #${rejectingPayment.id} has been rejected. Participant was notified.`
        });
        setRejectingPayment(null);
        setRejectionReason('');
        await fetchPayments();
        if (selectedProofPayment?.id === rejectingPayment.id) {
          handleCloseProofModal();
        }
      }
    } catch (err) {
      console.error('Reject payment error:', err);
      setToastMsg({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to reject payment.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Download ticket
  const handleDownloadTicket = async (ticketRef) => {
    try {
      const res = await documentAPI.downloadTicket(ticketRef);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ticket-${ticketRef}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToastMsg({ type: 'danger', text: 'Failed to download ticket.' });
    }
  };

  // Download invoice
  const handleDownloadInvoice = async (invoiceRef) => {
    try {
      const res = await documentAPI.downloadInvoice(invoiceRef);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceRef}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToastMsg({ type: 'danger', text: 'Failed to download invoice.' });
    }
  };

  // Metrics
  const totalCount = payments.length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    // Status filter
    if (statusFilter !== 'All' && p.status !== statusFilter.toLowerCase()) {
      return false;
    }
    // Event filter
    if (eventFilter !== 'All' && String(p.event_id) !== String(eventFilter)) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = p.user_name?.toLowerCase().includes(query);
      const matchEmail = p.user_email?.toLowerCase().includes(query);
      const matchEvent = p.event_title?.toLowerCase().includes(query);
      const matchTx = p.transaction_number?.toLowerCase().includes(query);
      return matchName || matchEmail || matchEvent || matchTx;
    }
    return true;
  });

  const handleExport = async (format) => {
    try {
      const res = await exportAPI.payments(format, {
        status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined,
        eventId: eventFilter !== 'All' ? eventFilter : undefined
      });
      const blob = new Blob([res.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToastMsg({ type: 'success', text: `Exported payments to ${format.toUpperCase()}!` });
    } catch (err) {
      console.error('Export payments error:', err);
      setToastMsg({ type: 'danger', text: 'Failed to export payments.' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']}>
      <Layout>
        <div className="container py-4">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-success me-2" />
                Offline Payment Verification
              </h2>
              <p className="text-secondary small mb-0">
                Review submitted transaction proofs, verify external payments, and issue tickets &amp; invoices
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <ExportDropdown onExport={handleExport} />
              <button
                className="btn btn-outline-primary btn-sm px-3"
                onClick={fetchPayments}
                disabled={loading}
              >
                Refresh Payments
              </button>
            </div>
          </div>

          {/* Toast Message */}
          {toastMsg.text && (
            <div className={`alert alert-${toastMsg.type} alert-dismissible fade show shadow-sm`} role="alert">
              <span className="small fw-semibold">{toastMsg.text}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setToastMsg({ type: '', text: '' })}
              />
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small fw-semibold">Total Payments</span>
                    <h3 className="fw-bold text-dark mb-0">{totalCount}</h3>
                  </div>
                  <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="fs-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small fw-semibold">Pending Review</span>
                    <h3 className="fw-bold text-warning mb-0">{pendingCount}</h3>
                  </div>
                  <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                    <FontAwesomeIcon icon={faClock} className="fs-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small fw-semibold">Approved &amp; Issued</span>
                    <h3 className="fw-bold text-success mb-0">{approvedCount}</h3>
                  </div>
                  <div className="bg-success-subtle text-success p-3 rounded-circle">
                    <FontAwesomeIcon icon={faCheckCircle} className="fs-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small fw-semibold">Rejected Proofs</span>
                    <h3 className="fw-bold text-danger mb-0">{rejectedCount}</h3>
                  </div>
                  <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                    <FontAwesomeIcon icon={faTimesCircle} className="fs-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
            <div className="row g-3 align-items-center">
              {/* Search */}
              <div className="col-md-5">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0"
                    placeholder="Search by participant, email, event, or Txn ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="col-sm-6 col-md-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted fw-semibold">Status:</span>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Event Filter */}
              <div className="col-sm-6 col-md-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted fw-semibold">Event:</span>
                  <select
                    className="form-select form-select-sm text-truncate"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <option value="All">All Events</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          {loading ? (
            <div className="card border bg-white p-5 text-center rounded-4 shadow-sm mb-4">
              <div className="spinner-border text-primary mb-2" role="status" />
              <p className="text-muted small">Loading offline payment submissions...</p>
            </div>
          ) : (
            <div className="card border shadow-sm overflow-hidden rounded-4 mb-4 bg-white">
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light">
                    <tr className="text-secondary small">
                      <th scope="col" className="ps-4 py-3">Participant</th>
                      <th scope="col" className="py-3">Event &amp; Fee</th>
                      <th scope="col" className="py-3">Transaction Ref</th>
                      <th scope="col" className="py-3">Submitted At</th>
                      <th scope="col" className="py-3">Status</th>
                      <th scope="col" className="py-3 text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((item) => (
                        <tr key={item.id}>
                          <td className="ps-4 py-3">
                            <span className="fw-semibold text-dark d-block">
                              {item.user_name || 'Participant'}
                            </span>
                            <span className="text-muted small">{item.user_email}</span>
                          </td>

                          <td className="py-3">
                            <span className="fw-semibold text-primary d-block">
                              {item.event_title}
                            </span>
                            <span className="badge bg-light text-dark border small">
                              ₹ {parseFloat(item.amount).toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3">
                            <code className="text-dark fw-bold bg-light px-2 py-1 rounded">
                              {item.transaction_number}
                            </code>
                          </td>

                          <td className="py-3 text-secondary small">
                            {new Date(item.submitted_at).toLocaleDateString('en-GB')}{' '}
                            <span className="text-muted">
                              {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-3">
                            {item.status === 'approved' ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle py-1 px-2">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                Approved
                              </span>
                            ) : item.status === 'rejected' ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle py-1 px-2" title={item.rejection_reason || ''}>
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                Rejected
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle py-1 px-2">
                                <FontAwesomeIcon icon={faClock} className="me-1" />
                                Pending Review
                              </span>
                            )}
                          </td>

                          <td className="py-3 text-end pe-4">
                            <div className="d-inline-flex flex-wrap justify-content-end gap-1">
                              {/* View Proof Button */}
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2"
                                onClick={() => handleViewProof(item)}
                                title="View Payment Screenshot"
                              >
                                <FontAwesomeIcon icon={faEye} className="me-1" />
                                Proof
                              </button>

                              {/* Action buttons if Pending */}
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm px-2"
                                    onClick={() => handleApprove(item.id)}
                                    disabled={actionLoading}
                                    title="Approve & Generate Documents"
                                  >
                                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm px-2"
                                    onClick={() => handleOpenRejectModal(item)}
                                    disabled={actionLoading}
                                    title="Reject Payment"
                                  >
                                    <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Download Documents if Approved */}
                              {item.status === 'approved' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm px-2"
                                    onClick={() => handleDownloadTicket(item.ticket_id || item.registration_id)}
                                    title="Download Ticket"
                                  >
                                    <FontAwesomeIcon icon={faTicketAlt} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleDownloadInvoice(item.invoice_id || item.id)}
                                    title="Download Invoice"
                                  >
                                    <FontAwesomeIcon icon={faReceipt} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <FontAwesomeIcon icon={faMoneyBillWave} className="display-6 text-muted mb-3" />
                          <h6 className="fw-bold text-dark">No Payment Records Found</h6>
                          <p className="text-muted small mb-0">
                            {statusFilter === 'All'
                              ? 'No offline payments submitted yet.'
                              : `No payments found with status "${statusFilter}".`}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1. Modal: View Payment Proof Screenshot */}
          {selectedProofPayment && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content rounded-4 border-0 shadow">
                  <div className="modal-header border-bottom py-3">
                    <h5 className="modal-title fw-bold text-dark">
                      <FontAwesomeIcon icon={faReceipt} className="text-primary me-2" />
                      Payment Proof #{selectedProofPayment.id}
                    </h5>
                    <button type="button" className="btn-close" onClick={handleCloseProofModal} />
                  </div>

                  <div className="modal-body p-4">
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted mb-1">Participant</div>
                          <div className="fw-bold text-dark">{selectedProofPayment.user_name}</div>
                          <div className="small text-secondary">{selectedProofPayment.user_email}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted mb-1">Transaction Ref &amp; Fee</div>
                          <div className="fw-bold text-dark">
                            <code>{selectedProofPayment.transaction_number}</code>
                          </div>
                          <div className="small text-success fw-bold">
                            ₹ {parseFloat(selectedProofPayment.amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-3 border rounded-3 bg-light">
                      {loadingProof ? (
                        <div className="py-5">
                          <div className="spinner-border text-primary mb-2" role="status" />
                          <p className="text-muted small">Loading payment screenshot...</p>
                        </div>
                      ) : proofImageUrl ? (
                        <img
                          src={proofImageUrl}
                          alt="Payment Screenshot Proof"
                          className="img-fluid rounded-3 shadow-sm"
                          style={{ maxHeight: '420px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="py-4 text-muted small">
                          Screenshot not available or failed to load.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer border-top py-3">
                    {selectedProofPayment.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm px-3"
                          onClick={() => handleOpenRejectModal(selectedProofPayment)}
                          disabled={actionLoading}
                        >
                          Reject Proof
                        </button>
                        <button
                          type="button"
                          className="btn btn-success btn-sm px-3"
                          onClick={() => handleApprove(selectedProofPayment.id)}
                          disabled={actionLoading}
                        >
                          Approve Payment
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm px-3"
                      onClick={handleCloseProofModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Modal: Reject Payment Reason Prompt */}
          {rejectingPayment && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 border-0 shadow">
                  <div className="modal-header border-bottom py-3">
                    <h5 className="modal-title fw-bold text-danger">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Reject Payment Proof
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setRejectingPayment(null)}
                    />
                  </div>

                  <form onSubmit={handleConfirmReject}>
                    <div className="modal-body p-4">
                      <p className="small text-secondary mb-3">
                        You are rejecting the payment for participant{' '}
                        <strong>{rejectingPayment.user_name}</strong> (Txn: <code>{rejectingPayment.transaction_number}</code>).
                        An email and in-app notification with your reason will be sent to the participant so they can re-upload.
                      </p>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-dark">
                          Rejection Reason <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why the proof is invalid (e.g. Transaction amount does not match, screenshot is blurry, invalid UTR ID)..."
                          required
                        />
                      </div>
                    </div>

                    <div className="modal-footer border-top py-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-3"
                        onClick={() => setRejectingPayment(null)}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-danger btn-sm px-3"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
