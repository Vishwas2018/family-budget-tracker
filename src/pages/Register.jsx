import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

/**
 * Register page component
 * Handles new user registration
 */
function Register() {
  const { isAuthenticated, register: registerUser, registerStatus } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear password error when user types in either password field
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Send registration data without confirmPassword
    const { confirmPassword, ...registrationData } = formData;
    registerUser(registrationData);
  };
  
  return (
    <div className="register-container">
      <h2>Create Your <span>Account</span></h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>
        
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
            placeholder="Min. 6 characters"
            required
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            minLength={6}
          />
          {passwordError && <p className="error-text">{passwordError}</p>}
        </div>
        
        <button 
          type="submit" 
          className={registerStatus === 'pending' ? 'loading' : ''}
          disabled={registerStatus === 'pending'}
        >
          {registerStatus === 'pending' ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default Register;