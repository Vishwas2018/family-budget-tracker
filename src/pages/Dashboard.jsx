import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../providers/AppProvider';

/**
 * Dashboard page component
 * Displays financial summary and transaction data
 */
function Dashboard() {
  const { user } = useAuth();
  const { success } = useNotifications();
  const [currentDate, setCurrentDate] = useState('');
  
  // Demo data - would come from API in actual implementation
  const [summary, setSummary] = useState({
    income: 6200,
    expenses: 4750,
    balance: 1450
  });
  
  // Format current date on component mount
  useEffect(() => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
    
    // Notification demo - show welcome message
    success(`Welcome back, ${user?.name || 'User'}!`);
  }, [success, user]);
  
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
            <span className="user-name">{user?.name}</span>
          </div>
        </div>
      </header>
      
      {/* Financial Summary Cards */}
      <div className="finance-summary">
        <div className="summary-card income">
          <div className="card-icon">
            {/* Income Icon placeholder */}
            <span>💰</span>
          </div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="amount">${summary.income.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card expenses">
          <div className="card-icon">
            {/* Expense Icon placeholder */}
            <span>💸</span>
          </div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="amount">${summary.expenses.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="card-icon">
            {/* Balance Icon placeholder */}
            <span>📊</span>
          </div>
          <div className="card-content">
            <h3>Balance</h3>
            <p className="amount">${summary.balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="dashboard-content">
        <h2>Recent Transactions</h2>
        <p>This is a placeholder for the transaction list. When connected to the API, this will display your recent financial transactions.</p>
        
        <div className="action-buttons">
          <button className="btn btn-primary">Add Transaction</button>
          <button className="btn btn-secondary">View Reports</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;