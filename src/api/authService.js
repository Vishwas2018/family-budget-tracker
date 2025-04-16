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
    try {
      console.log('Registering user:', userData.email);
      const response = await apiClient.post('/users/register', userData);
      console.log('Registration successful');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Log in a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} Promise with the API response
   */
  login: async (credentials) => {
    try {
      console.log('Logging in user:', credentials.email);
      const response = await apiClient.post('/users/login', credentials);
      console.log('Login successful');
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get the current user's profile
   * @returns {Promise} Promise with the API response
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Promise with the API response
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check if user is authenticated by verifying token validity
   * @returns {Promise<boolean>} Promise that resolves to boolean indicating auth status
   */
  checkAuth: async () => {
    try {
      console.log('Checking auth status');
      await apiClient.get('/users/profile');
      console.log('Auth check: User is authenticated');
      return true;
    } catch (error) {
      console.log('Auth check: User is not authenticated', error.message);
      return false;
    }
  }
};

export default authService;