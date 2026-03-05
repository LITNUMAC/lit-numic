/**
 * Input Sanitization Utilities
 * Focused on trim, format validation, and length limits.
 * Svelte already escapes HTML by default — no aggressive HTML sanitization needed.
 */

/**
 * Sanitize a text string: trim whitespace and enforce max length.
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length (default: 200)
 * @returns {string} Sanitized string
 */
export function sanitizeText(input, maxLength = 200) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

/**
 * Validate password strength.
 * @param {string} password
 * @param {number} minLength - Minimum length (default: 6)
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password, minLength = 6) {
  if (typeof password !== "string" || password.length < minLength) {
    return { valid: false, message: `Password minimal ${minLength} karakter.` };
  }
  return { valid: true, message: "" };
}

/**
 * Sanitize username: lowercase, alphanumeric + underscores only, max length.
 * @param {string} input
 * @param {number} maxLength
 * @returns {string}
 */
export function sanitizeUsername(input, maxLength = 30) {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, maxLength);
}

/**
 * Simple rate limiter factory for client-side use.
 * @param {number} maxAttempts - Max attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ canAttempt: () => boolean, recordAttempt: () => void, getRemaining: () => number, getResetTime: () => number, reset: () => void }}
 */
export function createRateLimiter(maxAttempts, windowMs) {
  let attempts = [];

  return {
    /** Check if an attempt is allowed */
    canAttempt() {
      const now = Date.now();
      attempts = attempts.filter((t) => now - t < windowMs);
      return attempts.length < maxAttempts;
    },

    /** Record a new attempt */
    recordAttempt() {
      attempts.push(Date.now());
    },

    /** Get remaining attempts */
    getRemaining() {
      const now = Date.now();
      attempts = attempts.filter((t) => now - t < windowMs);
      return Math.max(0, maxAttempts - attempts.length);
    },

    /** Get seconds until next attempt is available */
    getResetTime() {
      if (attempts.length === 0) return 0;
      const now = Date.now();
      const oldest = attempts.filter((t) => now - t < windowMs)[0];
      if (!oldest) return 0;
      return Math.ceil((oldest + windowMs - now) / 1000);
    },

    /** Reset all attempts */
    reset() {
      attempts = [];
    },
  };
}
