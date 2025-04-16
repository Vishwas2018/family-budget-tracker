import './App.css';

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Navigation from './components/layout/Navigation';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Register from './pages/Register';
// Hooks and Context
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';

/**
 * Main application component with routing configuration
 */
function App() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log('Auth state:', { 
      isLoading, 
      isAuthenticated,
      hasUser: !!user,
      currentPath: location.pathname
    });
  }, [isLoading, isAuthenticated, user, location.pathname]);

  // Show loading indicator while authentication is being determined
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      
      <div className="app-container">
        {/* Background Elements */}
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        
        <div className="shape-divider">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
        
        <Routes>
          {/* Public routes - redirect to dashboard if already logged in */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
          } />
          
          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Redirect to dashboard if logged in, otherwise login */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

export default App;