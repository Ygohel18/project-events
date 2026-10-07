import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardUser,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faClock,
  faQrcode
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import ExportDropdown from '../../components/common/ExportDropdown';
import { eventAPI, attendanceAPI, exportAPI } from '../../services/api';

export default function AttendancePage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // 1. Load events list for selector
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const res = await eventAPI.getEvents({ includeDrafts: true });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setEvents(res.data.data);

          // If query param ?eventId=... provided or pick first event
          if (router.query.eventId) {
            setSelectedEventId(String(router.query.eventId));
          } else if (res.data.data.length > 0) {
            setSelectedEventId(String(res.data.data[0].id));
          }
        }
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [router.query.eventId]);

  // 2. Fetch attendance whenever selected event changes
  useEffect(() => {
    if (!selectedEventId) return;

    async function loadAttendance() {
      try {
        setLoadingAttendance(true);
        const res = await attendanceAPI.getEventAttendance(selectedEventId);
        if (res.data?.success) {
          setAttendanceData(res.data);
        }
      } catch (err) {
        console.error('Error loading attendance:', err);
        setAttendanceData(null);
      } finally {
        setLoadingAttendance(false);
      }
    }

    loadAttendance();
  }, [selectedEventId]);

  // 3. Mark Present or Absent
  const handleMarkAttendance = async (registrationId, newStatus) => {
    try {
      const res = await attendanceAPI.updateAttendance(registrationId, newStatus);
      if (res.data?.success) {
        setToastMsg(`Participant marked as ${newStatus}!`);
        setTimeout(() => setToastMsg(''), 3000);

        // Update local state smoothly
        setAttendanceData((prev) => {
          if (!prev) return prev;
          const updatedList = prev.data.map((item) => {
            if (item.registration_id === registrationId) {
              return {
                ...item,
                attendance_status: newStatus,
                check_in_time: newStatus === 'present' ? new Date().toISOString() : null
              };
            }
            return item;
          });

          const total = updatedList.length;
          const present = updatedList.filter((r) => r.attendance_status === 'present').length;
          const absent = total - present;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            ...prev,
            summary: { total, present, absent, percentage },
            data: updatedList
          };
        });
      }
    } catch (err) {
      console.error('Failed to update attendance:', err);
      alert('Could not update attendance status. Please try again.');
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await exportAPI.attendance(format, {
        eventId: selectedEventId || undefined
      });
      const blob = new Blob([res.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToastMsg(`Exported attendance to ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Export attendance error:', err);
      alert('Failed to export attendance.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']}>
      <Layout>
        <div className="container py-4">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <FontAwesomeIcon icon={faClipboardUser} className="text-primary me-2" />
                Participant Attendance
              </h2>
              <p className="text-secondary small mb-0">
                Track event check-ins, record present/absent statuses, and manage verified attendees
              </p>
            </div>

            {/* Actions: Event Selector + Export + QR Scanner */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="d-flex align-items-center gap-1">
                <label className="small fw-semibold text-secondary mb-0 d-none d-sm-inline">Event:</label>
                <select
                  className="form-select form-select-sm shadow-sm"
                  style={{ minWidth: '200px' }}
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={loadingEvents}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>

              <ExportDropdown onExport={handleExport} />

              <Link
                href={selectedEventId ? `/scan-ticket?eventId=${selectedEventId}` : '/scan-ticket'}
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
              >
                <FontAwesomeIcon icon={faQrcode} />
                <span>Scan QR</span>
              </Link>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="alert alert-success py-2 small shadow-sm mb-4" role="alert">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              {toastMsg}
            </div>
          )}

          {/* Event Quick Info & Attendance Stats */}
          {attendanceData?.summary && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-3">
                <div className="card border-0 shadow-sm p-3 rounded-4 bg-primary text-white">
                  <span className="small text-white-50">Total Registered</span>
                  <h3 className="fw-bold mb-0">{attendanceData.summary.total}</h3>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card border-0 shadow-sm p-3 rounded-4 bg-success text-white">
                  <span className="small text-white-50">Present (Checked In)</span>
                  <h3 className="fw-bold mb-0">{attendanceData.summary.present}</h3>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card border-0 shadow-sm p-3 rounded-4 bg-danger text-white">
                  <span className="small text-white-50">Absent</span>
                  <h3 className="fw-bold mb-0">{attendanceData.summary.absent}</h3>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card border-0 shadow-sm p-3 rounded-4 text-white" style={{ backgroundColor: '#123B70' }}>
                  <span className="small text-white-50">Attendance Rate</span>
                  <h3 className="fw-bold mb-0">{attendanceData.summary.percentage}%</h3>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table Card */}
          <div className="card border shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  {attendanceData?.event?.title || 'Selected Event Attendees'}
                </h5>
                <span className="text-muted small">
                  {attendanceData?.event?.date} • {attendanceData?.event?.location}
                </span>
              </div>
            </div>

            <div className="card-body p-0">
              {loadingAttendance ? (
                <div className="text-center py-5 text-muted">
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-primary fs-4" />
                  <p className="small mt-2 mb-0">Loading participant check-in list...</p>
                </div>
              ) : !attendanceData || attendanceData.data?.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No participants registered for this event yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-secondary">
                        <th className="ps-4 py-3">Reg ID</th>
                        <th className="py-3">Participant Name</th>
                        <th className="py-3">Contact</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3">Check-in Time</th>
                        <th className="py-3 text-end pe-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.data.map((item) => (
                        <tr key={item.registration_id}>
                          <td className="ps-4 py-3">
                            <span className="badge bg-light text-primary border font-monospace">
                              REG-{String(item.registration_id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="fw-bold text-dark">{item.participant_name}</td>
                          <td className="small text-muted">
                            <div>{item.participant_email}</div>
                            {item.participant_phone && <div>{item.participant_phone}</div>}
                          </td>
                          <td className="text-center">
                            {item.attendance_status === 'present' ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                Present
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1">
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="small text-muted">
                            {item.check_in_time ? (
                              <span>
                                <FontAwesomeIcon icon={faClock} className="me-1 text-primary" />
                                {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            {item.attendance_status === 'present' ? (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm px-2 py-1"
                                onClick={() => handleMarkAttendance(item.registration_id, 'absent')}
                                title="Mark as Absent"
                              >
                                Mark Absent
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-success btn-sm px-3 py-1 text-white"
                                onClick={() => handleMarkAttendance(item.registration_id, 'present')}
                                title="Mark as Present"
                              >
                                Mark Present
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
