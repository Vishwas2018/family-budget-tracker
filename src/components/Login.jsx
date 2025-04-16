import { Link, useNavigate } from 'react-router-dom';

import axios from 'axios';
import { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use API endpoint with full URL during development
      const response = await axios.post('/api/users/login', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Store authentication data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update authentication state
      if (onLoginSuccess) onLoginSuccess();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      
      // Handle different error scenarios
      if (err.response) {
        // Server responded with an error status
        if (err.response.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.response.status === 400) {
          setError(err.response.data?.message || 'Please check your information and try again.');
        } else {
          setError('Login failed. Please try again later.');
        }
      } else if (err.request) {
        // Request was made but no response
        setError('Cannot connect to the server. Please check your internet connection.');
      } else {
        // Something else caused the error
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome <span>Back</span></h2>
      {error && <div className="error-message">{error}</div>}
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
        <button type="submit" className={loading ? 'loading' : ''} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Create one now</Link>
      </p>
    </div>
  );
}

export default Login;