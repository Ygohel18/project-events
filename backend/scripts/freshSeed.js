// ========================================================
// Fresh Database Reset & Seed Script
// Command: npm run seed:fresh
// Recreates all tables from database.sql and populates fresh seed data
// ========================================================

const { execSync } = require('child_process');
const path = require('path');

async function runFreshSeed() {
  console.log('🔄 ==========================================');
  console.log('🌱 Starting Fresh Database Reset & Seeding');
  console.log('==========================================\n');

  try {
    const backendDir = path.resolve(__dirname, '..');

    // Step 1: Re-initialize fresh tables from database.sql
    console.log('📦 Step 1/2: Resetting database schema tables...');
    execSync('node scripts/setupDatabase.js', { cwd: backendDir, stdio: 'inherit' });

    // Step 2: Seed fresh demo records
    console.log('\n📝 Step 2/2: Populating demonstration data...');
    execSync('node seed/seed.js', { cwd: backendDir, stdio: 'inherit' });

    console.log('\n✨ Fresh reset and seed completed successfully!');
    console.log('------------------------------------------');
    console.log('Default Demo Logins:');
    console.log('👑 Admin:       admin@example.com       | Password: 1234567890 (Admin User)');
    console.log('🎪 Organizer:   organizer@example.com   | Password: 1234567890 (Organizer User)');
    console.log('🎓 Participant: user@example.com        | Password: 1234567890 (Test User)');
    console.log('------------------------------------------\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Fresh seed failed:', err.message);
    process.exit(1);
  }
}

runFreshSeed();
