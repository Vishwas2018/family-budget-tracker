import { Link } from 'react-router-dom';
import { useState } from 'react';

/**
 * Bills and Reminders page
 */
function BillsAndReminders() {
  // Placeholder data for reminders - in a real app, this would come from an API or context
  const [reminders, setReminders] = useState([
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
    },
    {
      id: 'r4',
      title: 'Car Insurance',
      dueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      amount: 115,
      category: 'Insurance',
      isPaid: true,
      isOverdue: false
    },
    {
      id: 'r5',
      title: 'Phone Bill',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      amount: 49.99,
      category: 'Utilities',
      isPaid: false,
      isOverdue: false
    }
  ]);

  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle marking a reminder as paid
  const handleMarkAsPaid = (id) => {
    setReminders(prevReminders => 
      prevReminders.map(reminder => 
        reminder.id === id ? { ...reminder, isPaid: true } : reminder
      )
    );
  };

  // Group reminders by status for better organization
  const overdueReminders = reminders.filter(r => !r.isPaid && r.isOverdue);
  const upcomingReminders = reminders.filter(r => !r.isPaid && !r.isOverdue);
  const paidReminders = reminders.filter(r => r.isPaid);

  return (
    <div className="bills-page">
      <header className="page-header">
        <h1>Bills & Reminders</h1>
        <button className="btn btn-primary">Add New Reminder</button>
      </header>

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
                      onClick={() => handleMarkAsPaid(reminder.id)}
                    >
                      Mark as Paid
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
                        onClick={() => handleMarkAsPaid(reminder.id)}
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No upcoming bills or reminders.</p>
                <button className="btn btn-sm btn-primary">
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