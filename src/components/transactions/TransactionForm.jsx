import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
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
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringInterval: null
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
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
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      // Allow dates up to 5 years in the future and 10 years in the past
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() + 5);
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 10);
      
      if (selectedDate > maxDate) {
        newErrors.date = 'Date cannot be more than 5 years in the future';
      } else if (selectedDate < minDate) {
        newErrors.date = 'Date cannot be more than 10 years in the past';
      }
    }
    
    // Recurring interval validation
    if (formData.isRecurring && !formData.recurringInterval) {
      newErrors.recurringInterval = 'Please select a recurrence interval';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input focus (for validation)
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateForm();
  };
  
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
    
    // Clear error for this field when user is typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }), {}
    );
    setTouched(allTouched);
    
    // Validate all fields
    const isValid = validateForm();
    
    if (!isValid) {
      return; // Don't submit if there are validation errors
    }
    
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
  
  // Helper to determine if a field has an error
  const hasError = (field) => {
    return touched[field] && errors[field];
  };
  
  return (
    <div className="transaction-form-container">
      <h2>{isEditing ? 'Edit' : 'Add'} Transaction</h2>
      
      <form onSubmit={handleSubmit} noValidate>
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
        <div className={`form-group ${hasError('amount') ? 'error' : ''}`}>
          <label htmlFor="amount">Amount</label>
          <div className="amount-input">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              aria-invalid={hasError('amount')}
              aria-describedby={hasError('amount') ? "amount-error" : undefined}
            />
          </div>
          {hasError('amount') && (
            <p className="error-text" id="amount-error">{errors.amount}</p>
          )}
        </div>
        
        {/* Category */}
        <div className={`form-group ${hasError('category') ? 'error' : ''}`}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={categoriesLoading}
            aria-invalid={hasError('category')}
            aria-describedby={hasError('category') ? "category-error" : undefined}
          >
            <option value="">Select a category</option>
            {availableCategories.map(category => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          {hasError('category') && (
            <p className="error-text" id="category-error">{errors.category}</p>
          )}
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
            maxLength={200}
          ></textarea>
          <p className="char-count">
            {formData.description.length}/200 characters
          </p>
        </div>
        
        {/* Date */}
        <div className={`form-group ${hasError('date') ? 'error' : ''}`}>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={hasError('date')}
            aria-describedby={hasError('date') ? "date-error" : undefined}
          />
          {hasError('date') && (
            <p className="error-text" id="date-error">{errors.date}</p>
          )}
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
          <div className={`form-group ${hasError('recurringInterval') ? 'error' : ''}`}>
            <label htmlFor="recurringInterval">Recurring Interval</label>
            <select
              id="recurringInterval"
              name="recurringInterval"
              value={formData.recurringInterval || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              required={formData.isRecurring}
              aria-invalid={hasError('recurringInterval')}
              aria-describedby={hasError('recurringInterval') ? "interval-error" : undefined}
            >
              <option value="">Select interval</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
            {hasError('recurringInterval') && (
              <p className="error-text" id="interval-error">{errors.recurringInterval}</p>
            )}
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

// Define prop types
TransactionForm.propTypes = {
  transaction: PropTypes.shape({
    _id: PropTypes.string,
    type: PropTypes.oneOf(['income', 'expense']),
    amount: PropTypes.number,
    category: PropTypes.string,
    description: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isRecurring: PropTypes.bool,
    recurringInterval: PropTypes.oneOf([
      null, 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual'
    ])
  }),
  isEditing: PropTypes.bool
};

export default TransactionForm;