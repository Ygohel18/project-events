import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faPaperPlane,
  faCheckCircle,
  faUser,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons';
import Layout from '../components/layout/Layout';
import { contactAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';

// Screen 9: Contact Us Page
// Two-column layout with contact details on the left and form on the right
export default function ContactPage() {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const socialLinks = [
    { key: 'facebook', icon: faFacebook, url: settings.facebook, label: 'Facebook' },
    { key: 'instagram', icon: faInstagram, url: settings.instagram, label: 'Instagram' },
    { key: 'linkedin', icon: faLinkedin, url: settings.linkedin, label: 'LinkedIn' },
    { key: 'youtube', icon: faYoutube, url: settings.youtube, label: 'YouTube' },
    { key: 'twitter', icon: faXTwitter, url: settings.twitter, label: 'Twitter / X' }
  ].filter(s => s.url && s.url.trim() !== '' && s.url !== '#');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill out all required fields before submitting.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await contactAPI.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject ? formData.subject.trim() : 'General Inquiry',
        message: formData.message.trim()
      });

      if (res.data?.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Contact Support">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card border shadow-sm rounded-4 overflow-hidden">
              <div className="row g-0">
                {/* Left Side: Contact Information */}
                <div
                  className="col-12 col-md-5 p-4 p-md-5 d-flex flex-column justify-content-between text-white"
                  style={{ backgroundColor: '#123B70' }}
                >
                  <div>
                    <h3 className="fw-bold mb-2">Get in Touch</h3>
                    <p className="text-white-50 small mb-4">
                      We would love to hear from you! Feel free to reach out for any queries, support, or feedback.
                    </p>

                    <div className="d-flex flex-column gap-3 mb-4">
                      {settings.address && (
                        <div className="d-flex align-items-start gap-3">
                          <div className="rounded-circle bg-white bg-opacity-10 p-2 text-white">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                          </div>
                          <div>
                            <div className="text-white-50 small">Address</div>
                            <div className="fw-medium small">{settings.address}</div>
                          </div>
                        </div>
                      )}

                      {settings.email && (
                        <div className="d-flex align-items-start gap-3">
                          <div className="rounded-circle bg-white bg-opacity-10 p-2 text-white">
                            <FontAwesomeIcon icon={faEnvelope} />
                          </div>
                          <div>
                            <div className="text-white-50 small">Email</div>
                            <div className="fw-medium small">{settings.email}</div>
                          </div>
                        </div>
                      )}

                      {settings.phone && (
                        <div className="d-flex align-items-start gap-3">
                          <div className="rounded-circle bg-white bg-opacity-10 p-2 text-white">
                            <FontAwesomeIcon icon={faPhone} />
                          </div>
                          <div>
                            <div className="text-white-50 small">Phone</div>
                            <div className="fw-medium small">{settings.phone}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Media Links */}
                  {socialLinks.length > 0 && (
                    <div>
                      <div className="text-white-50 small mb-2">Connect with us:</div>
                      <div className="d-flex gap-3">
                        {socialLinks.map((social) => (
                          <a
                            key={social.key}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white opacity-75 hover-opacity-100 fs-5"
                            aria-label={social.label}
                            title={social.label}
                          >
                            <FontAwesomeIcon icon={social.icon} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Contact Form */}
                <div className="col-12 col-md-7 p-4 p-md-5 bg-white">
                  <h4 className="fw-bold text-dark mb-1">Send a Message</h4>
                  <p className="text-muted small mb-4">Our support team usually responds within 24 hours.</p>

                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center justify-content-between small py-2 mb-4" role="alert">
                      <span>{errorMsg}</span>
                      <button
                        type="button"
                        className="btn-close btn-close-sm"
                        onClick={() => setErrorMsg('')}
                      />
                    </div>
                  )}

                  {submitted && (
                    <div className="alert alert-success d-flex align-items-center gap-2 small py-2 mb-4" role="alert">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Thank you! Your message has been sent successfully.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-dark">Your Name</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 ps-0"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-dark">Your Email</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input
                          type="email"
                          className="form-control border-start-0 ps-0"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-4">
                      <label className="form-label small fw-medium text-dark">Your Message</label>
                      <textarea
                        rows="4"
                        className="form-control"
                        placeholder="Write your message here..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    >
                      {loading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
