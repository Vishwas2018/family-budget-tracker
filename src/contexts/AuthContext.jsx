import { createContext, useContext, useEffect, useState } from 'react';

import authService from '../api/authService';
import { useNavigate } from 'react-router-dom';

// Create Auth context
const AuthContext = createContext(null);

/**
 * Authentication provider component that manages user authentication state
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get stored credentials
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          try {
            // Verify token with backend
            const isValid = await authService.checkAuth();
            
            if (isValid) {
              // If token is valid, set the user
              setUser(JSON.parse(storedUser));
              console.log('Successfully authenticated with stored token');
            } else {
              // If token is invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              console.log('Token validation failed - user will need to login');
            }
          } catch (error) {
            // Handle token verification error
            console.error('Token validation error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // No stored credentials found
          console.log('No stored credentials found - user needs to login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        // Always turn off loading state to prevent app from hanging
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setAuthError(null); // Clear previous errors
      
      const data = await authService.login(credentials);
      
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      setUser(data.user);
      
      console.log('Login successful:', data.user.email);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null); // Clear previous errors
      
      const data = await authService.register(userData);
      
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      setUser(data.user);
      
      console.log('Registration successful:', data.user.email);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear stored credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset auth state
    setUser(null);
    setAuthError(null);
    
    console.log('User logged out');
    
    // Redirect to login
    navigate('/login');
  };

  // Combine auth state and functions into a single value
  const authValues = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    error: authError,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}