import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear,
  faSave,
  faCheckCircle,
  faEnvelope,
  faPhone,
  faSlidersH,
  faImage,
  faGlobe,
  faLocationDot,
  faShareNodes,
  faSpinner,
  faBuilding,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { settingsAPI } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { getMediaUrl } from '../../utils/media';

export default function AdminSettingsPage() {
  const { reloadSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    brand_name: '',
    tagline: '',
    description: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    footer_description: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    twitter: '',
    logo: '',
    favicon: '',
    publicRegistrationsOpen: true,
    emailNotifications: true,
    maintenanceMode: false
  });

  // Selected files for uploads
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');

  // Fetch settings from server
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getAdminSettings();
      if (res.data?.success && res.data.data) {
        const s = res.data.data;
        setFormData((prev) => ({
          ...prev,
          brand_name: s.brand_name || '',
          tagline: s.tagline || '',
          description: s.description || '',
          address: s.address || '',
          email: s.email || '',
          phone: s.phone || '',
          website: s.website || '',
          footer_description: s.footer_description || '',
          facebook: s.facebook || '',
          instagram: s.instagram || '',
          linkedin: s.linkedin || '',
          youtube: s.youtube || '',
          twitter: s.twitter || '',
          logo: s.logo || '',
          favicon: s.favicon || '',
          publicRegistrationsOpen: s.publicRegistrationsOpen !== false,
          emailNotifications: s.emailNotifications !== false,
          maintenanceMode: !!s.maintenanceMode
        }));

        if (s.logo) {
          setLogoPreview(s.logo.startsWith('http') ? s.logo : `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001'}${s.logo}`);
        }
        if (s.favicon) {
          setFaviconPreview(s.favicon.startsWith('http') ? s.favicon : `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001'}${s.favicon}`);
        }
      }
    } catch (err) {
      console.error('Failed to load admin settings:', err);
      setErrorMsg('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'logo' && key !== 'favicon') {
          data.append(key, formData[key]);
        }
      });

      if (logoFile) {
        data.append('logo', logoFile);
      }
      if (faviconFile) {
        data.append('favicon', faviconFile);
      }

      const res = await settingsAPI.updateSettings(data);
      if (res.data?.success) {
        setSuccessMsg('Website and brand settings updated successfully!');
        await reloadSettings();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.data?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'brand', label: 'Brand Identity', icon: faImage },
    { id: 'contact', label: 'Contact & Location', icon: faBuilding },
    { id: 'social', label: 'Social Media', icon: faShareNodes },
    { id: 'toggles', label: 'Preferences & Toggles', icon: faSlidersH }
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout title="Platform & Brand Settings">
        <div className="container py-4">
          {/* Admin Header */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">
              <FontAwesomeIcon icon={faGear} className="text-primary me-2" />
              Website & Brand Settings
            </h2>
            <p className="text-secondary small mb-0">
              Configure system-wide branding, logos, contact information, social links, and platform defaults
            </p>
          </div>

          <div className="row g-4">
            {/* Left Admin Sidebar */}
            <div className="col-12 col-lg-3">
              <AdminSidebar currentPath="/admin/settings" />
            </div>

            {/* Right Main Settings Form Area */}
            <div className="col-12 col-lg-9">
              {/* Feedback Alerts */}
              {successMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4 rounded-3 shadow-sm" role="alert">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-3 shadow-sm" role="alert">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="bg-white p-2 rounded-4 border shadow-sm mb-4">
                <ul className="nav nav-pills nav-fill gap-1" role="tablist">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <li key={tab.id} className="nav-item" role="presentation">
                        <button
                          type="button"
                          className={`nav-link py-2 px-3 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2 transition-all ${
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-secondary bg-transparent'
                          }`}
                          style={{
                            color: isActive ? '#FFFFFF' : '#475569',
                            backgroundColor: isActive ? '#2563EB' : 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <FontAwesomeIcon
                            icon={tab.icon}
                            style={{ color: isActive ? '#FFFFFF' : '#64748B' }}
                          />
                          <span>{tab.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {loading ? (
                <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-primary fs-3 mb-2" />
                  <p className="text-muted small mb-0">Loading brand settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="card border shadow-sm p-4 bg-white rounded-4 mb-4">
                    {/* Tab 1: Brand Identity */}
                    {activeTab === 'brand' && (
                      <div>
                        <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                          Brand Identity &amp; Logos
                        </h5>

                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Brand Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="brand_name"
                              value={formData.brand_name}
                              onChange={handleChange}
                              placeholder="e.g. CampusEvents"
                              required
                            />
                            <div className="form-text">Displayed on header, footer, tickets, and emails.</div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Tagline</label>
                            <input
                              type="text"
                              className="form-control"
                              name="tagline"
                              value={formData.tagline}
                              onChange={handleChange}
                              placeholder="e.g. Discover, Join & Experience College Events"
                            />
                            <div className="form-text">Short slogan shown on browser tab and footer.</div>
                          </div>

                          <div className="col-12">
                            <label className="form-label small fw-semibold text-dark">Brand Description</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              placeholder="Brief description of the platform for meta tags and about pages."
                            />
                          </div>

                          <div className="col-12">
                            <label className="form-label small fw-semibold text-dark">Footer Short Description</label>
                            <textarea
                              className="form-control"
                              rows="2"
                              name="footer_description"
                              value={formData.footer_description}
                              onChange={handleChange}
                              placeholder="Summary displayed at the bottom of every page."
                            />
                          </div>

                          {/* Brand Logo Upload */}
                          <div className="col-12 col-md-6 mt-4">
                            <label className="form-label small fw-semibold text-dark">Brand Logo</label>
                            <div className="d-flex align-items-center gap-3">
                              {logoPreview && (
                                <img
                                  src={logoPreview}
                                  alt="Logo Preview"
                                  className="border rounded p-1 bg-light"
                                  style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
                                />
                              )}
                              <input
                                type="file"
                                className="form-control"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={handleLogoChange}
                              />
                            </div>
                            <div className="form-text">Recommended: PNG/SVG transparent background, max 2MB.</div>
                          </div>

                          {/* Favicon Upload */}
                          <div className="col-12 col-md-6 mt-4">
                            <label className="form-label small fw-semibold text-dark">Browser Favicon</label>
                            <div className="d-flex align-items-center gap-3">
                              {faviconPreview && (
                                <img
                                  src={faviconPreview}
                                  alt="Favicon Preview"
                                  className="border rounded p-1 bg-light"
                                  style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                                />
                              )}
                              <input
                                type="file"
                                className="form-control"
                                accept="image/x-icon,image/png,image/svg+xml"
                                onChange={handleFaviconChange}
                              />
                            </div>
                            <div className="form-text">Square icon (32x32 or 64x64) for browser tabs.</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Contact & Location */}
                    {activeTab === 'contact' && (
                      <div>
                        <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                          Contact Information &amp; Address
                        </h5>

                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Contact Email</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faEnvelope} />
                              </span>
                              <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contact@example.com"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Phone Number</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faPhone} />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Website URL</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faGlobe} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://campusevents.edu"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Physical Address</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faLocationDot} />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Campus Center, Block 4"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Social Media */}
                    {activeTab === 'social' && (
                      <div>
                        <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                          Social Media Profiles
                        </h5>
                        <p className="text-muted small mb-3">
                          Leave empty to hide the respective social icon in the website footer.
                        </p>

                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Facebook</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faFacebook} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="facebook"
                                value={formData.facebook}
                                onChange={handleChange}
                                placeholder="https://facebook.com/yourpage"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Instagram</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faInstagram} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                placeholder="https://instagram.com/yourprofile"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">LinkedIn</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faLinkedin} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="linkedin"
                                value={formData.linkedin}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/company/yourpage"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Twitter / X</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faXTwitter} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="twitter"
                                value={formData.twitter}
                                onChange={handleChange}
                                placeholder="https://x.com/yourhandle"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">YouTube</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted">
                                <FontAwesomeIcon icon={faYoutube} />
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="youtube"
                                value={formData.youtube}
                                onChange={handleChange}
                                placeholder="https://youtube.com/@channel"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Preferences & Toggles */}
                    {activeTab === 'toggles' && (
                      <div>
                        <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                          Platform Features &amp; Controls
                        </h5>

                        <div className="form-check form-switch mb-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="regSwitch"
                            name="publicRegistrationsOpen"
                            checked={formData.publicRegistrationsOpen}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="regSwitch">
                            Allow Public Registrations for Events
                          </label>
                          <span className="d-block text-muted small">
                            When enabled, visitors can freely register for open events.
                          </span>
                        </div>

                        <div className="form-check form-switch mb-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="notifySwitch"
                            name="emailNotifications"
                            checked={formData.emailNotifications}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="notifySwitch">
                            Send Automated Notification Emails
                          </label>
                          <span className="d-block text-muted small">
                            Sends confirmation receipts and ticket updates to attendees.
                          </span>
                        </div>

                        <div className="form-check form-switch mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="maintSwitch"
                            name="maintenanceMode"
                            checked={formData.maintenanceMode}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold text-danger" htmlFor="maintSwitch">
                            Maintenance Mode
                          </label>
                          <span className="d-block text-muted small">
                            Restrict normal operations while performing maintenance tasks.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 fw-semibold"
                        disabled={saving}
                      >
                        <FontAwesomeIcon icon={saving ? faSpinner : faSave} spin={saving} />
                        <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
