import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 404 Not Found page component
 * Displays when a route doesn't match any defined routes
 */
function NotFound() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        
        <div className="not-found-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotFound;