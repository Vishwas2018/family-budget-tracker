import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../providers/AppProvider';
import { useTransactions } from '../contexts/TransactionsContext';

/**
 * Dashboard page component
 * Displays financial summary and transaction data with enhanced UI
 */
function Dashboard() {
  const { user } = useAuth();
  const { success } = useNotifications();
  const [currentDate, setCurrentDate] = useState('');

  // Get transaction data from context
  const {
    summary,
    transactions,
    isLoading,
    dateRange,
    setCurrentMonth,
    deleteTransaction
  } = useTransactions();

  // Placeholder data for reminders - in a real app, this would come from an API
  const [reminders] = useState([
    {
      id: 'r1',
      title: 'Rent Payment',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      amount: 1200,
      category: 'Housing',
      isPaid: false,
      isOverdue: false
    },
    {
      id: 'r2',
      title: 'Electricity Bill',
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
      amount: 85.50,
      category: 'Utilities',
      isPaid: false,
      isOverdue: true
    },
    {
      id: 'r3',
      title: 'Netflix Subscription',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      amount: 14.99,
      category: 'Entertainment',
      isPaid: false,
      isOverdue: false
    }
  ]);

  // Format current date and set date range only once on component mount
  useEffect(() => {
    // Format the current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    // Set current month for transaction filters
    setCurrentMonth();

    // Use a ref to track if the welcome message has been shown
  const welcomeShown = sessionStorage.getItem('welcomeShown');
  if (!welcomeShown) {
    // Show welcome message only once per session
    success(`Welcome back, ${user?.name || 'User'}!`);
    sessionStorage.setItem('welcomeShown', 'true');
  }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

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
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Financial Overview</h2>
        </div>
        
        <div className="finance-summary">
          <div className="summary-card income">
            <div className="card-icon">
              <span>💰</span>
            </div>
            <div className="card-content">
              <h3>Total Income</h3>
              <p className="amount">
                {isLoading.summary
                  ? '$...'
                  : formatCurrency(summary?.income || 0)
                }
              </p>
              <div className="trend positive">
                <span>↑ 12.5% vs last month</span>
              </div>
            </div>
          </div>

          <div className="summary-card expenses">
            <div className="card-icon">
              <span>💸</span>
            </div>
            <div className="card-content">
              <h3>Total Expenses</h3>
              <p className="amount">
                {isLoading.summary
                  ? '$...'
                  : formatCurrency(summary?.expenses || 0)
                }
              </p>
              <div className="trend negative">
                <span>↓ 3.2% vs last month</span>
              </div>
            </div>
          </div>

          <div className="summary-card balance">
            <div className="card-icon">
              <span>📊</span>
            </div>
            <div className="card-content">
              <h3>Balance</h3>
              <p className="amount">
                {isLoading.summary
                  ? '$...'
                  : formatCurrency(summary?.balance || 0)
                }
              </p>
            </div>
          </div>
          
          <div className="summary-card savings">
            <div className="card-icon">
              <span>🏦</span>
            </div>
            <div className="card-content">
              <h3>Savings</h3>
              <p className="amount">
                {isLoading.summary
                  ? '$...'
                  : formatCurrency((summary?.income || 0) * 0.1)
                }
              </p>
              <div className="trend positive">
                <span>↑ 5.3% growth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content in Grid Layout */}
      <div className="dashboard-grid">
        {/* Recent Transactions Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/dashboard/transactions" className="section-action">
              View All →
            </Link>
          </div>

          {isLoading.transactions ? (
            <div className="transaction-list-loading">
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="transaction-list-empty">
              <p>No transactions found for the selected period.</p>
              <Link to="/dashboard/transactions/new" className="btn btn-sm btn-primary">
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="transactions-list">
              {/* Show at most 5 most recent transactions */}
              {transactions.slice(0, 5).map(transaction => (
                <div key={transaction._id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <div className="transaction-category">{transaction.category}</div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    {transaction.description && (
                      <div className="transaction-description">{transaction.description}</div>
                    )}
                  </div>
                  <div className="transaction-amount">
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              
              <div className="transaction-list-footer">
                <Link to="/dashboard/transactions" className="btn btn-secondary btn-sm">
                  View all transactions
                </Link>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <Link to="/dashboard/transactions/new" className="btn btn-primary">
              Add Transaction
            </Link>
          </div>
        </div>
        
        {/* Reminders & Bills Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Bills & Reminders</h2>
            <button className="section-action">
              Add Reminder
            </button>
          </div>

          <div className="reminders-list">
            {reminders
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .map(reminder => {
                // Calculate days remaining
                const daysRemaining = Math.ceil(
                  (new Date(reminder.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                
                // Determine reminder status
                let statusText = '';
                let statusClass = '';
                
                if (reminder.isPaid) {
                  statusText = 'Paid';
                  statusClass = 'paid';
                } else if (reminder.isOverdue) {
                  statusText = 'Overdue';
                  statusClass = 'overdue';
                } else if (daysRemaining <= 3) {
                  statusText = 'Due soon';
                  statusClass = 'due-soon';
                } else {
                  statusText = `${daysRemaining} days left`;
                  statusClass = 'upcoming';
                }
                
                return (
                  <div 
                    key={reminder.id} 
                    className={`reminder-card ${statusClass}`}
                  >
                    <div className="reminder-header">
                      <h4 className="reminder-title">{reminder.title}</h4>
                      <span className={`reminder-status ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    
                    <div className="reminder-details">
                      <div className="reminder-info">
                        <div className="reminder-category">{reminder.category}</div>
                        <div className="reminder-date">
                          {new Date(reminder.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="reminder-amount">
                        {formatCurrency(reminder.amount)}
                      </div>
                    </div>
                    
                    {!reminder.isPaid && (
                      <div className="reminder-actions">
                        <button className="btn-sm btn-primary">
                          Mark as Paid
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          
          <div className="action-buttons">
            <button className="btn btn-secondary">
              Manage All Reminders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;