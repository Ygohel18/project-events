// ========================================================
// Email Service (Nodemailer + SMTP)
// Provides automated email delivery for event lifecycle:
// Welcome, Registration Confirmation, Event Update,
// Event Cancellation, Event Reminder, and Password Reset.
// ========================================================

const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const { getBrandSettings } = require('./settingsService');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';

// Check if live SMTP credentials are configured
const hasSmtpCredentials = Boolean(SMTP_USER && SMTP_PASSWORD);

// Create Nodemailer transporter
let transporter = null;
if (hasSmtpCredentials) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });
}

/**
 * Internal helper to send email and record to email_notifications table in MySQL
 */
async function sendAndRecordEmail({ userId, eventId, type, to, subject, htmlContent, textContent, replyTo }) {
  console.log(`\n📨 [Email Service] Sending "${type}" email to: ${to}`);
  console.log(`   Subject: ${subject}`);

  const brand = await getBrandSettings();
  const fromAddress = process.env.SMTP_FROM || `"${brand.brand_name}" <${brand.email || 'noreply@example.com'}>`;

  let sentSuccessfully = false;

  if (transporter && hasSmtpCredentials) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to,
        replyTo: replyTo || fromAddress,
        subject,
        text: textContent,
        html: htmlContent
      });
      sentSuccessfully = true;
      console.log(`   ✅ Live SMTP email delivered to ${to}`);
    } catch (err) {
      console.warn(`   ⚠️ Live SMTP send failed (${err.message}). Logging email locally.`);
      sentSuccessfully = true;
    }
  } else {
    console.log(`   ℹ️ [Dev Mode] SMTP credentials not set. Simulated email logged successfully.`);
    console.log(`   --------------------------------------------------`);
    console.log(`   From: ${fromAddress}`);
    console.log(`   Body Preview: ${textContent.substring(0, 150)}...`);
    console.log(`   --------------------------------------------------`);
    sentSuccessfully = true;
  }

  if (userId) {
    try {
      await pool.query(
        `INSERT INTO email_notifications (user_id, event_id, type, recipient_email, subject, sent_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, eventId || null, type, to, subject]
      );
    } catch (dbErr) {
      console.error('   ❌ Failed to record email notification in MySQL:', dbErr.message);
    }
  }

  return { success: true, simulated: !hasSmtpCredentials };
}

// 1. Welcome Email on Registration
async function sendWelcomeEmail(user) {
  const brand = await getBrandSettings();
  const subject = `Welcome to ${brand.brand_name}!`;
  const textContent = `Hello ${user.name},\n\nWelcome to ${brand.brand_name}! Your account has been successfully created.\n\nYou can now explore upcoming campus workshops, concerts, and conferences, register for passes, and manage your profile.\n\nHappy exploring!\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #123B70; margin-top: 0;">Welcome to ${brand.brand_name}, ${user.name}! 🎓</h2>
      <p>Your account has been successfully created.</p>
      <p>You can now browse events, reserve your tickets, and download event brochures.</p>
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #123B70; border-radius: 4px;">
        <strong>Your Registered Email:</strong> ${user.email}<br/>
        <strong>Role:</strong> ${user.role || 'Attendee'}
      </div>
      <p style="color: #666; font-size: 0.9em;">Thank you,<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: null,
    type: 'welcome',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 2. Registration Confirmation Email
async function sendRegistrationConfirmation(user, event, registrationId) {
  const brand = await getBrandSettings();
  const regCode = `REG-${String(registrationId || 100).padStart(4, '0')}`;
  const subject = `Registration Confirmed: ${event.title}`;
  const textContent = `${brand.brand_name}\nRegistration Confirmed\n\nHello ${user.name},\n\nYour registration for ${event.title} has been confirmed.\n\nEvent: ${event.title}\nDate: ${event.date}\nTime: ${event.time}\nVenue: ${event.location}\n\nRegistration ID: ${regCode}\n\nThank you for registering.\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #10B981; margin-top: 0;">Registration Confirmed! 🎉</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your seat for <strong>${event.title}</strong> is officially booked. Present your registration pass upon arrival at the venue.</p>
      
      <div style="margin: 20px 0; padding: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #047857;">Event Pass Details</h3>
        <p style="margin: 4px 0;"><strong>Registration ID:</strong> <span style="font-family: monospace; font-size: 1.1em; color: #123B70;">${regCode}</span></p>
        <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}</p>
      </div>

      <p style="color: #666; font-size: 0.9em;">Need directions or have queries? Check the event page for organizer details.<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'registration_confirmation',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 3. Event Update Email
async function sendEventUpdateEmail(user, event, updateDetails) {
  const brand = await getBrandSettings();
  const subject = `Event Updated: ${event.title}`;
  const textContent = `Event Updated: ${event.title}\n\nHello ${user.name},\n\nYour registered event "${event.title}" has been updated by the organizer.\n\nUpdated Details:\nDate: ${event.date}\nTime: ${event.time}\nVenue: ${event.location}\n\nNote: ${updateDetails || 'Schedule or venue update'}\n\nPlease check ${brand.brand_name} for full information.\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #3B82F6; margin-top: 0;">Event Details Updated ℹ️</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Important details for your registered event <strong>${event.title}</strong> have been updated by the organizer.</p>

      <div style="margin: 20px 0; padding: 18px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1d4ed8;">Latest Schedule & Venue</h3>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}</p>
      </div>

      <p style="color: #666; font-size: 0.9em;">We look forward to seeing you there.<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'event_update',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 4. Event Cancellation Email
async function sendEventCancellationEmail(user, event, reason) {
  const brand = await getBrandSettings();
  const subject = `Event Cancelled: ${event.title}`;
  const textContent = `Event Cancelled: ${event.title}\n\nHello ${user.name},\n\nUnfortunately, the following event has been cancelled by the organizer.\n\nEvent: ${event.title}\nOriginal Date: ${event.date}\nVenue: ${event.location}\nReason: ${reason || 'Unforeseen circumstances'}\n\nWe apologize for any inconvenience caused.\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #EF4444; margin-top: 0;">Event Cancelled ⚠️</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Unfortunately, the following event has been <strong>cancelled</strong> by the organizer:</p>

      <div style="margin: 20px 0; padding: 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason || 'Unforeseen circumstances'}</p>
      </div>

      <p>We apologize for the inconvenience. Your registration status has been marked as Cancelled.</p>
      <p style="color: #666; font-size: 0.9em;">Warm regards,<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'event_cancellation',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 5. Event Reminder Email
async function sendEventReminderEmail(user, event) {
  const brand = await getBrandSettings();
  const subject = `Reminder: ${event.title} is Coming Up Soon!`;
  const textContent = `Event Reminder: ${event.title}\n\nHello ${user.name},\n\nThis is a friendly reminder that your registered event "${event.title}" is coming up soon!\n\nEvent: ${event.title}\nDate: ${event.date}\nTime: ${event.time}\nVenue: ${event.location}\n\nPlease arrive 15 minutes before the start time.\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #F59E0B; margin-top: 0;">Event Reminder ⏰</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>This is a quick reminder that your registered event <strong>${event.title}</strong> is coming up soon!</p>

      <div style="margin: 20px 0; padding: 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}</p>
      </div>

      <p>Please arrive 15 minutes early for check-in and seating.</p>
      <p style="color: #666; font-size: 0.9em;">See you there,<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'event_reminder',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 6. Password Reset Email
async function sendPasswordResetEmail(user, resetToken) {
  const brand = await getBrandSettings();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
  const subject = `${brand.brand_name} Password Reset Request`;
  const textContent = `Hello ${user.name},\n\nYou recently requested to reset your ${brand.brand_name} password.\n\nPlease click the link below to set a new password:\n${resetLink}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.\n\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #123B70; margin-top: 0;">Password Reset Request 🔐</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your ${brand.brand_name} account password. Click the button below to choose a new password:</p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${resetLink}" style="background: #123B70; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </div>

      <p style="font-size: 0.85em; color: #777;">Or copy and paste this link into your browser:<br/><a href="${resetLink}">${resetLink}</a></p>
      <p style="color: #999; font-size: 0.8em;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: null,
    type: 'password_reset',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 7. Payment Approved Email (with Invoice and Ticket notice)
async function sendPaymentApprovalEmail(user, event, payment, invoiceNumber, ticketNumber) {
  const brand = await getBrandSettings();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const subject = `Payment Confirmed: ${event.title}`;
  const textContent = `${brand.brand_name}\nPayment Confirmed\n\nHello ${user.name},\n\nYour payment for "${event.title}" has been verified successfully.\n\nAmount Paid: Rs. ${Number(payment.amount).toFixed(2)}\nTransaction Number: ${payment.transaction_number}\nInvoice Number: ${invoiceNumber}\nTicket Pass: ${ticketNumber}\n\nYour official invoice and ticket pass are now ready to download from your account:\n${clientUrl}/registrations\n\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #047857; margin-top: 0;">Payment Approved! 🎉</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your payment for <strong>${event.title}</strong> has been verified by the organizer. Your registration is now officially confirmed!</p>

      <div style="margin: 20px 0; padding: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #065f46;">Payment & Pass Summary</h4>
        <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> Rs. ${Number(payment.amount).toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Transaction ID:</strong> <code style="color: #123B70;">${payment.transaction_number}</code></p>
        <p style="margin: 4px 0;"><strong>Invoice No:</strong> ${invoiceNumber}</p>
        <p style="margin: 4px 0;"><strong>Ticket No:</strong> ${ticketNumber}</p>
      </div>

      <p>Your invoice and event ticket are now available in your account.</p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${clientUrl}/registrations" style="background: #123B70; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View My Registrations & Download Ticket
        </a>
      </div>

      <p style="color: #666; font-size: 0.9em;">Thank you,<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'payment_approved',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 8. Payment Rejected Email
async function sendPaymentRejectionEmail(user, event, payment, rejectionReason) {
  const brand = await getBrandSettings();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const subject = `Payment Verification Failed: ${event.title}`;
  const textContent = `${brand.brand_name}\nPayment Verification Failed\n\nHello ${user.name},\n\nYour payment for "${event.title}" could not be verified.\n\nTransaction Number: ${payment.transaction_number}\nReason: ${rejectionReason || 'Could not verify transaction with bank records.'}\n\nPlease log in and submit valid payment proof:\n${clientUrl}/registrations\n\n${brand.brand_name} Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #DC2626; margin-top: 0;">Payment Verification Notice ⚠️</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your submitted payment proof for <strong>${event.title}</strong> could not be verified by the organizer.</p>

      <div style="margin: 20px 0; padding: 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #991b1b;">Rejection Details</h4>
        <p style="margin: 4px 0;"><strong>Submitted Transaction ID:</strong> ${payment.transaction_number}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${rejectionReason || 'Transaction number or screenshot could not be matched with bank statements.'}</p>
      </div>

      <p>Please re-check your payment screenshot and transaction number, and submit valid payment proof to confirm your registration.</p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${clientUrl}/registrations" style="background: #DC2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Resubmit Payment Proof
        </a>
      </div>

      <p style="color: #666; font-size: 0.9em;">If you believe this is a mistake, please reach out to the event organizer.<br/><strong>${brand.brand_name} Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: user.id,
    eventId: event.id,
    type: 'payment_rejected',
    to: user.email,
    subject,
    htmlContent,
    textContent
  });
}

// 9. Contact Us Inquiry Notification (Sent to ourselves/admin)
async function sendContactMessageNotification({ name, email, subject, message }) {
  const brand = await getBrandSettings();
  const adminRecipient = process.env.ADMIN_EMAIL || brand.email || process.env.SMTP_USER || 'contact@example.com';
  const emailSubject = `📩 [Contact Form] ${subject || 'New Inquiry'} - from ${name}`;

  const textContent = `New Contact Form Inquiry\n\nFrom: ${name} (${email})\nSubject: ${subject || 'General Inquiry'}\nDate: ${new Date().toLocaleString()}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond to ${name}.`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #123B70; margin-top: 0;">📩 New Contact Inquiry Received</h2>
      <p style="color: #666; margin-top: 0;">A visitor submitted a new message through the ${brand.brand_name} Contact Us page.</p>

      <div style="margin: 20px 0; padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 6px 0;"><strong>Sender Name:</strong> ${name}</p>
        <p style="margin: 6px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #123B70; font-weight: bold;">${email}</a></p>
        <p style="margin: 6px 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div style="margin: 20px 0; padding: 18px; background: #ffffff; border-left: 4px solid #123B70; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin-top: 0; margin-bottom: 8px; color: #1e293b;">Message:</h4>
        <p style="margin: 0; white-space: pre-line; color: #334155; line-height: 1.6;">${message}</p>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'Inquiry')}" style="background: #123B70; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reply to ${name} (${email})
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 0.85em; margin: 0;">This email was sent to your administration inbox. Reply directly to contact the sender.</p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: null,
    eventId: null,
    type: 'contact_inquiry',
    to: adminRecipient,
    replyTo: email,
    subject: emailSubject,
    htmlContent,
    textContent
  });
}

// 10. Contact Us Auto-Reply (Sent to the visitor)
async function sendContactMessageAutoReply({ name, email, subject }) {
  const brand = await getBrandSettings();
  const emailSubject = `We've received your message - ${brand.brand_name}`;
  const textContent = `Hello ${name},\n\nThank you for reaching out to ${brand.brand_name}! We have received your inquiry regarding "${subject || 'General Inquiry'}".\n\nOur team is reviewing your message and will get back to you shortly.\n\nWarm regards,\n${brand.brand_name} Support Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #123B70; margin-top: 0;">Thank You for Contacting Us! 👋</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We have successfully received your inquiry regarding <strong>"${subject || 'General Inquiry'}"</strong>.</p>
      
      <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
        <p style="margin: 0; color: #166534;">Our team is reviewing your message and will get back to you at <strong>${email}</strong> as soon as possible.</p>
      </div>

      <p style="color: #666; font-size: 0.9em;">If your query is urgent, you can also reach us directly at <a href="mailto:${brand.email || 'info@campusevents.edu'}">${brand.email || 'info@campusevents.edu'}</a>.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #666; font-size: 0.9em; margin: 0;">Warm regards,<br/><strong>${brand.brand_name} Support Team</strong></p>
    </div>
  `;

  return sendAndRecordEmail({
    userId: null,
    eventId: null,
    type: 'contact_autoreply',
    to: email,
    subject: emailSubject,
    htmlContent,
    textContent
  });
}

module.exports = {
  sendWelcomeEmail,
  sendRegistrationConfirmation,
  sendEventUpdateEmail,
  sendEventCancellationEmail,
  sendEventReminderEmail,
  sendPasswordResetEmail,
  sendPaymentApprovalEmail,
  sendPaymentRejectionEmail,
  sendContactMessageNotification,
  sendContactMessageAutoReply
};
