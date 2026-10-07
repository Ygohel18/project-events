-- ========================================================
-- Event Management System - MySQL Database Schema
-- Database: event_management
-- Fresh installation contains tables only (No demo records)
-- ========================================================

-- Drop existing tables cleanly (executes within the currently selected database)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS event_highlights;
DROP TABLE IF EXISTS event_benefits;
DROP TABLE IF EXISTS event_images;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. Table: users
-- --------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT DEFAULT NULL,
  role ENUM('user', 'organizer', 'admin') DEFAULT 'user',
  profile_image VARCHAR(255) DEFAULT NULL,
  token_version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 2. Table: categories
-- --------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 3. Table: events
-- --------------------------------------------------------
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  category_id INT NOT NULL,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  location VARCHAR(200) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  map_embed_url TEXT DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  brochure VARCHAR(255) DEFAULT NULL,
  organizer_id INT NOT NULL,
  registration_fee DECIMAL(10, 2) DEFAULT 0.00,
  max_participants INT DEFAULT 200,
  status ENUM('Draft', 'Published', 'Hidden', 'Cancelled', 'Completed') DEFAULT 'Published',
  registration_open BOOLEAN DEFAULT TRUE,
  payment_required BOOLEAN DEFAULT FALSE,
  payment_instructions TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 4. Table: event_benefits (Why You Should Attend)
-- --------------------------------------------------------
CREATE TABLE event_benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  icon VARCHAR(50) DEFAULT '🎯',
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 5. Table: event_highlights
-- --------------------------------------------------------
CREATE TABLE event_highlights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 6. Table: event_images (Optional Event Gallery)
-- --------------------------------------------------------
CREATE TABLE event_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 5. Table: registrations
-- --------------------------------------------------------
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',
  payment_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 6. Table: attendance
-- --------------------------------------------------------
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,
  status ENUM('present', 'absent') DEFAULT 'absent',
  check_in_time TIMESTAMP NULL DEFAULT NULL,
  checked_in_by INT NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 7. Table: notifications (In-app notifications)
-- --------------------------------------------------------
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 8. Table: email_notifications (SMTP tracking for deduplication)
-- --------------------------------------------------------
CREATE TABLE email_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT DEFAULT NULL,
  type ENUM('welcome', 'registration_confirmation', 'event_update', 'event_cancellation', 'event_reminder', 'password_reset', 'payment_approved', 'payment_rejected') NOT NULL,
  recipient_email VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 9. Table: password_resets
-- --------------------------------------------------------
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 10. Table: contact_messages
-- --------------------------------------------------------
CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(200) DEFAULT NULL,
  message TEXT NOT NULL,
  status ENUM('New', 'Read', 'Replied') DEFAULT 'New',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 11. Table: payments (Manual / Offline Payment Proofs)
-- --------------------------------------------------------
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_number VARCHAR(100) NOT NULL UNIQUE,
  payment_screenshot VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  verified_by INT NULL DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 12. Table: invoices (PDF Invoices for Verified Payments)
-- --------------------------------------------------------
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  payment_id INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 13. Table: tickets (PDF Event Tickets with QR Code)
-- --------------------------------------------------------
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  verification_token VARCHAR(100) NULL UNIQUE,
  status ENUM('valid', 'checked_in', 'cancelled') DEFAULT 'valid',
  file_path VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 14. Table: system_settings (System & Branding Configuration)
-- --------------------------------------------------------
CREATE TABLE system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
