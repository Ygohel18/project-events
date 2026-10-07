// ========================================================
// Express Server Entry Point
// ========================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/database');
const { startReminderCron, checkAndSendReminders } = require('./services/cronService');
const { verifyToken, requireRole } = require('./middleware/authMiddleware');

// Ensure upload directories exist
['events', 'profiles', 'gallery', 'documents', 'payments', 'invoices', 'tickets'].forEach((sub) => {
  const dir = path.join(__dirname, 'uploads', sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const exportRoutes = require('./routes/exportRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Production & Subdomain-Safe CORS Configuration ---
const allowedOriginsList = [
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGINS
]
  .filter(Boolean)
  .flatMap((entry) => entry.split(',').map((s) => s.trim().toLowerCase()))
  .filter(Boolean);

const rootDomain = process.env.ROOT_DOMAIN
  ? process.env.ROOT_DOMAIN.replace(/^\./, '').toLowerCase()
  : null;

function getApexDomain(host) {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    if (parts.length >= 3 && ['co', 'com', 'org', 'net', 'edu', 'gov'].includes(parts[parts.length - 2])) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }
  return hostname;
}

function isOriginAllowed(origin, req) {
  if (!origin) return true;
  const lowerOrigin = origin.toLowerCase().replace(/\/+$/, '');

  // 1. Wildcard allow-all
  if (allowedOriginsList.includes('*')) {
    return true;
  }

  // 2. Direct configured origin matches (with or without protocol)
  if (allowedOriginsList.some((allowed) => allowed === lowerOrigin || lowerOrigin.includes(allowed))) {
    return true;
  }

  // 3. Localhost development environments
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(lowerOrigin)) {
    return true;
  }

  // 4. Subdomain matching with explicitly configured ROOT_DOMAIN
  if (rootDomain) {
    try {
      const parsed = new URL(lowerOrigin);
      if (parsed.hostname === rootDomain || parsed.hostname.endsWith(`.${rootDomain}`)) {
        return true;
      }
    } catch (e) {}
  }

  // 5. Automatic sibling subdomain detection based on current server host
  // e.g. If backend host is eventsbackend.tempwebsite.in and origin is events.tempwebsite.in,
  // both share apex domain tempwebsite.in -> seamlessly allow!
  if (req && req.headers && req.headers.host) {
    try {
      const hostApex = getApexDomain(req.headers.host);
      const originParsed = new URL(lowerOrigin);
      const originApex = getApexDomain(originParsed.hostname);
      if (hostApex && originApex && hostApex === originApex) {
        return true;
      }
    } catch (e) {}
  }

  // 6. Wildcard matching from ALLOWED_ORIGINS (e.g. *.example.com)
  for (const allowed of allowedOriginsList) {
    if (allowed.startsWith('*.')) {
      const base = allowed.slice(2);
      try {
        const parsed = new URL(lowerOrigin);
        if (parsed.hostname.endsWith(`.${base}`)) return true;
      } catch (e) {}
    }
  }

  // 7. In non-production, allow any origin
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
}

// Universal CORS & Preflight middleware (ensures headers are ALWAYS present on all responses)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin, req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    // If origin is allowed or absent (like mobile apps/curl), allow it
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // Don't throw an unhandled Error that strips headers; simply return false
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve non-sensitive static assets with cross-origin headers for images & documents
const staticOptions = {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};

app.use('/uploads/events', express.static(path.join(__dirname, 'uploads/events'), staticOptions));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles'), staticOptions));
app.use('/uploads/gallery', express.static(path.join(__dirname, 'uploads/gallery'), staticOptions));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents'), staticOptions));

// Block direct static access to private payment proofs, invoices, and tickets
app.use(['/uploads/payments', '/uploads/invoices', '/uploads/tickets'], (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Direct access forbidden. Please access files via authenticated API endpoints.'
  });
});

// 2. Health & Root Info Endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Management System REST API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 3. API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api', documentRoutes);

// On-demand reminder trigger (useful for testing and evaluation)
app.post('/api/reminders/trigger', verifyToken, requireRole('admin', 'organizer'), async (req, res) => {
  const result = await checkAndSendReminders();
  res.status(200).json(result);
});

// 4. 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }
  console.error('Unhandled server error:', err.message);
  const isClientError = err.name === 'MulterError' || (err.message && err.message.includes('allowed'));
  res.status(isClientError ? 400 : 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 6. Start Server, test MySQL connection, and start reminder cron
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
  await testConnection();
  startReminderCron();
});

module.exports = app;
