// income.js - Income page functionality for the Family Budget Tracker

// Global variables
let incomeData = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    dateRange: 'current-month',
    startDate: '',
    endDate: '',
    category: 'all'
};
let selectedIncomeId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the income page
    if (document.querySelector('.sidebar li.active a[href="income.html"]')) {
        // Initialize the income page when utils are available
        if (window.utils) {
            initializeIncomePage();
        } else {
            document.addEventListener('utilsLoaded', initializeIncomePage);
        }
    }
});

// Initialize income page
function initializeIncomePage() {
    // Load income data
    loadIncomeData();

    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners for the page
function setupEventListeners() {
    // Add income button
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => {
            showIncomeModal();
        });
    }

    // Income form submission
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeFormSubmit);
    }

    // Recurring checkbox toggle
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.addEventListener('change', toggleRecurringFields);
    }

    // Filter form
    const incomeFilterForm = document.getElementById('incomeFilterForm');
    if (incomeFilterForm) {
        incomeFilterForm.addEventListener('submit', handleFilterSubmit);
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
        exportBtn.addEventListener('click', exportIncomeData);
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteIncome);
    }
}

// Load income data from API
async function loadIncomeData() {
    try {
        // Show loading state
        const incomeListElement = document.getElementById('incomeList');
        if (incomeListElement) {
            incomeListElement.innerHTML = '<tr><td colspan="6">Loading income data...</td></tr>';
        }

        // Prepare query parameters
        const queryParams = prepareQueryParams();

        // Make API request to get income data
        const response = await utils.fetchApi(`/incomes?${queryParams}`);

        // Store the data
        incomeData = response.data.results;
        currentPage = response.data.page;
        totalPages = response.data.totalPages;

        // Update summary cards
        updateIncomeSummary(response.data.summary);

        // Display the income list
        displayIncomeList();

        // Update pagination
        updatePagination();
    } catch (error) {
        console.error('Error fetching income data:', error);
        utils.showAlert('Error loading income data: ' + error.message, 'danger');

        // Show error state
        const incomeListElement = document.getElementById('incomeList');
        if (incomeListElement) {
            incomeListElement.innerHTML = '<tr><td colspan="6">Failed to load income data</td></tr>';
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

    return params.toString();
}

// Update income summary cards
function updateIncomeSummary(summary) {
    // Update total income
    const totalIncomeElement = document.getElementById('totalIncome');
    if (totalIncomeElement && summary.total) {
        totalIncomeElement.textContent = utils.formatCurrency(summary.total);
    }

    // Update salary income
    const salaryIncomeElement = document.getElementById('salaryIncome');
    if (salaryIncomeElement && summary.byCategoryMap && summary.byCategoryMap.salary) {
        salaryIncomeElement.textContent = utils.formatCurrency(summary.byCategoryMap.salary);
    } else if (salaryIncomeElement) {
        salaryIncomeElement.textContent = utils.formatCurrency(0);
    }

    // Update rental income
    const rentalIncomeElement = document.getElementById('rentalIncome');
    if (rentalIncomeElement && summary.byCategoryMap && summary.byCategoryMap.rental) {
        rentalIncomeElement.textContent = utils.formatCurrency(summary.byCategoryMap.rental);
    } else if (rentalIncomeElement) {
        rentalIncomeElement.textContent = utils.formatCurrency(0);
    }

    // Update other income
    const otherIncomeElement = document.getElementById('otherIncome');
    if (otherIncomeElement) {
        let otherIncome = 0;

        if (summary.byCategoryMap) {
            // Calculate sum of all categories except salary and rental
            for (const [category, amount] of Object.entries(summary.byCategoryMap)) {
                if (category !== 'salary' && category !== 'rental') {
                    otherIncome += amount;
                }
            }
        }

        otherIncomeElement.textContent = utils.formatCurrency(otherIncome);
    }
}

// Display income list
function displayIncomeList() {
    const incomeListElement = document.getElementById('incomeList');
    if (!incomeListElement) return;

    if (!incomeData || incomeData.length === 0) {
        incomeListElement.innerHTML = '<tr><td colspan="6">No income records found</td></tr>';
        return;
    }

    // Clear the list
    incomeListElement.innerHTML = '';

    // Add income rows
    incomeData.forEach(income => {
        const row = document.createElement('tr');

        // Format date
        const date = utils.formatDate(income.date);

        // Format recurring badge
        const recurringBadge = income.isRecurring
            ? `<span class="badge badge-info">Recurring (${income.recurringInterval})</span>`
            : '<span class="badge badge-secondary">One-time</span>';

        // Create row HTML
        row.innerHTML = `
            <td>${date}</td>
            <td>${income.source}</td>
            <td>${income.category}</td>
            <td>${utils.formatCurrency(income.amount)}</td>
            <td>${recurringBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${income._id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${income._id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        incomeListElement.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const incomeId = button.getAttribute('data-id');
            editIncome(incomeId);
        });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const incomeId = button.getAttribute('data-id');
            showDeleteConfirmation(incomeId);
        });
    });
}

// Update pagination controls
function updatePagination() {
    const paginationElement = document.getElementById('incomePagination');
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
            loadIncomeData();
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
                loadIncomeData();
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
            loadIncomeData();
        }
    });
    paginationElement.appendChild(nextButton);
}

// Show income modal for adding new income
function showIncomeModal(incomeId = null) {
    // Reset form
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.reset();
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
        modalTitle.textContent = incomeId ? 'Edit Income' : 'Add Income';
    }

    // Clear hidden income ID
    const incomeIdField = document.getElementById('incomeId');
    if (incomeIdField) {
        incomeIdField.value = '';
    }

    // If editing, fill the form with income data
    if (incomeId) {
        fillIncomeForm(incomeId);
    }

    // Show the modal
    utils.openModal('incomeModal');
}

// Fill income form with data for editing
function fillIncomeForm(incomeId) {
    // Find the income item
    const income = incomeData.find(item => item._id === incomeId);
    if (!income) return;

    // Set the income ID
    const incomeIdField = document.getElementById('incomeId');
    if (incomeIdField) {
        incomeIdField.value = income._id;
    }

    // Fill form fields
    const sourceField = document.getElementById('source');
    if (sourceField) {
        sourceField.value = income.source;
    }

    const amountField = document.getElementById('amount');
    if (amountField) {
        amountField.value = income.amount;
    }

    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.value = utils.formatDateForInput(income.date);
    }

    const categoryField = document.getElementById('category');
    if (categoryField) {
        categoryField.value = income.category;
    }

    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        descriptionField.value = income.description || '';
    }

    // Set recurring checkbox
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.checked = income.isRecurring;
    }

    // Show/hide recurring fields
    const recurringFields = document.getElementById('recurringFields');
    if (recurringFields) {
        if (income.isRecurring) {
            recurringFields.style.display = 'block';

            const recurringIntervalField = document.getElementById('recurringInterval');
            if (recurringIntervalField) {
                recurringIntervalField.value = income.recurringInterval || 'monthly';
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

// Handle income form submission
async function handleIncomeFormSubmit(event) {
    event.preventDefault();

    // Get form data
    const incomeId = document.getElementById('incomeId').value;
    const source = document.getElementById('source').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringInterval = isRecurring ? document.getElementById('recurringInterval').value : null;

    // Validate form data
    if (!source || !amount || !date || !category) {
        utils.showAlert('Please fill in all required fields', 'danger');
        return;
    }

    // Prepare income data
    const incomeData = {
        source,
        amount,
        date,
        category,
        description,
        isRecurring,
        recurringInterval
    };

    try {
        if (incomeId) {
            // Update existing income
            await utils.fetchApi(`/incomes/${incomeId}`, {
                method: 'PUT',
                body: JSON.stringify(incomeData)
            });

            utils.showAlert('Income updated successfully', 'success');
        } else {
            // Create new income
            await utils.fetchApi('/incomes', {
                method: 'POST',
                body: JSON.stringify(incomeData)
            });

            utils.showAlert('Income added successfully', 'success');
        }

        // Close the modal
        utils.closeModal('incomeModal');

        // Reload income data
        loadIncomeData();
    } catch (error) {
        utils.showAlert(error.message || 'Failed to save income', 'danger');
    }
}

// Edit income
function editIncome(incomeId) {
    showIncomeModal(incomeId);
}

// Show delete confirmation
function showDeleteConfirmation(incomeId) {
    // Store the selected income ID
    selectedIncomeId = incomeId;

    // Show the confirmation modal
    utils.openModal('deleteConfirmModal');
}

// Confirm delete income
async function confirmDeleteIncome() {
    if (!selectedIncomeId) return;

    try {
        // Delete the income
        await utils.fetchApi(`/incomes/${selectedIncomeId}`, {
            method: 'DELETE'
        });

        // Show success message
        utils.showAlert('Income deleted successfully', 'success');

        // Close the modal
        utils.closeModal('deleteConfirmModal');

        // Reset selected income ID
        selectedIncomeId = null;

        // Reload income data
        loadIncomeData();
    } catch (error) {
        utils.showAlert(error.message || 'Failed to delete income', 'danger');
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

    // Update filters
    currentFilters = {
        dateRange,
        startDate,
        endDate,
        category
    };

    // Reset to first page
    currentPage = 1;

    // Load data with new filters
    loadIncomeData();
}

// Reset filters
function resetFilters() {
    // Reset filter form
    const filterForm = document.getElementById('incomeFilterForm');
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
        category: 'all'
    };

    // Reset to first page
    currentPage = 1;

    // Load data with reset filters
    loadIncomeData();
}

// Handle import form submission
async function handleImportFormSubmit(event) {
    event.preventDefault();

    // Get the file
    const fileInput = document.getElementById('incomeImportFile');
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

        // Get API_URL from utils
        const API_URL = 'http://localhost:5003/api'; // Fallback

        // Make API request to import
        const response = await fetch(`${API_URL}/incomes/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        // Show success message
        utils.showAlert(`Successfully imported ${data.data.imported} income records`, 'success');

        // Close the modal
        utils.closeModal('importModal');

        // Reset the form
        const importForm = document.getElementById('importForm');
        if (importForm) {
            importForm.reset();
        }

        // Reload income data
        loadIncomeData();
    } catch (error) {
        utils.showAlert(error.message || 'Failed to import data', 'danger');
    }
}

// Export income data
async function exportIncomeData() {
    try {
        // Prepare query parameters including filters
        const queryParams = prepareQueryParams();

        // Get API_URL from utils
        const API_URL = 'http://localhost:5003/api'; // Fallback

        // Make API request to export
        const response = await fetch(`${API_URL}/incomes/export?${queryParams}`, {
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
        a.download = 'income_data.xlsx';

        // Append to the document and trigger download
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        utils.showAlert('Income data exported successfully', 'success');
    } catch (error) {
        utils.showAlert(error.message || 'Failed to export data', 'danger');
    }
}