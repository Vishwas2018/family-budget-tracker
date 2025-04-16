const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generates a secure random string for use as a secret key
 * @param {number} bytes - Number of bytes to generate (default: 64)
 * @returns {string} - A secure random hex string
 */
const generateSecureSecret = (bytes = 64) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generates a JWT token for a user
 * @param {string} userId - The user ID to encode in the token
 * @param {string} secret - The secret to use for signing
 * @param {object} options - Additional JWT options (e.g., expiresIn)
 * @returns {string} - The generated JWT token
 */
const generateToken = (userId, secret, options = { expiresIn: '30d' }) => {
  if (!userId || !secret) {
    throw new Error('User ID and secret are required to generate a token');
  }
  
  return jwt.sign({ id: userId }, secret, options);
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret used to sign the token
 * @returns {object} - The decoded token payload
 */
const verifyToken = (token, secret) => {
  if (!token || !secret) {
    throw new Error('Token and secret are required for verification');
  }
  
  return jwt.verify(token, secret);
};

/**
 * Generates a hash for a password
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - A promise that resolves to the hashed password
 */
const hashPassword = async (password) => {
  // This function is just a placeholder - we're already using bcrypt in the User model
  // It's included here for completeness of the security utils module
  throw new Error('Use the User model methods for password hashing');
};

module.exports = {
  generateSecureSecret,
  generateToken,
  verifyToken,
  hashPassword
};