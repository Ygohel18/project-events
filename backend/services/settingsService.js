const { pool } = require('../config/database');

// Default fallback settings
const DEFAULT_BRAND_SETTINGS = {
  brand_name: 'Campus Events',
  tagline: 'Connecting people through campus and community events',
  logo: '',
  favicon: '',
  description: 'A modern platform designed to make event management simple, efficient, and accessible.',
  address: 'Campus Center, Tech Avenue, Ahmedabad, Gujarat',
  email: 'contact@example.com',
  phone: '+91 98765 43210',
  website: 'https://example.com',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  twitter: '',
  footer_description: 'A modern platform designed to make event management simple, efficient, and accessible.'
};

const PUBLIC_KEYS = [
  'brand_name',
  'tagline',
  'logo',
  'favicon',
  'description',
  'address',
  'email',
  'phone',
  'website',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'twitter',
  'footer_description'
];

/**
 * Fetch non-sensitive branding configuration from database
 */
async function getBrandSettings() {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const settings = { ...DEFAULT_BRAND_SETTINGS };

    for (const row of rows) {
      if (PUBLIC_KEYS.includes(row.setting_key)) {
        settings[row.setting_key] = row.setting_value;
      }
    }

    return settings;
  } catch (err) {
    console.error('Error fetching brand settings from MySQL:', err.message);
    return { ...DEFAULT_BRAND_SETTINGS };
  }
}

/**
 * Fetch all settings (admin use)
 */
async function getAllSettings() {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const settings = { ...DEFAULT_BRAND_SETTINGS };

    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

    return settings;
  } catch (err) {
    console.error('Error fetching all settings from MySQL:', err.message);
    return { ...DEFAULT_BRAND_SETTINGS };
  }
}

/**
 * Save settings key-value pairs into system_settings
 */
async function saveSettings(settingsMap) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(settingsMap)) {
      if (typeof key === 'string' && key.trim()) {
        const valStr = value !== null && value !== undefined ? String(value) : '';
        await connection.query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, valStr, valStr]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  DEFAULT_BRAND_SETTINGS,
  PUBLIC_KEYS,
  getBrandSettings,
  getAllSettings,
  saveSettings
};
