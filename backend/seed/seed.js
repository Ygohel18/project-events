// ========================================================
// Seed Script (npm run seed)
// Populates demonstration data using real local media files
// ========================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedDatabase() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'event_management';
  const dbPort = Number(process.env.DB_PORT) || 3306;

  console.log(`🌱 Starting database seed process on '${dbName}' (${dbHost}:${dbPort})...`);

  try {
    // 1. Connect to MySQL
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort
    });

    // 2. Ensure target upload directories exist
    const uploadsDir = path.join(__dirname, '../uploads');
    const eventsUploadDir = path.join(uploadsDir, 'events');
    const profilesUploadDir = path.join(uploadsDir, 'profiles');
    const docsUploadDir = path.join(uploadsDir, 'documents');

    [eventsUploadDir, profilesUploadDir, docsUploadDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // 3. Copy seed assets into uploads folder
    console.log('📁 Copying local seed media assets to /uploads...');
    const seedAssetsDir = path.join(__dirname, 'assets');

    // Copy event images
    const eventFiles = [
      'music-fest.jpg',
      'tech-conference.jpg',
      'food-festival.jpg',
      'art-exhibition.jpg',
      'web-dev-workshop.jpg',
      'business-meet.jpg'
    ];
    eventFiles.forEach((file) => {
      const src = path.join(seedAssetsDir, 'events', file);
      const dest = path.join(eventsUploadDir, file);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    });

    // Profile avatars: Seed demo users strictly use Gravatar based on email (no local seed avatar files)

    // Copy document brochure
    const docSrc = path.join(seedAssetsDir, 'documents', 'sample-brochure.pdf');
    const docDest = path.join(docsUploadDir, 'sample-brochure.pdf');
    if (fs.existsSync(docSrc)) fs.copyFileSync(docSrc, docDest);

    // 4. Clean existing records safely for repeatable runs
    console.log('🧹 Clearing existing demo data...');
    await connection.query('DELETE FROM system_settings');
    await connection.query('DELETE FROM contact_messages');
    await connection.query('DELETE FROM password_resets');
    await connection.query('DELETE FROM email_notifications');
    await connection.query('DELETE FROM attendance');
    await connection.query('DELETE FROM notifications');
    await connection.query('DELETE FROM registrations');
    await connection.query('DELETE FROM event_highlights');
    await connection.query('DELETE FROM event_benefits');
    await connection.query('DELETE FROM events');
    await connection.query('DELETE FROM categories');
    await connection.query('DELETE FROM users');

    // 5. Seed Categories
    console.log('🏷️  Seeding categories...');
    const categories = [
      [1, 'Educational', 'Workshops, masterclasses, tech talks, and bootcamps.'],
      [2, 'Cultural', 'Art exhibitions, music concerts, and dance festivals.'],
      [3, 'Sports', 'Tournaments, marathons, athletics, and competitions.'],
      [4, 'Business', 'Conferences, networking meetups, and investor pitches.'],
      [5, 'Workshops', 'Hands-on practical training and developer bootcamps.'],
      [6, 'Conferences', 'Large-scale industry summits and panel discussions.'],
      [7, 'Entertainment', 'Live shows, comedy nights, and DJ music festivals.'],
      [8, 'Social', 'Food fairs, social community gatherings, and meetups.']
    ];

    for (const cat of categories) {
      await connection.query(
        'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
        cat
      );
    }

    // 6. Seed Demo Users (Hashed password: 1234567890)
    console.log('👥 Seeding demo users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1234567890', salt);

    // Initialize fresh auth session version for token invalidation on seed
    const sessionVersion = `ASV-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const defaultSettings = [
      ['auth_session_version', sessionVersion],
      ['brand_name', 'Campus Events'],
      ['tagline', 'Connecting people through campus and community events'],
      ['logo', ''],
      ['favicon', ''],
      ['description', 'A modern platform designed to make event management simple, efficient, and accessible.'],
      ['address', 'Campus Center, Tech Avenue, Ahmedabad, Gujarat'],
      ['email', 'contact@example.com'],
      ['phone', '+91 98765 43210'],
      ['website', 'https://example.com'],
      ['facebook', ''],
      ['instagram', ''],
      ['linkedin', ''],
      ['youtube', ''],
      ['twitter', ''],
      ['footer_description', 'A modern platform designed to make event management simple, efficient, and accessible.']
    ];

    for (const [key, val] of defaultSettings) {
      await connection.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, val, val]
      );
    }

    const users = [
      [
        1,
        'Admin User',
        'admin@example.com',
        '+91 98765 43210',
        hashedPassword,
        'Mumbai, Maharashtra',
        'admin',
        null,
        1
      ],
      [
        2,
        'Organizer User',
        'organizer@example.com',
        '+91 98250 11223',
        hashedPassword,
        'Ahmedabad, Gujarat',
        'organizer',
        null,
        1
      ],
      [
        3,
        'Test User',
        'user@example.com',
        '+91 97234 55667',
        hashedPassword,
        'Surat, Gujarat',
        'user',
        null,
        1
      ],
      [
        4,
        'Participant User',
        'participant@example.com',
        '+91 97234 55668',
        hashedPassword,
        'Pune, Maharashtra',
        'user',
        null,
        1
      ]
    ];

    for (const u of users) {
      await connection.query(
        'INSERT INTO users (id, name, email, phone, password, address, role, profile_image, token_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        u
      );
    }

    // 7. Seed Demo Events (using local relative image and PDF brochure paths, real venue addresses, and Google Maps embed URLs)
    console.log('🎪 Seeding demo events with real venue addresses, Google Maps embeds, and offline payment instructions...');
    const events = [
      [
        1,
        'Music Fest 2025',
        'Experience an electrifying night of live musical performances with renowned independent artists, bands, and food trucks.',
        7,
        '12 Dec 2025',
        '10:00 AM',
        'Riverfront Open Air Amphitheatre',
        'Sabarmati Riverfront, Ashram Road, Ahmedabad, Gujarat 380009',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.936050519395!2d72.571362!3d23.022505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f501000001%3A0x82b26002f1a3014a!2sSabarmati%20Riverfront!5e0!3m2!1sen!2sin!4v1700000000001',
        '/uploads/events/music-fest.jpg',
        '/uploads/documents/sample-brochure.pdf',
        2,
        500.00,
        500,
        'Published',
        true,
        true,
        'Pay ₹500 via UPI: eventpay@upi or PhonePe/GPay: 98250 11223.\nBank: HDFC Bank, A/C: 50100234567890, IFSC: HDFC0001234.'
      ],
      [
        2,
        'Tech Conference',
        'A gathering of passionate technologists discussing AI, web architecture, cloud engineering, and modern DevOps tools.',
        6,
        '15 Dec 2025',
        '09:00 AM',
        'Mahatma Mandir Convention Centre',
        'Sector 13C, Gandhinagar, Gujarat 382016',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.653139369062!2d72.637785!3d23.218525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395c2b9340000001%3A0x44613b942354a01!2sMahatma%20Mandir%20Convention%20and%20Exhibition%20Centre!5e0!3m2!1sen!2sin!4v1700000000002',
        '/uploads/events/tech-conference.jpg',
        '/uploads/documents/sample-brochure.pdf',
        2,
        1200.00,
        200,
        'Published',
        true,
        true,
        'Pay ₹1200 via UPI: techconf@upi.\nBank: ICICI Bank, A/C: 001205001234, IFSC: ICIC0000012.'
      ],
      [
        3,
        'Food Festival',
        'Delight your taste buds with culinary creations from over 50 local and international chefs, bakeries, and food stalls.',
        8,
        '20 Dec 2025',
        '11:00 AM',
        'Riverfront Event Centre',
        'Behind Tagore Hall, Paldi, Ahmedabad, Gujarat 380007',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.285816962294!2d72.569429!3d23.012588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e851918a24555%3A0x6b2e3f53c1bcf7ec!2sRiverfront%20Event%20Centre!5e0!3m2!1sen!2sin!4v1700000000003',
        '/uploads/events/food-festival.jpg',
        null,
        1,
        0.00,
        600,
        'Published',
        true,
        false,
        null
      ],
      [
        4,
        'Art Exhibition',
        'A curated visual showcase of contemporary paintings, ceramic art, sculpture, and digital designs by emerging artists.',
        2,
        '25 Dec 2025',
        '10:00 AM',
        'Amdavad ni Gufa Art Gallery',
        'Kasturbhai Lalbhai Campus, CEPT University, University Road, Ahmedabad, Gujarat 380009',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.554625804364!2d72.548231!3d23.036683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84ee80000001%3A0x2ffba35832049d5a!2sAmdavad%20ni%20Gufa!5e0!3m2!1sen!2sin!4v1700000000004',
        '/uploads/events/art-exhibition.jpg',
        null,
        1,
        200.00,
        150,
        'Published',
        true,
        true,
        'Pay ₹200 via UPI: artexpo@upi. Enter your registration ID in UPI remark.'
      ],
      [
        5,
        'Web Development Workshop',
        'A beginner-friendly interactive workshop on building modern web applications with JavaScript, React, and REST APIs.',
        1,
        '28 Dec 2025',
        '02:00 PM',
        'Dev Accelerator (DevX) Tech Park',
        'The First, B-Block, Vastrapur, Ahmedabad, Gujarat 380015',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.745814524816!2d72.529321!3d23.031542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84b85c1c8767%3A0xc489a80e071c35a6!2sDevX%20Coworking%20Space!5e0!3m2!1sen!2sin!4v1700000000005',
        '/uploads/events/web-dev-workshop.jpg',
        '/uploads/documents/sample-brochure.pdf',
        2,
        400.00,
        80,
        'Published',
        true,
        true,
        'Pay ₹400 via UPI: webworkshops@upi / Paytm: 98250 11224.'
      ],
      [
        6,
        'Business Networking Meet',
        'Connect with startup founders, tech investors, and industry executives to pitch ideas and form strategic partnerships.',
        4,
        '05 Jan 2026',
        '05:00 PM',
        'Jio World Convention Centre',
        'G Block BKC, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400098',
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.825203309627!2d72.862414!3d19.064563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8e6dfd224b7%3A0x9eb145a198c6001!2sJio%20World%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1700000000006',
        '/uploads/events/business-meet.jpg',
        null,
        1,
        750.00,
        120,
        'Published',
        true,
        true,
        'Pay ₹750 via UPI: startupnetwork@upi.'
      ]
    ];

    for (const ev of events) {
      await connection.query(
        `INSERT INTO events 
          (id, title, description, category_id, date, time, location, address, map_embed_url, image, brochure, organizer_id, registration_fee, max_participants, status, registration_open, payment_required, payment_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ev
      );
    }

    // 7b. Seed Event Benefits ("Why You Should Attend")
    console.log('💡 Seeding dynamic event benefits...');
    const benefits = [
      // Event 1: Music Fest
      [1, 1, '🎸', 'Live Rock & Indie Bands', 'Top independent artists and bands performing live across multiple acoustic and rock stages.', 1],
      [2, 1, '🍔', 'Gourmet Food Truck Alley', 'Over 20 curated regional food stalls, dessert trucks, and festival merchandise kiosks.', 2],
      [3, 1, '🎟️', 'Digital Entry Passes', 'Instant admission verification using your personalized digital admission pass.', 3],
      // Event 2: Tech Conference
      [4, 2, '🚀', 'Cloud & AI Keynote Sessions', 'Insights from leading cloud engineers, solution architects, and tech founders.', 1],
      [5, 2, '🤝', 'High-Impact Networking', 'Connect directly with developers, recruitment leads, and engineering teams.', 2],
      [6, 2, '📜', 'Verified Attendance Certificate', 'Receive an official verified certificate of attendance issued directly to your profile.', 3],
      // Event 3: Food Festival
      [7, 3, '🍜', '50+ Global Food Artisans', 'Taste curated dishes and street food specialties crafted by award-winning regional chefs.', 1],
      [8, 3, '👨‍🍳', 'Live Masterclasses & Cooking Demos', 'Engage in live cooking masterclasses, baking workshops, and mixology tutorials.', 2],
      // Event 4: Art Exhibition
      [9, 4, '🎨', 'Curated Contemporary Art', 'Explore over 100 original visual artworks spanning ceramic sculptures, oil paintings, and digital art.', 1],
      [10, 4, '🖌️', 'Interactive Live Painting', 'Watch live collaborative canvas sessions and receive signed exhibition prints.', 2],
      // Event 5: Web Dev Workshop
      [11, 5, '💻', 'Hands-On Full Stack Labs', 'Build fully functional web applications step-by-step with JavaScript, React, and Express.', 1],
      [12, 5, '🛠️', 'Production Tooling & Best Practices', 'Learn component state design, REST APIs, database persistence, and clean code hygiene.', 2],
      [13, 5, '📜', 'Developer Credential', 'Receive a verifiable digital certificate validating your practical code lab completion.', 3],
      // Event 6: Business Meet
      [14, 6, '💼', 'Direct Investor Pitch Circles', 'Present your venture concepts directly to angel investors and seed venture capital partners.', 1],
      [15, 6, '🌐', 'Executive Roundtable Sessions', 'Participate in closed-door discussions on fundraising, scaling, and team building.', 2]
    ];

    for (const b of benefits) {
      await connection.query(
        'INSERT INTO event_benefits (id, event_id, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        b
      );
    }

    // 7c. Seed Event Highlights
    console.log('✨ Seeding dynamic event highlights...');
    const highlights = [
      // Event 1
      [1, 1, 'Multiple live music stages featuring indie, rock, and fusion artists', 1],
      [2, 1, 'Official festival wristbands and limited edition event merchandise', 2],
      [3, 1, 'Seamless entry scanning with digital mobile passes', 3],
      [4, 1, 'Free shuttle services from major transit junctions', 4],
      // Event 2
      [5, 2, 'Keynote speeches on Generative AI and modern cloud systems', 1],
      [6, 2, 'Interactive panel discussions and open audience Q&A', 2],
      [7, 2, 'Exclusive recruitment booths and startup showcase pavilion', 3],
      [8, 2, 'Complimentary lunch, refreshments, and conference kit', 4],
      // Event 3
      [9, 3, 'Culinary passport with sample tastings across 50 food stalls', 1],
      [10, 3, 'Live acoustic busking performances throughout the evening', 2],
      [11, 3, 'Artisan dessert pavilions and local micro-bakeries', 3],
      // Event 4
      [12, 4, 'Guided gallery tour led by featured contemporary artists', 1],
      [13, 4, 'Interactive pottery, sketch, and printmaking stations', 2],
      [14, 4, 'Exhibition catalog and exclusive artist-signed posters', 3],
      // Event 5
      [15, 5, '100% hands-on coding in modern browser-based dev environments', 1],
      [16, 5, 'Reusable starter project templates and workshop slide decks', 2],
      [17, 5, 'Live debugging and guidance from seasoned teaching assistants', 3],
      // Event 6
      [18, 6, 'Structured speed networking rounds matching founders with mentors', 1],
      [19, 6, 'Curated 5-minute startup pitch opportunities before investors', 2],
      [20, 6, 'Evening networking mixer with high tea and refreshments', 3]
    ];

    for (const h of highlights) {
      await connection.query(
        'INSERT INTO event_highlights (id, event_id, title, sort_order) VALUES (?, ?, ?, ?)',
        h
      );
    }

    // 8. Seed Registrations
    console.log('🎟️  Seeding demo registrations...');
    const registrations = [
      [1, 3, 1, 'Confirmed', 'approved'],
      [2, 3, 2, 'Confirmed', 'approved'],
      [3, 3, 5, 'Pending', 'pending']
    ];

    for (const reg of registrations) {
      await connection.query(
        'INSERT INTO registrations (id, user_id, event_id, status, payment_status) VALUES (?, ?, ?, ?, ?)',
        reg
      );
    }

    // 9. Seed Notifications
    console.log('🔔 Seeding demo notifications...');
    const notifications = [
      [1, 3, 'Registration Confirmed', 'Your registration for Music Fest 2025 has been confirmed.', 'success', 0],
      [2, 3, 'Event Updated', 'Event Tech Conference has been updated with new schedule.', 'info', 0],
      [3, 3, 'Upcoming Deadline', 'Registration deadline for Food Festival is tomorrow.', 'warning', 0],
      [4, 3, 'New Event Announced', 'New event "Business Networking Meet" is now available.', 'info', 1],
      [5, 3, 'Security Update', 'Password changed successfully.', 'success', 1]
    ];

    for (const notif of notifications) {
      await connection.query(
        'INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
        notif
      );
    }

    // 10. Seed Attendance for Registrations
    console.log('📋 Seeding demo attendance records...');
    const attendanceRecords = [
      [1, 1, 'present', new Date()],
      [2, 2, 'present', new Date()],
      [3, 3, 'absent', null]
    ];
    for (const att of attendanceRecords) {
      await connection.query(
        'INSERT INTO attendance (id, registration_id, status, check_in_time) VALUES (?, ?, ?, ?)',
        att
      );
    }

    // 11. Seed Email Notifications (tracking sent emails)
    console.log('📧 Seeding demo email notification history...');
    const emailLogs = [
      [1, 3, 1, 'registration_confirmation', 'user@example.com', 'Registration Confirmed: Music Fest 2025'],
      [2, 3, 2, 'registration_confirmation', 'user@example.com', 'Registration Confirmed: Tech Conference 2025'],
      [3, 3, null, 'welcome', 'user@example.com', 'Welcome to the platform!']
    ];
    for (const log of emailLogs) {
      await connection.query(
        'INSERT INTO email_notifications (id, user_id, event_id, type, recipient_email, subject) VALUES (?, ?, ?, ?, ?, ?)',
        log
      );
    }

    // 12. Seed Contact Messages
    console.log('💬 Seeding sample contact messages...');
    const contactMessages = [
      [1, 'Vikram Singhania', 'vikram@example.com', 'Partnership Inquiry', 'Hi team, we would like to sponsor campus hackathons.'],
      [2, 'Pooja Dave', 'pooja@example.com', 'Speaker Application', 'Can I register as a guest speaker for upcoming design sessions?']
    ];
    for (const msg of contactMessages) {
      await connection.query(
        'INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
        msg
      );
    }

    // 13. Seed Payments (Manual/Offline Proofs)
    console.log('💳 Seeding demo payments, invoices & tickets...');
    const sampleScreenshot = '/uploads/payments/sample-proof.png';
    // Ensure placeholder image exists for sample proof
    const paymentDir = path.join(__dirname, '../uploads/payments');
    if (!fs.existsSync(paymentDir)) fs.mkdirSync(paymentDir, { recursive: true });
    const proofFile = path.join(paymentDir, 'sample-proof.png');
    if (!fs.existsSync(proofFile)) {
      // Create a small placeholder PNG
      fs.writeFileSync(proofFile, Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d400000000049454e44ae426082', 'hex'));
    }

    const payments = [
      [1, 1, 3, 1, 500.00, 'UPI-TXN-982501-1001', sampleScreenshot, 'approved', new Date(), new Date(), 2, null],
      [2, 2, 3, 2, 1200.00, 'UPI-TXN-982501-1002', sampleScreenshot, 'approved', new Date(), new Date(), 2, null],
      [3, 3, 3, 5, 400.00, 'UPI-TXN-982501-1003', sampleScreenshot, 'pending', new Date(), null, null, null]
    ];

    for (const p of payments) {
      await connection.query(
        `INSERT INTO payments 
          (id, registration_id, user_id, event_id, amount, transaction_number, payment_screenshot, status, submitted_at, verified_at, verified_by, rejection_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p
      );
    }

    // 14. Seed Invoices for Approved Registrations
    const invoices = [
      [1, 1, 1, 'INV-2026-00001', new Date(), 500.00, '/uploads/invoices/INV-2026-00001.pdf'],
      [2, 2, 2, 'INV-2026-00002', new Date(), 1200.00, '/uploads/invoices/INV-2026-00002.pdf']
    ];
    for (const inv of invoices) {
      await connection.query(
        'INSERT INTO invoices (id, registration_id, payment_id, invoice_number, invoice_date, amount, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
        inv
      );
    }

    // 15. Seed Tickets for Approved Registrations
    const tickets = [
      [1, 1, 'TKT-2026-00001', '/uploads/tickets/TKT-2026-00001.pdf', new Date()],
      [2, 2, 'TKT-2026-00002', '/uploads/tickets/TKT-2026-00002.pdf', new Date()]
    ];
    for (const tkt of tickets) {
      await connection.query(
        'INSERT INTO tickets (id, registration_id, ticket_number, file_path, generated_at) VALUES (?, ?, ?, ?, ?)',
        tkt
      );
    }

    await connection.end();

    console.log('\n========================================');
    console.log('🎉 Database seeded successfully!');
    console.log('========================================');
    console.log('📊 Seeded Statistics:');
    console.log('   Users: 3 (Admin, Organizer, Student)');
    console.log('   Categories: 8');
    console.log('   Events: 6 (all with local images in /uploads/events)');
    console.log('   Registrations: 3 (2 Present, 1 Absent)');
    console.log('   Notifications: 5');
    console.log('   Email Logs: 3');
    console.log('   Contact Messages: 2');
    console.log('🔑 Demo Login Password: 1234567890');
    console.log('   - Admin: admin@example.com (Admin User)');
    console.log('   - Organizer: organizer@example.com (Organizer User)');
    console.log('   - Participant: user@example.com (Test User)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
