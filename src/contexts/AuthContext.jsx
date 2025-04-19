import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import authService from '../api/authService';
import toast from 'react-hot-toast';

// Create a single Auth context to be used throughout the application
const AuthContext = createContext(null);

/**
 * Authentication provider component that manages user authentication state
 * With improved handling of redirection and error notifications
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize auth state from localStorage on component mount
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

              // If on login page, redirect to dashboard
              if (location.pathname === '/login') {
                navigate('/dashboard');
              }
            } else {
              // If token is invalid, clear storage but don't redirect if on login/register pages
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              console.log('Token validation failed - user will need to login');
              
              // Only redirect if not already on login or register page
              if (location.pathname !== '/login' && location.pathname !== '/register') {
                navigate('/login');
              }
            }
          } catch (error) {
            // Handle token verification error
            console.error('Token validation error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Only redirect if not already on login or register page
            if (location.pathname !== '/login' && location.pathname !== '/register') {
              navigate('/login');
            }
          }
        } else {
          // No stored credentials found - redirect if not on login or register page
          console.log('No stored credentials found - user needs to login');
          if (location.pathname !== '/login' && location.pathname !== '/register') {
            navigate('/login');
          }
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
  }, [navigate, location.pathname]);

  /**
   * Handles user login with credentials
   * @param {Object} credentials - User credentials (email, password)
   * @returns {Object} Result with success status and optional error
   */
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
      toast.success('Login successful!');
      
      // Redirect to dashboard or stored location
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      setAuthError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user registration with new account details
   * @param {Object} userData - New user data (name, email, password)
   * @returns {Object} Result with success status and optional error
   */
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
      toast.success('Registration successful!');
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      
      setAuthError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user logout and cleanup
   */
  const logout = () => {
    // Clear stored credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset auth state
    setUser(null);
    setAuthError(null);
    
    console.log('User logged out');
    toast.success('Logged out successfully');
    
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
 * Hook to use the auth context throughout the application
 * @returns {Object} Authentication context with user state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}