import apiClient from './client';

/**
 * Service for category-related API operations
 */
const categoryService = {
  /**
   * Get all categories with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} Promise with the API response
   */
  getCategories: async (params = {}) => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  /**
   * Get a single category by ID
   * @param {string} id - Category ID
   * @returns {Promise} Promise with the API response
   */
  getCategory: async (id) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Create a new category (admin only)
   * @param {Object} categoryData - Category data
   * @returns {Promise} Promise with the API response
   */
  createCategory: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  /**
   * Update an existing category (admin only)
   * @param {string} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise} Promise with the API response
   */
  updateCategory: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  /**
   * Delete a category (admin only)
   * @param {string} id - Category ID
   * @returns {Promise} Promise with the API response
   */
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Reset categories to defaults (admin only)
   * @returns {Promise} Promise with the API response
   */
  resetCategories: async () => {
    const response = await apiClient.post('/categories/reset');
    return response.data;
  }
};

export default categoryService;