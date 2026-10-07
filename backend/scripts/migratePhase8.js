// Database Migration for Phase 8: Professional Ticket, QR Attendance & Data Export
const { pool } = require('../config/database');

async function migratePhase8() {
  console.log('🔄 Running Phase 8 Schema Migration...');
  const conn = await pool.getConnection();

  try {
    // 1. Check & add checked_in_by column to attendance
    const [attCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'checked_in_by'`
    );

    if (attCols.length === 0) {
      console.log('  Adding checked_in_by column to attendance table...');
      await conn.query(`
        ALTER TABLE attendance 
        ADD COLUMN checked_in_by INT NULL DEFAULT NULL,
        ADD CONSTRAINT fk_attendance_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('  ✅ Added checked_in_by to attendance.');
    } else {
      console.log('  ℹ️ Column checked_in_by already exists on attendance.');
    }

    // 2. Check & add status column to tickets
    const [tktStatusCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'status'`
    );

    if (tktStatusCols.length === 0) {
      console.log('  Adding status column to tickets table...');
      await conn.query(`
        ALTER TABLE tickets 
        ADD COLUMN status ENUM('valid', 'checked_in', 'cancelled') DEFAULT 'valid'
      `);
      console.log('  ✅ Added status to tickets.');
    } else {
      console.log('  ℹ️ Column status already exists on tickets.');
    }

    // 3. Check & add verification_token column to tickets
    const [tktTokenCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'verification_token'`
    );

    if (tktTokenCols.length === 0) {
      console.log('  Adding verification_token column to tickets table...');
      await conn.query(`
        ALTER TABLE tickets 
        ADD COLUMN verification_token VARCHAR(100) NULL UNIQUE
      `);
      console.log('  ✅ Added verification_token to tickets.');
    } else {
      console.log('  ℹ️ Column verification_token already exists on tickets.');
    }

    // 4. Populate verification_token for existing tickets if null
    await conn.query(`
      UPDATE tickets 
      SET verification_token = CONCAT('VTK-', UPPER(SUBSTRING(MD5(CONCAT(ticket_number, registration_id)), 1, 16)))
      WHERE verification_token IS NULL
    `);

    console.log('🎉 Phase 8 Schema Migration Completed Successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migratePhase8();
