import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useCategories } from '../../contexts/CategoriesContext';
import { useTransactions } from '../../contexts/TransactionsContext';

/**
 * TransactionList component
 * Displays a paginated list of transactions with filtering options
 */
function TransactionList() {
  const { 
    transactions, 
    pagination, 
    isLoading,
    filters,
    setFilters,
    dateRange,
    setDateRange,
    deleteTransaction
  } = useTransactions();
  
  const { categories } = useCategories();
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, page: 1 }); // Reset to page 1 when filters change
  };
  
  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setFilters({ ...filters, page: newPage });
  };
  
  // Handle transaction deletion with confirmation
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
      deleteTransaction(id);
    }
  };
  
  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get category color based on name
  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#64748b'; // Default color if not found
  };
  
  return (
    <div className="transaction-list-container">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">From</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              setFilters({ type: '', category: '', page: 1, limit: 20 });
              setDateRange({ startDate: null, endDate: null });
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Transactions Table */}
      {isLoading.transactions ? (
        <div className="loading-container">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found matching your filters.</p>
          <Link to="/dashboard/transactions/new" className="btn btn-primary">Add Your First Transaction</Link>
        </div>
      ) : (
        <>
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction._id} className={transaction.type}>
                    <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                    <td>
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(transaction.category) }}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="description-cell">
                      {transaction.description || <span className="no-description">No description</span>}
                    </td>
                    <td className={`amount-cell ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="actions-cell">
                      <Link 
                        to={`/dashboard/transactions/${transaction._id}/edit`} 
                        className="action-btn edit-btn"
                        title="Edit"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="action-btn delete-btn"
                        title="Delete"
                        disabled={isLoading.deleting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                &laquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                &lsaquo;
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TransactionList;