// Fixed sections of auth.js

// Authentication state manager
const authManager = {
  // Current authentication state
  isAuthenticated: false,

  // Current user information
  user: null,

  // Timeout for session expiration warning
  warningTimeout: null,

  // Timeout for session expiration
  expirationTimeout: null,

  /**
   * Initialize authentication state
   */
  init() {
    this.checkAuth();

    // Set up periodic checks for auth state
    setInterval(() => this.checkAuth(), 60 * 1000); // Check every minute

    // Listen for storage events (token changes in other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        this.checkAuth();
      }
    });
  },

  /**
   * Check current authentication state
   * @returns {boolean} - Whether user is authenticated
   */
  checkAuth() {
    const token = localStorage.getItem('token');
    this.clearTimeouts();

    if (!token) {
      this.setUnauthenticated();
      return false;
    }

    try {
      // Parse JWT token payload
      const payload = this.parseToken(token);

      if (!payload || !payload.exp) {
        this.setUnauthenticated();
        return false;
      }

      // Check if token is expired
      const expTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      if (expTime <= now) {
        this.setUnauthenticated();
        this.handleExpiredSession();
        return false;
      }

      // Token is valid - set up expiration warning and handlers
      this.setupExpirationHandlers(expTime);

      // Set authenticated state
      this.isAuthenticated = true;
      this.user = {
        id: payload.id,
        name: payload.name,
        email: payload.email
      };

      // Update UI with user info
      this.updateUserInfo();

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.setUnauthenticated();
      return false;
    }
  },

  /**
   * Parse JWT token to extract payload
   * @param {string} token - JWT token
   * @returns {object|null} - Decoded payload or null on error
   */
  parseToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  },

  /**
   * Set up expiration warning and timeout handlers
   * @param {number} expTime - Expiration timestamp in milliseconds
   */
  setupExpirationHandlers(expTime) {
    const now = Date.now();
    const timeUntilExp = expTime - now;

    // Set warning 5 minutes before expiration
    const warningTime = Math.max(0, timeUntilExp - (5 * 60 * 1000));

    this.warningTimeout = setTimeout(() => {
      this.showSessionWarning();
    }, warningTime);

    // Set timeout to handle expiration
    this.expirationTimeout = setTimeout(() => {
      this.handleExpiredSession();
    }, timeUntilExp);
  },

  /**
   * Clear all timeout handlers
   */
  clearTimeouts() {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }
  },

  /**
   * Set unauthenticated state
   */
  setUnauthenticated() {
    this.isAuthenticated = false;
    this.user = null;
    this.clearTimeouts();
  },

  /**
   * Update UI with user information
   */
  updateUserInfo() {
    if (!this.user) return;

    const userNameElement = document.getElementById('userName');
    if (userNameElement && this.user.name) {
      userNameElement.textContent = this.user.name;
    }
  },

  /**
   * Handle expired session
   */
  handleExpiredSession() {
    localStorage.removeItem('token');
    this.setUnauthenticated();

    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/pages/login.html')) {
      utils.showAlert('Your session has expired. Please log in again.', 'warning');

      // Delay redirect to allow alert to be seen
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 2000);
    }
  },

  /**
   * Show session expiration warning
   */
  showSessionWarning() {
    // Remove any existing warning first
    const existingWarning = document.querySelector('.session-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    const warning = document.createElement('div');
    warning.className = 'session-warning';
    warning.innerHTML = `
      <div class="session-warning-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Your session will expire in 5 minutes. Would you like to stay logged in?</p>
        <button id="extendSessionBtn" class="btn primary">Stay Logged In</button>
      </div>
    `;

    document.body.appendChild(warning);

    // Add click handler for extend button
    const extendBtn = document.getElementById('extendSessionBtn');
    if (extendBtn) {
      extendBtn.addEventListener('click', () => {
        this.refreshToken();
        warning.remove();
      });
    }

    // Auto-dismiss after 1 minute if not actioned
    setTimeout(() => {
      if (document.body.contains(warning)) {
        warning.remove();
      }
    }, 60000);
  },

  /**
   * Refresh the auth token
   */
  async refreshToken() {
    try {
      // Get current token
      const token = localStorage.getItem('token');
      if (!token) return;

      // Call refresh endpoint
      const response = await utils.fetchApi('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success && response.data?.token) {
        // Store new token
        localStorage.setItem('token', response.data.token);

        // Update auth state
        this.checkAuth();

        utils.showAlert('Your session has been refreshed', 'success');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, let the normal expiration flow handle it
    }
  },

  /**
   * Log the user out
   */
  async logout() {
    try {
      // Mark that we're logging out to prevent redirect loop
      localStorage.setItem('loggingOut', 'true');

      // Call logout API if authenticated
      if (this.isAuthenticated) {
        await utils.fetchApi('/auth/logout', {
          method: 'POST',
          showLoading: false // Don't show loading indicator for logout
        }).catch(() => {
          // Swallow errors on logout API - we'll log out locally regardless
          console.warn('Logout API call failed, proceeding with local logout');
        });
      }

      // Clear authentication data
      localStorage.removeItem('token');
      this.setUnauthenticated();

      // Redirect to login page
      window.location.href = '/pages/login.html';

      // Clear logging out flag after redirect
      setTimeout(() => {
        localStorage.removeItem('loggingOut');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);

      // Force logout even if API fails
      localStorage.removeItem('token');
      localStorage.removeItem('loggingOut');
      this.setUnauthenticated();
      window.location.href = '/pages/login.html';
    }
  }
};

/**
 * Handle login form submission
 * @param {Event} event - Form submission event
 */
async function handleLogin(event) {
  event.preventDefault();

  // Get form data
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    utils.showAlert('Please fill in all fields', 'danger');
    return;
  }

  try {
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    // Make login request
    const response = await utils.fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // Verify response has required data
    if (!response.success || !response.data?.token) {
      throw new Error('Invalid server response');
    }

    // Store token securely
    localStorage.setItem('token', response.data.token);

    // Initialize auth state
    authManager.checkAuth();

    // Show success message
    utils.showAlert('Login successful! Redirecting...', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      if (window.reminderNotification && typeof window.reminderNotification.getUpcomingReminders === 'function') {
        window.reminderNotification.getUpcomingReminders().then(reminders => {
          if (reminders && reminders.length > 0) {
            window.reminderNotification.showReminderNotification(reminders);
          }
        });
      }
    }, 2000);
  } catch (error) {
    // Reset button
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Login';
    }

    // Show error message
    utils.showAlert(error.message || 'Login failed. Please try again.', 'danger');
  }
}