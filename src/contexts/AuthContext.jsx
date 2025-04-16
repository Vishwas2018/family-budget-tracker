import { createContext, useContext, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import authService from '../api/authService';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../providers/AppProvider';

// Create Auth context
const AuthContext = createContext(null);

/**
 * Authentication provider component that manages user authentication state
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error: showError } = useNotifications();

  // User data query - uses localStorage to restore immediate state,
  // then validates via API
  const { 
    data: user,
    error,
    status
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // Try to get stored user first
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      
      try {
        // Validate token with API
        const isAuthenticated = await authService.checkAuth();
        if (!isAuthenticated) {
          throw new Error('Authentication failed');
        }
        
        // Return stored user if valid
        return JSON.parse(storedUser);
      } catch (error) {
        // Clear invalid credentials
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw error;
      }
    },
    retry: false,
  });

  // Effect to handle authentication errors
  useEffect(() => {
    if (error && status === 'error') {
      showError('Authentication session expired. Please login again.');
    }
  }, [error, status, showError]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      // Show success message
      success('Login successful!');
      
      // Redirect to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      showError(message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      // Show success message
      success('Account created successfully!');
      
      // Redirect to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed';
      showError(message);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      // Update stored user data
      const updatedUser = { 
        ...user, 
        name: data.name,
        email: data.email 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update auth state
      queryClient.setQueryData(['auth', 'user'], updatedUser);
      
      // Show success message
      success('Profile updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Profile update failed';
      showError(message);
    },
  });

  // Logout function
  const logout = () => {
    // Clear stored credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset auth state
    queryClient.setQueryData(['auth', 'user'], null);
    
    // Invalidate all queries to force refetch when logging in again
    queryClient.invalidateQueries();
    
    // Show success message
    success('Logged out successfully');
    
    // Redirect to login
    navigate('/login');
  };

  // Combine auth state and functions into a single value
  const authValues = {
    user,
    isAuthenticated: !!user,
    isLoading: status === 'loading',
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    logout,
    loginStatus: loginMutation.status,
    registerStatus: registerMutation.status,
    updateProfileStatus: updateProfileMutation.status,
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