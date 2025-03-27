/**
 * app.js - Core functionality for the Family Budget Tracker
 * Enhanced with better error handling and modern practices
 */

// Utility functions
const utils = (function() {
  // API URL from config or fallback
  const API_URL = window.appConfig?.api.baseUrl || 'http://localhost:5003/api';
  
  return {
    // Make API_URL available as a property
    API_URL: API_URL,
    
    /**
     * Format a number as currency
     */
    formatCurrency: function(amount) {
      if (amount === null || amount === undefined) {
        return '$0.00';
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    },

    /**
     * Format a date to display format
     */
    formatDate: function(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      const options = window.appConfig?.dateFormat.display || 
                      { year: 'numeric', month: 'short', day: 'numeric' };
                      
      return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format a date for input fields (YYYY-MM-DD)
     */
    formatDateForInput: function(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for input field:', dateString);
        return '';
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },

    /**
     * Get current date in YYYY-MM-DD format
     */
    getCurrentDate: function() {
      const now = new Date();
      return this.formatDateForInput(now);
    },

    /**
     * Display an alert message to the user
     */
    showAlert: function(message, type = 'info', duration = window.appConfig?.ui.alertDuration || 5000) {
      // Try to find existing alert box
      let alertBox = document.getElementById('alertBox');
      
      // Create alert box if it doesn't exist
      if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'alertBox';
        alertBox.className = 'alert';
        alertBox.style.display = 'none';
        
        // Find a good place to add the alert
        const content = document.querySelector('.dashboard-content') || 
                        document.querySelector('main') ||
                        document.body;
                        
        // Add to beginning of content area
        if (content.firstChild) {
          content.insertBefore(alertBox, content.firstChild);
        } else {
          content.appendChild(alertBox);
        }
      }
      
      // Set alert content and type
      alertBox.textContent = message;
      alertBox.className = `alert alert-${type}`;
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'alert-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = function() {
        alertBox.style.display = 'none';
      };
      alertBox.appendChild(closeBtn);
      
      // Show the alert
      alertBox.style.display = 'block';
      
      // Auto-hide after specified duration (if not 0)
      if (duration > 0) {
        setTimeout(function() {
          if (alertBox && alertBox.style.display === 'block') {
            alertBox.style.display = 'none';
          }
        }, duration);
      }
    },

    /**
     * Enhanced API request helper with error handling
     */
    fetchApi: async function(endpoint, options = {}) {
      try {
        // Show loading indicator for long requests
        let loadingIndicator = null;
        let loadingTimeout = null;
        
        if (options.showLoading !== false) {
          loadingTimeout = setTimeout(function() {
            // Only show loading indicator for requests that take more than 300ms
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-spinner';
            loadingIndicator.id = 'api-loading-indicator';
            document.body.appendChild(loadingIndicator);
          }, 300);
        }
        
        // Add request ID for debugging
        const requestId = `req_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
        
        // Set up request headers
        const headers = {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...options.headers
        };
        
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request in development
        if (window.appConfig?.debug) {
          console.groupCollapsed(`API Request: ${options.method || 'GET'} ${endpoint}`);
          console.log('Headers:', { ...headers, Authorization: token ? '[PRESENT]' : undefined });
          console.log('Body:', options.body ? JSON.parse(options.body) : undefined);
          console.groupEnd();
        }
        
        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(function() {
          controller.abort();
        }, 30000); // 30 seconds timeout
        
        const url = `${utils.API_URL}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        
        // Clear timeout and loading indicator
        clearTimeout(timeoutId);
        
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        
        if (loadingIndicator && document.body.contains(loadingIndicator)) {
          loadingIndicator.remove();
        }
        
        // Handle response based on content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          // Log response in development
          if (window.appConfig?.debug) {
            console.groupCollapsed(`API Response: ${options.method || 'GET'} ${endpoint}`);
            console.log('Status:', response.status);
            console.log('Data:', data);
            console.groupEnd();
          }
          
          // Handle error responses
          if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
              // Only redirect if not already on login page
              if (!window.location.pathname.includes('/pages/login.html')) {
                localStorage.removeItem('token');
                
                utils.showAlert('Session expired. Please log in again.', 'warning');
                setTimeout(function() {
                  window.location.href = '/pages/login.html';
                }, 1500);
              }
              
              throw new Error('Authentication required. Please log in.');
            }
            
            // Throw error with API message
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
          }
          
          return data;
        } else {
          // For non-JSON responses (like file downloads), return the response
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          return response;
        }
      } catch (error) {
        // Clean up any lingering loading indicators
        const indicator = document.getElementById('api-loading-indicator');
        if (indicator) {
          indicator.remove();
        }
        
        // Handle specific error types
        if (error.name === 'AbortError') {
          utils.showAlert('Request timed out. Please try again.', 'danger');
          throw new Error('Request timed out. Please check your internet connection.');
        }
        
        console.error('API Error:', error);
        
        // Don't show alert if the caller explicitly doesn't want it
        if (options.suppressAlert !== true) {
          utils.showAlert(error.message || 'Something went wrong', 'danger');
        }
        
        throw error;
      }
    },

    /**
     * Open a modal dialog
     */
    openModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        // Add body class to prevent scrolling
        document.body.classList.add('modal-open');
        
        // Show the modal
        modal.style.display = 'block';
        
        // Add animation class
        setTimeout(function() {
          modal.classList.add('show');
        }, 10);
        
        // Focus first input or button
        setTimeout(function() {
          const firstInput = modal.querySelector('input, select, textarea, button:not(.close-modal)');
          if (firstInput) {
            firstInput.focus();
          }
        }, 200);
      }
    },

    /**
     * Close a modal dialog
     */
    closeModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        // Remove animation class
        modal.classList.remove('show');
        
        // Delay hiding to allow animation to complete
        setTimeout(function() {
          modal.style.display = 'none';
          
          // Remove body class if no other modals are open
          const openModals = document.querySelectorAll('.modal[style*="display: block"]');
          if (openModals.length === 0) {
            document.body.classList.remove('modal-open');
          }
        }, 200);
      }
    },

    /**
     * Initialize all modals close buttons
     */
    initializeModals: function() {
      // Get all modals
      const modals = document.querySelectorAll('.modal');
      
      modals.forEach(function(modal) {
        // Skip already initialized modals
        if (modal.dataset.initialized === 'true') return;
        
        // Close when clicking on X button
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(function(button) {
          button.addEventListener('click', function() {
            utils.closeModal(modal.id);
          });
        });
        
        // Close when clicking outside the modal
        modal.addEventListener('click', function(event) {
          if (event.target === modal) {
            utils.closeModal(modal.id);
          }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape' && modal.style.display === 'block') {
            utils.closeModal(modal.id);
          }
        });
        
        // Mark as initialized
        modal.dataset.initialized = 'true';
      });
    },

    /**
     * Initialize the sidebar navigation
     */
    initializeSidebar: function() {
      const toggleBtn = document.getElementById('toggleSidebar');
      const closeBtn = document.getElementById('closeSidebar');
      const sidebar = document.querySelector('.sidebar');
      
      if (toggleBtn && closeBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
          sidebar.classList.add('open');
        });
        
        closeBtn.addEventListener('click', function() {
          sidebar.classList.remove('open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
          const isMobile = window.innerWidth <= 768;
          const isOutsideSidebar = !sidebar.contains(event.target);
          const isNotToggleButton = !toggleBtn.contains(event.target);
          
          if (isMobile && isOutsideSidebar && isNotToggleButton && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
          }
        });
      }
    },
    
    /**
     * Format a date range
     */
    formatDateRange: function(startDate, endDate) {
      const start = this.formatDate(startDate);
      const end = this.formatDate(endDate);
      return `${start} - ${end}`;
    },
    
    /**
     * Check if a date is valid
     */
    isValidDate: function(date) {
      if (!date) return false;
      
      const testDate = new Date(date);
      return !isNaN(testDate.getTime());
    },
    
    /**
     * Add days to a date
     */
    addDays: function(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },
    
    /**
     * Check if a value is empty
     */
    isEmpty: function(value) {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    },
    
    /**
     * Sanitize a string to prevent XSS attacks
     */
    sanitize: function(str) {
      if (!str) return '';
      
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };
})();

/**
 * Check if user is logged in and redirect accordingly
 */
function checkAuth() {
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  const publicPages = ['/pages/login.html', '/pages/register.html', '/index.html', '/'];
  
  const isPublicPage = publicPages.some(function(page) {
    return currentPath.endsWith(page);
  });
  
  if (!token && !isPublicPage) {
    // If no token and not on a public page, redirect to login
    window.location.href = '/pages/login.html';
  } else if (token && (currentPath.includes('/pages/login.html') || currentPath.includes('/pages/register.html'))) {
    // If has token and on login/register page, redirect to dashboard
    window.location.href = '/pages/dashboard.html';
  }
}

/**
 * Initialize common page elements
 */
function initializePage() {
  // Check authentication
  checkAuth();
  
  // Add page load time to console
  if (window.appConfig?.debug) {
    console.log(`Page loaded in ${performance.now().toFixed(0)}ms`);
  }
  
  // Initialize modals
  utils.initializeModals();
  
  // Initialize sidebar
  utils.initializeSidebar();
  
  // Add dark mode detector
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.body.classList.add('dark-mode');
  }
  
  // Update version in footer if exists
  const versionElement = document.querySelector('.version');
  if (versionElement && window.appConfig?.version) {
    versionElement.textContent = `v${window.appConfig.version}`;
  }
}

// Make utils available globally
window.utils = utils;

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  
  // Dispatch custom event to notify other scripts that utils are loaded
  document.dispatchEvent(new Event('utilsLoaded'));
});

// Add unload handler to show loading indicator on page transitions
window.addEventListener('beforeunload', function() {
  const isFormChanged = document.querySelector('form:not(.filter-form) input:not([type="hidden"]):not([type="submit"]):not([readonly]):not([disabled])');
  
  if (!isFormChanged) {
    // Only show indicator if no form is being edited
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner page-transition';
    document.body.appendChild(loadingIndicator);
  }
});