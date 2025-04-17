import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../providers/AppProvider';
import { useTransactions } from '../contexts/TransactionsContext';

/**
 * Dashboard page component
 * Displays financial summary and transaction data
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
    setCurrentMonth
  } = useTransactions();

  // Format current date and set date range only once on component mount
  useEffect(() => {
    // Format the current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    // Set current month for transaction filters
    setCurrentMonth();

    // Show welcome message
    success(`Welcome back, ${user?.name || 'User'}!`);

    // This effect should run only once on mount, dependencies are intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <span>💰</span>
          </div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="amount">
              ${isLoading.summary
                ? '...'
                : (summary?.income || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              }
            </p>
          </div>
        </div>

        <div className="summary-card expenses">
          <div className="card-icon">
            <span>💸</span>
          </div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="amount">
              ${isLoading.summary
                ? '...'
                : (summary?.expenses || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              }
            </p>
          </div>
        </div>

        <div className="summary-card balance">
          <div className="card-icon">
            <span>📊</span>
          </div>
          <div className="card-content">
            <h3>Balance</h3>
            <p className="amount">
              ${isLoading.summary
                ? '...'
                : (summary?.balance || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <h2>Recent Transactions</h2>

        {isLoading.transactions ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found for the selected period. Add your first transaction to get started!</p>
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
                </div>
                <div className="transaction-amount">
                  {transaction.type === 'income' ? '+' : '-'}
                  ${transaction.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="action-buttons">
          <Link to="/dashboard/transactions/new" className="btn btn-primary">Add Transaction</Link>
          <Link to="/dashboard/transactions" className="btn btn-secondary">View All Transactions</Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;