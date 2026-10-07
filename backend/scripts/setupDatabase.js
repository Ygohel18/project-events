// ========================================================
// Fresh Database Setup Script (npm run db:setup)
// Creates empty tables in MySQL without demo records
// ========================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  console.log('🔄 Initializing MySQL database tables...');

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'event_management';
  const dbPort = Number(process.env.DB_PORT) || 3306;

  console.log(`📡 Connecting to MySQL host: ${dbHost}:${dbPort}`);
  console.log(`👤 Database user: ${dbUser}`);
  console.log(`🗄️  Target database: ${dbName}`);

  let connection;
  try {
    // 1. First attempt: Connect directly to the target database
    // (Standard for cPanel where the database is created via cPanel MySQL Wizard)
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        port: dbPort,
        multipleStatements: true
      });
    } catch (connErr) {
      // If database does not exist and current user has permissions (e.g. local root dev)
      if (connErr.code === 'ER_BAD_DB_ERROR' || connErr.errno === 1049) {
        console.log(`ℹ️  Database '${dbName}' does not exist. Attempting to create it...`);
        const serverConn = await mysql.createConnection({
          host: dbHost,
          user: dbUser,
          password: dbPassword,
          port: dbPort
        });
        await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await serverConn.end();

        connection = await mysql.createConnection({
          host: dbHost,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          port: dbPort,
          multipleStatements: true
        });
      } else {
        throw connErr;
      }
    }

    // 2. Read database.sql file
    const sqlPath = path.join(__dirname, '../database.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Strip any residual CREATE DATABASE or USE statements to prevent access denied errors
    sqlContent = sqlContent
      .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[^;]+;/gi, '')
      .replace(/USE\s+[^;]+;/gi, '');

    // 3. Execute schema DDL within the selected database
    await connection.query(sqlContent);

    // 4. Initialize fresh auth session version for token invalidation
    const sessionVersion = `ASV-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    await connection.query(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      ['auth_session_version', sessionVersion, sessionVersion]
    );

    await connection.end();

    console.log(`✅ Database tables in '${dbName}' initialized successfully!`);
    console.log('📊 Empty database ready:');
    console.log('   - users (0 records)');
    console.log('   - categories (0 records)');
    console.log('   - events (0 records)');
    console.log('   - event_benefits (0 records)');
    console.log('   - event_highlights (0 records)');
    console.log('   - registrations (0 records)');
    console.log('   - attendance (0 records)');
    console.log('   - notifications (0 records)');
    console.log('   - email_notifications (0 records)');
    console.log('   - contact_messages (0 records)');
    console.log('   - password_resets (0 records)');
    console.log('   - payments (0 records)');
    console.log('   - invoices (0 records)');
    console.log('   - tickets (0 records)');
    console.log('💡 To load demonstration data, run: npm run seed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 HINT for cPanel:');
      console.error('1. Make sure the database user has been ADDED to the database in cPanel > MySQL Databases with "ALL PRIVILEGES".');
      console.error(`2. Confirm that DB_NAME matches your cPanel database (e.g. cpaneluser_${dbName}).`);
      console.error(`3. Confirm DB_USER and DB_PASSWORD match the credentials assigned in cPanel.\n`);
    }
    process.exit(1);
  }
}

setupDatabase();
