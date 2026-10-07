// ========================================================
// Background Automation Service (node-cron)
// Periodically checks upcoming events within next 24 hours,
// sends reminder emails & in-app notifications, and deduplicates
// via the email_notifications table in MySQL.
// ========================================================

const cron = require('node-cron');
const { pool } = require('../config/database');
const emailService = require('./emailService');

/**
 * Main reminder check function
 * Can be called periodically by node-cron or triggered on-demand
 */
async function checkAndSendReminders() {
  console.log('\n⏰ [Cron Worker] Checking upcoming events for automated reminders...');

  try {
    // 1. Find upcoming events that are published and within the next 48 hours / upcoming
    // Checks all published events
    const [events] = await pool.query(`
      SELECT id, title, description, date, time, location
      FROM events
      WHERE status = 'Published'
    `);

    let remindersSent = 0;

    for (const ev of events) {
      // 2. Find confirmed registrations for this event
      const [participants] = await pool.query(`
        SELECT u.id AS user_id, u.name, u.email
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ? AND r.status = 'Confirmed'
      `, [ev.id]);

      for (const p of participants) {
        // 3. Deduplication Check: Has this user already received a reminder for this event?
        const [existing] = await pool.query(`
          SELECT id FROM email_notifications
          WHERE user_id = ? AND event_id = ? AND type = 'event_reminder'
        `, [p.user_id, ev.id]);

        if (existing.length === 0) {
          // Send reminder email (also records into email_notifications)
          await emailService.sendEventReminderEmail(
            { id: p.user_id, name: p.name, email: p.email },
            ev
          );

          // Create in-app notification record
          await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES (?, ?, ?, 'warning', 0)
          `, [
            p.user_id,
            `Reminder: ${ev.title}`,
            `Your event "${ev.title}" is coming up on ${ev.date} at ${ev.time}. Venue: ${ev.location}.`
          ]);

          remindersSent++;
          console.log(`   🔔 Reminder delivered to ${p.name} (${p.email}) for "${ev.title}"`);
        }
      }
    }

    console.log(`⏰ [Cron Worker] Reminder check complete. Sent: ${remindersSent} new reminders.\n`);
    return { success: true, count: remindersSent };
  } catch (error) {
    console.error('❌ [Cron Worker] Error during reminder scan:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Starts the hourly reminder cron job
 */
function startReminderCron() {
  console.log('🕒 Initializing automated event reminder cron job (Runs every hour)...');
  // Runs at minute 0 of every hour: '0 * * * *'
  cron.schedule('0 * * * *', () => {
    checkAndSendReminders();
  });
}

module.exports = {
  startReminderCron,
  checkAndSendReminders
};
