import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

/**
 * Component that protects routes from unauthenticated access
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  // Still loading authentication state - show a minimal loader
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Not authenticated, redirect to login with return path
  if (!isAuthenticated || !user) {
    console.log('Protected route: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admin route check
  if (adminOnly && !isAdmin) {
    console.log('Protected route: Not an admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated (and admin if required), render children
  return children;
}

export default ProtectedRoute;