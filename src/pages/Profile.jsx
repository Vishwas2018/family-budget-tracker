import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../providers/AppProvider';

/**
 * User profile page component
 * Allows users to view and update their profile information
 */
function Profile() {
  const { user, updateProfile, updateProfileStatus, logout } = useAuth();
  const { success } = useNotifications();
  
  // Initialize form with user data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);
  
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
    
    // Only validate passwords if user is trying to change password
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      
      if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
    }
    
    // Remove confirmPassword and only include password if it's provided
    const updateData = {
      name: formData.name,
      email: formData.email
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateProfile(updateData);
    
    // Clear password fields after submission
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
    
    success('Profile updated successfully');
  };
  
  const handleLogout = () => {
    logout();
  };
  
  if (!user) {
    return <div className="loading-screen">Loading profile...</div>;
  }
  
  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Your Profile</h1>
        <div className="profile-actions">
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
          <button onClick={handleLogout} className="btn btn-danger">Sign Out</button>
        </div>
      </header>
      
      <div className="profile-content">
        <div className="profile-card">
          <h2>Personal Information</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                required
              />
            </div>
            
            <h3>Change Password</h3>
            <p className="form-info">Leave blank to keep your current password</p>
            
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                placeholder="Min. 6 characters"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                placeholder="Confirm your new password"
              />
              {passwordError && <p className="error-text">{passwordError}</p>}
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary ${updateProfileStatus === 'pending' ? 'loading' : ''}`}
              disabled={updateProfileStatus === 'pending'}
            >
              {updateProfileStatus === 'pending' ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        
        <div className="profile-info">
          <h3>Account Details</h3>
          <p><strong>Account Type:</strong> {user.role || 'User'}</p>
          <p><strong>Member Since:</strong> {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;