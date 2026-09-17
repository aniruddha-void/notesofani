const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '' || process.env.JWT_SECRET.includes('default_jwt_secret'))) {
  console.error('[JWT Configuration Error]: FATAL: A strong JWT_SECRET environment variable must be set in production mode.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'notesofani_default_jwt_secret_dev_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT token
 * @param {Object} payload - Data to embed in token (id, role, email)
 * @returns {string}
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token
 * @param {string} token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Sets a secure HTTP-Only authentication cookie
 * @param {Object} res - Express response object
 * @param {string} cookieName - 'userToken' or 'adminToken'
 * @param {string} token - Signed JWT token
 */
const sendAuthCookie = (res, cookieName, token) => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * Clears an authentication cookie securely
 * @param {Object} res - Express response object
 * @param {string} cookieName - 'userToken' or 'adminToken'
 */
const clearAuthCookie = (res, cookieName) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  sendAuthCookie,
  clearAuthCookie,
};
