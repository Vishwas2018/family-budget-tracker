import apiClient from './client';

/**
 * Service for authentication-related API operations
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with the API response
   */
  register: async (userData) => {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },

  /**
   * Log in a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} Promise with the API response
   */
  login: async (credentials) => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
  },

  /**
   * Get the current user's profile
   * @returns {Promise} Promise with the API response
   */
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  /**
   * Update the current user's profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Promise with the API response
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Check if user is authenticated by verifying token validity
   * @returns {Promise<boolean>} Promise that resolves to boolean indicating auth status
   */
  checkAuth: async () => {
    try {
      await apiClient.get('/users/profile');
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default authService;