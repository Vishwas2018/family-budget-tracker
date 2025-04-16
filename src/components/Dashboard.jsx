import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="user-greeting">Hello, <span className="text-primary">{user.name}</span></h1>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </div>
      <div className="dashboard-content">
        <p>Your budget dashboard is ready for you to start tracking expenses and income.</p>
        <p>From here, you can manage your financial goals and monitor your spending habits.</p>
        
        <div className="user-info">
          <p><strong>Account Information</strong></p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Account ID:</strong> {user._id}</p>
          <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;