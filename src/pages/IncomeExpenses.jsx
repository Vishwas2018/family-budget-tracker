import { useCallback, useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

/**
 * Component for managing income and expense categories
 * with user input functionality and calculated monthly/annual amounts
 */
const IncomeExpenses = () => {
  // Determine if we're viewing income or expenses based on the current route
  const location = useLocation();
  const isIncome = location.pathname.includes('/income');
  const pageTitle = isIncome ? 'Income Sources' : 'Expense Categories';
  
  // Main data state
  const [items, setItems] = useState(() => {
    // Initialize from localStorage if available
    const storedData = localStorage.getItem(isIncome ? 'incomeItems' : 'expenseItems');
    return storedData ? JSON.parse(storedData) : [];
  });
  
  // State for filtered data view
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Form state for adding new items
  const [formData, setFormData] = useState({
    categoryType: '',
    category: '',
    type: '',
    description: '',
    frequency: 'Monthly',
    amount: '',
  });
  
  // State for form visibility
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Frequency conversion factors for calculating monthly and annual amounts
  const frequencyFactors = {
    Daily: { monthly: 30, annual: 365 },
    Weekly: { monthly: 4.33, annual: 52 },
    Fortnightly: { monthly: 2.17, annual: 26 },
    Monthly: { monthly: 1, annual: 12 },
    Quarterly: { monthly: 1/3, annual: 4 },
    Biannually: { monthly: 1/6, annual: 2 },
    Annually: { monthly: 1/12, annual: 1 },
    'Need Based': { monthly: 1, annual: 12 }, // Assuming monthly for need-based
  };
  
  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      isIncome ? 'incomeItems' : 'expenseItems', 
      JSON.stringify(items)
    );
  }, [items, isIncome]);
  
  // Filter items based on selected category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.categoryType === selectedCategory));
    }
  }, [selectedCategory, items]);
  
  // Format currency amounts
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }, []);
  
  // Get unique category types for filter dropdown
  const getCategoryTypes = useCallback(() => {
    const uniqueTypes = [...new Set(items.map(item => item.categoryType))];
    return ['All', ...uniqueTypes].filter(Boolean); // Remove empty values
  }, [items]);
  
  // Calculate monthly and annual amounts based on frequency and amount
  const calculateAmounts = useCallback((amount, frequency) => {
    const factor = frequencyFactors[frequency] || frequencyFactors.Monthly;
    
    return {
      monthlyAmount: amount * factor.monthly,
      annualAmount: amount * factor.annual
    };
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert amount to number if it's the amount field
    if (name === 'amount' && value !== '') {
      processedValue = parseFloat(value);
    }
    
    setFormData({ ...formData, [name]: processedValue });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.categoryType || !formData.amount || formData.amount <= 0) {
      alert('Please provide at least Category Type and a valid Amount');
      return;
    }
    
    // Calculate monthly and annual amounts
    const { monthlyAmount, annualAmount } = calculateAmounts(
      parseFloat(formData.amount),
      formData.frequency
    );
    
    // Create new item with calculated amounts
    const newItem = {
      id: Date.now(), // Use timestamp as unique ID
      ...formData,
      amount: parseFloat(formData.amount),
      monthlyAmount,
      annualAmount
    };
    
    // Add to items array
    setItems(prev => [...prev, newItem]);
    
    // Reset form
    setFormData({
      categoryType: '',
      category: '',
      type: '',
      description: '',
      frequency: 'Monthly',
      amount: '',
    });
    
    // Hide form after submission
    setIsFormVisible(false);
  };
  
  // Handle item deletion
  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };
  
  // Calculate totals for the filtered data
  const calculateTotals = useCallback(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        monthlyTotal: acc.monthlyTotal + item.monthlyAmount,
        annualTotal: acc.annualTotal + item.annualAmount
      }),
      { monthlyTotal: 0, annualTotal: 0 }
    );
  }, [filteredItems]);
  
  const totals = calculateTotals();
  
  return (
    <div className="income-expenses-page">
      <header className="page-header">
        <h1>{pageTitle}</h1>
        
        <div className="header-actions">
          <div className="filter-controls">
            <label htmlFor="categoryFilter">Filter by Category:</label>
            <select 
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {getCategoryTypes().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormVisible(prev => !prev)}
          >
            {isFormVisible ? 'Cancel' : `Add ${isIncome ? 'Income' : 'Expense'}`}
          </button>
        </div>
      </header>
      
      {/* Form for adding new items */}
      {isFormVisible && (
        <div className="add-item-form">
          <h2>Add New {isIncome ? 'Income' : 'Expense'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoryType">Category Type*</label>
                <input
                  type="text"
                  id="categoryType"
                  name="categoryType"
                  value={formData.categoryType}
                  onChange={handleInputChange}
                  placeholder="e.g. Salary, Investment, etc."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Mortgage Repayments"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g. 3 Ferguson Drive"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Variable One"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="frequency">Frequency*</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Biannually">Biannually</option>
                  <option value="Annually">Annually</option>
                  <option value="Need Based">Need Based</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount*</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Add {isIncome ? 'Income' : 'Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-label">Monthly Total:</span>
          <span className="summary-value">{formatCurrency(totals.monthlyTotal)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Annual Total:</span>
          <span className="summary-value">{formatCurrency(totals.annualTotal)}</span>
        </div>
      </div>
      
      {/* Data table */}
      {filteredItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sr #</th>
                <th>Category Type</th>
                <th>Category</th>
                <th>Type</th>
                <th>Description</th>
                <th>Frequency</th>
                <th>Amount</th>
                <th>Monthly Amount</th>
                <th>Annual Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.categoryType}</td>
                  <td>{item.category}</td>
                  <td>{item.type}</td>
                  <td>{item.description}</td>
                  <td>{item.frequency}</td>
                  <td className="amount-cell">{formatCurrency(item.amount)}</td>
                  <td className="amount-cell">{formatCurrency(item.monthlyAmount)}</td>
                  <td className="amount-cell">{formatCurrency(item.annualAmount)}</td>
                  <td>
                    <button 
                      className="btn-icon delete-btn" 
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="7" className="total-label">Totals</td>
                <td className="total-value">{formatCurrency(totals.monthlyTotal)}</td>
                <td className="total-value">{formatCurrency(totals.annualTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No {isIncome ? 'income' : 'expense'} items found.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormVisible(true)}
          >
            Add Your First {isIncome ? 'Income' : 'Expense'} Item
          </button>
        </div>
      )}
    </div>
  );
};

export default IncomeExpenses;