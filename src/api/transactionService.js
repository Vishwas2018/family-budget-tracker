import apiClient from './client';

/**
 * Service for transaction-related API operations
 */
const transactionService = {
  /**
   * Get all transactions with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} Promise with the API response
   */
  getTransactions: async (params = {}) => {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  },

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise} Promise with the API response
   */
  getTransaction: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise} Promise with the API response
   */
  createTransaction: async (transactionData) => {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  },

  /**
   * Update an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} transactionData - Updated transaction data
   * @returns {Promise} Promise with the API response
   */
  updateTransaction: async (id, transactionData) => {
    const response = await apiClient.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   * @returns {Promise} Promise with the API response
   */
  deleteTransaction: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Get transaction summary (income, expenses, balance)
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise} Promise with the API response
   */
  getTransactionSummary: async (params = {}) => {
    const response = await apiClient.get('/transactions/summary', { params });
    return response.data;
  },

  /**
   * Get monthly transaction data for reports
   * @param {Object} params - Query parameters (year)
   * @returns {Promise} Promise with the API response
   */
  getMonthlyTransactions: async (params = {}) => {
    const response = await apiClient.get('/transactions/monthly', { params });
    return response.data;
  },

  /**
   * Get category breakdown for expenses
   * @param {Object} params - Query parameters (startDate, endDate, type)
   * @returns {Promise} Promise with the API response
   */
  getCategoryBreakdown: async (params = {}) => {
    const response = await apiClient.get('/transactions/category-breakdown', { params });
    return response.data;
  }
};

export default transactionService;