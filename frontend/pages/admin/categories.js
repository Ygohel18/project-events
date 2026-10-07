import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTags,
  faSearch,
  faPlus,
  faTrashAlt,
  faEdit,
  faLayerGroup,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { categoryAPI } from '../../services/api';

// Screen 11 Sub-page: Admin Categories Management
// Full interactive CRUD connected with live MySQL backend: Create, Read (DataTable), Update (Modal), Delete (Confirm Modal)
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals & alerts
  const [toastMessage, setToastMessage] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Fetch categories from backend
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategories();
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 1. CREATE: Handle adding new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    try {
      const response = await categoryAPI.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || 'No description provided.'
      });

      if (response.data?.success) {
        setNewCatName('');
        setNewCatDesc('');
        setShowAddForm(false);
        triggerToast(`Category "${newCatName.trim()}" created successfully!`);
        loadCategories();
      }
    } catch (err) {
      console.error('Error creating category:', err);
      triggerToast(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. UPDATE: Handle editing existing category
  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    setSubmitting(true);
    try {
      const response = await categoryAPI.updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        description: editingCategory.description
      });

      if (response.data?.success) {
        const updatedName = editingCategory.name.trim();
        setEditingCategory(null);
        triggerToast(`Category "${updatedName}" updated successfully!`);
        loadCategories();
      }
    } catch (err) {
      console.error('Error updating category:', err);
      triggerToast(err.response?.data?.message || 'Failed to update category.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. DELETE: Confirm deletion
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setSubmitting(true);
    try {
      const response = await categoryAPI.deleteCategory(categoryToDelete.id);
      if (response.data?.success) {
        const deletedName = categoryToDelete.name;
        setCategoryToDelete(null);
        triggerToast(`Category "${deletedName}" was deleted.`);
        loadCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      triggerToast(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container py-4">
          {/* Admin Header */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faTags} className="text-primary me-2" />
                Categories Management
              </h2>
              <p className="text-secondary small mb-0">
                Create, update, and manage classification tags for events across the platform
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{showAddForm ? 'Close Form' : 'Add Category'}</span>
            </button>
          </div>

          <div className="row g-4">
            {/* Left Admin Sidebar */}
            <div className="col-12 col-lg-3">
              <AdminSidebar currentPath="/admin/categories" />
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

              {/* Add Category Collapsible Form */}
              {showAddForm && (
                <div className="card border shadow-sm p-4 bg-white rounded-4 mb-4">
                  <h5 className="fw-bold text-dark mb-3">Add New Category</h5>
                  <form onSubmit={handleAddCategory}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. AI & Robotics"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-medium text-dark">
                          Description
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Brief explanation of events in this category..."
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                        />
                      </div>
                      <div className="col-12 text-end">
                        <button
                          type="button"
                          className="btn btn-light btn-sm me-2"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn btn-primary btn-sm px-4"
                        >
                          {submitting ? 'Saving...' : 'Save Category'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Toolbar: Search */}
              <div className="card border shadow-sm p-3 bg-white rounded-3 mb-4">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <FontAwesomeIcon icon={faSearch} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search category name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-6 text-md-end text-muted small">
                    Total: <strong className="text-dark">{filteredCategories.length}</strong>{' '}
                    categories in database
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="card border bg-white p-5 text-center rounded-4 shadow-sm mb-4">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading categories...</span>
                  </div>
                  <p className="text-muted small">Loading categories from database...</p>
                </div>
              )}

              {/* Categories Table */}
              {!loading && (
                <div className="card border shadow-sm overflow-hidden rounded-4 bg-white mb-4">
                  <div className="table-responsive">
                    <table className="table align-middle table-hover mb-0">
                      <thead className="table-light">
                        <tr className="text-secondary small">
                          <th scope="col" className="ps-4 py-3">
                            Category Name
                          </th>
                          <th scope="col" className="py-3">
                            Description
                          </th>
                          <th scope="col" className="py-3">
                            Assigned Events
                          </th>
                          <th scope="col" className="py-3 text-end pe-4">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((item) => (
                            <tr key={item.id}>
                              <td className="ps-4 py-3">
                                <div className="d-flex align-items-center gap-2">
                                  <FontAwesomeIcon icon={faLayerGroup} className="text-primary" />
                                  <span className="fw-semibold text-dark">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 text-secondary small" style={{ maxWidth: '300px' }}>
                                <div className="text-truncate">
                                  {item.description || 'No description provided.'}
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="badge bg-primary-subtle text-primary">
                                  {item.eventsCount !== undefined ? item.eventsCount : 0} events
                                </span>
                              </td>
                              <td className="py-3 text-end pe-4">
                                <div className="d-inline-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm px-2 py-1"
                                    onClick={() => setEditingCategory(item)}
                                    title="Edit Category"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm px-2 py-1"
                                    onClick={() => setCategoryToDelete(item)}
                                    title="Delete Category"
                                  >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-5 text-muted small">
                              No categories found matching your query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= EDIT MODAL ================= */}
        {editingCategory && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">Edit Category</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingCategory(null)}
                  />
                </div>
                <form onSubmit={handleEditCategorySubmit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-dark">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-dark">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editingCategory.description || ''}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, description: e.target.value })
                        }
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-top">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setEditingCategory(null)}
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

        {/* ================= DELETE CONFIRMATION MODAL ================= */}
        {categoryToDelete && (
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
                  <h5 className="fw-bold text-dark mb-2">Delete Category?</h5>
                  <p className="text-secondary small mb-4">
                    Are you sure you want to delete category <strong>"{categoryToDelete.name}"</strong>
                    ?
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-light px-4"
                      onClick={() => setCategoryToDelete(null)}
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
      </Layout>
    </ProtectedRoute>
  );
}
