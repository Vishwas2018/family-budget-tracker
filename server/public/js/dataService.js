/**
 * dataService.js - Centralized API interaction for the Family Budget Tracker
 * 
 * This module provides a clean interface for all API operations and handles
 * common concerns like authentication, error handling, and request formatting.
 */

import config from './config.js';

/**
 * Represents an API error with enhanced details
 */
class ApiError extends Error {
  /**
   * Creates a new API error
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {object} data - Additional error data from API
   */
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Core data service for API interactions
 */
const dataService = {
  /**
   * Makes an API request with proper error handling and authentication
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} options - Request options
   * @returns {Promise<object>} Response data
   * @throws {ApiError} If the request fails
   */
  async request(endpoint, options = {}) {
    try {
      // Generate unique request ID for tracking
      const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Set up request headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers
      };
      
      // Add authentication token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Set up request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || config.api.timeout
      );
      
      // Log request in development mode
      if (config.debug?.enabled && config.api.logRequests) {
        console.group(`API Request: ${options.method || 'GET'} ${endpoint}`);
        console.log('Headers:', { ...headers, Authorization: token ? '[REDACTED]' : undefined });
        if (options.body) {
          console.log('Body:', typeof options.body === 'string' ? JSON.parse(options.body) : options.body);
        }
        console.groupEnd();
      }
      
      // Make the request
      const fullUrl = config.getApiUrl(endpoint);
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type') || '';
      let data;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (options.responseType === 'blob' || contentType.includes('application/octet-stream')) {
        data = await response.blob();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
      
      // Handle error responses
      if (!response.ok) {
        throw new ApiError(
          data.message || `Error ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408, { reason: 'timeout' });
      }
      
      // Log error in development mode
      if (config.debug?.enabled) {
        console.error('API Error:', error);
      }
      
      // Rethrow API errors directly
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Wrap other errors in ApiError
      throw new ApiError(error.message || 'Unknown error occurred', 500);
    }
  },
  
  /**
   * Makes a GET request to the API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {object} options - Additional request options
   * @returns {Promise<object>} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    // Add query parameters to URL
    const url = new URL(config.getApiUrl(endpoint), window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    // Use only the pathname + search to avoid origin issues
    const urlPath = url.pathname + url.search;
    
    return this.request(urlPath, {
      method: 'GET',
      ...options
    });
  },
  
  /**
   * Makes a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional request options
   * @returns {Promise<object>} Response data
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  /**
   * Makes a PUT request to the API
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional request options
   * @returns {Promise<object>} Response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  /**
   * Makes a DELETE request to the API
   * @param {string} endpoint - API endpoint
   * @param {object} options - Additional request options
   * @returns {Promise<object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  },
  
  /**
   * Uploads a file to the API
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {object} additionalData - Additional form data
   * @param {object} options - Additional request options
   * @returns {Promise<object>} Response data
   */
  async uploadFile(endpoint, file, additionalData = {}, options = {}) {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    // Make request without Content-Type header (browser sets it with boundary)
    const requestOptions = {
      method: 'POST',
      body: formData,
      ...options
    };
    
    // Remove content-type header to let browser set it with proper boundary
    delete requestOptions.headers?.['Content-Type'];
    
    return this.request(endpoint, requestOptions);
  },
  
  /**
   * Downloads a file from the API
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Name to save the file as
   * @param {object} params - Query parameters
   * @returns {Promise<void>} Promise that resolves when download starts
   */
  async downloadFile(endpoint, filename, params = {}) {
    try {
      const response = await this.get(endpoint, params, {
        responseType: 'blob',
        headers: {
          Accept: '*/*'
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};

/**
 * Authentication service for user management
 */
const authService = {
  /**
   * Registers a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Response with token and user data
   */
  async register(userData) {
    const response = await dataService.post(config.api.endpoints.auth.register, userData);
    
    // Store token
    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  },
  
  /**
   * Logs in a user
   * @param {object} credentials - Login credentials
   * @returns {Promise<object>} Response with token and user data
   */
  async login(credentials) {
    const response = await dataService.post(config.api.endpoints.auth.login, credentials);
    
    // Store token
    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  },
  
  /**
   * Logs out the current user
   * @returns {Promise<object>} Response data
   */
  async logout() {
    try {
      // Call logout API
      await dataService.post(config.api.endpoints.auth.logout);
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local logout');
    } finally {
      // Always clear local auth data
      localStorage.removeItem('token');
    }
    
    return { success: true };
  },
  
  /**
   * Gets the current user's data
   * @returns {Promise<object>} User data
   */
  async getCurrentUser() {
    return dataService.get(config.api.endpoints.auth.me);
  },
  
  /**
   * Refreshes the authentication token
   * @returns {Promise<object>} New token data
   */
  async refreshToken() {
    const response = await dataService.post(config.api.endpoints.auth.refresh);
    
    // Store new token
    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  },
  
  /**
   * Checks if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }
};

/**
 * Expense service for expense management
 */
const expenseService = {
  /**
   * Gets expenses with optional filtering
   * @param {object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} Paginated expense data with summary
   */
  async getExpenses(filters = {}, page = 1, limit = 10) {
    return dataService.get(config.api.endpoints.expenses.list, {
      page,
      limit,
      ...filters
    });
  },
  
  /**
   * Gets a single expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<object>} Expense data
   */
  async getExpense(id) {
    return dataService.get(config.api.endpoints.expenses.detail(id));
  },
  
  /**
   * Creates a new expense
   * @param {object} expenseData - Expense data
   * @returns {Promise<object>} Created expense
   */
  async createExpense(expenseData) {
    return dataService.post(config.api.endpoints.expenses.list, expenseData);
  },
  
  /**
   * Updates an existing expense
   * @param {string} id - Expense ID
   * @param {object} expenseData - Updated expense data
   * @returns {Promise<object>} Updated expense
   */
  async updateExpense(id, expenseData) {
    return dataService.put(config.api.endpoints.expenses.detail(id), expenseData);
  },
  
  /**
   * Deletes an expense
   * @param {string} id - Expense ID
   * @returns {Promise<object>} Response data
   */
  async deleteExpense(id) {
    return dataService.delete(config.api.endpoints.expenses.detail(id));
  },
  
  /**
   * Deletes multiple expenses
   * @param {string[]} ids - Array of expense IDs
   * @returns {Promise<object>} Response with success and failure counts
   */
  async bulkDeleteExpenses(ids) {
    return dataService.post(config.api.endpoints.expenses.bulkDelete, { ids });
  },
  
  /**
   * Imports expenses from a file
   * @param {File} file - File to import
   * @returns {Promise<object>} Import results
   */
  async importExpenses(file) {
    return dataService.uploadFile(config.api.endpoints.expenses.import, file);
  },
  
  /**
   * Exports expenses to a file
   * @param {object} filters - Filter criteria for export
   * @returns {Promise<void>} Promise that resolves when download starts
   */
  async exportExpenses(filters = {}) {
    return dataService.downloadFile(
      config.api.endpoints.expenses.export,
      'expense_data.xlsx',
      filters
    );
  }
};

/**
 * Income service for income management
 */
const incomeService = {
  /**
   * Gets incomes with optional filtering
   * @param {object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} Paginated income data with summary
   */
  async getIncomes(filters = {}, page = 1, limit = 10) {
    return dataService.get(config.api.endpoints.incomes.list, {
      page,
      limit,
      ...filters
    });
  },
  
  /**
   * Gets a single income by ID
   * @param {string} id - Income ID
   * @returns {Promise<object>} Income data
   */
  async getIncome(id) {
    return dataService.get(config.api.endpoints.incomes.detail(id));
  },
  
  /**
   * Creates a new income
   * @param {object} incomeData - Income data
   * @returns {Promise<object>} Created income
   */
  async createIncome(incomeData) {
    return dataService.post(config.api.endpoints.incomes.list, incomeData);
  },
  
  /**
   * Updates an existing income
   * @param {string} id - Income ID
   * @param {object} incomeData - Updated income data
   * @returns {Promise<object>} Updated income
   */
  async updateIncome(id, incomeData) {
    return dataService.put(config.api.endpoints.incomes.detail(id), incomeData);
  },
  
  /**
   * Deletes an income
   * @param {string} id - Income ID
   * @returns {Promise<object>} Response data
   */
  async deleteIncome(id) {
    return dataService.delete(config.api.endpoints.incomes.detail(id));
  },
  
  /**
   * Imports incomes from a file
   * @param {File} file - File to import
   * @returns {Promise<object>} Import results
   */
  async importIncomes(file) {
    return dataService.uploadFile(config.api.endpoints.incomes.import, file);
  },
  
  /**
   * Exports incomes to a file
   * @param {object} filters - Filter criteria for export
   * @returns {Promise<void>} Promise that resolves when download starts
   */
  async exportIncomes(filters = {}) {
    return dataService.downloadFile(
      config.api.endpoints.incomes.export,
      'income_data.xlsx',
      filters
    );
  }
};

/**
 * Reminder service for reminder management
 */
const reminderService = {
  /**
   * Gets reminders with optional filtering
   * @param {object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} Paginated reminder data with summary
   */
  async getReminders(filters = {}, page = 1, limit = 10) {
    return dataService.get(config.api.endpoints.reminders.list, {
      page,
      limit,
      ...filters
    });
  },
  
  /**
   * Gets a single reminder by ID
   * @param {string} id - Reminder ID
   * @returns {Promise<object>} Reminder data
   */
  async getReminder(id) {
    return dataService.get(config.api.endpoints.reminders.detail(id));
  },
  
  /**
   * Creates a new reminder
   * @param {object} reminderData - Reminder data
   * @returns {Promise<object>} Created reminder
   */
  async createReminder(reminderData) {
    return dataService.post(config.api.endpoints.reminders.list, reminderData);
  },
  
  /**
   * Updates an existing reminder
   * @param {string} id - Reminder ID
   * @param {object} reminderData - Updated reminder data
   * @returns {Promise<object>} Updated reminder
   */
  async updateReminder(id, reminderData) {
    return dataService.put(config.api.endpoints.reminders.detail(id), reminderData);
  },
  
  /**
   * Deletes a reminder
   * @param {string} id - Reminder ID
   * @returns {Promise<object>} Response data
   */
  async deleteReminder(id) {
    return dataService.delete(config.api.endpoints.reminders.detail(id));
  },
  
  /**
   * Marks a reminder as completed
   * @param {string} id - Reminder ID
   * @returns {Promise<object>} Updated reminder with next occurrence if recurring
   */
  async completeReminder(id) {
    return dataService.put(config.api.endpoints.reminders.complete(id));
  }
};

/**
 * Dashboard service for dashboard data
 */
const dashboardService = {
  /**
   * Gets dashboard data
   * @returns {Promise<object>} Dashboard summary data
   */
  async getDashboardData() {
    return dataService.get(config.api.endpoints.dashboard);
  }
};

/**
 * Config service for application configuration
 */
const configService = {
  /**
   * Gets category configuration
   * @returns {Promise<object>} Categories and subcategories
   */
  async getCategories() {
    return dataService.get(config.api.endpoints.config.categories);
  }
};

// Export services
export {
  dataService,
  authService,
  expenseService,
  incomeService,
  reminderService,
  dashboardService,
  configService,
  ApiError
};

// Make services available globally for easier access from HTML
window.services = {
  auth: authService,
  expense: expenseService,
  income: incomeService,
  reminder: reminderService,
  dashboard: dashboardService,
  config: configService
};

export default {
  auth: authService,
  expense: expenseService,
  income: incomeService,
  reminder: reminderService,
  dashboard: dashboardService,
  config: configService
};