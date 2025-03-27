// middleware/rateLimit.js
const rateLimit = (maxRequests, timeWindow) => {
    // Store request counts by IP
    const requestCounts = {};
    
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      
      // Initialize request tracking for this IP
      if (!requestCounts[ip]) {
        requestCounts[ip] = {
          count: 1,
          resetTime: Date.now() + timeWindow
        };
        
        // Set up cleanup after time window
        setTimeout(() => {
          delete requestCounts[ip];
        }, timeWindow);
        
        return next();
      }
      
      // Check if time window has passed
      if (Date.now() > requestCounts[ip].resetTime) {
        requestCounts[ip] = {
          count: 1,
          resetTime: Date.now() + timeWindow
        };
        
        return next();
      }
      
      // Check if request limit is exceeded
      if (requestCounts[ip].count >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
      }
      
      // Increment request count
      requestCounts[ip].count++;
      next();
    };
  };
  
  module.exports = rateLimit;