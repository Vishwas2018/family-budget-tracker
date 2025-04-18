import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

/**
 * Component for displaying a list of transactions with optional filtering
 */
const TransactionList = ({ 
  transactions = [], 
  isLoading = false,
  limit = 5,
  showViewAll = true,
  onDeleteTransaction = null
}) => {
  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Render placeholder loading state
  if (isLoading) {
    return (
      <div className="transaction-list-loading">
        {Array(limit).fill(0).map((_, index) => (
          <div key={index} className="transaction-item skeleton">
            <div className="transaction-info">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line shorter"></div>
            </div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }
  
  // Render empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div className="transaction-list-empty">
        <p>No transactions found for the selected period.</p>
        <Link to="/dashboard/transactions/new" className="btn btn-sm btn-primary">
          Add your first transaction
        </Link>
      </div>
    );
  }
  
  // Show limited transactions
  const displayedTransactions = transactions.slice(0, limit);
  
  return (
    <div className="transaction-list">
      {displayedTransactions.map(transaction => (
        <div key={transaction._id} className={`transaction-item ${transaction.type}`}>
          <div className="transaction-info">
            <div className="transaction-category">{transaction.category}</div>
            <div className="transaction-date">
              {format(new Date(transaction.date), 'MMM dd, yyyy')}
            </div>
            {transaction.description && (
              <div className="transaction-description">{transaction.description}</div>
            )}
          </div>
          
          <div className="transaction-details">
            <div className="transaction-amount">
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
            
            {onDeleteTransaction && (
              <div className="transaction-actions">
                <Link to={`/dashboard/transactions/${transaction._id}/edit`} className="btn-icon" title="Edit">
                  ✏️
                </Link>
                <button 
                  onClick={() => onDeleteTransaction(transaction._id)} 
                  className="btn-icon"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {showViewAll && transactions.length > limit && (
        <div className="transaction-list-footer">
          <Link to="/dashboard/transactions" className="btn btn-secondary btn-sm">
            View all ({transactions.length}) transactions
          </Link>
        </div>
      )}
    </div>
  );
};

TransactionList.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['income', 'expense']).isRequired,
      amount: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
      description: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
    })
  ),
  isLoading: PropTypes.bool,
  limit: PropTypes.number,
  showViewAll: PropTypes.bool,
  onDeleteTransaction: PropTypes.func
};

export default TransactionList;