/**
 * cPanel Phusion Passenger Startup Entry Point
 * File: backend/app.js
 *
 * This file is automatically detected by cPanel CloudLinux "Setup Node.js App".
 * Passenger assigns the listening port or Unix domain socket dynamically in process.env.PORT.
 */

const path = require('path');
// dotenv will load fallback values from .env without overwriting variables set in cPanel UI
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./server');

// Export the Express application for Passenger
module.exports = app;
