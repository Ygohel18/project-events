import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCamera,
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import ProfileSidebar from '../components/dashboard/ProfileSidebar';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { getMediaUrl } from '../utils/media';

// Screen 7: Profile / My Account Page
// Connected with MariaDB backend via userAPI with real local avatar uploads
export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    profile_image: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize and load fresh profile from backend
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'user',
        profile_image: user.profile_image || ''
      });
    }

    async function fetchFreshProfile() {
      try {
        const response = await userAPI.getProfile();
        if (response.data?.success && response.data?.data) {
          const profile = response.data.data;
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            role: profile.role || 'user',
            profile_image: profile.profile_image || ''
          });
          updateUser(profile);
        }
      } catch (err) {
        console.error('Error fetching live profile:', err);
      }
    }

    fetchFreshProfile();
  }, [user?.id]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Only JPG, JPEG, PNG, or WEBP image files are allowed for avatars.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Avatar file size must be less than 2 MB.');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile update submit using FormData
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);

      if (avatarFile) {
        payload.append('profile_image', avatarFile);
      }

      const response = await userAPI.updateProfile(payload);

      if (response.data?.success) {
        setSuccessMsg('Profile updated successfully in database!');
        updateUser(response.data.data);
        setAvatarFile(null);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const currentAvatarUrl =
    avatarPreview || getMediaUrl(formData.profile_image, 'profile', formData.email || user?.email);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container py-4">
          {/* Page Title */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">Account Settings</h2>
            <p className="text-secondary small mb-0">
              Manage your personal profile details and preferences
            </p>
          </div>

          <div className="row g-4">
            {/* Left Sidebar */}
            <div className="col-12 col-md-4 col-lg-3">
              <ProfileSidebar />
            </div>

            {/* Right Main Form Section */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="card border shadow-sm p-4 p-md-5 bg-white rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <h4 className="fw-bold text-dark mb-0">My Profile</h4>
                  <span className="badge bg-light text-primary border text-capitalize">
                    {formData.role} Account
                  </span>
                </div>

                {/* Feedback Notifications */}
                {errorMsg && (
                  <div className="alert alert-danger py-2 small mb-4" role="alert">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div
                    className="alert alert-success d-flex align-items-center gap-2 small py-2 mb-4"
                    role="alert"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Photo Avatar Preview & Local Upload */}
                <div className="d-flex align-items-center gap-4 mb-4 pb-3 border-bottom">
                  <div className="position-relative">
                    <img
                      src={currentAvatarUrl}
                      alt={formData.name || 'User'}
                      className="rounded-circle border border-primary border-2 shadow-sm"
                      style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">{formData.name}</h6>
                    <p className="text-muted small mb-2 text-capitalize">
                      {formData.role} • {formData.email}
                    </p>
                    <label
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2 m-0"
                      style={{ cursor: 'pointer' }}
                    >
                      <FontAwesomeIcon icon={faCamera} />
                      <span>{avatarFile ? 'Change Selected Photo' : 'Upload Avatar'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="d-none"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    {avatarFile && (
                      <span className="small text-success d-block mt-1">
                        ✓ Selected: {avatarFile.name} (Click Save Changes below)
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleUpdate}>
                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-dark">Full Name *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                          type="text"
                          name="name"
                          className="form-control border-start-0 ps-0"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Email (Readonly) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-dark">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input
                          type="email"
                          className="form-control border-start-0 ps-0 bg-light"
                          value={formData.email}
                          readOnly
                          disabled
                        />
                      </div>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Email cannot be changed directly
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-dark">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faPhone} />
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          className="form-control border-start-0 ps-0"
                          placeholder="e.g. +91 98765 43210"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* City / Address */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-dark">City / Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </span>
                        <input
                          type="text"
                          name="address"
                          className="form-control border-start-0 ps-0"
                          placeholder="e.g. Ahmedabad, Gujarat"
                          value={formData.address}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-12 text-end mt-4 pt-3 border-top">
                      <button
                        type="submit"
                        className="btn btn-primary px-4 d-inline-flex align-items-center gap-2"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
