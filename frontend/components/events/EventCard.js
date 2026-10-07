import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { getMediaUrl } from '../../utils/media';

// Reusable Event Card Component matching REFERENCE.png
export default function EventCard({ event }) {
  const isFree = Number(event.price) === 0;

  return (
    <div className="card h-100 border card-hover overflow-hidden">
      {/* Event Image */}
      <div className="position-relative" style={{ height: '175px' }}>
        <img
          src={getMediaUrl(event.image)}
          alt={event.title}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
        />
        {/* Category Pill Tag */}
        <span
          className="position-absolute top-0 start-0 m-2 badge bg-primary text-white"
          style={{ fontSize: '0.75rem', fontWeight: '500' }}
        >
          {event.category}
        </span>
        {/* Price Tag */}
        <span
          className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white"
          style={{ fontSize: '0.75rem', fontWeight: '500' }}
        >
          {isFree ? 'Free' : `₹ ${event.price}`}
        </span>
      </div>

      {/* Card Content */}
      <div className="card-body p-3 d-flex flex-column">
        {/* Date and Time */}
        <div className="d-flex align-items-center text-secondary small mb-1">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" style={{ fontSize: '0.85rem' }} />
          <span>{event.date} • {event.time}</span>
        </div>

        {/* Event Title */}
        <h6 className="card-title fw-bold text-dark mb-2 text-truncate" title={event.title}>
          {event.title}
        </h6>

        {/* Location / Venue */}
        <div className="d-flex align-items-center text-muted small mb-3">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-2" style={{ fontSize: '0.85rem' }} />
          <span className="text-truncate">{event.location}</span>
        </div>

        {/* Card Footer Action */}
        <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-end">
          <Link
            href={`/events/${event.id}`}
            className="btn btn-primary btn-sm px-3 fw-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
