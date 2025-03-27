/**
 * reminderNotification.js - Reminder notification functionality
 * 
 * This module handles showing reminder notifications when the app loads
 * and allows users to manage their reminders
 */

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if utils and auth are ready
  if (window.utils && window.authManager?.isAuthenticated) {
    setTimeout(initializeNotifications, 500);
  } else {
    const checkAuth = setInterval(function() {
      if (window.utils && window.authManager?.isAuthenticated) {
        clearInterval(checkAuth);
        initializeNotifications();
      }
    }, 500);
  }
});

/**
 * Initialize the notification system
 */
async function initializeNotifications() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // Only show notifications on app pages (not login/register)
  if (window.location.pathname.includes('/pages/login.html') || 
      window.location.pathname.includes('/pages/register.html')) {
    return;
  }
  
  console.log("Getting upcoming reminders...");
  
  // Get upcoming reminders
  try {
    const reminders = await getUpcomingReminders();
    console.log("Reminders found:", reminders);
    
    // Show notification if there are upcoming or overdue reminders
    if (reminders && reminders.length > 0) {
      showReminderNotification(reminders);
    }
  } catch (error) {
    console.error('Failed to load reminder notifications:', error);
  }
}

/**
 * Get upcoming and overdue reminders
 * @returns {Promise<Array>} Array of reminder objects
 */
async function getUpcomingReminders() {
    try {        
        // Get reminders due in the next 7 days or overdue
        const response = await utils.fetchApi('/reminders?dateRange=upcoming&status=pending,overdue&limit=5');

        if (!response.success || !response.data || !response.data.results) {
            throw new Error('Invalid API response format');
        }

        return response.data.results;
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        return [];
    }
}

/**
 * Show notification modal with upcoming reminders
 * @param {Array} reminders - Array of reminder objects
 */
function showReminderNotification(reminders) {
    // Create modal if it doesn't exist
    if (!document.getElementById('reminderNotificationModal')) {
        createNotificationModal();
    }

    // Add CSS for notifications if it doesn't exist
    if (!document.getElementById('reminder-notification-styles')) {
        addNotificationStyles();
    }

    // Populate the modal with reminders
    populateReminderNotification(reminders);

    // Show the modal
    utils.openModal('reminderNotificationModal');
}

/**
 * Create the notification modal
 */
function createNotificationModal() {
    const modalHTML = `
      <div class="modal" id="reminderNotificationModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2><i class="fas fa-bell"></i> Upcoming Reminders</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div id="reminderNotificationList"></div>
            <div class="form-actions">
              <button type="button" class="btn secondary close-modal">Dismiss</button>
              <a href="reminder.html" class="btn primary">View All Reminders</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Make sure utils initializes the modal
    if (utils.initializeModals) {
        utils.initializeModals();
    }
}

/**
 * Add CSS styles for the notification
 */
function addNotificationStyles() {
    const styles = document.createElement('style');
    styles.id = 'reminder-notification-styles';
    styles.textContent = `
      .notification-section {
        margin-bottom: 15px;
      }
      
      .notification-section h3 {
        margin-bottom: 10px;
        font-size: 1.1rem;
        color: var(--primary-color);
        padding-bottom: 5px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .notification-section.overdue h3 {
        color: var(--danger-color);
      }
      
      .notification-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .notification-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px;
        margin-bottom: 8px;
        background-color: #f8f9fa;
        border-left: 4px solid var(--primary-color);
        border-radius: 4px;
      }
      
      .notification-section.overdue .notification-item {
        border-left-color: var(--danger-color);
        background-color: #fff5f5;
      }
      
      .notification-content {
        flex: 1;
      }
      
      .notification-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .notification-details {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 5px;
        font-size: 0.85rem;
      }
      
      .notification-date, 
      .notification-amount, 
      .notification-category {
        color: #666;
      }
      
      .notification-description {
        font-size: 0.85rem;
        color: #666;
        margin-top: 5px;
      }
      
      .notification-actions {
        margin-left: 10px;
      }
      
      .notification-actions .btn {
        padding: 5px 10px;
        font-size: 0.8rem;
      }
    `;

    document.head.appendChild(styles);
}

/**
 * Populate the notification modal with reminders
 * @param {Array} reminders - Array of reminder objects
 */
function populateReminderNotification(reminders) {
    const container = document.getElementById('reminderNotificationList');

    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Group reminders by status
    const overdueReminders = reminders.filter(r => r.status === 'overdue');
    const pendingReminders = reminders.filter(r => r.status === 'pending');

    // Create HTML content
    let html = '';

    // Add overdue reminders
    if (overdueReminders.length > 0) {
        html += '<div class="notification-section overdue">';
        html += '<h3>Overdue</h3>';
        html += '<ul class="notification-list">';

        overdueReminders.forEach(reminder => {
            html += createReminderListItem(reminder);
        });

        html += '</ul></div>';
    }

    // Add pending reminders
    if (pendingReminders.length > 0) {
        html += '<div class="notification-section pending">';
        html += '<h3>Due Soon</h3>';
        html += '<ul class="notification-list">';

        pendingReminders.forEach(reminder => {
            html += createReminderListItem(reminder);
        });

        html += '</ul></div>';
    }

    // Add message if no reminders
    if (html === '') {
        html = '<p>No upcoming reminders.</p>';
    }

    // Set the content
    container.innerHTML = html;

    // Add event listeners to complete buttons
    const completeButtons = container.querySelectorAll('.complete-reminder-btn');
    completeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            const reminderId = button.getAttribute('data-id');

            try {
                // Show loading state
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;

                // Complete the reminder
                await utils.fetchApi(`/reminders/${reminderId}/complete`, {
                    method: 'PUT'
                });

                // Remove from list
                const listItem = button.closest('li');
                listItem.style.opacity = '0.5';
                listItem.style.textDecoration = 'line-through';
                button.remove();

                // Show success message
                utils.showAlert('Reminder marked as completed', 'success');
            } catch (error) {
                console.error('Error completing reminder:', error);
                utils.showAlert('Failed to complete reminder', 'danger');

                // Restore button
                button.innerHTML = '<i class="fas fa-check"></i> Complete';
                button.disabled = false;
            }
        });
    });
}

/**
 * Create HTML for a reminder list item
 * @param {Object} reminder - Reminder object
 * @returns {string} HTML string
 */
function createReminderListItem(reminder) {
    const dueDate = utils.formatDate(reminder.dueDate);
    const amount = reminder.amount ? utils.formatCurrency(reminder.amount) : '';

    return `
      <li class="notification-item">
        <div class="notification-content">
          <div class="notification-title">${reminder.title}</div>
          <div class="notification-details">
            <span class="notification-date"><i class="fas fa-calendar"></i> ${dueDate}</span>
            ${amount ? `<span class="notification-amount"><i class="fas fa-money-bill"></i> ${amount}</span>` : ''}
            <span class="notification-category"><i class="fas fa-tag"></i> ${reminder.category || 'Other'}</span>
          </div>
          ${reminder.description ? `<div class="notification-description">${reminder.description}</div>` : ''}
        </div>
        <div class="notification-actions">
          ${reminder.status !== 'completed' ?
            `<button class="btn primary small complete-reminder-btn" data-id="${reminder._id}">
              <i class="fas fa-check"></i> Complete
            </button>` :
            ''
        }
        </div>
      </li>
    `;
}

// Add module to window to access from other scripts
window.reminderNotification = {
    getUpcomingReminders,
    showReminderNotification
};