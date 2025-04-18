import PropTypes from 'prop-types';
import { format } from 'date-fns';

/**
 * Component to display reminders and upcoming bill payments
 */
const ReminderCard = ({ 
  title, 
  dueDate, 
  amount, 
  category, 
  isPaid = false, 
  isOverdue = false,
  onClick 
}) => {
  // Format the due date
  const formattedDate = dueDate ? format(new Date(dueDate), 'MMM dd, yyyy') : '';
  const daysRemaining = dueDate ? Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Handle status text and style
  let statusText = '';
  let statusClass = '';
  
  if (isPaid) {
    statusText = 'Paid';
    statusClass = 'paid';
  } else if (isOverdue) {
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
    <div className={`reminder-card ${statusClass}`} onClick={onClick}>
      <div className="reminder-header">
        <h4 className="reminder-title">{title}</h4>
        <span className={`reminder-status ${statusClass}`}>{statusText}</span>
      </div>
      
      <div className="reminder-details">
        <div className="reminder-info">
          <div className="reminder-category">{category}</div>
          <div className="reminder-date">{formattedDate}</div>
        </div>
        <div className="reminder-amount">
          ${amount.toFixed(2)}
        </div>
      </div>
      
      {!isPaid && (
        <div className="reminder-actions">
          <button className="btn-sm btn-primary">Mark as Paid</button>
        </div>
      )}
    </div>
  );
};

ReminderCard.propTypes = {
  title: PropTypes.string.isRequired,
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  amount: PropTypes.number.isRequired,
  category: PropTypes.string.isRequired,
  isPaid: PropTypes.bool,
  isOverdue: PropTypes.bool,
  onClick: PropTypes.func
};

export default ReminderCard;