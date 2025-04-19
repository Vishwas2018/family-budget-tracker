const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generates a secure random string for use as a secret key
 * Uses crypto.randomBytes for cryptographically strong random generation
 * @param {number} bytes - Number of bytes to generate (default: 64)
 * @returns {string} - A secure random hex string
 */
const generateSecureSecret = (bytes = 64) => {
  // 64 bytes provides 128 hex characters - sufficiently secure for JWT
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Validates a JWT secret's strength
 * @param {string} secret - The secret to validate
 * @returns {Object} - Validation result with status and reason
 */
const validateSecretStrength = (secret) => {
  if (!secret) {
    return { valid: false, reason: 'Secret is empty' };
  }
  
  if (secret === 'supersecret123456789') {
    return { valid: false, reason: 'Using default development secret' };
  }
  
  if (secret.length < 32) {
    return { valid: false, reason: 'Secret is too short (min 32 characters)' };
  }
  
  // Check for complexity - should have mixed case, numbers and special chars for best security
  const hasLowercase = /[a-z]/.test(secret);
  const hasUppercase = /[A-Z]/.test(secret);
  const hasNumbers = /\d/.test(secret);
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
  
  const complexity = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;
  
  if (complexity < 3) {
    return { 
      valid: false, 
      reason: 'Secret lacks complexity (should contain at least 3 of: lowercase, uppercase, numbers, special chars)' 
    };
  }
  
  return { valid: true };
};

/**
 * Generates a JWT token for a user
 * @param {string} userId - The user ID to encode in the token
 * @param {string} secret - The secret to use for signing
 * @param {object} options - Additional JWT options (e.g., expiresIn)
 * @returns {string} - The generated JWT token
 * @throws {Error} - If userId or secret are invalid
 */
const generateToken = (userId, secret, options = { expiresIn: '30d' }) => {
  if (!userId) {
    throw new Error('User ID is required to generate a token');
  }
  
  if (!secret) {
    throw new Error('Secret is required to generate a token');
  }
  
  const secretValidation = validateSecretStrength(secret);
  if (!secretValidation.valid && process.env.NODE_ENV === 'production') {
    console.error(`JWT Secret security warning: ${secretValidation.reason}`);
    // In production, consider throwing an error here to prevent using weak secrets
  }
  
  // Add issued at time for enhanced security
  return jwt.sign(
    { 
      id: userId,
      iat: Math.floor(Date.now() / 1000) 
    }, 
    secret, 
    options
  );
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret used to sign the token
 * @returns {object} - The decoded token payload
 * @throws {Error} - If token is invalid or verification fails
 */
const verifyToken = (token, secret) => {
  if (!token) {
    throw new Error('Token is required for verification');
  }
  
  if (!secret) {
    throw new Error('Secret is required for verification');
  }
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    // Add more specific error messaging
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token signature');
    }
    throw error;
  }
};

module.exports = {
  generateSecureSecret,
  validateSecretStrength,
  generateToken,
  verifyToken
};