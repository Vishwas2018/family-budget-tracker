// reminder.js - Reminder page functionality for the Family Budget Tracker

let selectedReminders = [];

// Global state management
const reminderState = {
  reminderData: [],
  currentPage: 1,
  totalPages: 1,
  filters: {
    dateRange: 'all', // Default to showing all reminders instead of just upcoming
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all'
  }
};

/**
 * Initialize the page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the reminder page
  const isReminderPage = document.querySelector('.sidebar li.active a[href="reminder.html"]');
  if (!isReminderPage) return;

  if (window.utils) {
    initializeReminderPage();
  } else {
    document.addEventListener('utilsLoaded', initializeReminderPage);
  }
});

/**
 * Initialize the reminder page components and load data
 */
function initializeReminderPage() {
  setupEventListeners();
  loadReminderData();
}

/**
 * Set up all event listeners for interactive elements
 */
function setupEventListeners() {
  // Add reminder button
  attachClickListener('#addReminderBtn', () => showReminderModal());

  // Reminder form submission
  attachFormSubmitListener('#reminderForm', handleReminderFormSubmit);

  // Recurring checkbox toggle
  attachChangeListener('#isRecurring', toggleRecurringFields);

  // Filter form
  attachFormSubmitListener('#reminderFilterForm', handleFilterSubmit);

  // Date range filter change
  attachChangeListener('#dateRangeFilter', toggleCustomDateFields);

  // Reset filter button
  attachClickListener('#resetFilterBtn', resetFilters);

  // Confirm delete button
  attachClickListener('#confirmDeleteBtn', confirmDeleteReminder);

  // Init delete button listeners through event delegation
  document.addEventListener('click', handleActionButtonClicks);
}

/**
 * Utility function to safely attach click event listeners
 */
function attachClickListener(selector, handler) {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener('click', handler);
  }
}

/**
 * Utility function to safely attach change event listeners
 */
function attachChangeListener(selector, handler) {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener('change', handler);
  }
}

/**
 * Utility function to safely attach form submit event listeners
 */
function attachFormSubmitListener(selector, handler) {
  const form = document.querySelector(selector);
  if (form) {
    form.addEventListener('submit', handler);
  }
}

/**
 * Handle clicks on action buttons using event delegation
 */
function handleActionButtonClicks(event) {
  // Edit button
  const editButton = event.target.closest('.edit-btn');
  if (editButton) {
    const reminderId = editButton.getAttribute('data-id');
    return editReminder(reminderId);
  }

  // Delete button
  const deleteButton = event.target.closest('.delete-btn');
  if (deleteButton) {
    const reminderId = deleteButton.getAttribute('data-id');
    return showDeleteConfirmation(reminderId);
  }

  // Complete button
  const completeButton = event.target.closest('.complete-btn');
  if (completeButton) {
    const reminderId = completeButton.getAttribute('data-id');
    return completeReminder(reminderId);
  }
}

/**
 * Load reminder data from the API based on current filters and pagination
 */
async function loadReminderData() {
  try {
    // Show loading state
    const reminderListElement = document.getElementById('reminderList');
    if (reminderListElement) {
      reminderListElement.innerHTML = '<tr><td colspan="7"><div class="loading-spinner"></div></td></tr>';
    }

    // Prepare query parameters
    const queryParams = prepareQueryParams();

    // Make API request to get reminder data
    const response = await utils.fetchApi(`/reminders?${queryParams}`);

    if (!response.success || !response.data) {
      throw new Error('Invalid API response format');
    }

    // Update global state
    reminderState.reminderData = response.data.results;
    reminderState.currentPage = response.data.page;
    reminderState.totalPages = response.data.totalPages;

    // Update summary if available
    if (response.data.summary) {
      updateReminderSummary(response.data.summary);
    }

    // Display the reminder list
    displayReminderList();

    // Update pagination
    updatePagination();

  } catch (error) {
    utils.showAlert(`Error loading reminder data: ${error.message}`, 'danger');

    // Show error state
    const reminderListElement = document.getElementById('reminderList');
    if (reminderListElement) {
      reminderListElement.innerHTML =
        `<tr><td colspan="7">Failed to load reminder data. ${error.message}</td></tr>`;
    }
  }
}

/**
 * Prepare query parameters based on current filters and pagination
 */
function prepareQueryParams() {
  const params = new URLSearchParams();

  // Add pagination
  params.append('page', reminderState.currentPage);
  params.append('limit', 10);

  // Add date range filter
  if (reminderState.filters.dateRange === 'custom') {
    if (reminderState.filters.startDate) {
      params.append('startDate', reminderState.filters.startDate);
    }
    if (reminderState.filters.endDate) {
      params.append('endDate', reminderState.filters.endDate);
    }
  } else {
    params.append('dateRange', reminderState.filters.dateRange);
  }

  // Add category filter
  if (reminderState.filters.category !== 'all') {
    params.append('category', reminderState.filters.category);
  }

  // Add status filter
  if (reminderState.filters.status !== 'all') {
    params.append('status', reminderState.filters.status);
  }

  return params.toString();
}

/**
 * Update reminder summary cards
 */
function updateReminderSummary(summary) {
  updateElementText('#totalPending', summary.totalPending || 0);
  updateElementText('#totalOverdue', summary.totalOverdue || 0);
  updateElementText('#upcomingTotal', utils.formatCurrency(summary.upcomingTotal || 0));
  updateElementText('#billReminders', summary.byCategoryMap?.bill || 0);
}

/**
 * Utility function to safely update text content of an element
 */
function updateElementText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

function displayReminderList() {
  const reminderListElement = document.getElementById('reminderList');
  if (!reminderListElement) return;

  const { reminderData } = reminderState;
  
  if (!reminderData || reminderData.length === 0) {
    reminderListElement.innerHTML = '<tr><td colspan="8">No reminder records found</td></tr>';
    return;
  }

  reminderListElement.innerHTML = '';
  
  reminderData.forEach(reminder => {
    try {
      const row = document.createElement('tr');
      
      // Create checkbox cell
      const checkboxCell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'reminder-select-checkbox';
      checkbox.setAttribute('data-id', reminder._id);
      checkbox.checked = selectedReminders.includes(reminder._id);
      checkbox.addEventListener('change', handleReminderCheckboxChange);
      checkboxCell.appendChild(checkbox);
      
      // Add checkbox cell to row
      row.appendChild(checkboxCell);
      
      // Format date safely
      let dueDate = "N/A";
      try {
        dueDate = utils.formatDate(reminder.dueDate);
      } catch (err) {
        console.warn(`Error formatting date:`, err);
      }
    
      // Format amount
      const amount = reminder.amount ? utils.formatCurrency(reminder.amount) : '-';
    
      // Determine recurring badge
      const recurringInterval = reminder.recurringInterval || 'monthly';
      const recurringBadge = reminder.isRecurring
        ? `<span class="badge badge-info">Recurring (${recurringInterval})</span>`
        : '<span class="badge badge-secondary">One-time</span>';
    
      // Determine status class and text
      const status = reminder.status || 'pending';
      const statusClass = getStatusClass(status);
    
      // Create action buttons
      const actionButtons = `
        <div class="action-buttons">
          <button class="action-btn edit-btn" data-id="${reminder._id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${reminder._id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
          ${status !== 'completed' ? 
            `<button class="action-btn complete-btn" data-id="${reminder._id}" title="Mark Complete">
              <i class="fas fa-check"></i>
            </button>` : ''}
        </div>
      `;
    
      // Set row content (without the first cell, which is already added)
      row.innerHTML += `
        <td>${dueDate}</td>
        <td>${reminder.title || 'Untitled'}</td>
        <td>${reminder.category || 'Other'}</td>
        <td>${amount}</td>
        <td>${recurringBadge}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>${actionButtons}</td>
      `;
    
      reminderListElement.appendChild(row);
    } catch (error) {
      console.error(`Error creating row for reminder:`, error, reminder);
    }
  });
  
  // Update bulk delete button visibility
  updateBulkDeleteButtonVisibility();
}

// Add call to setupBulkDeleteFunctionality in initializeReminderPage
function initializeReminderPage() {
  setupEventListeners();
  setupBulkDeleteFunctionality(); // Add this line
  loadReminderData();
}

/**
 * Create a table row element for a reminder
 */
function createReminderRow(reminder) {
  const row = document.createElement('tr');

  // Format date safely
  let dueDate = "N/A";
  try {
    dueDate = utils.formatDate(reminder.dueDate);
  } catch (err) {
    console.warn(`Error formatting date:`, err);
  }

  // Format amount
  const amount = reminder.amount ? utils.formatCurrency(reminder.amount) : '-';

  // Determine recurring badge
  const recurringInterval = reminder.recurringInterval || 'monthly';
  const recurringBadge = reminder.isRecurring
    ? `<span class="badge badge-info">Recurring (${recurringInterval})</span>`
    : '<span class="badge badge-secondary">One-time</span>';

  // Determine status class and text
  const status = reminder.status || 'pending';
  const statusClass = getStatusClass(status);

  // Create action buttons
  const actionButtons = `
      <div class="action-buttons">
        <button class="action-btn edit-btn" data-id="${reminder._id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${reminder._id}" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
        ${status !== 'completed' ?
      `<button class="action-btn complete-btn" data-id="${reminder._id}" title="Mark Complete">
            <i class="fas fa-check"></i>
          </button>` : ''}
      </div>
    `;

  // Set row content
  row.innerHTML = `
      <td>${dueDate}</td>
      <td>${reminder.title || 'Untitled'}</td>
      <td>${reminder.category || 'Other'}</td>
      <td>${amount}</td>
      <td>${recurringBadge}</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
      <td>${actionButtons}</td>
    `;

  return row;
}

/**
 * Get CSS class for a reminder status
 */
function getStatusClass(status) {
  switch (status) {
    case 'completed': return 'status-paid';
    case 'pending': return 'status-pending';
    case 'overdue': return 'status-overdue';
    default: return 'status-pending';
  }
}

/**
 * Update pagination controls
 */
function updatePagination() {
  const paginationElement = document.getElementById('reminderPagination');
  if (!paginationElement) return;

  // Clear pagination
  paginationElement.innerHTML = '';

  // Don't show pagination if there's only one page
  if (reminderState.totalPages <= 1) return;

  // Create pagination element
  const fragment = document.createDocumentFragment();

  // Previous button
  const prevButton = createPaginationButton('<i class="fas fa-chevron-left"></i>', () => {
    if (reminderState.currentPage > 1) {
      reminderState.currentPage--;
      loadReminderData();
    }
  });
  prevButton.disabled = reminderState.currentPage === 1;
  fragment.appendChild(prevButton);

  // Page buttons
  const maxPages = 5;
  const startPage = Math.max(1, reminderState.currentPage - Math.floor(maxPages / 2));
  const endPage = Math.min(reminderState.totalPages, startPage + maxPages - 1);

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = createPaginationButton(i, () => {
      if (i !== reminderState.currentPage) {
        reminderState.currentPage = i;
        loadReminderData();
      }
    });

    if (i === reminderState.currentPage) {
      pageButton.className = 'active';
    }

    fragment.appendChild(pageButton);
  }

  // Next button
  const nextButton = createPaginationButton('<i class="fas fa-chevron-right"></i>', () => {
    if (reminderState.currentPage < reminderState.totalPages) {
      reminderState.currentPage++;
      loadReminderData();
    }
  });
  nextButton.disabled = reminderState.currentPage === reminderState.totalPages;
  fragment.appendChild(nextButton);

  // Add all pagination elements
  paginationElement.appendChild(fragment);
}

/**
 * Create a pagination button element
 */
function createPaginationButton(html, clickHandler) {
  const button = document.createElement('button');
  button.innerHTML = html;
  button.addEventListener('click', clickHandler);
  return button;
}

/**
 * Show modal for adding or editing a reminder
 */
function showReminderModal(reminderId = null) {
  resetReminderForm();

  // Set modal title
  updateElementText('#modalTitle', reminderId ? 'Edit Reminder' : 'Add Reminder');

  // Set today's date as default
  const dueDateField = document.getElementById('dueDate');
  if (dueDateField) {
    dueDateField.value = utils.getCurrentDate();
  }

  // If editing, fill the form with reminder data
  if (reminderId) {
    fillReminderForm(reminderId);
  }

  // Show the modal
  utils.openModal('reminderModal');
}

/**
 * Reset the reminder form
 */
function resetReminderForm() {
  const reminderForm = document.getElementById('reminderForm');
  if (reminderForm) {
    reminderForm.reset();
  }

  // Reset hidden reminder ID
  const reminderIdField = document.getElementById('reminderId');
  if (reminderIdField) {
    reminderIdField.value = '';
  }

  // Hide recurring fields
  const recurringFields = document.getElementById('recurringFields');
  if (recurringFields) {
    recurringFields.style.display = 'none';
  }
}

/**
 * Fill reminder form with data for editing
 */
function fillReminderForm(reminderId) {
  // Find the reminder item
  const reminder = reminderState.reminderData.find(item => item._id === reminderId);
  if (!reminder) {
    utils.showAlert('Reminder not found', 'danger');
    return;
  }

  // Set the reminder ID
  document.getElementById('reminderId').value = reminder._id;

  // Fill form fields
  setFormValue('#title', reminder.title);
  setFormValue('#amount', reminder.amount || '');
  setFormValue('#dueDate', utils.formatDateForInput(reminder.dueDate));
  setFormValue('#category', reminder.category);
  setFormValue('#description', reminder.description || '');

  // Set recurring checkbox
  const isRecurringCheckbox = document.getElementById('isRecurring');
  if (isRecurringCheckbox) {
    isRecurringCheckbox.checked = reminder.isRecurring;

    // Show/hide recurring fields
    const recurringFields = document.getElementById('recurringFields');
    if (recurringFields) {
      recurringFields.style.display = reminder.isRecurring ? 'block' : 'none';

      if (reminder.isRecurring) {
        setFormValue('#recurringInterval', reminder.recurringInterval || 'monthly');
      }
    }
  }
}

/**
 * Utility function to safely set form field value
 */
function setFormValue(selector, value) {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
  }
}

/**
 * Toggle recurring fields based on checkbox
 */
function toggleRecurringFields() {
  const isRecurring = document.getElementById('isRecurring').checked;
  const recurringFields = document.getElementById('recurringFields');
  if (recurringFields) {
    recurringFields.style.display = isRecurring ? 'block' : 'none';
  }
}

/**
 * Toggle custom date fields based on date range selection
 */
function toggleCustomDateFields() {
  const dateRange = document.getElementById('dateRangeFilter').value;
  const customDateFields = document.getElementById('customDateFields');
  if (customDateFields) {
    customDateFields.style.display = dateRange === 'custom' ? 'block' : 'none';
  }
}

/**
 * Handle reminder form submission
 */
async function handleReminderFormSubmit(event) {
  event.preventDefault();

  // Get form data
  const reminderId = document.getElementById('reminderId').value;
  const reminderData = {
    title: document.getElementById('title').value,
    amount: parseFloat(document.getElementById('amount').value || 0),
    dueDate: document.getElementById('dueDate').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    isRecurring: document.getElementById('isRecurring').checked
  };

  // Add recurring interval if applicable
  if (reminderData.isRecurring) {
    reminderData.recurringInterval = document.getElementById('recurringInterval').value;
  }

  // Validate form data
  if (!reminderData.title || !reminderData.dueDate || !reminderData.category) {
    utils.showAlert('Please fill in all required fields', 'danger');
    return;
  }

  // Normalize amount to undefined if NaN
  if (isNaN(reminderData.amount)) {
    reminderData.amount = undefined;
  }

  try {
    let response;

    if (reminderId) {
      // Update existing reminder
      response = await utils.fetchApi(`/reminders/${reminderId}`, {
        method: 'PUT',
        body: JSON.stringify(reminderData)
      });

      utils.showAlert('Reminder updated successfully', 'success');
    } else {
      // Create new reminder
      response = await utils.fetchApi('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminderData)
      });

      utils.showAlert('Reminder added successfully', 'success');
    }

    // Close the modal
    utils.closeModal('reminderModal');

    // Reload reminder data
    loadReminderData();
  } catch (error) {
    utils.showAlert(`Failed to save reminder: ${error.message}`, 'danger');
  }
}

/**
 * Edit a reminder
 */
function editReminder(reminderId) {
  showReminderModal(reminderId);
}

/**
 * Complete a reminder
 */
async function completeReminder(reminderId) {
  try {
    // Make API request to complete the reminder
    const response = await utils.fetchApi(`/reminders/${reminderId}/complete`, {
      method: 'PUT'
    });

    utils.showAlert('Reminder marked as completed', 'success');

    // If a recurring reminder, show info about the next occurrence
    if (response.data?.next) {
      utils.showAlert(`Next reminder created for ${utils.formatDate(response.data.next.dueDate)}`, 'info');
    }

    // Reload reminder data
    loadReminderData();
  } catch (error) {
    utils.showAlert(`Failed to complete reminder: ${error.message}`, 'danger');
  }
}

// State for tracking the selected reminder for deletion
let selectedReminderId = null;

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation(reminderId) {
  // Store the selected reminder ID
  selectedReminderId = reminderId;

  // Show the confirmation modal
  utils.openModal('deleteConfirmModal');
}

/**
 * Confirm delete reminder
 */
async function confirmDeleteReminder() {
  if (!selectedReminderId) return;

  try {
    // Delete the reminder
    await utils.fetchApi(`/reminders/${selectedReminderId}`, {
      method: 'DELETE'
    });

    // Show success message
    utils.showAlert('Reminder deleted successfully', 'success');

    // Close the modal
    utils.closeModal('deleteConfirmModal');

    // Reset selected reminder ID
    selectedReminderId = null;

    // Reload reminder data
    loadReminderData();
  } catch (error) {
    utils.showAlert(`Failed to delete reminder: ${error.message}`, 'danger');
  }
}

/**
 * Handle filter form submission
 */
function handleFilterSubmit(event) {
  event.preventDefault();

  // Get filter values
  const dateRange = document.getElementById('dateRangeFilter').value;
  let startDate = '';
  let endDate = '';

  if (dateRange === 'custom') {
    startDate = document.getElementById('startDate').value;
    endDate = document.getElementById('endDate').value;

    // Validate date range
    if (!startDate || !endDate) {
      utils.showAlert('Please select both start and end dates', 'warning');
      return;
    }
  }

  const category = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;

  // Update filters in state
  reminderState.filters = {
    dateRange,
    startDate,
    endDate,
    category,
    status
  };

  // Reset to first page
  reminderState.currentPage = 1;

  // Load data with new filters
  loadReminderData();
}

/**
 * Reset filters to default
 */
function resetFilters() {
  // Reset filter form
  const filterForm = document.getElementById('reminderFilterForm');
  if (filterForm) {
    filterForm.reset();
  }

  // Hide custom date fields
  const customDateFields = document.getElementById('customDateFields');
  if (customDateFields) {
    customDateFields.style.display = 'none';
  }

  // Reset filters to default
  reminderState.filters = {
    dateRange: 'all',
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all'
  };

  // Update filter elements to match reset state
  document.getElementById('dateRangeFilter').value = 'all';
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('statusFilter').value = 'all';

  // Reset to first page
  reminderState.currentPage = 1;

  // Load data with reset filters
  loadReminderData();
}

/**
 * Utility function to test API directly
 */
async function testReminderAPI() {
  try {
    console.log("Testing reminders API directly...");

    // Test with minimal query parameters
    const response = await utils.fetchApi('/reminders?limit=100');
    console.log("API test response:", response);

    if (response.data && response.data.results) {
      console.log(`Found ${response.data.results.length} reminders in API response`);

      if (response.data.results.length > 0) {
        console.log("Sample reminder:", response.data.results[0]);
      }
    }

    return response;
  } catch (error) {
    console.error("API test failed:", error);
    return null;
  }
}

// Add this to the setupEventListeners function
function setupBulkDeleteFunctionality() {
  console.log("Setting up bulk delete functionality for reminders");
  
  // Find the table header row
  const tableHeader = document.querySelector('#reminderList').parentNode.querySelector('thead tr');
  
  if (tableHeader) {
    // Check if we need to add the select all column
    if (!document.getElementById('selectAllRemindersCell')) {
      console.log("Adding select all cell to header");
      
      // Create the select all cell
      const selectAllCell = document.createElement('th');
      selectAllCell.id = 'selectAllRemindersCell';
      selectAllCell.style.width = '40px';
      
      // Create the select all checkbox
      const selectAllCheckbox = document.createElement('input');
      selectAllCheckbox.type = 'checkbox';
      selectAllCheckbox.id = 'selectAllReminders';
      
      // Add it to the cell
      selectAllCell.appendChild(selectAllCheckbox);
      
      // Insert at the beginning of the header row
      tableHeader.insertBefore(selectAllCell, tableHeader.firstChild);
      
      // Add event listener to the select all checkbox
      selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    }
  }
  
  // Find or create the bulk delete button
  let bulkDeleteBtn = document.getElementById('bulkDeleteRemindersBtn');
  
  if (!bulkDeleteBtn) {
    const cardActions = document.querySelector('.card-actions');
    if (cardActions) {
      // Create the button
      bulkDeleteBtn = document.createElement('button');
      bulkDeleteBtn.id = 'bulkDeleteRemindersBtn';
      bulkDeleteBtn.className = 'btn danger small';
      bulkDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';
      bulkDeleteBtn.style.display = 'none'; // Initially hidden
      
      // Add it to the card actions
      if (cardActions.firstChild) {
        cardActions.insertBefore(bulkDeleteBtn, cardActions.firstChild);
      } else {
        cardActions.appendChild(bulkDeleteBtn);
      }
    }
  }
  
  // Add event listener to the bulk delete button
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', showBulkDeleteConfirmation);
  }
  
  // Create bulk delete modal if it doesn't exist
  if (!document.getElementById('bulkDeleteRemindersConfirmModal')) {
    createBulkDeleteModal();
  }
  
  // Update visibility of bulk delete button based on current selections
  updateBulkDeleteButtonVisibility();
}

// Handle select all checkbox change
function handleSelectAllChange(event) {
  const isChecked = event.target.checked;
  const checkboxes = document.querySelectorAll('.reminder-select-checkbox');
  
  selectedReminders = [];
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
    
    if (isChecked) {
      const reminderId = checkbox.getAttribute('data-id');
      if (reminderId) {
        selectedReminders.push(reminderId);
      }
    }
  });
  
  updateBulkDeleteButtonVisibility();
}

// Handle individual checkbox change
function handleReminderCheckboxChange(event) {
  const checkbox = event.target;
  const reminderId = checkbox.getAttribute('data-id');

  if (checkbox.checked) {
    if (!selectedReminders.includes(reminderId)) {
      selectedReminders.push(reminderId);
    }
  } else {
    selectedReminders = selectedReminders.filter(id => id !== reminderId);
    
    const selectAllCheckbox = document.getElementById('selectAllReminders');
    if (selectAllCheckbox && selectAllCheckbox.checked) {
      selectAllCheckbox.checked = false;
    }
  }
  
  updateBulkDeleteButtonVisibility();
}

// Update bulk delete button visibility
function updateBulkDeleteButtonVisibility() {
  const bulkDeleteBtn = document.getElementById('bulkDeleteRemindersBtn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.style.display = selectedReminders.length > 0 ? 'inline-block' : 'none';
  }
}

// Show bulk delete confirmation
function showBulkDeleteConfirmation() {
  const message = document.getElementById('bulkDeleteRemindersMessage');
  if (message) {
    message.textContent = `Are you sure you want to delete ${selectedReminders.length} reminder record(s)? This action cannot be undone.`;
  }
  
  const bulkDeleteModal = document.getElementById('bulkDeleteRemindersConfirmModal');
  if (bulkDeleteModal) {
    bulkDeleteModal.style.display = 'block';
  }
}

// Create bulk delete modal
function createBulkDeleteModal() {
  const bulkDeleteModal = document.createElement('div');
  bulkDeleteModal.id = 'bulkDeleteRemindersConfirmModal';
  bulkDeleteModal.className = 'modal';
  
  bulkDeleteModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Confirm Bulk Delete</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p id="bulkDeleteRemindersMessage">Are you sure you want to delete the selected reminder records? This action cannot be undone.</p>
        <div class="form-actions">
          <button type="button" class="btn secondary close-modal">Cancel</button>
          <button type="button" class="btn danger" id="confirmBulkDeleteRemindersBtn">Delete</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(bulkDeleteModal);
  
  const closeButtons = bulkDeleteModal.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      bulkDeleteModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === bulkDeleteModal) {
      bulkDeleteModal.style.display = 'none';
    }
  });
  
  const confirmBtn = document.getElementById('confirmBulkDeleteRemindersBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', performBulkDelete);
  }
}

// Perform bulk delete operation
async function performBulkDelete() {
  if (selectedReminders.length === 0) {
    utils.showAlert('No reminders selected for deletion', 'warning');
    return;
  }

  try {
    utils.showAlert('Deleting selected reminders...', 'info');
    
    const response = await utils.fetchApi('/reminders/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({
        ids: selectedReminders
      })
    });
    
    const bulkDeleteModal = document.getElementById('bulkDeleteRemindersConfirmModal');
    if (bulkDeleteModal) {
      bulkDeleteModal.style.display = 'none';
    }
    
    if (response.success) {
      utils.showAlert(`Successfully deleted ${response.data.deleted} reminder(s)`, 'success');
    } else {
      utils.showAlert('Failed to delete some reminders', 'warning');
    }
    
    selectedReminders = [];
    updateBulkDeleteButtonVisibility();
    loadReminderData();
  } catch (error) {
    utils.showAlert('Error performing bulk delete: ' + error.message, 'danger');
  }
}