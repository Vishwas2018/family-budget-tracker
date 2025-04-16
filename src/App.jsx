import './App.css';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';

import Dashboard from './components/Dashboard';
// Components
import Login from './components/Login';
import Register from './components/Register';
import axios from 'axios';

// Create auth context
export const AuthContext = createContext();

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Background elements for unique design
const BackgroundElements = () => (
  <>
    <div className="floating-element floating-element-1"></div>
    <div className="floating-element floating-element-2"></div>
    <div className="floating-element floating-element-3"></div>
    <div className="shape-divider">
      <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
      </svg>
    </div>
  </>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios default headers when token exists
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set auth token in axios headers
        setAuthToken(token);
        
        // Get user data from localStorage
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          // If token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthToken(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Auth context value
  const authContextValue = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter>
        <div className="app-container">
          <BackgroundElements />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;