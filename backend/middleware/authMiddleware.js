const { verifyToken } = require('../utils/securityUtils');
const config = require('../config/config');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token in the Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token, config.jwtSecret);

      // Get user from token without returning password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          message: 'Not authorized, user not found' 
        });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      
      // Provide specific error messages based on error type
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      res.status(401).json({ message: 'Not authorized, authentication failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Roles that are allowed to access the route
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (protect middleware should be called first)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: Missing role information' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role ${req.user.role} is not authorized to access this resource` 
      });
    }

    next();
  };
};

module.exports = { protect, authorize };