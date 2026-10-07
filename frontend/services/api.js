// Axios API Service Layer
// Connects React frontend directly to Express + MySQL backend
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach JWT token and handle multipart/form-data
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Let the browser set the boundary automatically for FormData uploads
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Automatically handle 401 Unauthorized responses (e.g. database reset, session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = Boolean(error.config?.headers?.Authorization || error.config?.headers?.authorization);
      if (hadToken && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 1. Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// 2. User Profile API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData)
};

// 3. Events API
export const eventAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  cancelEvent: (id, reason) => api.put(`/events/${id}/cancel`, { reason }),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (id, dataOrNull) => {
    if (dataOrNull) {
      return api.post(`/events/${id}/register`, dataOrNull);
    }
    return api.post(`/events/${id}/register`);
  },
  getMyRegistration: (id) => api.get(`/events/${id}/my-registration`)
};

// 4. Categories API
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  createCategory: (catData) => api.post('/categories', catData),
  updateCategory: (id, catData) => api.put(`/categories/${id}`, catData),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// 5. Registrations API
export const registrationAPI = {
  getMyRegistrations: () => api.get('/registrations/my'),
  cancelRegistration: (id) => api.put(`/registrations/${id}/cancel`)
};

// 6. Attendance API
export const attendanceAPI = {
  getEventAttendance: (eventId) => api.get(`/attendance/event/${eventId}`),
  updateAttendance: (registrationId, status) => api.put(`/attendance/${registrationId}`, { status })
};

// 7. Reports & Analytics API
export const reportAPI = {
  getRegistrationReport: () => api.get('/reports/registrations'),
  getAttendanceReport: () => api.get('/reports/attendance'),
  getRevenueReport: () => api.get('/reports/revenue'),
  getEventPerformance: (id) => api.get(`/reports/events/${id}`),
  exportCSVUrl: (type) => `${API_BASE_URL}/reports/export/${type}`
};

// 8. Contact Us API
export const contactAPI = {
  sendMessage: (msgData) => api.post('/contact', msgData),
  getMessages: () => api.get('/contact')
};

// 9. Notifications API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// 10. Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getEvents: () => api.get('/admin/events'),
  getRegistrations: () => api.get('/admin/registrations'),
  updateRegistrationStatus: (id, status) => api.put(`/admin/registrations/${id}/status`, { status })
};

// 11. Payment API (Offline Payment Verification Workflow)
export const paymentAPI = {
  submitProof: (refIdOrFormData, maybeFormData) => {
    if (maybeFormData) {
      return api.post(`/payments/${refIdOrFormData}`, maybeFormData);
    }
    return api.post('/payments', refIdOrFormData);
  },
  getMyPayments: () => api.get('/payments/my-payments'),
  getOrganizerPayments: (params) => api.get('/payments/organizer', { params }),
  getAdminPayments: (params) => api.get('/payments/admin', { params }),
  approvePayment: (id) => api.put(`/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.put(`/payments/${id}/reject`, { reason }),
  getProofUrl: (paymentId) => `${API_BASE_URL}/payments/${paymentId}/proof`
};

// 12. Documents API (Invoices & Tickets)
export const documentAPI = {
  downloadInvoice: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  downloadTicket: (id) => api.get(`/tickets/${id}/download`, { responseType: 'blob' }),
  getInvoiceDownloadUrl: (id) => `${API_BASE_URL}/invoices/${id}/download`,
  getTicketDownloadUrl: (id) => `${API_BASE_URL}/tickets/${id}/download`
};

// 13. Ticket & QR Verification API
export const ticketAPI = {
  verify: (token, eventId) => api.get(`/tickets/verify/${encodeURIComponent(token)}`, { params: eventId ? { eventId } : {} }),
  checkIn: (id) => api.post(`/tickets/${encodeURIComponent(id)}/check-in`),
  getDetails: (id) => api.get(`/tickets/${id}`),
  getRecentCheckIns: (eventId) => api.get('/tickets/recent-checkins', { params: eventId ? { eventId } : {} }),
  download: (id) => api.get(`/tickets/${id}/download`, { responseType: 'blob' })
};

// 14. Data Export API (CSV & Excel)
export const exportAPI = {
  events: (format = 'csv', params = {}) => api.get('/export/events', { params: { ...params, format }, responseType: 'blob' }),
  participants: (format = 'csv', params = {}) => api.get('/export/participants', { params: { ...params, format }, responseType: 'blob' }),
  registrations: (format = 'csv', params = {}) => api.get('/export/registrations', { params: { ...params, format }, responseType: 'blob' }),
  payments: (format = 'csv', params = {}) => api.get('/export/payments', { params: { ...params, format }, responseType: 'blob' }),
  attendance: (format = 'csv', params = {}) => api.get('/export/attendance', { params: { ...params, format }, responseType: 'blob' }),
  tickets: (format = 'csv', params = {}) => api.get('/export/tickets', { params: { ...params, format }, responseType: 'blob' }),
  reports: (type, format = 'csv') => api.get(`/export/reports/${type}`, { params: { format }, responseType: 'blob' })
};

// 15. Settings API (Public & Admin Brand Configurations)
export const settingsAPI = {
  getPublicSettings: () => api.get('/settings/public'),
  getAdminSettings: () => api.get('/settings/admin'),
  updateSettings: (data) => {
    if (data instanceof FormData) {
      return api.put('/settings/admin', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put('/settings/admin', data);
  }
};

export default api;
