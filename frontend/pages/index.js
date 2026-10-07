import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faArrowRight, faFire, faCompass } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import EventCard from '../components/events/EventCard';
import { eventAPI } from '../services/api';

// Screen 1: Home Page
// Displays hero section with search bar and live upcoming events from MariaDB
export default function HomePage() {
  const router = useRouter();
  // State for search input
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load live events from backend
  useEffect(() => {
    async function fetchUpcomingEvents() {
      try {
        setLoading(true);
        const response = await eventAPI.getEvents();
        if (response.data?.success && Array.isArray(response.data?.data)) {
          // Select top 4 events for upcoming events section
          setUpcomingEvents(response.data.data.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUpcomingEvents();
  }, []);

  // Handle hero search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/events');
    }
  };

  return (
    <Layout>
      <div className="container py-4">
        {/* ================= HERO SECTION ================= */}
        <section className="hero-section text-center position-relative shadow-sm">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <span className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-semibold">
                <FontAwesomeIcon icon={faFire} className="me-1" />
                Explore Live Experiences
              </span>
              <h1 className="display-5 fw-bold mb-3 text-white">
                Discover Amazing Events Near You
              </h1>
              <p className="lead text-white-50 mb-4 px-md-5">
                Find, register and be a part of exciting events around you. Workshops, concerts, conferences, and more.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="hero-search-bar d-flex align-items-center mx-auto" style={{ maxWidth: '650px' }}>
                <FontAwesomeIcon icon={faCompass} className="text-muted me-2 ms-2 fs-5" />
                <input
                  type="text"
                  className="form-control border-0 shadow-none bg-transparent py-2"
                  placeholder="Search events, categories, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-primary rounded-pill px-4 ms-2 d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faSearch} />
                  <span className="d-none d-sm-inline">Search</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ================= UPCOMING EVENTS SECTION ================= */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1">Upcoming Events</h3>
              <p className="text-secondary small mb-0">Handpicked trending events happening soon</p>
            </div>
            <Link href="/events" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 px-3">
              <span>View All</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Loading events...</span>
              </div>
              <p className="text-muted small">Loading live events from database...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && upcomingEvents.length === 0 && (
            <div className="card border bg-white p-5 text-center rounded-4 shadow-sm">
              <h5 className="fw-bold text-dark mb-1">No Upcoming Events Found</h5>
              <p className="text-secondary small mb-3">Be the first to create and publish a new event!</p>
              <div>
                <Link href="/create-event" className="btn btn-primary btn-sm px-4">
                  Create Event
                </Link>
              </div>
            </div>
          )}

          {/* 4-column responsive grid with real MariaDB data */}
          {!loading && upcomingEvents.length > 0 && (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="col">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Explore Banner */}
        <section className="bg-white border rounded-4 p-4 p-md-5 text-center shadow-sm mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8 text-lg-start mb-3 mb-lg-0">
              <h4 className="fw-bold text-dark mb-2">Are you an Event Organizer?</h4>
              <p className="text-secondary mb-0">
                Create and publish your event in minutes. Manage attendees, track registrations, and sell tickets effortlessly.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/create-event" className="btn btn-primary px-4 py-2">
                Host an Event Today
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
