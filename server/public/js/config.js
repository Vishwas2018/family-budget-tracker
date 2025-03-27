/**
 * config.js - Central configuration for the Family Budget Tracker
 */

// Create configuration object
window.appConfig = (function() {
  // Determine environment based on hostname
  const isProduction = window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1');
  
  // Base API URL
  const baseApiUrl = isProduction 
    ? '/api'  // Production - relative path for same-domain deployment
    : 'http://localhost:5003/api';  // Development
    
  // Create config object
  const config = {
    // App info
    appName: 'Family Budget Tracker',
    version: '1.0.0',
    
    // API settings
    api: {
      baseUrl: baseApiUrl,
      timeout: 30000, // 30 seconds
      endpoints: {
        auth: {
          login: '/auth/login',
          register: '/auth/register',
          logout: '/auth/logout',
          me: '/auth/me',
          refresh: '/auth/refresh'
        },
        dashboard: '/dashboard',
        expenses: '/expenses',
        incomes: '/incomes',
        reminders: '/reminders',
        config: {
          categories: '/config/categories'
        }
      },
      logRequests: true
    },
    
    // Date formats
    dateFormat: {
      display: {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      }
    },
    
    // UI settings
    ui: {
      alertDuration: 5000, // 5 seconds
      pageSize: 10
    },
    
    // Debug settings
    debug: {
      enabled: !isProduction,
      logApiCalls: true
    },
    
    // Helper functions
    getApiUrl: function(endpoint) {
      return this.api.baseUrl + endpoint;
    }
  };
  
  // Return frozen config object to prevent modifications
  return Object.freeze(config);
})();

// Log configuration in development
if (window.appConfig.debug?.enabled) {
  console.log('App configuration loaded:', window.appConfig);
}