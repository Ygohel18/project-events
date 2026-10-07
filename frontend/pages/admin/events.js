import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faSearch,
  faPlus,
  faEye,
  faTrashAlt,
  faEdit,
  faCheckCircle,
  faExclamationTriangle,
  faImage,
  faSpinner,
  faFilePdf,
  faUpload,
  faBan,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import ExportDropdown from '../../components/common/ExportDropdown';
import { adminAPI, eventAPI, categoryAPI, exportAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

// Screen 11 Sub-page: Admin Events Management
// Full interactive CRUD connected to live MySQL backend with real local file uploads
export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // In-app alert notification message
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [eventToCancel, setEventToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state for Add Event
  const [newEvent, setNewEvent] = useState({
    title: '',
    category_id: '',
    date: '',
    time: '',
    location: '',
    address: '',
    map_embed_url: '',
    description: '',
    price: 0,
    maxParticipants: 100,
    status: 'Published',
    registration_open: true
  });
  const [addImageFile, setAddImageFile] = useState(null);
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addBrochureFile, setAddBrochureFile] = useState(null);

  // Form state for Edit Event
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editBrochureFile, setEditBrochureFile] = useState(null);

  // Trigger toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Load events and categories from MySQL
  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, categoriesRes] = await Promise.all([
        adminAPI.getEvents(),
        categoryAPI.getCategories()
      ]);

      if (eventsRes.data?.success && Array.isArray(eventsRes.data?.data)) {
        setEvents(eventsRes.data.data);
      }
      if (categoriesRes.data?.success && Array.isArray(categoriesRes.data?.data)) {
        setCategories(categoriesRes.data.data);
        if (categoriesRes.data.data.length > 0 && !newEvent.category_id) {
          setNewEvent((prev) => ({ ...prev, category_id: categoriesRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. CREATE: Add new event to MySQL with FormData
  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.location.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newEvent.title.trim());
      formData.append('category_id', newEvent.category_id || (categories[0]?.id || 1));
      formData.append('date', newEvent.date || 'TBD 2026');
      formData.append('time', newEvent.time || '10:00 AM');
      formData.append('location', newEvent.location.trim());
      formData.append('address', newEvent.address ? newEvent.address.trim() : '');
      formData.append('map_embed_url', newEvent.map_embed_url ? newEvent.map_embed_url.trim() : '');
      formData.append('description', newEvent.description || 'No description provided.');
      formData.append('registration_fee', Number(newEvent.price) || 0);
      formData.append('max_participants', Number(newEvent.maxParticipants) || 100);
      formData.append('status', newEvent.status || 'Published');
      formData.append('registration_open', newEvent.registration_open ? 'true' : 'false');

      if (addImageFile) {
        formData.append('image', addImageFile);
      }
      if (addBrochureFile) {
        formData.append('brochure', addBrochureFile);
      }

      const res = await eventAPI.createEvent(formData);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewEvent({
          title: '',
          category_id: categories[0]?.id || '',
          date: '',
          time: '',
          location: '',
          address: '',
          map_embed_url: '',
          description: '',
          price: 0,
          maxParticipants: 100,
          status: 'Published',
          registration_open: true
        });
        setAddImageFile(null);
        setAddImagePreview(null);
        setAddBrochureFile(null);
        triggerToast(`Event "${newEvent.title.trim()}" published successfully!`);
        loadData();
      }
    } catch (err) {
      console.error('Error creating event:', err);
      triggerToast(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. UPDATE: Edit existing event in MySQL with FormData
  const handleEditEventSubmit = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', editingEvent.title.trim());
      formData.append('category_id', editingEvent.category_id);
      formData.append('date', editingEvent.date);
      formData.append('time', editingEvent.time);
      formData.append('location', editingEvent.location);
      formData.append('address', editingEvent.address ? editingEvent.address.trim() : '');
      formData.append('map_embed_url', editingEvent.map_embed_url ? editingEvent.map_embed_url.trim() : '');
      formData.append('description', editingEvent.description || '');
      formData.append('registration_fee', Number(editingEvent.price || editingEvent.registration_fee) || 0);
      formData.append('max_participants', Number(editingEvent.maxParticipants) || 100);
      formData.append('status', editingEvent.status);
      formData.append('registration_open', editingEvent.registration_open !== false && editingEvent.registration_open !== 0 && editingEvent.registration_open !== 'false' ? 'true' : 'false');

      if (editImageFile) {
        formData.append('image', editImageFile);
      }
      if (editBrochureFile) {
        formData.append('brochure', editBrochureFile);
      }

      const res = await eventAPI.updateEvent(editingEvent.id, formData);
      if (res.data?.success) {
        const title = editingEvent.title;
        setEditingEvent(null);
        setEditImageFile(null);
        setEditImagePreview(null);
        setEditBrochureFile(null);
        triggerToast(`Event "${title}" updated successfully!`);
        loadData();
      }
    } catch (err) {
      console.error('Error updating event:', err);
      triggerToast(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. DELETE: Confirm deletion in MySQL
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setSubmitting(true);
    try {
      const res = await eventAPI.deleteEvent(eventToDelete.id);
      if (res.data?.success) {
        const title = eventToDelete.title;
        setEventToDelete(null);
        triggerToast(`Event "${title}" was deleted.`);
        loadData();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      triggerToast(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. CANCEL: Cancel event and notify registered attendees
  const handleCancelEvent = async (e) => {
    if (e) e.preventDefault();
    if (!eventToCancel) return;

    setSubmitting(true);
    try {
      const res = await eventAPI.cancelEvent(eventToCancel.id, cancelReason);
      if (res.data?.success) {
        const title = eventToCancel.title;
        setEventToCancel(null);
        setCancelReason('');
        triggerToast(`Event "${title}" was cancelled and attendees have been notified.`);
        loadData();
      }
    } catch (err) {
      console.error('Error cancelling event:', err);
      triggerToast(err.response?.data?.message || 'Failed to cancel event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter events based on search, category and status
  const filteredEvents = events.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExport = async (format) => {
    try {
      const res = await exportAPI.events(format, {
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        categoryId: selectedCategory !== 'All' ? selectedCategory : undefined
      });
      const blob = new Blob([res.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export events error:', err);
      alert('Failed to export events.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container py-4">
          {/* Admin Header */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                Events Management
              </h2>
              <p className="text-secondary small mb-0">
                Manage live catalog events, preview banners, dates, pricing, and live publish statuses in MySQL
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <ExportDropdown onExport={handleExport} />
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Admin Sidebar */}
            <div className="col-12 col-lg-3">
              <AdminSidebar currentPath="/admin/events" />
            </div>

            {/* Right Main Content */}
            <div className="col-12 col-lg-9">
              {/* In-app Toast Banner */}
              {toastMessage && (
                <div
                  className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-4 shadow-sm"
                  role="alert"
                >
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span className="small fw-semibold">{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-sm"
                    onClick={() => setToastMessage('')}
                  />
                </div>
              )}

              {/* DataTable Card */}
              <div className="card border shadow-sm bg-white rounded-4 overflow-hidden">
                {/* Search & Filters Header */}
                <div className="card-header bg-white border-bottom p-3">
                  <div className="row g-2 align-items-center">
                    {/* Search */}
                    <div className="col-12 col-md-5">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">
                          <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 ps-0"
                          placeholder="Search event name or location..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="col-6 col-md-4">
                      <select
                        className="form-select form-select-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="col-6 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Hidden">Hidden</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small text-muted">
                    <span>
                      Showing <strong className="text-dark">{filteredEvents.length}</strong> events in database
                    </span>
                    {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                      <button
                        className="btn btn-link btn-sm p-0 text-primary small text-decoration-none"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedStatus('All');
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Data */}
                <div className="table-responsive">
                  <table className="table align-middle table-hover mb-0">
                    <thead className="table-light">
                      <tr className="text-secondary small">
                        <th scope="col" className="ps-4 py-3">
                          Event
                        </th>
                        <th scope="col" className="py-3">
                          Category
                        </th>
                        <th scope="col" className="py-3">
                          Date &amp; Time
                        </th>
                        <th scope="col" className="py-3">
                          Price
                        </th>
                        <th scope="col" className="py-3">
                          Attendees
                        </th>
                        <th scope="col" className="py-3">
                          Status
                        </th>
                        <th scope="col" className="py-3 text-end pe-4">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-primary" />
                            Loading events from database...
                          </td>
                        </tr>
                      ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((item) => (
                          <tr key={item.id}>
                            <td className="ps-4 py-3">
                              <div className="d-flex align-items-center gap-3">
                                <img
                                  src={getMediaUrl(item.image)}
                                  alt={item.title}
                                  className="rounded-3 border"
                                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                />
                                <div>
                                  <span className="fw-semibold text-dark d-block">
                                    {item.title}
                                  </span>
                                  <span className="text-muted small">
                                    {item.location}
                                  </span>
                                  {item.brochure && (
                                    <span className="badge bg-danger-subtle text-danger border ms-1" style={{ fontSize: '0.65rem' }}>
                                      PDF Brochure
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="badge bg-light text-dark border">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3 small text-secondary">
                              <div>{item.date}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {item.time}
                              </div>
                            </td>
                            <td className="py-3 small fw-medium text-dark">
                              {Number(item.price) === 0 ? 'Free' : `₹ ${item.price}`}
                            </td>
                            <td className="py-3 small text-secondary">
                              {item.registeredCount || 0} / {item.maxParticipants}
                            </td>
                            <td className="py-3">
                              <div className="d-flex flex-column gap-1">
                                <span
                                  className={`badge ${
                                    item.status === 'Published'
                                      ? 'bg-success-subtle text-success'
                                      : item.status === 'Cancelled'
                                      ? 'bg-danger-subtle text-danger'
                                      : item.status === 'Draft'
                                      ? 'bg-secondary-subtle text-secondary'
                                      : item.status === 'Completed'
                                      ? 'bg-info-subtle text-info'
                                      : 'bg-warning-subtle text-warning'
                                  }`}
                                >
                                  {item.status}
                                </span>
                                {item.registration_open === false || item.registration_open === 0 || item.registration_open === 'false' ? (
                                  <span className="badge bg-warning-subtle text-warning-emphasis" style={{ fontSize: '0.68rem' }}>
                                    Reg. Closed
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                                    Reg. Open
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-end pe-4">
                              <div className="btn-group btn-group-sm">
                                <Link
                                  href={`/events/${item.id}`}
                                  className="btn btn-outline-secondary"
                                  title="View Public Event"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </Link>
                                <Link
                                  href={`/admin/attendance?eventId=${item.id}`}
                                  className="btn btn-outline-primary"
                                  title="Attendance"
                                >
                                  <FontAwesomeIcon icon={faUsers} />
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => {
                                    setEditingEvent({ ...item });
                                    setEditImageFile(null);
                                    setEditImagePreview(null);
                                    setEditBrochureFile(null);
                                  }}
                                  title="Edit Event"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-warning"
                                  onClick={() => {
                                    setEventToCancel(item);
                                    setCancelReason('');
                                  }}
                                  title="Cancel Event & Notify Attendees"
                                  disabled={item.status === 'Cancelled'}
                                >
                                  <FontAwesomeIcon icon={faBan} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => setEventToDelete(item)}
                                  title="Delete Event"
                                >
                                  <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted small">
                            No events found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="card-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    Published: {events.filter((e) => e.status === 'Published').length} | Drafts:{' '}
                    {events.filter((e) => e.status === 'Draft').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 1. CREATE EVENT MODAL ================= */}
        {showAddModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">
                    <FontAwesomeIcon icon={faPlus} className="text-primary me-2" />
                    Create New Event
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  />
                </div>
                <form onSubmit={handleAddEventSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12 col-md-8">
                        <label className="form-label small fw-medium text-dark">Event Title *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. Annual Cultural Meet"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Category *</label>
                        <select
                          className="form-select"
                          value={newEvent.category_id}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, category_id: e.target.value })
                          }
                          required
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-medium text-dark">Description</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Enter summary of event..."
                          value={newEvent.description}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Date *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. 15 Jan 2026"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Time *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. 06:00 PM - 09:00 PM"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-medium text-dark">Location *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. City Auditorium, Ahmedabad"
                          value={newEvent.location}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, location: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Detailed Venue Address</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Auditorium A, Campus Center, 123 Tech Avenue"
                          value={newEvent.address}
                          onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Google Maps Embed URL or iframe</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://www.google.com/maps/embed?... or <iframe>"
                          value={newEvent.map_embed_url}
                          onChange={(e) => setNewEvent({ ...newEvent, map_embed_url: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={newEvent.price}
                          onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">
                          Max Attendees
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={newEvent.maxParticipants}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, maxParticipants: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Status</label>
                        <select
                          className="form-select"
                          value={newEvent.status}
                          onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                        >
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Hidden">Hidden</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="addRegOpenSwitch"
                            checked={newEvent.registration_open}
                            onChange={(e) => setNewEvent({ ...newEvent, registration_open: e.target.checked })}
                          />
                          <label className="form-check-label small fw-medium text-dark" htmlFor="addRegOpenSwitch">
                            Registration Open (Allow attendees to register)
                          </label>
                        </div>
                      </div>

                      {/* Cover Image File Input */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Event Image (JPG, PNG, WEBP)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="form-control"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAddImageFile(e.target.files[0]);
                              setAddImagePreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                        {addImagePreview && (
                          <div className="mt-2">
                            <img
                              src={addImagePreview}
                              alt="Selected"
                              className="rounded-2 border"
                              style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Brochure PDF File Input */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Event Brochure (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="form-control"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAddBrochureFile(e.target.files[0]);
                            }
                          }}
                        />
                        {addBrochureFile && (
                          <div className="small text-success mt-1">
                            ✓ Document: {addBrochureFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-top">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-sm px-3"
                    >
                      {submitting ? 'Saving...' : 'Publish Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. EDIT / UPDATE EVENT MODAL ================= */}
        {editingEvent && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">
                    <FontAwesomeIcon icon={faEdit} className="text-primary me-2" />
                    Edit Event Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingEvent(null)}
                  />
                </div>
                <form onSubmit={handleEditEventSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12 col-md-8">
                        <label className="form-label small fw-medium text-dark">Event Title *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={editingEvent.title}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Category *</label>
                        <select
                          className="form-select"
                          value={editingEvent.category_id}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, category_id: e.target.value })
                          }
                          required
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-medium text-dark">Description</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={editingEvent.description || ''}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Date *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={editingEvent.date}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, date: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Time *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={editingEvent.time}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, time: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-medium text-dark">Location *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={editingEvent.location}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, location: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Detailed Venue Address</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Auditorium A, Campus Center, 123 Tech Avenue"
                          value={editingEvent.address || ''}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, address: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">Google Maps Embed URL or iframe</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://www.google.com/maps/embed?... or <iframe>"
                          value={editingEvent.map_embed_url || ''}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, map_embed_url: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={editingEvent.price !== undefined ? editingEvent.price : editingEvent.registration_fee || 0}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, price: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">
                          Max Attendees
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={editingEvent.maxParticipants}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, maxParticipants: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-dark">Status</label>
                        <select
                          className="form-select"
                          value={editingEvent.status}
                          onChange={(e) =>
                            setEditingEvent({ ...editingEvent, status: e.target.value })
                          }
                        >
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Hidden">Hidden</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="editRegOpenSwitch"
                            checked={editingEvent.registration_open !== false && editingEvent.registration_open !== 0 && editingEvent.registration_open !== 'false'}
                            onChange={(e) =>
                              setEditingEvent({ ...editingEvent, registration_open: e.target.checked })
                            }
                          />
                          <label className="form-check-label small fw-medium text-dark" htmlFor="editRegOpenSwitch">
                            Registration Open (Allow attendees to register)
                          </label>
                        </div>
                      </div>

                      {/* Edit Image Replacement */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Replace Cover Image
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="form-control mb-2"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setEditImageFile(e.target.files[0]);
                              setEditImagePreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                        <div className="small text-muted mb-1">Current / Preview Banner:</div>
                        <img
                          src={editImagePreview || getMediaUrl(editingEvent.image)}
                          alt="Banner"
                          className="rounded-2 border w-100"
                          style={{ height: '80px', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Edit Brochure Replacement */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Replace Brochure (PDF)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="form-control mb-2"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setEditBrochureFile(e.target.files[0]);
                            }
                          }}
                        />
                        {editingEvent.brochure && (
                          <div className="small text-muted mb-1">
                            Current: <a href={getMediaUrl(editingEvent.brochure)} target="_blank" rel="noreferrer">View PDF Brochure</a>
                          </div>
                        )}
                        {editBrochureFile && (
                          <div className="small text-success">
                            ✓ New document: {editBrochureFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-top">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setEditingEvent(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-sm px-3"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. DELETE CONFIRMATION MODAL ================= */}
        {eventToDelete && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <div className="modal-body p-4 text-center">
                  <div
                    className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <FontAwesomeIcon icon={faExclamationTriangle} className="fs-3" />
                  </div>
                  <h5 className="fw-bold text-dark mb-2">Delete Event?</h5>
                  <p className="text-secondary small mb-4">
                    Are you sure you want to delete event{' '}
                    <strong>"{eventToDelete.title}"</strong>? This will permanently remove its database record and media files.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-light px-4"
                      onClick={() => setEventToDelete(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      className="btn btn-danger px-4"
                      onClick={handleConfirmDelete}
                    >
                      {submitting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. CANCEL EVENT MODAL ================= */}
        {eventToCancel && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <form onSubmit={handleCancelEvent}>
                  <div className="modal-body p-4">
                    <div className="text-center mb-3">
                      <div
                        className="rounded-circle bg-warning-subtle text-warning d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <FontAwesomeIcon icon={faBan} className="fs-3" />
                      </div>
                      <h5 className="fw-bold text-dark mb-1">Cancel Event?</h5>
                      <p className="text-secondary small mb-0">
                        This will set <strong>"{eventToCancel.title}"</strong> to Cancelled and dispatch email & in-app alerts to all registered participants.
                      </p>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">
                        Cancellation Reason (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="e.g. Unforeseen weather circumstances, speaker illness..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-light px-3"
                        onClick={() => {
                          setEventToCancel(null);
                          setCancelReason('');
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-warning px-4 fw-medium text-dark"
                      >
                        {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
