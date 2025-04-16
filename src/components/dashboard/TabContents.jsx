import { useState } from 'react';

// Income Tab Content
export const IncomeTab = () => {
  const [incomeItems, setIncomeItems] = useState([
    { id: 1, source: 'Salary', amount: 5000, date: '2025-04-05', recurring: true },
    { id: 2, source: 'Freelance', amount: 1200, date: '2025-04-12', recurring: false },
  ]);

  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    date: '',
    recurring: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewIncome(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!newIncome.source || !newIncome.amount || !newIncome.date) return;
    
    setIncomeItems(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        source: newIncome.source, 
        amount: Number(newIncome.amount), 
        date: newIncome.date,
        recurring: newIncome.recurring
      }
    ]);
    
    // Reset form
    setNewIncome({
      source: '',
      amount: '',
      date: '',
      recurring: false
    });
  };

  const deleteIncome = (id) => {
    setIncomeItems(prev => prev.filter(item => item.id !== id));
  };

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="income-tab">
      <div className="tab-header">
        <h2>Income</h2>
        <div className="total-summary">
          Total: <span className="amount">${totalIncome.toLocaleString()}</span>
        </div>
      </div>

      <div className="content-grid">
        <div className="data-list">
          <h3>Income Sources</h3>
          {incomeItems.length === 0 ? (
            <p className="empty-list">No income sources added yet.</p>
          ) : (
            <ul className="finance-list">
              {incomeItems.map(item => (
                <li key={item.id} className="finance-item">
                  <div className="item-details">
                    <h4>{item.source}</h4>
                    <div className="item-meta">
                      <span className="date">{new Date(item.date).toLocaleDateString()}</span>
                      {item.recurring && <span className="recurring-badge">Recurring</span>}
                    </div>
                  </div>
                  <div className="item-amount">${item.amount.toLocaleString()}</div>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteIncome(item.id)}
                    aria-label="Delete income item"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="entry-form">
          <h3>Add New Income</h3>
          <form onSubmit={handleAddIncome}>
            <div className="form-group">
              <label htmlFor="income-source">Source</label>
              <input
                id="income-source"
                type="text"
                name="source"
                value={newIncome.source}
                onChange={handleInputChange}
                placeholder="e.g., Salary, Freelance"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="income-amount">Amount ($)</label>
              <input
                id="income-amount"
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={newIncome.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="income-date">Date Received</label>
              <input
                id="income-date"
                type="date"
                name="date"
                value={newIncome.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group checkbox">
              <input
                id="income-recurring"
                type="checkbox"
                name="recurring"
                checked={newIncome.recurring}
                onChange={handleInputChange}
              />
              <label htmlFor="income-recurring">Recurring Income</label>
            </div>
            
            <button type="submit" className="btn btn-primary">Add Income</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Expenses Tab Content
export const ExpensesTab = () => {
  const [expenseItems, setExpenseItems] = useState([
    { id: 1, category: 'Rent', description: 'Monthly rent', amount: 1500, date: '2025-04-01', recurring: true },
    { id: 2, category: 'Groceries', description: 'Weekly shopping', amount: 120, date: '2025-04-10', recurring: false },
  ]);

  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    recurring: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount || !newExpense.date) return;
    
    setExpenseItems(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        category: newExpense.category, 
        description: newExpense.description,
        amount: Number(newExpense.amount), 
        date: newExpense.date,
        recurring: newExpense.recurring
      }
    ]);
    
    // Reset form
    setNewExpense({
      category: '',
      description: '',
      amount: '',
      date: '',
      recurring: false
    });
  };

  const deleteExpense = (id) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id));
  };

  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  
  const categories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Personal', 'Debt', 'Other'];

  return (
    <div className="expenses-tab">
      <div className="tab-header">
        <h2>Expenses</h2>
        <div className="total-summary">
          Total: <span className="amount expense">${totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div className="content-grid">
        <div className="data-list">
          <h3>Expense List</h3>
          {expenseItems.length === 0 ? (
            <p className="empty-list">No expenses added yet.</p>
          ) : (
            <ul className="finance-list">
              {expenseItems.map(item => (
                <li key={item.id} className="finance-item">
                  <div className="item-details">
                    <h4>{item.category}</h4>
                    <p>{item.description}</p>
                    <div className="item-meta">
                      <span className="date">{new Date(item.date).toLocaleDateString()}</span>
                      {item.recurring && <span className="recurring-badge">Recurring</span>}
                    </div>
                  </div>
                  <div className="item-amount expense">${item.amount.toLocaleString()}</div>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteExpense(item.id)}
                    aria-label="Delete expense item"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="entry-form">
          <h3>Add New Expense</h3>
          <form onSubmit={handleAddExpense}>
            <div className="form-group">
              <label htmlFor="expense-category">Category</label>
              <select
                id="expense-category"
                name="category"
                value={newExpense.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="expense-description">Description</label>
              <input
                id="expense-description"
                type="text"
                name="description"
                value={newExpense.description}
                onChange={handleInputChange}
                placeholder="Brief description"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="expense-amount">Amount ($)</label>
              <input
                id="expense-amount"
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={newExpense.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="expense-date">Date</label>
              <input
                id="expense-date"
                type="date"
                name="date"
                value={newExpense.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group checkbox">
              <input
                id="expense-recurring"
                type="checkbox"
                name="recurring"
                checked={newExpense.recurring}
                onChange={handleInputChange}
              />
              <label htmlFor="expense-recurring">Recurring Expense</label>
            </div>
            
            <button type="submit" className="btn btn-primary">Add Expense</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Reminders Tab Content
export const RemindersTab = () => {
  const [reminders, setReminders] = useState([
    { id: 1, title: 'Pay Rent', description: 'Monthly rent payment', dueDate: '2025-05-01', priority: 'high', completed: false },
    { id: 2, title: 'Car Insurance', description: 'Quarterly premium due', dueDate: '2025-06-15', priority: 'medium', completed: false },
  ]);

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReminder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.dueDate) return;
    
    setReminders(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        title: newReminder.title, 
        description: newReminder.description, 
        dueDate: newReminder.dueDate,
        priority: newReminder.priority,
        completed: false
      }
    ]);
    
    // Reset form
    setNewReminder({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
  };

  const toggleReminderStatus = (id) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: !reminder.completed } 
          : reminder
      )
    );
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  // Sort reminders: incomplete first, then by due date
  const sortedReminders = [...reminders].sort((a, b) => {
    // First by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Then by due date
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className="reminders-tab">
      <div className="tab-header">
        <h2>Payment Reminders</h2>
        <div className="reminder-summary">
          {reminders.filter(r => !r.completed).length} pending reminders
        </div>
      </div>

      <div className="content-grid">
        <div className="data-list">
          <h3>Upcoming Payments</h3>
          {reminders.length === 0 ? (
            <p className="empty-list">No payment reminders set.</p>
          ) : (
            <ul className="reminder-list">
              {sortedReminders.map(reminder => (
                <li 
                  key={reminder.id} 
                  className={`reminder-item ${reminder.completed ? 'completed' : `priority-${reminder.priority}`}`}
                >
                  <div className="reminder-check">
                    <input
                      type="checkbox"
                      checked={reminder.completed}
                      onChange={() => toggleReminderStatus(reminder.id)}
                      id={`reminder-${reminder.id}`}
                    />
                    <label htmlFor={`reminder-${reminder.id}`} className="checkbox-label"></label>
                  </div>
                  
                  <div className="reminder-details">
                    <h4 className={reminder.completed ? 'completed' : ''}>{reminder.title}</h4>
                    {reminder.description && <p>{reminder.description}</p>}
                    <div className="reminder-meta">
                      <span className="due-date">
                        Due: {new Date(reminder.dueDate).toLocaleDateString()}
                      </span>
                      <span className={`priority-badge ${reminder.priority}`}>
                        {reminder.priority}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteReminder(reminder.id)}
                    aria-label="Delete reminder"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="entry-form">
          <h3>Add New Reminder</h3>
          <form onSubmit={handleAddReminder}>
            <div className="form-group">
              <label htmlFor="reminder-title">Payment Title</label>
              <input
                id="reminder-title"
                type="text"
                name="title"
                value={newReminder.title}
                onChange={handleInputChange}
                placeholder="e.g., Credit Card Payment"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reminder-description">Description (Optional)</label>
              <input
                id="reminder-description"
                type="text"
                name="description"
                value={newReminder.description}
                onChange={handleInputChange}
                placeholder="Additional details"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reminder-date">Due Date</label>
              <input
                id="reminder-date"
                type="date"
                name="dueDate"
                value={newReminder.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reminder-priority">Priority</label>
              <select
                id="reminder-priority"
                name="priority"
                value={newReminder.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary">Add Reminder</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Reports Tab Content
export const ReportsTab = () => {
  // Simulated data for reports
  const monthlyData = {
    income: [
      { month: 'Jan', amount: 6200 },
      { month: 'Feb', amount: 6200 },
      { month: 'Mar', amount: 7100 },
      { month: 'Apr', amount: 6200 },
    ],
    expenses: [
      { month: 'Jan', amount: 5300 },
      { month: 'Feb', amount: 4900 },
      { month: 'Mar', amount: 5100 },
      { month: 'Apr', amount: 5400 },
    ]
  };
  
  const expensesByCategory = [
    { category: 'Housing', amount: 2100 },
    { category: 'Food', amount: 850 },
    { category: 'Transportation', amount: 450 },
    { category: 'Utilities', amount: 380 },
    { category: 'Entertainment', amount: 320 },
    { category: 'Other', amount: 650 },
  ];
  
  const calculateSavings = () => {
    const totalIncome = monthlyData.income.reduce((sum, month) => sum + month.amount, 0);
    const totalExpenses = monthlyData.expenses.reduce((sum, month) => sum + month.amount, 0);
    return totalIncome - totalExpenses;
  };
  
  const totalSavings = calculateSavings();
  const savingsRate = (totalSavings / monthlyData.income.reduce((sum, month) => sum + month.amount, 0)) * 100;
  
  return (
    <div className="reports-tab">
      <div className="tab-header">
        <h2>Financial Reports</h2>
      </div>
      
      <div className="reports-grid">
        <div className="summary-card">
          <h3>Financial Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Income</span>
              <span className="stat-value">
                ${monthlyData.income.reduce((sum, month) => sum + month.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value expense">
                ${monthlyData.expenses.reduce((sum, month) => sum + month.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="stat-item highlight">
              <span className="stat-label">Total Savings</span>
              <span className="stat-value savings">
                ${totalSavings.toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Savings Rate</span>
              <span className="stat-value">
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Monthly Overview</h3>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="bar-chart">
                {monthlyData.income.map((month, index) => (
                  <div className="month-column" key={month.month}>
                    <div className="chart-bars">
                      <div 
                        className="income-bar"
                        style={{height: `${(month.amount / 8000) * 200}px`}}
                        title={`Income: $${month.amount}`}
                      ></div>
                      <div 
                        className="expense-bar"
                        style={{height: `${(monthlyData.expenses[index].amount / 8000) * 200}px`}}
                        title={`Expenses: $${monthlyData.expenses[index].amount}`}
                      ></div>
                    </div>
                    <div className="month-label">{month.month}</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color income"></span>
                  <span>Income</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color expense"></span>
                  <span>Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="expenses-breakdown">
          <h3>Expense Breakdown</h3>
          <div className="pie-chart-placeholder">
            <div className="category-breakdown">
              {expensesByCategory.map(category => (
                <div className="category-item" key={category.category}>
                  <div className="category-bar-container">
                    <div 
                      className="category-bar"
                      style={{
                        width: `${(category.amount / expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)) * 100}%`,
                        backgroundColor: getCategoryColor(category.category)
                      }}
                    ></div>
                  </div>
                  <div className="category-details">
                    <span className="category-name">{category.category}</span>
                    <span className="category-amount">${category.amount}</span>
                    <span className="category-percentage">
                      {((category.amount / expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="savings-goals">
          <h3>Savings Goals</h3>
          <div className="goals-list">
            <div className="goal-item">
              <div className="goal-info">
                <h4>Emergency Fund</h4>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '65%'}}></div>
                  </div>
                  <div className="progress-numbers">
                    <span>$6,500 of $10,000</span>
                    <span>65%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-info">
                <h4>Vacation</h4>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '30%'}}></div>
                  </div>
                  <div className="progress-numbers">
                    <span>$1,200 of $4,000</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-info">
                <h4>New Car</h4>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '10%'}}></div>
                  </div>
                  <div className="progress-numbers">
                    <span>$3,000 of $30,000</span>
                    <span>10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for category colors
function getCategoryColor(category) {
  const colors = {
    'Housing': '#4f46e5',
    'Food': '#10b981',
    'Transportation': '#f59e0b',
    'Utilities': '#6366f1',
    'Healthcare': '#ef4444',
    'Entertainment': '#8b5cf6',
    'Shopping': '#ec4899',
    'Personal': '#14b8a6',
    'Debt': '#f43f5e',
    'Other': '#64748b'
  };
  
  return colors[category] || '#64748b';
}