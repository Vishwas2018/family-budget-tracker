/**
 * Standard API response formatter
 * Provides consistent response structure across the API
 */

/**
 * Format a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 */
const success = (res, statusCode = 200, message = 'Success', data = null, meta = {}) => {
    const response = {
      success: true,
      message,
      ...(data !== null && { data }),
      ...(Object.keys(meta).length > 0 && { meta })
    };
    
    return res.status(statusCode).json(response);
  };
  
  /**
   * Format an error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {*} errors - Error details
   */
  const error = (res, statusCode = 500, message = 'Error', errors = null) => {
    const response = {
      success: false,
      message,
      ...(errors !== null && { errors })
    };
    
    return res.status(statusCode).json(response);
  };
  
  /**
   * Common response shortcuts
   */
  const created = (res, message = 'Resource created successfully', data = null, meta = {}) => 
    success(res, 201, message, data, meta);
  
  const accepted = (res, message = 'Request accepted', data = null, meta = {}) => 
    success(res, 202, message, data, meta);
  
  const noContent = (res) => res.status(204).end();
  
  const badRequest = (res, message = 'Bad request', errors = null) => 
    error(res, 400, message, errors);
  
  const unauthorized = (res, message = 'Unauthorized', errors = null) => 
    error(res, 401, message, errors);
  
  const forbidden = (res, message = 'Forbidden', errors = null) => 
    error(res, 403, message, errors);
  
  const notFound = (res, message = 'Resource not found', errors = null) => 
    error(res, 404, message, errors);
  
  const conflict = (res, message = 'Resource conflict', errors = null) => 
    error(res, 409, message, errors);
  
  const serverError = (res, message = 'Internal server error', errors = null) => 
    error(res, 500, message, errors);
  
  module.exports = {
    success,
    error,
    created,
    accepted,
    noContent,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    serverError
  };