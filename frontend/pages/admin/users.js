import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faSearch,
  faUserPlus,
  faTrashAlt,
  faEdit,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { adminAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

// Screen 11 Sub-page: Admin Users Management
// Full interactive CRUD: Create, Read (DataTable), Update (Modal), Delete (Confirm Modal)
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // In-app alert notification message
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form states for Add User
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Attendee',
    status: 'Active'
  });

  // Fetch users from backend on component mount
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      if (res.data && res.data.data) {
        // Normalize role and date display for UI presentation
        const normalized = res.data.data.map((u) => ({
          ...u,
          role: u.role === 'admin' ? 'Admin' : u.role === 'organizer' ? 'Organizer' : 'Attendee',
          status: u.status || 'Active',
          avatar: getMediaUrl(u.avatar || u.profile_image, 'profile', u.email),
          joinedDate: u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : 'Recent'
        }));
        setUsers(normalized);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      triggerToast('Failed to load users from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper to trigger temporary toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 1. CREATE: Handle adding new user
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    try {
      await adminAPI.createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        role: newUser.role,
        password: 'password123'
      });

      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', role: 'Attendee', status: 'Active' });
      triggerToast(`User "${newUser.name}" created successfully!`);
      await fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      const msg = err.response?.data?.message || 'Error creating user.';
      triggerToast(msg);
    }
  };

  // 2. UPDATE: Handle editing existing user
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await adminAPI.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role
      });

      const updatedName = editingUser.name;
      setEditingUser(null);
      triggerToast(`User "${updatedName}" updated successfully!`);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      const msg = err.response?.data?.message || 'Error updating user.';
      triggerToast(msg);
    }
  };

  // 3. DELETE: Confirm deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await adminAPI.deleteUser(userToDelete.id);
      const deletedName = userToDelete.name;
      setUserToDelete(null);
      triggerToast(`User "${deletedName}" was removed.`);
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      const msg = err.response?.data?.message || 'Error deleting user.';
      triggerToast(msg);
    }
  };

  // Toggle user active status
  const handleToggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
          triggerToast(`User status set to ${newStatus}.`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Filter users based on search, role, status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
      <div className="container py-4">
        {/* Admin Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <FontAwesomeIcon icon={faUsers} className="text-primary me-2" />
              Users Management
            </h2>
            <p className="text-secondary small mb-0">
              Manage registered users, assign roles (Admin, Organizer, Attendee), and track account statuses
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Add New User</span>
          </button>
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
            <AdminSidebar currentPath="/admin/users" />
          </div>

          {/* Right Main Management DataTable Area */}
          <div className="col-12 col-lg-9">
            <div className="card border shadow-sm bg-white rounded-4 overflow-hidden">
              {/* DataTable Controls: Search + Filters */}
              <div className="card-header bg-white border-bottom p-3">
                <div className="row g-2 align-items-center">
                  {/* Search Bar */}
                  <div className="col-12 col-md-6">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <FontAwesomeIcon icon={faSearch} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Role Filter */}
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Organizer">Organizer</option>
                      <option value="Attendee">Attendee</option>
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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DataTable */}
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light">
                    <tr className="text-secondary small">
                      <th scope="col" className="ps-3 py-3">User</th>
                      <th scope="col" className="py-3">Contact</th>
                      <th scope="col" className="py-3">Role</th>
                      <th scope="col" className="py-3">Events</th>
                      <th scope="col" className="py-3">Joined</th>
                      <th scope="col" className="py-3">Status</th>
                      <th scope="col" className="py-3 text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-primary" />
                          Loading users from database...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted small">
                          No users match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((item) => (
                        <tr key={item.id}>
                          {/* User Avatar & Name */}
                          <td className="ps-3 py-2">
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={item.avatar}
                                alt={item.name}
                                className="rounded-circle border"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                              <div>
                                <span className="fw-bold text-dark d-block" style={{ fontSize: '0.88rem' }}>
                                  {item.name}
                                </span>
                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  ID: #{item.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Email & Phone */}
                          <td className="py-2 small">
                            <div className="text-secondary">
                              <FontAwesomeIcon icon={faEnvelope} className="me-1 text-muted" style={{ fontSize: '0.75rem' }} />
                              {item.email}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" style={{ fontSize: '0.72rem' }} />
                              {item.phone || 'N/A'}
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-2">
                            <span
                              className={`badge ${
                                item.role === 'Admin'
                                  ? 'bg-primary'
                                  : item.role === 'Organizer'
                                  ? 'bg-info-subtle text-info border'
                                  : 'bg-light text-secondary border'
                              }`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {item.role}
                            </span>
                          </td>

                          {/* Registered Events Count */}
                          <td className="py-2 small text-secondary">
                            {item.registeredEvents} bookings
                          </td>

                          {/* Joined Date */}
                          <td className="py-2 small text-muted">
                            {item.joinedDate}
                          </td>

                          {/* Status */}
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id)}
                              className={`btn btn-sm py-0 px-2 border-0 badge ${
                                item.status === 'Active'
                                  ? 'bg-success-subtle text-success'
                                  : 'bg-secondary-subtle text-secondary'
                              }`}
                              style={{ fontSize: '0.72rem', cursor: 'pointer' }}
                              title="Click to toggle status"
                            >
                              ● {item.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-2 text-end pe-3">
                            <div className="btn-group btn-group-sm">
                              {/* Edit Button */}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setEditingUser({ ...item })}
                                title="Edit User"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              {/* Delete Button */}
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => setUserToDelete(item)}
                                title="Delete User"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
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
                  Showing {filteredUsers.length} of {users.length} users
                </span>
                <span className="text-muted small">
                  Active accounts: {users.filter((u) => u.status === 'Active').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 1. CREATE USER MODAL ================= */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <FontAwesomeIcon icon={faUserPlus} className="text-primary me-2" />
                  Add New User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleAddUserSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. rahul@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 98765 12345"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-medium text-dark">Role</label>
                      <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="Attendee">Attendee</option>
                        <option value="Organizer">Organizer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-medium text-dark">Status</label>
                      <select
                        className="form-select"
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
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
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. EDIT / UPDATE USER MODAL ================= */}
      {editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <FontAwesomeIcon icon={faEdit} className="text-primary me-2" />
                  Edit User Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingUser(null)}
                />
              </div>
              <form onSubmit={handleEditUserSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-medium text-dark">Role</label>
                      <select
                        className="form-select"
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="Attendee">Attendee</option>
                        <option value="Organizer">Organizer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-medium text-dark">Status</label>
                      <select
                        className="form-select"
                        value={editingUser.status}
                        onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. DELETE CONFIRMATION MODAL ================= */}
      {userToDelete && (
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
                <h5 className="fw-bold text-dark mb-2">Delete User?</h5>
                <p className="text-secondary small mb-4">
                  Are you sure you want to delete user <strong>"{userToDelete.name}"</strong>? This will permanently remove their profile and registration records.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => setUserToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4"
                    onClick={handleConfirmDelete}
                  >
                    Yes, Delete
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
