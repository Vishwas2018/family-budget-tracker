import axios from 'axios';

// Create an axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: '/api', // Works with the fixed Vite proxy configuration
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout - increased for reliability
});

// Track network status and retry count
let isOnline = true;
const retryQueue = [];
const MAX_RETRY_ATTEMPTS = 3;

// Request interceptor with enhanced error handling
apiClient.interceptors.request.use(
  (config) => {
    // Add token from localStorage if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add retry configuration if not present
    if (config.retry === undefined) {
      config.retry = MAX_RETRY_ATTEMPTS;
      config.retryCount = 0;
      config.retryDelay = 1000; // Start with 1 second delay
    }
    
    // Enhanced debugging for development only
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, 
        config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '');
    }
    
    return config;
  },
  (error) => {
    console.error('Request preparation error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic and token handling
apiClient.interceptors.response.use(
  (response) => {
    // Reset retry count on successful requests
    if (response.config.retryCount > 0) {
      console.log(`Request to ${response.config.url} succeeded after ${response.config.retryCount} retries`);
    }
    
    // Update online status
    if (!isOnline) {
      isOnline = true;
      console.log('Network connection restored');
      // Process queued requests
      processRetryQueue();
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors and implement retry logic
    if (error.message === 'Network Error' || !error.response) {
      if (isOnline) {
        isOnline = false;
        console.log('Network connection lost');
      }
      
      // Add to retry queue if not already retrying
      if (!originalRequest.isRetrying && originalRequest.retry > 0) {
        originalRequest.isRetrying = true;
        retryQueue.push(originalRequest);
      }
      
      return Promise.reject(error);
    }
    
    // Retry server errors (5xx) automatically
    if (error.response && error.response.status >= 500 && originalRequest.retryCount < originalRequest.retry) {
      originalRequest.retryCount++;
      
      // Exponential backoff
      const delay = originalRequest.retryDelay * (2 ** (originalRequest.retryCount - 1));
      console.log(`Retrying request to ${originalRequest.url} (attempt ${originalRequest.retryCount}/${originalRequest.retry}) after ${delay}ms`);
      
      return new Promise(resolve => {
        setTimeout(() => resolve(apiClient(originalRequest)), delay);
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear stored credentials on authentication failure
      if (error.response.data?.message === 'Token expired' || 
          error.response.data?.message === 'Invalid token') {
        console.log('Authentication token expired or invalid. Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Enhanced error logging with response details
    if (error.response) {
      console.error(
        `API Error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`,
        error.response.data
      );
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('API Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Process the retry queue when back online
function processRetryQueue() {
  if (retryQueue.length === 0) return;
  
  console.log(`Processing ${retryQueue.length} queued requests`);
  
  retryQueue.forEach(request => {
    console.log(`Retrying: ${request.method.toUpperCase()} ${request.url}`);
    apiClient(request).catch(error => {
      console.error('Failed to process queued request:', error);
    });
  });
  
  // Clear the queue
  retryQueue.length = 0;
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser reports online status');
    isOnline = true;
    processRetryQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser reports offline status');
    isOnline = false;
  });
}

// Add a ping method to check API health
apiClient.checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return { 
      success: true, 
      status: response.status,
      data: response.data,
      serverTime: response.headers.date
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    };
  }
};

export default apiClient;