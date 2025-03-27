// Handle select all checkbox change
function handleSelectAllChange(event) {
    // Get the checked state from the event
    const isChecked = event.target.checked;
    
    // Get all expense checkboxes
    const checkboxes = document.querySelectorAll('.expense-select-checkbox');
    
    // Reset the selectedExpenses array
    selectedExpenses = [];
    
    // Update each checkbox and the selectedExpenses array
    checkboxes.forEach(checkbox => {
      // Update checkbox state
      checkbox.checked = isChecked;
      
      // Update selectedExpenses array if checked
      if (isChecked) {
        const expenseId = checkbox.getAttribute('data-id');
        if (expenseId) {
          selectedExpenses.push(expenseId);
        }
      }
    });
    
    // Update bulk delete button visibility
    updateBulkDeleteButtonVisibility();
  }

// Handle individual checkbox change
function handleExpenseCheckboxChange(event) {
    const checkbox = event.target;
    const expenseId = checkbox.getAttribute('data-id');
  
    console.log("Checkbox changed for ID:", expenseId, "checked:", checkbox.checked);
  
    if (checkbox.checked) {
        // Add to selected expenses
        if (!selectedExpenses.includes(expenseId)) {
            selectedExpenses.push(expenseId);
        }
    } else {
        // Remove from selected expenses
        selectedExpenses = selectedExpenses.filter(id => id !== expenseId);
    
        // Uncheck "select all" if any individual item is unchecked
        const selectAllCheckbox = document.getElementById('selectAllExpenses');
        if (selectAllCheckbox && selectAllCheckbox.checked) {
            selectAllCheckbox.checked = false;
        }
    }
  
    console.log("Selected expenses after change:", selectedExpenses);
  
    // Update bulk delete button visibility
    updateBulkDeleteButtonVisibility();
}

// Update bulk delete button visibility based on selections
function updateBulkDeleteButtonVisibility() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.style.display = selectedExpenses.length > 0 ? 'inline-block' : 'none';
    }
}

// Show bulk delete confirmation modal
function showBulkDeleteConfirmation() {
    console.log("Showing bulk delete confirmation for", selectedExpenses.length, "expenses");
  
    // Update message to show count
    const message = document.getElementById('bulkDeleteMessage');
    if (message) {
        message.textContent = `Are you sure you want to delete ${selectedExpenses.length} expense record(s)? This action cannot be undone.`;
    }
  
    // Show the modal
    const bulkDeleteModal = document.getElementById('bulkDeleteConfirmModal');
    if (bulkDeleteModal) {
        bulkDeleteModal.style.display = 'block';
    } else {
        console.error("Bulk delete confirmation modal not found");
    }
}

// Perform the bulk delete operation
async function performBulkDelete() {
    console.log("Performing bulk delete for IDs:", selectedExpenses);
  
    if (selectedExpenses.length === 0) {
        utils.showAlert('No expenses selected for deletion', 'warning');
        return;
    }

    try {
        // Show loading state
        utils.showAlert('Deleting selected expenses...', 'info');
      
        // Try to use the bulk delete API
        const response = await utils.fetchApi('/expenses/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({
                ids: selectedExpenses
            })
        });
      
        console.log("Bulk delete API response:", response);
      
        // Close the modal
        const bulkDeleteModal = document.getElementById('bulkDeleteConfirmModal');
        if (bulkDeleteModal) {
            bulkDeleteModal.style.display = 'none';
        }
      
        // Show result message
        if (response.data.failed && response.data.failed.length === 0) {
            utils.showAlert(`Successfully deleted ${response.data.success.length} expense record(s)`, 'success');
        } else {
            utils.showAlert(`Deleted ${response.data.success.length} record(s), but ${response.data.failed.length} deletion(s) failed`, 'warning');
            console.log('Failed deletions:', response.data.failed);
        }
      
        // Clear selected expenses
        selectedExpenses = [];
      
        // Update bulk delete button visibility
        updateBulkDeleteButtonVisibility();
      
        // Reload expense data
        loadExpenseData();
    } catch (error) {
        console.error("Error in bulk delete operation:", error);
        
        // Fall back to individual deletes if bulk API fails
        try {
            let successCount = 0;
            let failCount = 0;
            
            for (const expenseId of selectedExpenses) {
                try {
                    await utils.fetchApi(`/expenses/${expenseId}`, {
                        method: 'DELETE'
                    });
                    
                    successCount++;
                } catch (err) {
                    console.error(`Error deleting expense ${expenseId}:`, err);
                    failCount++;
                }
            }
            
            // Close the modal
            const bulkDeleteModal = document.getElementById('bulkDeleteConfirmModal');
            if (bulkDeleteModal) {
                bulkDeleteModal.style.display = 'none';
            }
            
            // Show result message
            if (failCount === 0) {
                utils.showAlert(`Successfully deleted ${successCount} expense record(s)`, 'success');
            } else {
                utils.showAlert(`Deleted ${successCount} record(s), but ${failCount} deletion(s) failed`, 'warning');
            }
            
            // Clear selected expenses
            selectedExpenses = [];
            
            // Update bulk delete button visibility
            updateBulkDeleteButtonVisibility();
            
            // Reload expense data
            loadExpenseData();
        } catch (fallbackError) {
            utils.showAlert('Error performing bulk delete: ' + error.message, 'danger');
        }
    }
}// expense.js - Expense page functionality for the Family Budget Tracker

// Global variables
let expenseData = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    dateRange: 'current-month',
    startDate: '',
    endDate: '',
    category: 'all',
    subcategory: 'all'
};
let selectedExpenseId = null;
let selectedExpenses = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the expense page
    if (document.querySelector('.sidebar li.active a[href="expense.html"]')) {
        // Initialize the expense page when utils are available
        if (window.utils) {
            initializeExpensePage();
        } else {
            document.addEventListener('utilsLoaded', initializeExpensePage);
        }
    }
});

// Initialize expense page
function initializeExpensePage() {
    console.log("Initializing expense page...");
    
    if (window.subcategories && window.categories) {
        // Initialize basic functionality first
        initializeExpenseForm();
        initializeExpenseFilterForm();
        
        // Load data - this will use displayExpenseList
        loadExpenseData();
        
        // Set up event listeners last - after all other functions are defined
        setTimeout(() => {
            setupEventListeners();
        }, 100);
    } else {
        loadCategoryConfig().then(() => {
            initializeExpenseForm();
            initializeExpenseFilterForm();
            loadExpenseData();
            
            // Set up event listeners last - after all other functions are defined
            setTimeout(() => {
                setupEventListeners();
            }, 100);
        });
    }
}

// Set up event listeners for the page
function setupEventListeners() {
    // Add expense button
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            showExpenseModal();
        });
    }

    // Expense form submission
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseFormSubmit);
    }

    // Recurring checkbox toggle
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.addEventListener('change', toggleRecurringFields);
    }

    // Filter form
    const expenseFilterForm = document.getElementById('expenseFilterForm');
    if (expenseFilterForm) {
        expenseFilterForm.addEventListener('submit', handleFilterSubmit);
    }

    // Date range filter change
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', toggleCustomDateFields);
    }

    // Reset filter button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }

    // Import button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            utils.openModal('importModal');
        });
    }

    // Import form submission
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', handleImportFormSubmit);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportExpenseData);
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteExpense);
    }

    // Add category change event to update subcategory
    const categoryField = document.getElementById('category');
    if (categoryField) {
        categoryField.addEventListener('change', function() {
            updateSubcategoryDropdown(this.value);
        });
    }
     // Add this BEFORE the setupBulkDeleteFunctionality call
     console.log("Setting up event listeners, about to call setupBulkDeleteFunctionality");
    
     // Initialize bulk delete functionality
     setupBulkDeleteFunctionality();
     
     console.log("Finished setting up bulk delete functionality");
}

// Load expense data from API
async function loadExpenseData() {
    try {
        // Show loading state
        const expenseListElement = document.getElementById('expenseList');
        if (expenseListElement) {
            expenseListElement.innerHTML = '<tr><td colspan="12">Loading expense data...</td></tr>';
        }

        // Prepare query parameters
        const queryParams = prepareQueryParams();

        // Make API request to get expense data
        const response = await utils.fetchApi(`/expenses?${queryParams}`);

        // Store the data
        expenseData = response.data.results;
        currentPage = response.data.page;
        totalPages = response.data.totalPages;

        // Update summary cards
        updateExpenseSummary(response.data.summary);

        // Display the expense list
        displayExpenseList();

        // Update pagination
        updatePagination();
    } catch (error) {
        console.error('Error fetching expense data:', error);
        utils.showAlert('Error loading expense data: ' + error.message, 'danger');

        // Show error state
        const expenseListElement = document.getElementById('expenseList');
        if (expenseListElement) {
            expenseListElement.innerHTML = '<tr><td colspan="12">Failed to load expense data</td></tr>';
        }
    }
}

// Prepare query parameters based on filters and pagination
function prepareQueryParams() {
    let params = new URLSearchParams();

    // Add pagination
    params.append('page', currentPage);
    params.append('limit', 10);

    // Add date range filter
    if (currentFilters.dateRange === 'custom') {
        if (currentFilters.startDate) {
            params.append('startDate', currentFilters.startDate);
        }
        if (currentFilters.endDate) {
            params.append('endDate', currentFilters.endDate);
        }
    } else {
        params.append('dateRange', currentFilters.dateRange);
    }

    // Add category filter
    if (currentFilters.category !== 'all') {
        params.append('category', currentFilters.category);
    }

    // Add subcategory filter
    if (currentFilters.subcategory !== 'all') {
        params.append('subcategory', currentFilters.subcategory);
    }

    return params.toString();
}

// Update expense summary cards
function updateExpenseSummary(summary) {
    // Housing total
    const housingTotalElement = document.getElementById('housingExpenses');
    if (housingTotalElement) {
        housingTotalElement.textContent = utils.formatCurrency(summary.byCategoryMap.housing || 0);
    }

    // Food total
    const foodTotalElement = document.getElementById('foodExpenses');
    if (foodTotalElement) {
        foodTotalElement.textContent = utils.formatCurrency(summary.byCategoryMap.food || 0);
    }

    // Transportation total
    const transportationTotalElement = document.getElementById('transportationExpenses');
    if (transportationTotalElement) {
        transportationTotalElement.textContent = utils.formatCurrency(summary.byCategoryMap.transportation || 0);
    }

    // Utilities total
    const utilitiesTotalElement = document.getElementById('utilitiesTotal');
    if (utilitiesTotalElement) {
        utilitiesTotalElement.textContent = utils.formatCurrency(summary.byCategoryMap.utilities || 0);
    }

    // Total expenses
    const totalExpensesElement = document.getElementById('totalExpenses');
    if (totalExpensesElement && summary.total !== undefined) {
        totalExpensesElement.textContent = utils.formatCurrency(summary.total);
    }
}

// Display expense list
function displayExpenseList() {
    const expenseListElement = document.getElementById('expenseList');
    if (!expenseListElement) return;

    if (!expenseData || expenseData.length === 0) {
        expenseListElement.innerHTML = '<tr><td colspan="12">No expense records found</td></tr>';
        // Ensure the select all column exists in the header
        setupBulkDeleteFunctionality();
        return;
    }

    // Calculate total expenses for percentage calculation
    const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);

    // Clear the list
    expenseListElement.innerHTML = '';

    // Add expense rows
    expenseData.forEach(expense => {
        const row = document.createElement('tr');

        // Calculate percentage of total
        const percentage = (expense.amount / totalExpenses * 100).toFixed(1);

        // Calculate annual amount
        const frequencyMultipliers = {
            'one-time': 1,
            'daily': 365,
            'weekly': 52,
            'fortnightly': 26,
            'monthly': 12,
            'quarterly': 4,
            'yearly': 1
        };

        const multiplier = frequencyMultipliers[expense.paymentFrequency || 'one-time'];
        const annualAmount = expense.amount * multiplier;

        // Format values
        const date = utils.formatDate(expense.date);
        const formattedAmount = utils.formatCurrency(expense.amount);
        const formattedAnnualAmount = utils.formatCurrency(annualAmount);

        // Create the checkbox cell HTML
        const checkboxHtml = `
          <td>
            <input type="checkbox" class="expense-select-checkbox" data-id="${expense._id}">
          </td>
        `;

        // Map payment frequency to display value
        const paymentFrequencyMap = {
            'one-time': 'One-time',
            'daily': 'Daily',
            'weekly': 'Weekly',
            'fortnightly': 'Fortnightly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'yearly': 'Yearly'
        };

        // Map payment method to display value
        const paymentMethodMap = {
            'cash': 'Cash',
            'credit': 'Credit Card',
            'debit': 'Debit Card',
            'bank': 'Bank Transfer',
            'mobile': 'Mobile Payment',
            'other': 'Other'
        };

        // Add the checkbox cell to the beginning of the row HTML
        row.innerHTML = checkboxHtml + `
          <td>${date}</td>
          <td>${expense.category}</td>
          <td>${expense.subcategory || ''}</td>
          <td>${formattedAmount}</td>
          <td>${paymentFrequencyMap[expense.paymentFrequency] || 'One-time'}</td>
          <td>${paymentMethodMap[expense.paymentMethod] || '-'}</td>
          <td>${percentage}%</td>
          <td>${formattedAnnualAmount}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" data-id="${expense._id}" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete-btn" data-id="${expense._id}" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
          <td>${expense.description || '-'}</td>
          <td>${expense.comments || '-'}</td>
        `;

        expenseListElement.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
  
    // Make sure select all column exists in header
    setupBulkDeleteFunctionality();
  
    // Add event listeners to checkboxes
    const checkboxes = document.querySelectorAll('.expense-select-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleExpenseCheckboxChange);
    
        // Set initial state based on selectedExpenses array
        const expenseId = checkbox.getAttribute('data-id');
        checkbox.checked = selectedExpenses.includes(expenseId);
    });
  
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllExpenses');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = expenseData.length > 0 && selectedExpenses.length === expenseData.length;
    }
    
    // Make sure the bulk delete button visibility is updated
    updateBulkDeleteButtonVisibility();
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    console.log("Adding action button listeners");
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            console.log("Edit button clicked for ID:", expenseId);
            editExpense(expenseId);
        });
    });

    // Delete buttons - Using event delegation for better reliability
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        expenseList.addEventListener('click', function(event) {
            // Find closest delete button if it was clicked or a child of it was clicked
            const deleteButton = event.target.closest('.delete-btn');
          
            if (deleteButton) {
                const expenseId = deleteButton.getAttribute('data-id');
                console.log("Delete button clicked for ID:", expenseId);
                showDeleteConfirmation(expenseId);
                event.stopPropagation(); // Prevent event bubbling
            }
        });
    }
}

// Update pagination controls
function updatePagination() {
    const paginationElement = document.getElementById('expensePagination');
    if (!paginationElement) return;

    // Clear pagination
    paginationElement.innerHTML = '';

    // Don't show pagination if there's only one page
    if (totalPages <= 1) return;

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadExpenseData();
        }
    });
    paginationElement.appendChild(prevButton);

    // Page buttons
    const maxPages = 5; // Maximum number of page buttons to show
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.addEventListener('click', () => {
            if (i !== currentPage) {
                currentPage = i;
                loadExpenseData();
            }
        });
        paginationElement.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadExpenseData();
        }
    });
    paginationElement.appendChild(nextButton);
}

// Show expense modal for adding new expense
function showExpenseModal(expenseId = null) {
    // Reset form
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.reset();
    }

    // Set today's date as default
    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.value = utils.getCurrentDate();
    }

    // Reset recurring fields
    const recurringFields = document.getElementById('recurringFields');
    if (recurringFields) {
        recurringFields.style.display = 'none';
    }

    // Set modal title
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = expenseId ? 'Edit Expense' : 'Add Expense';
    }

    // Clear hidden expense ID
    const expenseIdField = document.getElementById('expenseId');
    if (expenseIdField) {
        expenseIdField.value = '';
    }

    // If editing, fill the form with expense data
    if (expenseId) {
        fillExpenseForm(expenseId);
    } else {
        // Initialize subcategory dropdown for new expense
        const categoryField = document.getElementById('category');
        if (categoryField && categoryField.value) {
            updateSubcategoryDropdown(categoryField.value);
        }
    }

    // Show the modal
    utils.openModal('expenseModal');
}

// Fill expense form with data for editing
function fillExpenseForm(expenseId) {
    // Find the expense item
    const expense = expenseData.find(item => item._id === expenseId);
    if (!expense) return;

    // Set the expense ID
    const expenseIdField = document.getElementById('expenseId');
    if (expenseIdField) {
        expenseIdField.value = expense._id;
    }

    // Fill form fields
    const payeeField = document.getElementById('payee');
    if (payeeField) {
        payeeField.value = expense.payee;
    }

    const amountField = document.getElementById('amount');
    if (amountField) {
        amountField.value = expense.amount;
    }

    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.value = utils.formatDateForInput(expense.date);
    }

    const categoryField = document.getElementById('category');
    if (categoryField) {
        categoryField.value = expense.category;
        
        // Update subcategory dropdown based on selected category
        updateSubcategoryDropdown(expense.category, expense.subcategory);
    }

    const paymentMethodField = document.getElementById('paymentMethod');
    if (paymentMethodField) {
        paymentMethodField.value = expense.paymentMethod || '';
    }

    const paymentFrequencyField = document.getElementById('paymentFrequency');
    if (paymentFrequencyField) {
        paymentFrequencyField.value = expense.paymentFrequency || 'one-time';
    }

    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        descriptionField.value = expense.description || '';
    }

    const commentsField = document.getElementById('comments');
    if (commentsField) {
        commentsField.value = expense.comments || '';
    }

    // Set recurring checkbox
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.checked = expense.isRecurring;
    }

    // Show/hide recurring fields
    const recurringFields = document.getElementById('recurringFields');
    if (recurringFields) {
        if (expense.isRecurring) {
            recurringFields.style.display = 'block';

            const recurringIntervalField = document.getElementById('recurringInterval');
            if (recurringIntervalField) {
                recurringIntervalField.value = expense.recurringInterval || 'monthly';
            }
        } else {
            recurringFields.style.display = 'none';
        }
    }
}

// Toggle recurring fields based on checkbox
function toggleRecurringFields() {
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringFields = document.getElementById('recurringFields');
    if (recurringFields) {
        recurringFields.style.display = isRecurring ? 'block' : 'none';
    }
}

// Toggle custom date fields based on date range selection
function toggleCustomDateFields() {
    const dateRange = document.getElementById('dateRangeFilter').value;
    const customDateFields = document.getElementById('customDateFields');
    if (customDateFields) {
        customDateFields.style.display = dateRange === 'custom' ? 'block' : 'none';
    }
}

// Update the subcategory dropdown based on selected category
function updateSubcategoryDropdown(categoryValue, selectedValue = '') {
    // Get the subcategory dropdown element
    const subcategoryField = document.getElementById('expense-subcategory');
    if (!subcategoryField) return;

    // Clear existing options
    subcategoryField.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Subcategory --';
    subcategoryField.appendChild(defaultOption);

    // Add subcategories based on selected category
    if (categoryValue && window.subcategories && window.subcategories[categoryValue]) {
        const subOptions = window.subcategories[categoryValue] || [];
        subOptions.forEach(subOption => {
            const option = document.createElement('option');
            option.value = subOption;
            option.textContent = subOption;
            if (selectedValue === subOption) {
                option.selected = true;
            }
            subcategoryField.appendChild(option);
        });
    }
}

// Handle expense form submission
function handleExpenseFormSubmit(event) {
    event.preventDefault();

    // Get form data
    const expenseId = document.getElementById('expenseId').value;
    const payee = document.getElementById('payee').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const subcategory = document.getElementById('expense-subcategory').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentFrequency = document.getElementById('paymentFrequency').value;
    const description = document.getElementById('description').value;
    const comments = document.getElementById('comments').value;
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringInterval = isRecurring ? document.getElementById('recurringInterval').value : null;

    // Validate form data
    if (!payee || !amount || !date || !category || !subcategory) {
        utils.showAlert('Please fill in all required fields', 'danger');
        return;
    }

    // Prepare expense data
    const expenseData = {
        payee,
        amount,
        date,
        category,
        subcategory,
        paymentMethod,
        paymentFrequency,
        description,
        comments,
        isRecurring,
        recurringInterval
    };

    // Submit data to API
    try {
        if (expenseId) {
            // Update existing expense
            utils.fetchApi(`/expenses/${expenseId}`, {
                method: 'PUT',
                body: JSON.stringify(expenseData)
            }).then(response => {
                if (response.success) {
                    utils.showAlert('Expense updated successfully', 'success');
                    utils.closeModal('expenseModal');
                    loadExpenseData();
                } else {
                    utils.showAlert(response.message || 'Failed to update expense', 'danger');
                }
            });
        } else {
            // Create new expense
            utils.fetchApi('/expenses', {
                method: 'POST',
                body: JSON.stringify(expenseData)
            }).then(response => {
                if (response.success) {
                    utils.showAlert('Expense added successfully', 'success');
                    utils.closeModal('expenseModal');
                    loadExpenseData();
                } else {
                    utils.showAlert(response.message || 'Failed to add expense', 'danger');
                }
            });
        }
    } catch (error) {
        utils.showAlert(error.message || 'Failed to process expense', 'danger');
    }
}

// Edit expense
function editExpense(expenseId) {
    showExpenseModal(expenseId);
}

// Show delete confirmation
function showDeleteConfirmation(expenseId) {
    console.log("Showing delete confirmation for ID:", expenseId);
    
    // Store the selected expense ID
    selectedExpenseId = expenseId;
    
    // Get the confirmation modal
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
        console.error("Delete confirmation modal not found in the DOM");
        return;
    }
    
    // Show the modal
    modal.style.display = 'block';
    
    // Make sure the confirm button has the right event listener
    const confirmButton = document.getElementById('confirmDeleteBtn');
    if (confirmButton) {
        // Remove existing listeners to prevent duplicates
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Add the event listener
        newConfirmButton.addEventListener('click', confirmDeleteExpense);
    } else {
        console.error("Confirm delete button not found in the modal");
    }
}

// Confirm delete expense
async function confirmDeleteExpense() {
    console.log("Confirming delete for ID:", selectedExpenseId);
    
    if (!selectedExpenseId) {
        console.error("No expense ID selected for deletion");
        return;
    }

    try {
        console.log("Sending DELETE request to:", `/expenses/${selectedExpenseId}`);
        
        // Delete the expense
        const response = await utils.fetchApi(`/expenses/${selectedExpenseId}`, {
            method: 'DELETE'
        });
        
        console.log("Delete response:", response);

        // Show success message
        utils.showAlert('Expense deleted successfully', 'success');

        // Close the modal
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Reset selected expense ID
        selectedExpenseId = null;

        // Reload expense data
        loadExpenseData();
    } catch (error) {
        console.error("Error deleting expense:", error);
        utils.showAlert(error.message || 'Failed to delete expense', 'danger');
    }
}

// Handle filter form submission
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
    const subcategory = document.getElementById('subcategoryFilter') ? 
        document.getElementById('subcategoryFilter').value : 'all';

    // Update filters
    currentFilters = {
        dateRange,
        startDate,
        endDate,
        category,
        subcategory
    };

    // Reset to first page
    currentPage = 1;

    // Load data with new filters
    loadExpenseData();
}

// Reset filters
function resetFilters() {
    // Reset filter form
    const filterForm = document.getElementById('expenseFilterForm');
    if (filterForm) {
        filterForm.reset();
    }

    // Hide custom date fields
    const customDateFields = document.getElementById('customDateFields');
    if (customDateFields) {
        customDateFields.style.display = 'none';
    }

    // Reset filters
    currentFilters = {
        dateRange: 'current-month',
        startDate: '',
        endDate: '',
        category: 'all',
        subcategory: 'all'
    };

    // Reset to first page
    currentPage = 1;

    // Load data with reset filters
    loadExpenseData();
}

// Initialize expense form with category and subcategory dropdowns
function initializeExpenseForm() {
    // Get form elements
    const categorySelect = document.getElementById('category');

    // Add change event listener to category dropdown
    if (categorySelect) {
        // Remove any existing listeners to prevent duplicates
        categorySelect.removeEventListener('change', categoryChangeHandler);
        categorySelect.addEventListener('change', categoryChangeHandler);
    }

    // Initial update if needed
    if (categorySelect && categorySelect.value) {
        updateSubcategoryDropdown(categorySelect.value);
    }
}

function categoryChangeHandler() {
    updateSubcategoryDropdown(this.value);
}

// Initialize expense filter form with subcategory support
function initializeExpenseFilterForm() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (categoryFilter) {
        // Add change event listener to update subcategory filter
        categoryFilter.addEventListener('change', function() {
            // Get or create subcategory filter
            let subcategoryFilter = document.getElementById('subcategoryFilter');
            
            if (!subcategoryFilter) {
                // Create container and element
                const container = document.createElement('div');
                container.className = 'filter-group';
                
                const label = document.createElement('label');
                label.setAttribute('for', 'subcategoryFilter');
                label.textContent = 'Subcategory';
                
                subcategoryFilter = document.createElement('select');
                subcategoryFilter.id = 'subcategoryFilter';
                subcategoryFilter.name = 'subcategory';
                subcategoryFilter.className = 'form-control';
                
                container.appendChild(label);
                container.appendChild(subcategoryFilter);
                
                // Insert after category filter
                categoryFilter.parentNode.after(container);
            }
            
            // Update options
            updateFilterSubcategories(this.value, subcategoryFilter);
        });
    }
}

// Update subcategory filter options
function updateFilterSubcategories(category, subcategoryElement) {
    if (!subcategoryElement) return;
    
    // Clear existing options
    subcategoryElement.innerHTML = '';
    
    // Add "All" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Subcategories';
    subcategoryElement.appendChild(allOption);
    
    // Add subcategories if category is selected and exists
    if (category !== 'all' && window.subcategories && window.subcategories[category]) {
        window.subcategories[category].forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat;
            option.textContent = subcat;
            subcategoryElement.appendChild(option);
        });
    }
}

// Handle import form submission
async function handleImportFormSubmit(event) {
    event.preventDefault();
    
    // Get the file - use the correct ID
    const fileInput = document.getElementById('expenseImportFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        utils.showAlert('Please select a file to import', 'warning');
        return;
    }

    const file = fileInput.files[0];

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        utils.showAlert('File size exceeds the 5MB limit', 'warning');
        return;
    }

    // Check file type
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!validTypes.includes(file.type)) {
        utils.showAlert('Invalid file type. Please upload an Excel or CSV file', 'warning');
        return;
    }

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Use the global API_URL instead of hardcoding it
        const token = localStorage.getItem('token');
        
        // Make API request to import
        const response = await fetch(`${utils.API_URL}/expenses/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        // Show success message
        utils.showAlert(`Successfully imported ${data.data.imported} expense records`, 'success');

        // Close the modal
        utils.closeModal('importModal');

        // Reset the form
        const importForm = document.getElementById('importForm');
        if (importForm) {
            importForm.reset();
        }

        // Reload expense data
        loadExpenseData();
    } catch (error) {
        utils.showAlert(error.message || 'Failed to import data', 'danger');
    }
}

function setupBulkDeleteFunctionality() {
    console.log("Setting up bulk delete functionality");
    
    // Find the table header row
    const tableHeader = document.querySelector('#expenseList').parentNode.querySelector('thead tr');
    console.log("Table header found:", tableHeader ? "Yes" : "No");
    
    if (tableHeader) {
        // Check if we need to add the select all column
        if (!document.getElementById('selectAllCell')) {
            console.log("Adding select all cell to header");
            
            // Create the select all cell
            const selectAllCell = document.createElement('th');
            selectAllCell.id = 'selectAllCell';
            selectAllCell.style.width = '40px';
            
            // Create the select all checkbox
            const selectAllCheckbox = document.createElement('input');
            selectAllCheckbox.type = 'checkbox';
            selectAllCheckbox.id = 'selectAllExpenses';
            
            // Add it to the cell
            selectAllCell.appendChild(selectAllCheckbox);
            
            // Insert at the beginning of the header row
            tableHeader.insertBefore(selectAllCell, tableHeader.firstChild);
            
            // Add event listener to the select all checkbox
            selectAllCheckbox.addEventListener('change', handleSelectAllChange);
            console.log("Added select all checkbox with event listener");
        } else {
            console.log("Select all cell already exists");
        }
    } else {
        console.error("Could not find table header for expenses");
    }
    
    // Find or create the bulk delete button
    let bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    if (!bulkDeleteBtn) {
        console.log("Creating bulk delete button");
        
        const cardActions = document.querySelector('.card-actions');
        if (cardActions) {
            // Create the button
            bulkDeleteBtn = document.createElement('button');
            bulkDeleteBtn.id = 'bulkDeleteBtn';
            bulkDeleteBtn.className = 'btn danger small';
            bulkDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';
            bulkDeleteBtn.style.display = 'none'; // Initially hidden
            
            // Add it to the card actions
            if (cardActions.firstChild) {
                cardActions.insertBefore(bulkDeleteBtn, cardActions.firstChild);
            } else {
                cardActions.appendChild(bulkDeleteBtn);
            }
            
            console.log("Bulk delete button created and added to DOM");
        } else {
            console.error("Could not find card-actions element");
        }
    } else {
        console.log("Bulk delete button already exists");
    }
    
    // Add event listener to the bulk delete button
    if (bulkDeleteBtn) {
        // Remove existing listeners to prevent duplicates
        const newBtn = bulkDeleteBtn.cloneNode(true);
        if (bulkDeleteBtn.parentNode) {
            bulkDeleteBtn.parentNode.replaceChild(newBtn, bulkDeleteBtn);
            newBtn.addEventListener('click', showBulkDeleteConfirmation);
            console.log("Added event listener to bulk delete button");
        }
    }
    
    // Create bulk delete modal if it doesn't exist
    let bulkDeleteModal = document.getElementById('bulkDeleteConfirmModal');
    
    if (!bulkDeleteModal) {
        console.log("Creating bulk delete confirmation modal");
        
        // Create the modal element
        bulkDeleteModal = document.createElement('div');
        bulkDeleteModal.id = 'bulkDeleteConfirmModal';
        bulkDeleteModal.className = 'modal';
        
        // Set the HTML for the modal
        bulkDeleteModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Confirm Bulk Delete</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p id="bulkDeleteMessage">Are you sure you want to delete the selected expense records? This action cannot be undone.</p>
                    <div class="form-actions">
                        <button type="button" class="btn secondary close-modal">Cancel</button>
                        <button type="button" class="btn danger" id="confirmBulkDeleteBtn">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the body
        document.body.appendChild(bulkDeleteModal);
        
        // Set up close button functionality
        const closeButtons = bulkDeleteModal.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                bulkDeleteModal.style.display = 'none';
            });
        });
        
        // Set up outside click to close
        window.addEventListener('click', (event) => {
            if (event.target === bulkDeleteModal) {
                bulkDeleteModal.style.display = 'none';
            }
        });
        
        console.log("Bulk delete modal created and added to DOM");
    }
    
    // Add event listener to confirm bulk delete button
    const confirmBtn = document.getElementById('confirmBulkDeleteBtn');
    if (confirmBtn) {
        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        if (confirmBtn.parentNode) {
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            newConfirmBtn.addEventListener('click', performBulkDelete);
            console.log("Added event listener to confirm bulk delete button");
        }
    }
    
    // Update visibility of bulk delete button based on current selections
    updateBulkDeleteButtonVisibility();
}

async function loadCategoryConfig() {
    try {
      // Use the utility API function to get the categories
      const response = await utils.fetchApi('/config/categories');
      
      if (response.success) {
        // Set the global categories and subcategories objects
        window.categories = response.categories;
        window.subcategories = response.subcategories;
        
        // Log success in development mode
        if (window.appConfig?.debug?.enabled) {
          console.log('Categories loaded:', window.categories);
          console.log('Subcategories loaded:', window.subcategories);
        }
        
        return response;
      }
    } catch (error) {
      console.error('Error loading category configuration:', error);
      
      // Fallback to hardcoded categories if API fails
      if (typeof window.subcategories === 'undefined' || typeof window.categories === 'undefined') {
        // Copy from categoryConfig.js - ensure it's available globally
        window.categories = [
          { value: 'housing', label: 'Housing' },
          { value: 'food', label: 'Food' },
          { value: 'transportation', label: 'Transportation' },
          { value: 'utilities', label: 'Utilities' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'entertainment', label: 'Entertainment' },
          { value: 'education', label: 'Education' },
          { value: 'personal', label: 'Personal' },
          { value: 'travel', label: 'Travel' },
          { value: 'other', label: 'Other' }
        ];
        
        // Define subcategories using the subcategories object from categoryConfig.js
        // This is a fallback if the API call fails
        window.subcategories = {
          housing: [
            'Mortgage',
            'Insurance',
            'Property Rates',
            'Water Bill',
            'Land Tax',
            'Maintenance',
            'Compliance Fees',
            'Body Corporate Fees'
          ],
          food: [
            'Groceries',
            'Dining Out',
            'Takeaway',
            'Coffee/Snacks'
          ],
          transportation: [
            'Car Loan',
            'Insurance',
            'Registration',
            'Fuel',
            'Maintenance & Repairs',
            'Public Transport',
            'Tolls & Parking',
            'Ride-Sharing & Taxis'
          ],
          utilities: [
            'Electricity Bill',
            'Gas Bill',
            'Water Bill',
            'Internet',
            'Mobile (Self)',
            'Mobile (Bachha)'
          ],
          healthcare: [
            'Health Insurance',
            'Doctor Visits',
            'Dentist',
            'Pharmacy',
            'Specialist Consultations',
            'Vision Care'
          ],
          entertainment: [
            'Subscriptions',
            'Movies & Shows',
            'Concerts & Events',
            'Memberships',
            'Hobbies & Leisure Activities'
          ],
          education: [
            'School Fees',
            'Books & Stationery',
            'Kids\' Classes',
            'Online Courses',
            'Tuition Fees'
          ],
          personal: [
            'Gym Membership',
            'Personal Care',
            'Clothing & Shopping',
            'Gifts & Donations'
          ],
          travel: [
            'Domestic Travel',
            'Overseas Travel',
            'Accommodation',
            'Flights & Transport',
            'Travel Insurance'
          ],
          other: [
            'Miscellaneous Expenses',
            'Fines',
            'Unexpected Expenses'
          ]
        };
      }
    }
  }
  
  // Export expense data
  async function exportExpenseData() {
    try {
      // Show loading state
      utils.showAlert('Preparing export...', 'info');
  
      // Prepare query parameters including filters
      const queryParams = prepareQueryParams();
  
      // Get API_URL from utils
      const API_URL = utils.API_URL || 'http://localhost:5003/api';
  
      // Make API request to export
      const response = await fetch(`${API_URL}/expenses/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Export failed');
      }
  
      // Get the blob from response
      const blob = await response.blob();
  
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'expense_data.xlsx';
  
      // Append to the document and trigger download
      document.body.appendChild(a);
      a.click();
  
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  
      utils.showAlert('Expense data exported successfully', 'success');
    } catch (error) {
      utils.showAlert(error.message || 'Failed to export data', 'danger');
    }
  }

  // Setup bulk delete functionality
function setupBulkDeleteFunctionality() {
    console.log("Setting up bulk delete functionality");
    
    // Find the table header row
    const tableHeader = document.querySelector('.data-table thead tr');
    console.log("Table header found:", tableHeader ? "Yes" : "No");
    
    if (tableHeader) {
      // Check if we need to add the select all column
      if (!document.getElementById('selectAllCell')) {
        console.log("Adding select all cell to header");
        
        // Create the select all cell
        const selectAllCell = document.createElement('th');
        selectAllCell.id = 'selectAllCell';
        selectAllCell.style.width = '40px';
        
        // Create the select all checkbox
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'selectAllExpenses';
        
        // Add it to the cell
        selectAllCell.appendChild(selectAllCheckbox);
        
        // Insert at the beginning of the header row
        tableHeader.insertBefore(selectAllCell, tableHeader.firstChild);
        
        // Add event listener to the select all checkbox
        selectAllCheckbox.addEventListener('change', handleSelectAllChange);
        console.log("Added select all checkbox with event listener");
      } else {
        console.log("Select all cell already exists");
      }
    } else {
      console.error("Could not find table header for expenses");
    }
    
    // Find or create the bulk delete button
    let bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    if (!bulkDeleteBtn) {
      console.log("Creating bulk delete button");
      
      const cardActions = document.querySelector('.card-actions');
      if (cardActions) {
        // Create the button
        bulkDeleteBtn = document.createElement('button');
        bulkDeleteBtn.id = 'bulkDeleteBtn';
        bulkDeleteBtn.className = 'btn danger small';
        bulkDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';
        bulkDeleteBtn.style.display = 'none'; // Initially hidden
        
        // Add it to the card actions
        if (cardActions.firstChild) {
          cardActions.insertBefore(bulkDeleteBtn, cardActions.firstChild);
        } else {
          cardActions.appendChild(bulkDeleteBtn);
        }
        
        console.log("Bulk delete button created and added to DOM");
      } else {
        console.error("Could not find card-actions element");
      }
    } else {
      console.log("Bulk delete button already exists");
    }
    
    // Add event listener to the bulk delete button
    if (bulkDeleteBtn) {
      // Remove existing listeners to prevent duplicates
      const newBtn = bulkDeleteBtn.cloneNode(true);
      if (bulkDeleteBtn.parentNode) {
        bulkDeleteBtn.parentNode.replaceChild(newBtn, bulkDeleteBtn);
        newBtn.addEventListener('click', showBulkDeleteConfirmation);
        console.log("Added event listener to bulk delete button");
      }
    }
    
    // Create bulk delete modal if it doesn't exist
    if (!document.getElementById('bulkDeleteConfirmModal')) {
      createBulkDeleteModal();
    }
    
    // Update visibility of bulk delete button based on current selections
    updateBulkDeleteButtonVisibility();
  }
  
  // Create bulk delete confirmation modal
function createBulkDeleteModal() {
    console.log("Creating bulk delete confirmation modal");
    
    // Create the modal element
    const bulkDeleteModal = document.createElement('div');
    bulkDeleteModal.id = 'bulkDeleteConfirmModal';
    bulkDeleteModal.className = 'modal';
    
    // Set the HTML for the modal
    bulkDeleteModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirm Bulk Delete</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p id="bulkDeleteMessage">Are you sure you want to delete the selected expense records? This action cannot be undone.</p>
          <div class="form-actions">
            <button type="button" class="btn secondary close-modal">Cancel</button>
            <button type="button" class="btn danger" id="confirmBulkDeleteBtn">Delete</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to the body
    document.body.appendChild(bulkDeleteModal);
    
    // Set up close button functionality
    const closeButtons = bulkDeleteModal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        bulkDeleteModal.style.display = 'none';
      });
    });
    
    // Set up outside click to close
    window.addEventListener('click', (event) => {
      if (event.target === bulkDeleteModal) {
        bulkDeleteModal.style.display = 'none';
      }
    });
    
    // Add event listener to confirm bulk delete button
    const confirmBtn = document.getElementById('confirmBulkDeleteBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', performBulkDelete);
      console.log("Added event listener to confirm bulk delete button");
    }
    
    console.log("Bulk delete modal created and added to DOM");
  }


