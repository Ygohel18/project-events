import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarPlus,
  faCloudUploadAlt,
  faCheckCircle,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faUsers,
  faTag,
  faSpinner,
  faFilePdf,
  faPlus,
  faTrash,
  faMap,
  faInfoCircle,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { eventAPI, categoryAPI } from '../services/api';

// Screen 10: Create Event Page (Organizer / Admin)
// Multi-field organizer form with real local file uploads (Multer) & PDF brochure support
export default function CreateEventPage() {
  const router = useRouter();

  // Form fields
  const [categories, setCategories] = useState([]);
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [status, setStatus] = useState('Published');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [registrationFee, setRegistrationFee] = useState('0');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Structured benefits and highlights
  const [benefits, setBenefits] = useState([
    { icon: 'faUsers', title: '', description: '' }
  ]);
  const [highlights, setHighlights] = useState([
    { title: '' }
  ]);

  // Media files
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);

  // Status flags
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddBenefit = () => {
    setBenefits([...benefits, { icon: 'faCheckCircle', title: '', description: '' }]);
  };

  const handleUpdateBenefit = (index, field, value) => {
    const updated = [...benefits];
    updated[index][field] = value;
    setBenefits(updated);
  };

  const handleRemoveBenefit = (index) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleAddHighlight = () => {
    setHighlights([...highlights, { title: '' }]);
  };

  const handleUpdateHighlight = (index, value) => {
    const updated = [...highlights];
    updated[index].title = value;
    setHighlights(updated);
  };

  const handleRemoveHighlight = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // Load live categories from MySQL
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await categoryAPI.getCategories();
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setCategories(response.data.data);
          if (response.data.data.length > 0) {
            setCategory(response.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Handle cover image selection with validation
  const handleImageChange = (e) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate extension and type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Invalid file: Only JPG, JPEG, PNG, or WEBP images are allowed.');
        return;
      }

      // Max size: 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size exceeds limit: Please select an image under 5 MB.');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle brochure PDF selection
  const handleBrochureChange = (e) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Invalid document: Brochures must be PDF files (.pdf).');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Document size exceeds limit: PDF brochure must be under 10 MB.');
        return;
      }

      setBrochureFile(file);
    }
  };

  // Handle form submit using FormData multipart
  const handleSubmit = async (e, chosenStatus = null) => {
    e.preventDefault();
    if (!eventName.trim() || !category || !date || !time || !location.trim()) {
      setErrorMsg('Please fill in all required event details.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', eventName.trim());
      formData.append('category_id', category);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('location', location.trim());
      formData.append('address', address.trim());
      formData.append('map_embed_url', mapEmbedUrl.trim());
      formData.append('description', description.trim() || 'No description provided.');
      formData.append('max_participants', maxParticipants || '100');
      formData.append('registration_fee', registrationFee || '0');
      formData.append('payment_required', parseFloat(registrationFee) > 0 ? (paymentRequired ? 'true' : 'false') : 'false');
      if (paymentInstructions.trim()) {
        formData.append('payment_instructions', paymentInstructions.trim());
      }
      formData.append('status', chosenStatus || status);
      formData.append('registration_open', registrationOpen ? 'true' : 'false');

      const filteredBenefits = benefits.filter(b => b.title && b.title.trim());
      formData.append('benefits', JSON.stringify(filteredBenefits));

      const filteredHighlights = highlights.filter(h => h.title && h.title.trim());
      formData.append('highlights', JSON.stringify(filteredHighlights));

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (brochureFile) {
        formData.append('brochure', brochureFile);
      }

      const response = await eventAPI.createEvent(formData);
      if (response.data?.success) {
        setSuccessMsg(true);
        setTimeout(() => {
          router.push('/events');
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to publish event. Please check inputs and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']}>
      <Layout>
        <div className="container py-4">
          {/* Page Title */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">
              <FontAwesomeIcon icon={faCalendarPlus} className="text-primary me-2" />
              Create New Event
            </h2>
            <p className="text-secondary small mb-0">
              Fill in the event details below to publish your event to the community
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              className="alert alert-danger d-flex align-items-center justify-content-between mb-4 shadow-sm"
              role="alert"
            >
              <span className="small fw-semibold">{errorMsg}</span>
              <button
                type="button"
                className="btn-close btn-close-sm"
                onClick={() => setErrorMsg('')}
              />
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div
              className="alert alert-success d-flex align-items-center gap-2 mb-4 shadow-sm"
              role="alert"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="fs-5" />
              <div>
                <strong>Event Published Successfully!</strong> Your event and uploaded files are saved in MySQL and
                visible to attendees. Redirecting to events...
              </div>
            </div>
          )}

          {/* Create Event Card & Form */}
          <div className="card border shadow-sm p-4 p-md-5 bg-white rounded-4 mb-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Left Column: Basic Information */}
                <div className="col-12 col-lg-7">
                  <h5 className="fw-bold text-dark mb-3">Event Information</h5>

                  {/* Event Title */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">
                      Event Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Annual Tech Symposium 2026"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Category Selection from Database */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-medium text-dark">
                        Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                        </span>
                        <input
                          type="date"
                          className="form-control border-start-0 ps-0"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-medium text-dark">
                        Time <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faClock} />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 ps-0"
                          placeholder="e.g. 10:00 AM - 04:00 PM"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">
                      Location / Venue <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="e.g. Campus Auditorium, Ahmedabad"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Detailed Venue Address */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">
                      Detailed Venue Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Auditorium A, Campus Center, 123 Tech Avenue"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Google Maps Embed URL */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">
                      Google Maps Embed URL or iframe
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">
                        <FontAwesomeIcon icon={faMap} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. https://www.google.com/maps/embed?pb=... or paste <iframe>"
                        value={mapEmbedUrl}
                        onChange={(e) => setMapEmbedUrl(e.target.value)}
                      />
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Paste Google Maps embed URL or the full embed &lt;iframe&gt; code. No API key needed.
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark">Event Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Write an engaging summary of your event, agenda, and requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Why You Should Attend Builder */}
                  <div className="mb-4 p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Why You Should Attend</h6>
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                          Attendee takeaways &amp; value propositions
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={handleAddBenefit}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {benefits.map((b, idx) => (
                      <div key={idx} className="card p-3 mb-2 border shadow-sm bg-white">
                        <div className="row g-2 align-items-center">
                          <div className="col-12 col-sm-4">
                            <select
                              className="form-select form-select-sm"
                              value={b.icon}
                              onChange={(e) => handleUpdateBenefit(idx, 'icon', e.target.value)}
                            >
                              <option value="faUsers">👥 Networking (faUsers)</option>
                              <option value="faCertificate">📜 Certificate (faCertificate)</option>
                              <option value="faAward">🏆 Trophy/Award (faAward)</option>
                              <option value="faGraduationCap">🎓 Learning (faGraduationCap)</option>
                              <option value="faLaptopCode">💻 Hands-on Code (faLaptopCode)</option>
                              <option value="faLightbulb">💡 Innovation (faLightbulb)</option>
                              <option value="faComments">💬 Discussion (faComments)</option>
                              <option value="faCoffee">☕ Food & Coffee (faCoffee)</option>
                              <option value="faCheckCircle">✓ Verified (faCheckCircle)</option>
                            </select>
                          </div>
                          <div className="col-12 col-sm-7">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Benefit title (e.g. Verified Certificate)"
                              value={b.title}
                              onChange={(e) => handleUpdateBenefit(idx, 'title', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-1 text-end">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRemoveBenefit(idx)}
                              title="Remove"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Short description (optional)"
                              value={b.description}
                              onChange={(e) => handleUpdateBenefit(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Event Highlights Builder */}
                  <div className="mb-3 p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Event Highlights</h6>
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                          Bullet points displayed on the event sidebar
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={handleAddHighlight}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Add Highlight</span>
                      </button>
                    </div>

                    {highlights.map((h, idx) => (
                      <div key={idx} className="input-group input-group-sm mb-2">
                        <span className="input-group-text bg-white text-success">✓</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Free swag bag for early birds"
                          value={h.title}
                          onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleRemoveHighlight(idx)}
                          title="Remove"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Attendance, Pricing & Local Media */}
                <div className="col-12 col-lg-5">
                  <h5 className="fw-bold text-dark mb-3">Capacity &amp; Publishing</h5>

                  {/* Visibility & Registration Controls */}
                  <div className="p-3 mb-3 border rounded-3 bg-light">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Visibility Status
                      </label>
                      <select
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="Published">Published (Public)</option>
                        <option value="Draft">Draft (Organizer/Admin only)</option>
                        <option value="Hidden">Hidden (Link only)</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="registrationOpenSwitch"
                        checked={registrationOpen}
                        onChange={(e) => setRegistrationOpen(e.target.checked)}
                      />
                      <label className="form-check-label small fw-semibold text-dark" htmlFor="registrationOpenSwitch">
                        Registration Open
                      </label>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      When turned off, users see "Registration Closed" and cannot sign up.
                    </span>
                  </div>

                  {/* Capacity & Price */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-medium text-dark">
                        Max Participants
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faUsers} />
                        </span>
                        <input
                          type="number"
                          min="1"
                          className="form-control border-start-0 ps-0"
                          placeholder="e.g. 150"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-medium text-dark">
                        Ticket Fee (₹)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control border-start-0 ps-0"
                          placeholder="0 for Free"
                          value={registrationFee}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRegistrationFee(val);
                            if (parseFloat(val) > 0) {
                              setPaymentRequired(true);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Offline Payment Settings (when fee > 0) */}
                  {parseFloat(registrationFee) > 0 && (
                    <div className="p-3 mb-3 border rounded-3 bg-light">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="paymentRequiredSwitch"
                          checked={paymentRequired}
                          onChange={(e) => setPaymentRequired(e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold text-dark" htmlFor="paymentRequiredSwitch">
                          Require Offline Payment Verification
                        </label>
                      </div>
                      <p className="text-muted extra-small mb-2" style={{ fontSize: '0.8rem' }}>
                        Attendees must submit a payment screenshot and transaction reference before receiving tickets.
                      </p>

                      <div className="mt-2">
                        <label className="form-label extra-small fw-semibold text-dark mb-1" style={{ fontSize: '0.82rem' }}>
                          Offline Payment Instructions
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          placeholder="e.g. Pay via UPI: college@upi or NEFT to Bank A/C 9876543210 IFSC SBIN0001234"
                          value={paymentInstructions}
                          onChange={(e) => setPaymentInstructions(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Real File Input for Event Image */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark d-block">
                      Event Cover Image (JPG, PNG, WEBP)
                    </label>
                    <div
                      className="border border-dashed rounded-3 p-3 text-center bg-light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('coverInput').click()}
                    >
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="display-6 text-primary mb-2" />
                      <p className="small text-dark fw-medium mb-1">
                        {imageFile ? imageFile.name : 'Click to select local image'}
                      </p>
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                        Max file size: 5MB
                      </span>
                      <input
                        id="coverInput"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="d-none"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  {/* Local Image Preview */}
                  {imagePreview && (
                    <div className="mb-3">
                      <label className="form-label small text-muted">Selected Banner Preview</label>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-3 w-100 border shadow-sm"
                        style={{ height: '140px', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Real File Input for Event Brochure (PDF) */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-dark d-block">
                      Event Brochure / Document (PDF, Optional)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-danger">
                        <FontAwesomeIcon icon={faFilePdf} />
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-control"
                        onChange={handleBrochureChange}
                      />
                    </div>
                    {brochureFile && (
                      <div className="small text-success mt-1">
                        ✓ Selected document: <strong>{brochureFile.name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Footer */}
                <div className="col-12 border-top pt-4 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                    onClick={(e) => handleSubmit(e, 'Draft')}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary px-5 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        <span>Publish Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
