// Database Connection Configuration using mysql2/promise\

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with environment variables and resilient TCP keep-alive
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_management',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Helper function to test database connectivity on server launch
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'event_management');
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️  MySQL connection warning:', error.message);
    console.warn('👉 Make sure MySQL is running (e.g. XAMPP, WAMP, or local MySQL) and database.sql is imported.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
