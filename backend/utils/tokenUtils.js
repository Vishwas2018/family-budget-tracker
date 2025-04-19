/**
 * Utility functions for JWT token handling
 */

/**
 * Parse JWT token without verification
 * @param {string} token - The JWT token to parse
 * @returns {Object} - The decoded token payload
 * @throws {Error} - If token is invalid or cannot be parsed
 */
export const parseJwt = (token) => {
    try {
      // Split the token and get the payload part (second segment)
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid token format');
      }
      
      // Replace non-base64 URL chars and decode
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      // Parse the JSON payload
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      throw new Error('Invalid token: ' + error.message);
    }
  };
  
  /**
   * Check if a token is expired
   * @param {string} token - The JWT token to check
   * @returns {boolean} - True if token is expired or invalid, false otherwise
   */
  export const isTokenExpired = (token) => {
    try {
      const tokenData = parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token has expiration claim
      if (!tokenData.exp) {
        console.warn('Token does not have an expiration claim');
        return false;
      }
      
      // Return true if current time is past expiration
      return tokenData.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Consider invalid tokens as expired
    }
  };
  
  /**
   * Get time remaining until token expiration
   * @param {string} token - The JWT token to check
   * @returns {Object} - Object with remaining time in different formats
   */
  export const getTokenTimeRemaining = (token) => {
    try {
      const tokenData = parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token has expiration claim
      if (!tokenData.exp) {
        return { valid: false, message: 'Token does not have an expiration claim' };
      }
      
      // If already expired
      if (tokenData.exp < currentTime) {
        return { 
          valid: false, 
          expired: true, 
          message: 'Token has expired',
          expiredAt: new Date(tokenData.exp * 1000).toISOString()
        };
      }
      
      // Calculate remaining time in seconds
      const remainingSeconds = tokenData.exp - currentTime;
      
      // Convert to human-readable formats
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      
      return {
        valid: true,
        expired: false,
        seconds: remainingSeconds,
        minutes: Math.floor(remainingSeconds / 60),
        hours: Math.floor(remainingSeconds / 3600),
        days: Math.floor(remainingSeconds / 86400),
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        expiration: new Date(tokenData.exp * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error calculating token time remaining:', error);
      return { 
        valid: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Securely store token in localStorage with encryption
   * Note: This is still vulnerable to XSS but provides a bit more security
   * @param {string} token - The JWT token to store
   * @param {string} key - The key to store the token under
   */
  export const secureStoreToken = (token, key = 'token') => {
    try {
      // Simple obfuscation (not true encryption, but better than plain text)
      const obfuscated = btoa(
        encodeURIComponent(
          token.split('').map(c => 
            String.fromCharCode(c.charCodeAt(0) + 3)
          ).join('')
        )
      );
      
      localStorage.setItem(key, obfuscated);
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  };
  
  /**
   * Retrieve token from secure storage
   * @param {string} key - The key the token was stored under
   * @returns {string|null} - The retrieved token or null if not found/invalid
   */
  export const secureGetToken = (key = 'token') => {
    try {
      const obfuscated = localStorage.getItem(key);
      
      if (!obfuscated) {
        return null;
      }
      
      // Reverse the obfuscation
      const token = decodeURIComponent(atob(obfuscated))
        .split('')
        .map(c => String.fromCharCode(c.charCodeAt(0) - 3))
        .join('');
      
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };
  
  /**
   * Clear token from secure storage
   * @param {string} key - The key the token was stored under
   */
  export const secureClearToken = (key = 'token') => {
    localStorage.removeItem(key);
  };
  
  export default {
    parseJwt,
    isTokenExpired,
    getTokenTimeRemaining,
    secureStoreToken,
    secureGetToken,
    secureClearToken
  };