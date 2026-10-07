import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faSearch,
  faCheck,
  faTimes,
  faEnvelope,
  faDownload,
  faCheckCircle,
  faExclamationTriangle,
  faEye,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import StatusBadge from '../../components/common/StatusBadge';
import ExportDropdown from '../../components/common/ExportDropdown';
import { adminAPI, exportAPI } from '../../services/api';

// Screen 11 Sub-page: Admin Registrations Management
// Interactive DataTable with search, status filtering, details modal, and in-app confirm dialogs
export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals & toast
  const [toastMessage, setToastMessage] = useState('');
  const [viewingReg, setViewingReg] = useState(null);
  const [regToCancel, setRegToCancel] = useState(null);

  // Fetch registrations from database
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getRegistrations();
      if (res.data && res.data.data) {
        // Format dates cleanly
        const formatted = res.data.data.map((r) => ({
          ...r,
          date: r.date ? new Date(r.date).toLocaleDateString() : 'N/A'
        }));
        setRegistrations(formatted);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      triggerToast('Failed to load registrations from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Approve registration in database
  const handleApprove = async (id, user) => {
    try {
      await adminAPI.updateRegistrationStatus(id, 'Confirmed');
      triggerToast(`Booking for "${user}" was approved!`);
      await fetchRegistrations();
    } catch (err) {
      console.error('Error approving registration:', err);
      triggerToast('Failed to approve registration.');
    }
  };

  // Confirm cancel registration in database
  const handleConfirmCancel = async () => {
    if (!regToCancel) return;
    try {
      await adminAPI.updateRegistrationStatus(regToCancel.id, 'Cancelled');
      const cancelledUser = regToCancel.user;
      setRegToCancel(null);
      triggerToast(`Booking for "${cancelledUser}" was cancelled.`);
      await fetchRegistrations();
    } catch (err) {
      console.error('Error cancelling registration:', err);
      triggerToast('Failed to cancel registration.');
    }
  };

  // Export CSV / Excel
  const handleExport = async (format) => {
    try {
      const res = await exportAPI.registrations(format, {
        status: selectedStatus !== 'All' ? selectedStatus : undefined
      });
      const blob = new Blob([res.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerToast(`Exported registrations to ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Export registrations error:', err);
      triggerToast('Failed to export registrations.');
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      (reg.ticketNumber && reg.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.user && reg.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.event && reg.event.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.email && reg.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'All' || reg.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const confirmedCount = registrations.filter((r) => r.status === 'Confirmed').length;
  const pendingCount = registrations.filter((r) => r.status === 'Pending').length;
  const cancelledCount = registrations.filter((r) => r.status === 'Cancelled').length;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
      <div className="container py-4">
        {/* Admin Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <FontAwesomeIcon icon={faTicketAlt} className="text-primary me-2" />
              Registrations Management
            </h2>
            <p className="text-secondary small mb-0">
              Track, approve, and manage attendee bookings, tickets, and booking status across all events
            </p>
          </div>
          <ExportDropdown onExport={handleExport} />
        </div>

        {/* In-app Toast Banner */}
        {toastMessage && (
          <div className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-4 shadow-sm" role="alert">
            <div className="d-flex align-items-center gap-2 small">
              <FontAwesomeIcon icon={faCheckCircle} className="fs-5" />
              <strong>{toastMessage}</strong>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              onClick={() => setToastMessage('')}
            />
          </div>
        )}

        <div className="row g-4">
          {/* Left Admin Sidebar */}
          <div className="col-12 col-lg-3">
            <AdminSidebar currentPath="/admin/registrations" />
          </div>

          {/* Right Main Management DataTable Area */}
          <div className="col-12 col-lg-9">
            {/* Quick Status Count Cards */}
            <div className="row g-3 mb-4">
              <div className="col-4">
                <div className="card border p-3 bg-white text-center">
                  <span className="text-secondary small d-block">Confirmed</span>
                  <h4 className="fw-bold text-success mb-0">{confirmedCount}</h4>
                </div>
              </div>
              <div className="col-4">
                <div className="card border p-3 bg-white text-center">
                  <span className="text-secondary small d-block">Pending</span>
                  <h4 className="fw-bold text-warning mb-0">{pendingCount}</h4>
                </div>
              </div>
              <div className="col-4">
                <div className="card border p-3 bg-white text-center">
                  <span className="text-secondary small d-block">Cancelled</span>
                  <h4 className="fw-bold text-danger mb-0">{cancelledCount}</h4>
                </div>
              </div>
            </div>

            <div className="card border shadow-sm bg-white rounded-4 overflow-hidden">
              {/* DataTable Controls: Search + Filter */}
              <div className="card-header bg-white border-bottom p-3">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-7">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <FontAwesomeIcon icon={faSearch} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search by ticket #, attendee, event, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-5">
                    <select
                      className="form-select form-select-sm"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="All">All Statuses ({registrations.length})</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DataTable */}
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light">
                    <tr className="text-secondary small">
                      <th scope="col" className="ps-3 py-3">Ticket #</th>
                      <th scope="col" className="py-3">Attendee</th>
                      <th scope="col" className="py-3">Event Name</th>
                      <th scope="col" className="py-3">Date</th>
                      <th scope="col" className="py-3">Amount</th>
                      <th scope="col" className="py-3">Status</th>
                      <th scope="col" className="py-3 text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-primary" />
                          Loading registrations from database...
                        </td>
                      </tr>
                    ) : filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted small">
                          No registrations found matching your query.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((item) => (
                        <tr key={item.id}>
                          {/* Ticket Code */}
                          <td className="ps-3 py-2 font-monospace small fw-bold text-primary">
                            {item.ticketNumber}
                          </td>

                          {/* Attendee */}
                          <td className="py-2">
                            <span className="fw-bold text-dark d-block" style={{ fontSize: '0.88rem' }}>
                              {item.user}
                            </span>
                            <span className="text-muted small d-block" style={{ fontSize: '0.75rem' }}>
                              <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                              {item.email}
                            </span>
                          </td>

                          {/* Event */}
                          <td className="py-2 small fw-medium text-dark">
                            {item.event}
                          </td>

                          {/* Date */}
                          <td className="py-2 small text-secondary">
                            {item.date}
                          </td>

                          {/* Amount */}
                          <td className="py-2 small fw-semibold text-dark">
                            {item.amount}
                          </td>

                          {/* Status */}
                          <td className="py-2">
                            <StatusBadge status={item.status} />
                          </td>

                          {/* Action Buttons */}
                          <td className="py-2 text-end pe-3">
                            <div className="btn-group btn-group-sm">
                              {/* View Details */}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setViewingReg(item)}
                                title="View Ticket"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>

                              {/* Approve Button */}
                              {item.status === 'Pending' && (
                                <button
                                  type="button"
                                  className="btn btn-outline-success"
                                  onClick={() => handleApprove(item.id, item.user)}
                                  title="Approve Booking"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                                  Approve
                                </button>
                              )}

                              {/* Cancel Button */}
                              {item.status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => setRegToCancel(item)}
                                  title="Cancel Booking"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  Showing {filteredRegistrations.length} of {registrations.length} registrations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= VIEW TICKET DETAILS MODAL ================= */}
      {viewingReg && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <FontAwesomeIcon icon={faTicketAlt} className="text-primary me-2" />
                  Booking Details - {viewingReg.ticketNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingReg(null)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="bg-light p-3 rounded-3 mb-3 border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Ticket Code:</span>
                    <strong className="font-monospace text-primary">{viewingReg.ticketNumber}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Event:</span>
                    <strong>{viewingReg.event}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Attendee:</span>
                    <span>{viewingReg.user} ({viewingReg.email})</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Date:</span>
                    <span>{viewingReg.date}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Amount:</span>
                    <strong>{viewingReg.amount}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Status:</span>
                    <StatusBadge status={viewingReg.status} />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-4"
                  onClick={() => setViewingReg(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      {regToCancel && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} className="fs-3" />
                </div>
                <h5 className="fw-bold text-dark mb-2">Cancel Registration?</h5>
                <p className="text-secondary small mb-4">
                  Are you sure you want to cancel ticket <strong>{regToCancel.ticketNumber}</strong> for <strong>{regToCancel.user}</strong>?
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => setRegToCancel(null)}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4"
                    onClick={handleConfirmCancel}
                  >
                    Confirm Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
    </ProtectedRoute>
  );
}
