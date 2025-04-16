import { useEffect, useState } from 'react';

import { useCategories } from '../../contexts/CategoriesContext';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../contexts/TransactionsContext';

/**
 * TransactionForm component for creating and editing transactions
 * @param {Object} props - Component props
 * @param {Object} props.transaction - Transaction data for editing (optional)
 * @param {boolean} props.isEditing - Whether in edit mode or not
 */
function TransactionForm({ transaction = null, isEditing = false }) {
  const navigate = useNavigate();
  const { createTransaction, updateTransaction, isLoading } = useTransactions();
  const { incomeCategories, expenseCategories, isLoading: categoriesLoading } = useCategories();
  
  // Initialize form state
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringInterval: null
  });
  
  // Filtered categories based on selected type
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // If in edit mode, populate form with transaction data
  useEffect(() => {
    if (isEditing && transaction) {
      const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
      
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        date: formattedDate,
        isRecurring: transaction.isRecurring || false,
        recurringInterval: transaction.recurringInterval || null
      });
    }
  }, [isEditing, transaction]);
  
  // Update available categories when type changes
  useEffect(() => {
    if (formData.type === 'income') {
      setAvailableCategories(incomeCategories);
    } else {
      setAvailableCategories(expenseCategories);
    }
  }, [formData.type, incomeCategories, expenseCategories]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle special input types
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Reset recurring interval if isRecurring is unchecked
    if (name === 'isRecurring' && !checked) {
      setFormData(prev => ({
        ...prev,
        recurringInterval: null
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (isEditing) {
      // Update existing transaction
      updateTransaction({
        id: transaction._id,
        data: transactionData
      }, {
        onSuccess: () => navigate('/dashboard')
      });
    } else {
      // Create new transaction
      createTransaction(transactionData, {
        onSuccess: () => navigate('/dashboard')
      });
    }
  };
  
  return (
    <div className="transaction-form-container">
      <h2>{isEditing ? 'Edit' : 'Add'} Transaction</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Transaction Type */}
        <div className="form-group">
          <label>Transaction Type</label>
          <div className="radio-group">
            <label className={`radio-label ${formData.type === 'expense' ? 'active' : ''}`}>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
              />
              Expense
            </label>
            <label className={`radio-label ${formData.type === 'income' ? 'active' : ''}`}>
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
              />
              Income
            </label>
          </div>
        </div>
        
        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <div className="amount-input">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>
        </div>
        
        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={categoriesLoading}
          >
            <option value="">Select a category</option>
            {availableCategories.map(category => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Enter transaction details"
          ></textarea>
        </div>
        
        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Recurring Transaction */}
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="isRecurring"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
          />
          <label htmlFor="isRecurring">This is a recurring transaction</label>
        </div>
        
        {/* Recurring Interval - Only show if isRecurring is true */}
        {formData.isRecurring && (
          <div className="form-group">
            <label htmlFor="recurringInterval">Recurring Interval</label>
            <select
              id="recurringInterval"
              name="recurringInterval"
              value={formData.recurringInterval || ''}
              onChange={handleChange}
              required={formData.isRecurring}
            >
              <option value="">Select interval</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        )}
        
        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading.creating || isLoading.updating}
          >
            {isLoading.creating || isLoading.updating 
              ? 'Saving...' 
              : isEditing ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;