import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

/**
 * Login page component
 * Handles user authentication
 */
function Login() {
  const { isAuthenticated, login, loginStatus } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };
  
  return (
    <div className="login-container">
      <h2>Welcome <span>Back</span></h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={loginStatus === 'pending' ? 'loading' : ''}
          disabled={loginStatus === 'pending'}
        >
          {loginStatus === 'pending' ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <p>
        Don't have an account? <Link to="/register">Create one now</Link>
      </p>
    </div>
  );
}

export default Login;