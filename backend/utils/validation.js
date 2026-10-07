// Simple validation helpers for beginner-level project

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isNotEmpty(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return true;
}

function isMinLength(str, minLength) {
  if (!str || typeof str !== 'string') return false;
  return str.length >= minLength;
}

module.exports = {
  isValidEmail,
  isNotEmpty,
  isMinLength
};
