import { Link, useNavigate } from 'react-router-dom';

import axios from 'axios';
import { useAuth } from '../App';
import { useState } from 'react';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      
      const response = await axios.post('/api/users/register', registerData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Use auth context login function
      login(response.data.user, response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      
      // Handle different error scenarios
      if (err.response) {
        // Server responded with an error status
        if (err.response.status === 400) {
          setError(err.response.data?.message || 'This email may already be registered.');
        } else {
          setError('Registration failed. Please try again later.');
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
    <div className="register-container">
      <h2>Create Your <span>Account</span></h2>
      {error && <div className="error-message">{error}</div>}
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
            minLength="6"
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
            minLength="6"
          />
        </div>
        <button type="submit" className={loading ? 'loading' : ''} disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default Register;