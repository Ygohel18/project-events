import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faEye,
  faGem,
  faUsers,
  faCalendarCheck,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { useSettings } from '../context/SettingsContext';

// Screen 8: About Us Page
// Informational page showing mission, vision, values, and platform details
export default function AboutPage() {
  const { settings } = useSettings();
  const brandName = settings.brand_name || 'CampusEvents';

  return (
    <Layout title={`About ${brandName}`}>
      <div className="container py-4">
        {/* ================= HERO SECTION ================= */}
        <div className="card border shadow-sm p-4 p-md-5 mb-5 bg-white rounded-4 overflow-hidden">
          <div className="row align-items-center gy-4">
            <div className="col-12 col-lg-7">
              <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-1 rounded-pill">
                About {brandName}
              </span>
              <h1 className="display-6 fw-bold text-dark mb-3">
                Connecting People Through Events
              </h1>
              <p className="lead text-secondary mb-4 fs-6">
                {settings.description || `${brandName} is a modern platform designed to make event management simple, efficient, and accessible. We empower organizers to host successful gatherings and help participants discover, register, and be a part of unforgettable experiences.`}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/events" className="btn btn-primary px-4 py-2">
                  Explore Events
                </Link>
                <Link href="/contact" className="btn btn-outline-secondary px-4 py-2">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right Celebration Image matching REFERENCE.png */}
            <div className="col-12 col-lg-5">
              <div className="position-relative">
                <img
                  src="/images/about-hero.jpg"
                  alt="Event Community"
                  className="w-100 rounded-4 shadow-sm"
                  style={{ height: '280px', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3 PILLARS: MISSION, VISION, VALUES ================= */}
        <div className="mb-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark mb-1">Our Core Principles</h3>
            <p className="text-secondary small">What drives us every single day</p>
          </div>

          <div className="row g-4">
            {/* 1. Our Mission */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border card-hover p-4 text-center">
                <div
                  className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faBullseye} className="fs-4" />
                </div>
                <h5 className="fw-bold text-dark mb-2">Our Mission</h5>
                <p className="text-secondary small mb-0">
                  To make event management simpler, faster, and accessible for everyone, from college clubs to global conferences.
                </p>
              </div>
            </div>

            {/* 2. Our Vision */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border card-hover p-4 text-center">
                <div
                  className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faEye} className="fs-4" />
                </div>
                <h5 className="fw-bold text-dark mb-2">Our Vision</h5>
                <p className="text-secondary small mb-0">
                  To build a vibrant, tightly connected global community where knowledge, entertainment, and networking flourish.
                </p>
              </div>
            </div>

            {/* 3. Our Values */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border card-hover p-4 text-center">
                <div
                  className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <FontAwesomeIcon icon={faGem} className="fs-4" />
                </div>
                <h5 className="fw-bold text-dark mb-2">Our Values</h5>
                <p className="text-secondary small mb-0">
                  Innovation, Trust, Customer Focus, and delivering an enjoyable experience for both attendees and organizers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Numbers Section */}
        <div className="card border bg-light p-4 p-md-5 text-center mb-4">
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <h3 className="fw-bold text-primary mb-1">500+</h3>
              <span className="text-muted small">Events Hosted</span>
            </div>
            <div className="col-6 col-md-3">
              <h3 className="fw-bold text-primary mb-1">25,000+</h3>
              <span className="text-muted small">Active Attendees</span>
            </div>
            <div className="col-6 col-md-3">
              <h3 className="fw-bold text-primary mb-1">150+</h3>
              <span className="text-muted small">Expert Organizers</span>
            </div>
            <div className="col-6 col-md-3">
              <h3 className="fw-bold text-primary mb-1">99.8%</h3>
              <span className="text-muted small">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
