import { Link, useLocation } from 'react-router-dom';

import { useReminders } from '../contexts/RemindersContext';
import { useState } from 'react';

/**
 * Bills and Reminders page
 */
function BillsAndReminders() {
  const location = useLocation();
  
  const { 
    reminders,
    upcomingReminders, 
    overdueReminders, 
    paidReminders, 
    markAsPaid,
    addReminder,
    deleteReminder
  } = useReminders();
  
  // Initialize form visibility from navigation state or default to hidden
  const [showAddForm, setShowAddForm] = useState(location.state?.showAddForm === true);
  const [newReminder, setNewReminder] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    amount: '',
    category: ''
  });

  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReminder({
      ...newReminder,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  // Handle form submission
  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.dueDate || !newReminder.amount) {
      alert('Please fill in all required fields');
      return;
    }

    addReminder({
      ...newReminder,
      dueDate: new Date(newReminder.dueDate)
    });

    // Reset form
    setNewReminder({
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      amount: '',
      category: ''
    });
    setShowAddForm(false);
  };

  return (
    <div className="bills-page">
      <header className="page-header">
        <h1>Bills & Reminders</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Reminder'}
        </button>
      </header>

      {/* Add Reminder Form */}
      {showAddForm && (
        <div className="add-item-form">
          <h2>Add New Reminder</h2>
          <form onSubmit={handleAddReminder}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newReminder.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Rent Payment"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={newReminder.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Housing"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dueDate">Due Date*</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newReminder.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount*</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={newReminder.amount}
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
                Add Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bills-container">
        {/* Overdue Bills */}
        {overdueReminders.length > 0 && (
          <div className="bills-section">
            <h2 className="section-title">Overdue</h2>
            <div className="reminders-list">
              {overdueReminders.map(reminder => (
                <div key={reminder.id} className="reminder-card overdue">
                  <div className="reminder-header">
                    <h4 className="reminder-title">{reminder.title}</h4>
                    <span className="reminder-status overdue">Overdue</span>
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
                  
                  <div className="reminder-actions">
                    <button 
                      className="btn-sm btn-primary"
                      onClick={() => markAsPaid(reminder.id)}
                    >
                      Mark as Paid
                    </button>
                    <button 
                      className="btn-sm btn-secondary"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Bills */}
        <div className="bills-section">
          <h2 className="section-title">Upcoming</h2>
          <div className="reminders-list">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map(reminder => {
                const daysRemaining = Math.ceil(
                  (new Date(reminder.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const isDueSoon = daysRemaining <= 3;
                
                return (
                  <div 
                    key={reminder.id} 
                    className={`reminder-card ${isDueSoon ? 'due-soon' : 'upcoming'}`}
                  >
                    <div className="reminder-header">
                      <h4 className="reminder-title">{reminder.title}</h4>
                      <span className={`reminder-status ${isDueSoon ? 'due-soon' : 'upcoming'}`}>
                        {isDueSoon ? 'Due soon' : `${daysRemaining} days left`}
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
                    
                    <div className="reminder-actions">
                      <button 
                        className="btn-sm btn-primary"
                        onClick={() => markAsPaid(reminder.id)}
                      >
                        Mark as Paid
                      </button>
                      <button 
                        className="btn-sm btn-secondary"
                        onClick={() => deleteReminder(reminder.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No upcoming bills or reminders.</p>
                <button className="btn btn-sm btn-primary" onClick={() => setShowAddForm(true)}>
                  Add your first reminder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paid Bills */}
        {paidReminders.length > 0 && (
          <div className="bills-section">
            <h2 className="section-title">Recently Paid</h2>
            <div className="reminders-list">
              {paidReminders.map(reminder => (
                <div key={reminder.id} className="reminder-card paid">
                  <div className="reminder-header">
                    <h4 className="reminder-title">{reminder.title}</h4>
                    <span className="reminder-status paid">Paid</span>
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
                  
                  <div className="reminder-actions">
                    <button 
                      className="btn-sm btn-secondary"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BillsAndReminders;