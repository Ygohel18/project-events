import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faLocationDot, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons';
import { useSettings } from '../../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  const brandName = settings.brand_name || 'CampusEvents';
  const logoUrl = settings.logo
    ? (settings.logo.startsWith('http') ? settings.logo : `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001'}${settings.logo}`)
    : null;

  // Only keep social platforms that have a real URL provided
  const socialLinks = [
    { key: 'facebook', icon: faFacebook, url: settings.facebook, label: 'Facebook' },
    { key: 'instagram', icon: faInstagram, url: settings.instagram, label: 'Instagram' },
    { key: 'linkedin', icon: faLinkedin, url: settings.linkedin, label: 'LinkedIn' },
    { key: 'youtube', icon: faYoutube, url: settings.youtube, label: 'YouTube' },
    { key: 'twitter', icon: faXTwitter, url: settings.twitter, label: 'Twitter / X' }
  ].filter(s => s.url && s.url.trim() !== '' && s.url !== '#');

  return (
    <footer className="bg-white border-top mt-auto pt-5 pb-4">
      <div className="container">
        <div className="row gy-4 gx-lg-5 justify-content-between">
          {/* Brand info */}
          <div className="col-12 col-md-5">
            <Link href="/" className="d-inline-flex align-items-center gap-2 text-decoration-none fs-4 fw-bold text-dark mb-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  style={{ maxHeight: '36px', maxWidth: '140px', objectFit: 'contain' }}
                  className="rounded"
                />
              ) : (
                <FontAwesomeIcon icon={faCalendarCheck} className="text-primary" />
              )}
              <span>{brandName}</span>
            </Link>
            
            <p className="text-muted small mb-3 lh-base" style={{ maxWidth: '420px' }}>
              {settings.footer_description || settings.description || 'Discover upcoming events, manage your registrations, and stay connected with campus activities.'}
            </p>

            {/* Configured Social Media Links Only */}
            {socialLinks.length > 0 && (
              <div className="d-flex gap-3 text-secondary pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary text-hover-primary"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <FontAwesomeIcon icon={social.icon} className="fs-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Useful Links */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold mb-3 text-dark text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Useful Links
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li>
                <Link href="/events" className="text-secondary text-decoration-none">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-secondary text-decoration-none">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary text-decoration-none">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="col-12 col-md-4">
            <h6 className="fw-bold mb-3 text-dark text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Contact Information
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-secondary">
              {settings.address && (
                <li className="d-flex align-items-start gap-2">
                  <FontAwesomeIcon icon={faLocationDot} className="text-primary mt-1 flex-shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings.email && (
                <li className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="text-primary flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-secondary text-decoration-none">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-primary flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="text-secondary text-decoration-none">
                    {settings.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <hr className="my-4 text-muted opacity-25" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary gap-2">
          <span>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </span>
          {settings.tagline && (
            <span className="text-muted fst-italic">
              {settings.tagline}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
