import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faUsers,
  faCalendarAlt,
  faTags,
  faTicketAlt,
  faBell,
  faGear,
  faArrowLeft,
  faMoneyBillWave,
  faQrcode
} from '@fortawesome/free-solid-svg-icons';

// Reusable Admin Navigation Sidebar with active path highlighting
export default function AdminSidebar({ currentPath }) {
  const router = useRouter();
  const path = currentPath || router.pathname;

  return (
    <div className="dashboard-sidebar">
      {/* Admin Portal Header */}
      <div className="px-3 py-2 border-bottom mb-3">
        <h6 className="fw-bold text-dark mb-0">Admin Portal</h6>
        <span className="badge bg-primary-subtle text-primary mt-1" style={{ fontSize: '0.72rem' }}>
          Management Console
        </span>
      </div>

      {/* Admin Navigation Links */}
      <nav className="d-flex flex-column gap-1">
        {/* 1. Dashboard Overview */}
        <Link
          href="/admin"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faChartPie} />
          <span>Dashboard</span>
        </Link>

        {/* 2. Users Management */}
        <Link
          href="/admin/users"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/users' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Users</span>
        </Link>

        {/* 3. Events Management */}
        <Link
          href="/admin/events"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/events' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Events</span>
        </Link>

        {/* 4. Categories Management */}
        <Link
          href="/admin/categories"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/categories' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faTags} />
          <span>Categories</span>
        </Link>

        {/* 5. Registrations Management */}
        <Link
          href="/admin/registrations"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/registrations' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faTicketAlt} />
          <span>Registrations</span>
        </Link>

        {/* 6. Offline Payments Verification */}
        <Link
          href="/admin/payments"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/payments' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faMoneyBillWave} />
          <span>Payments</span>
        </Link>

        {/* 7. Attendance Tracking */}
        <Link
          href="/admin/attendance"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/attendance' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Attendance</span>
        </Link>

        {/* 8. QR Scanner */}
        <Link
          href="/scan-ticket"
          className={`sidebar-nav-link text-decoration-none ${path === '/scan-ticket' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faQrcode} />
          <span>QR Scanner</span>
        </Link>

        {/* 9. Reports & Analytics */}
        <Link
          href="/admin/reports"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/reports' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faChartPie} />
          <span>Reports & CSV</span>
        </Link>

        {/* 8. Notifications */}
        <Link
          href="/notifications"
          className={`sidebar-nav-link text-decoration-none ${path === '/notifications' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faBell} />
          <span>Notifications</span>
        </Link>

        {/* 9. Platform Settings */}
        <Link
          href="/admin/settings"
          className={`sidebar-nav-link text-decoration-none ${path === '/admin/settings' ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faGear} />
          <span>Settings</span>
        </Link>

        {/* Back to Public View */}
        <hr className="my-2 border-secondary-subtle" />
        <Link
          href="/"
          className="sidebar-nav-link text-secondary text-decoration-none"
          style={{ fontSize: '0.85rem' }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Exit to Site</span>
        </Link>
      </nav>
    </div>
  );
}
