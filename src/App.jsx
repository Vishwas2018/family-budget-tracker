import './App.css';

import { Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Register from './pages/Register';
import { useAuth } from './contexts/AuthContext';

/**
 * Main application component with routing configuration
 */
function App() {
  const { isLoading } = useAuth();

  // Show loading indicator while initial auth state is being determined
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/dashboard/*" element={
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
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;