import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faSlidersH,
  faCalendarAlt,
  faMapMarkerAlt,
  faGraduationCap,
  faTheaterMasks,
  faRunning,
  faBriefcase,
  faLaptopCode,
  faUsers,
  faMusic,
  faHeart
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import EventCard from '../../components/events/EventCard';
import { eventAPI, categoryAPI } from '../../services/api';

// Screen 4: Events Listing Page
// Two-column layout with left category sidebar and responsive event grid connected to live MySQL backend
export default function EventsListingPage() {
  const router = useRouter();

  // 1. State for events, categories, and filters
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'tomorrow', 'upcoming'
  const [sortBy, setSortBy] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  // Load live categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await categoryAPI.getCategories();
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Sync query parameters on load (e.g. ?search=music or ?category=Cultural)
  useEffect(() => {
    if (router.query.search) {
      setSearchQuery(router.query.search);
    }
    if (router.query.category) {
      setSelectedCategory(router.query.category);
    }
    if (router.query.location) {
      setLocationQuery(router.query.location);
    }
    if (router.query.date_filter) {
      setDateFilter(router.query.date_filter);
    }
  }, [router.query]);

  // Fetch live events whenever search, category, location, or date filter changes
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const params = {};
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        if (locationQuery.trim()) {
          params.location = locationQuery.trim();
        }
        if (dateFilter && dateFilter !== 'all') {
          params.date_filter = dateFilter;
        }

        const response = await eventAPI.getEvents(params);
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setEvents(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching live events:', err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search slightly for smooth user typing
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, locationQuery, dateFilter]);

  // Category Icon Mapper helper
  const getCategoryIcon = (categoryName) => {
    switch (categoryName) {
      case 'Educational': return faGraduationCap;
      case 'Cultural': return faTheaterMasks;
      case 'Sports': return faRunning;
      case 'Business': return faBriefcase;
      case 'Workshops': return faLaptopCode;
      case 'Conferences': return faUsers;
      case 'Entertainment': return faMusic;
      case 'Social': return faHeart;
      default: return faCalendarAlt;
    }
  };

  // Sort events
  const sortedEvents = [...events].sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    return b.id - a.id; // default upcoming / newest
  });

  return (
    <Layout>
      <div className="container py-4">
        {/* Page Title & Breadcrumb */}
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">Discover Events</h2>
          <p className="text-secondary small mb-0">Browse through live events, workshops, and meetups</p>
        </div>

        <div className="row g-4">
          {/* ================= LEFT SIDEBAR: CATEGORIES & DATE FILTERS ================= */}
          <div className="col-12 col-lg-3">
            <div className="card border shadow-sm p-3 sticky-top" style={{ top: '80px', zIndex: 10 }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h6 className="fw-bold text-dark mb-0">
                  <FontAwesomeIcon icon={faSlidersH} className="text-primary me-2" />
                  Categories
                </h6>
                {selectedCategory !== 'All' && (
                  <button
                    className="btn btn-link btn-sm text-decoration-none p-0 text-primary small"
                    onClick={() => setSelectedCategory('All')}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Pills List */}
              <div className="d-flex flex-column gap-1 mb-4">
                <button
                  type="button"
                  className={`category-item border-0 bg-transparent text-start w-100 ${
                    selectedCategory === 'All' ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory('All')}
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className={selectedCategory === 'All' ? 'text-primary' : 'text-secondary'}
                    style={{ width: '18px' }}
                  />
                  <span>All Events</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    className={`category-item border-0 bg-transparent text-start w-100 d-flex justify-content-between align-items-center ${
                      selectedCategory === cat.name ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <FontAwesomeIcon
                        icon={getCategoryIcon(cat.name)}
                        className={selectedCategory === cat.name ? 'text-primary' : 'text-secondary'}
                        style={{ width: '18px' }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    {cat.eventsCount !== undefined && (
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                        {cat.eventsCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Date Filter Section */}
              <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                <h6 className="fw-bold text-dark mb-0">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                  When
                </h6>
                {dateFilter !== 'all' && (
                  <button
                    className="btn btn-link btn-sm text-decoration-none p-0 text-primary small"
                    onClick={() => setDateFilter('all')}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="d-flex flex-column gap-1">
                {[
                  { id: 'all', label: 'Any Date' },
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'upcoming', label: 'Upcoming' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`category-item border-0 bg-transparent text-start w-100 ${
                      dateFilter === item.id ? 'active' : ''
                    }`}
                    onClick={() => setDateFilter(item.id)}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT MAIN CONTENT: SEARCH & EVENT GRID ================= */}
          <div className="col-12 col-lg-9">
            {/* Top Toolbar: Search, Location & Sort */}
            <div className="card border shadow-sm p-3 mb-4">
              <div className="row g-2 align-items-center">
                {/* Search Bar */}
                <div className="col-12 col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-secondary">
                      <FontAwesomeIcon icon={faSearch} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search event name, topic..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary border-start-0"
                        type="button"
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="col-12 col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-secondary">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Filter by city/venue..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                    {locationQuery && (
                      <button
                        className="btn btn-outline-secondary border-start-0"
                        type="button"
                        onClick={() => setLocationQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort Option */}
                <div className="col-12 col-md-3">
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Results status */}
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small text-secondary">
                <span>
                  Showing <strong className="text-dark">{sortedEvents.length}</strong> events
                  {selectedCategory !== 'All' && <span> in <strong>{selectedCategory}</strong></span>}
                  {dateFilter !== 'all' && <span> ({dateFilter})</span>}
                </span>
                {(searchQuery || locationQuery) && (
                  <span>
                    {searchQuery && <>Keyword: &quot;{searchQuery}&quot; </>}
                    {locationQuery && <>Location: &quot;{locationQuery}&quot;</>}
                  </span>
                )}
              </div>
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

            {/* Event Cards Grid */}
            {!loading && sortedEvents.length > 0 && (
              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                {sortedEvents.map((event) => (
                  <div key={event.id} className="col">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && sortedEvents.length === 0 && (
              <div className="card border text-center p-5 bg-white shadow-sm rounded-4">
                <div className="py-4">
                  <FontAwesomeIcon icon={faSearch} className="display-4 text-muted mb-3" />
                  <h5 className="fw-bold text-dark">No Events Found</h5>
                  <p className="text-secondary small mb-3">
                    We could not find any events matching your criteria. Try adjusting your category or search keywords.
                  </p>
                  <button
                    className="btn btn-primary btn-sm px-4"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
