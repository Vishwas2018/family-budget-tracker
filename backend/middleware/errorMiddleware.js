const config = require('../config/config');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found middleware - handles 404 errors
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Error handler middleware - centralized error handling
 */
const errorHandler = (err, req, res, next) => {
  // If error doesn't have a status code, set it to 500 (server error)
  const statusCode = err.statusCode || err.status || 500;
  
  // Log error for debugging (but not in tests)
  if (config.env !== 'test') {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${err.message}`);
    if (statusCode === 500) {
      console.error(err.stack);
    }
  }
  
  // Prepare error response
  const errorResponse = {
    message: err.message,
    status: statusCode,
  };
  
  // Include stack trace in development environment
  if (config.env === 'development' && statusCode === 500) {
    errorResponse.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

module.exports = { 
  notFound, 
  errorHandler, 
  ApiError 
};