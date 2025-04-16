import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

/**
 * Login page component
 * Handles user authentication
 */
function Login() {
  const { login, error, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (formError) setFormError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    // Attempt login
    try {
      const result = await login(formData);
      if (!result.success) {
        setFormError(result.error?.response?.data?.message || 'Login failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Login submission error:', err);
    }
  };
  
  return (
    <div className="login-container">
      <h2>Welcome <span>Back</span></h2>
      
      {/* Show form errors */}
      {(formError || error) && (
        <div className="error-message">
          {formError || error}
        </div>
      )}
      
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
          className={isLoading ? 'loading' : ''}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <p>
        Don't have an account? <Link to="/register">Create one now</Link>
      </p>
    </div>
  );
}

export default Login;