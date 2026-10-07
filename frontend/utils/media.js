// ========================================================
// Frontend Media Utility
// Converts relative backend storage paths to full server URLs
// Strictly uses email-based Gravatar for user profile images when no custom file is uploaded
// ========================================================

import { md5 } from './md5';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5001');

/**
 * Generates a Gravatar profile image URL from user email
 * @param {string|null} email - User email address
 * @param {number} size - Image size in pixels (default: 200)
 * @param {string} defaultAvatar - Gravatar fallback style ("identicon", "mp", "retro")
 * @returns {string} - Gravatar image URL or default SVG if no email
 */
export function getGravatarUrl(email, size = 200, defaultAvatar = 'identicon') {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return '/images/default-avatar.svg';
  }
  const cleanEmail = email.trim().toLowerCase();
  const hash = md5(cleanEmail);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}`;
}

/**
 * Resolves a database file path or provides fallback media:
 * - For profiles: Gravatar URL strictly based on user's email
 * - For events: Default event banner SVG
 * @param {string|null} filePath - e.g. "/uploads/events/music-fest.jpg"
 * @param {string} fallbackType - "event" or "profile"
 * @param {string|null} email - Optional user email for Gravatar fallback
 * @returns {string} - Full accessible URL or Gravatar fallback URL
 */
export function getMediaUrl(filePath, fallbackType = 'event', email = null) {
  // If no custom file path is present, use Gravatar for profiles
  if (!filePath) {
    if (fallbackType === 'profile') {
      if (email) {
        return getGravatarUrl(email);
      }
      return '/images/default-avatar.svg';
    }
    return '/images/default-event.svg';
  }

  // If already a complete URL (e.g. preview blob, data URL, or external Gravatar URL)
  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('blob:') ||
    filePath.startsWith('data:')
  ) {
    return filePath;
  }

  // Ensure leading slash and prepend backend server base URL
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${BACKEND_URL}${cleanPath}`;
}
