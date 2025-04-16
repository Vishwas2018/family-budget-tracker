import './Dashboard.css';

import { ExpensesTab, IncomeTab, RemindersTab, ReportsTab } from './dashboard/TabContents';
import { useEffect, useState } from 'react';

import TabView from './TabView';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

// Dashboard Icons
const Icons = {
  Income: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20"></path>
      <path d="M5 20v-8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8"></path>
      <path d="M12 4v6"></path>
      <path d="M8 8l4-4 4 4"></path>
    </svg>
  ),
  Expenses: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h20"></path>
      <path d="M5 4v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4"></path>
      <path d="M12 20v-4"></path>
      <path d="M8 16l4 4 4-4"></path>
    </svg>
  ),
  Reminders: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Reports: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="2" x2="9" y2="22"></line>
      <line x1="9" y1="12" x2="22" y2="12"></line>
    </svg>
  )
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');
  const [balanceSummary, setBalanceSummary] = useState({
    income: 6200,
    expenses: 4750,
    balance: 1450
  });
  
  // Format current date on component mount
  useEffect(() => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Define dashboard tabs with their content
  const dashboardTabs = [
    {
      id: 'income',
      label: 'Income',
      icon: Icons.Income,
      content: <IncomeTab />
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Icons.Expenses,
      content: <ExpensesTab />
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: Icons.Reminders,
      content: <RemindersTab />
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: Icons.Reports,
      content: <ReportsTab />
    }
  ];
  
  if (!user) {
    return <div className="loading-screen">Loading user data...</div>;
  }
  
  return (
    <div className="dashboard-wrapper">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Budget Dashboard</h1>
          <p className="date">{currentDate}</p>
        </div>
        
        <div className="user-section">
          <div className="user-greeting">
            <span className="greeting-text">Welcome back,</span>
            <span className="user-name">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Sign Out</button>
        </div>
      </header>
      
      {/* Financial Summary Cards */}
      <div className="finance-summary">
        <div className="summary-card income">
          <div className="card-icon">
            {Icons.Income}
          </div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="amount">${balanceSummary.income.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card expenses">
          <div className="card-icon">
            {Icons.Expenses}
          </div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="amount">${balanceSummary.expenses.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div className="card-content">
            <h3>Balance</h3>
            <p className="amount">${balanceSummary.balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Main Tab Content */}
      <div className="dashboard-tabs">
        <TabView tabs={dashboardTabs} defaultTab="income" />
      </div>
    </div>
  );
}

export default Dashboard;