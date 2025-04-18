import axios from 'axios';

// Create API client with defaults
const apiClient = axios.create({
  baseURL: '/api', // This will work with the correct proxy setup
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add debugging information
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    
    // Add token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request preparation error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Detailed error logging for debugging
    if (error.response) {
      // Server responded with an error status
      console.error(`API Error (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No response received:', error.request);
    } else {
      // Error in setting up the request
      console.error('Request Error:', error.message);
    }
    
    // Handle session expiration
    if (error.response?.status === 401) {
      // Clear stored credentials on authentication failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login due to authentication error');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Test method to check if API is reachable
apiClient.checkConnection = async () => {
  try {
    const response = await apiClient.get('/health');
    console.log('API connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API connection failed:', error);
    return { success: false, error };
  }
};

export default apiClient;