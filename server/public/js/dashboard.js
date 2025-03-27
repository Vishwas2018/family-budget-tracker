// dashboard.js - Dashboard functionality for the Family Budget Tracker

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (document.querySelector('.sidebar li.active a[href="dashboard.html"]')) {
        // Initialize the dashboard
        if (window.utils) {
            initializeDashboard();
        } else {
            document.addEventListener('utilsLoaded', initializeDashboard);
        }
    }
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Fetch dashboard data
        const dashboardData = await fetchDashboardData();

        // Update summary cards
        updateSummaryCards(dashboardData);

        // Load charts
        loadCharts(dashboardData);

        // Load recent transactions
        loadRecentTransactions(dashboardData.recentTransactions);

        // Load upcoming payments
        loadUpcomingPayments(dashboardData.upcomingPayments);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        utils.showAlert('Error loading dashboard data: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Fetch dashboard data from API
async function fetchDashboardData() {
    try {
        // Make API request to get dashboard data
        const response = await utils.fetchApi('/dashboard');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

// Update summary cards with dashboard data
function updateSummaryCards(data) {
    // Update total income
    const totalIncomeElement = document.getElementById('totalIncome');
    if (totalIncomeElement) {
        totalIncomeElement.textContent = utils.formatCurrency(data.income.total);
    }

    // Update total expenses
    const totalExpensesElement = document.getElementById('totalExpenses');
    if (totalExpensesElement) {
        totalExpensesElement.textContent = utils.formatCurrency(data.expenses.total);
    }

    // Update current balance
    const currentBalanceElement = document.getElementById('currentBalance');
    if (currentBalanceElement) {
        const balance = data.income.total - data.expenses.total;
        currentBalanceElement.textContent = utils.formatCurrency(balance);
    }

    // Update savings amount
    const savingsAmountElement = document.getElementById('savingsAmount');
    if (savingsAmountElement) {
        savingsAmountElement.textContent = utils.formatCurrency(data.savings);
    }
}

// Load charts with dashboard data
function loadCharts(data) {
    // Load income vs expenses chart
    loadIncomeExpenseChart(data);

    // Load expense by category chart
    loadExpenseCategoryChart(data);
}

// Load income vs expenses chart
function loadIncomeExpenseChart(data) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Clear any existing chart
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    // Extract months and values
    const months = data.monthlyData.map(item => item.month);
    const incomeValues = data.monthlyData.map(item => item.income);
    const expenseValues = data.monthlyData.map(item => item.expenses);

    // Create the chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    backgroundColor: 'rgba(46, 204, 113, 0.8)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    data: incomeValues
                },
                {
                    label: 'Expenses',
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    data: expenseValues
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + utils.formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Store chart instance for later reference
    ctx.chart = chart;
}

// Load expense by category chart
function loadExpenseCategoryChart(data) {
    const ctx = document.getElementById('expenseCategoryChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Clear any existing chart
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    // Handle no data case
    if (!data.expensesByCategory || data.expensesByCategory.length === 0) {
        ctx.parentElement.innerHTML = '<div class="no-data-message">No expense data available</div>';
        return;
    }

    // Extract categories and values
    const categories = data.expensesByCategory.map(item => item.category);
    const values = data.expensesByCategory.map(item => item.amount);

    // Define colors for categories
    const backgroundColors = [
        'rgba(52, 152, 219, 0.8)',
        'rgba(155, 89, 182, 0.8)',
        'rgba(52, 73, 94, 0.8)',
        'rgba(22, 160, 133, 0.8)',
        'rgba(243, 156, 18, 0.8)',
        'rgba(192, 57, 43, 0.8)',
        'rgba(39, 174, 96, 0.8)'
    ];

    // Create the chart
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [
                {
                    data: values,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + utils.formatCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });

    // Store chart instance for later reference
    ctx.chart = chart;
}

// Load recent transactions
function loadRecentTransactions(transactions) {
    const transactionsTable = document.getElementById('recentTransactions');
    if (!transactionsTable) return;

    if (!transactions || transactions.length === 0) {
        transactionsTable.innerHTML = '<tr><td colspan="5">No recent transactions</td></tr>';
        return;
    }

    // Clear the table
    transactionsTable.innerHTML = '';

    // Add transaction rows
    transactions.forEach(transaction => {
        const row = document.createElement('tr');

        // Format date
        const date = utils.formatDate(transaction.date);

        // Determine transaction type
        const type = transaction.type === 'income' ? 'Income' : 'Expense';
        const typeClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';

        // Create row HTML
        row.innerHTML = `
            <td>${date}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>${utils.formatCurrency(transaction.amount)}</td>
            <td><span class="${typeClass}">${type}</span></td>
        `;

        transactionsTable.appendChild(row);
    });
}

// Load upcoming payments
function loadUpcomingPayments(payments) {
    const paymentsTable = document.getElementById('upcomingPayments');
    if (!paymentsTable) return;

    if (!payments || payments.length === 0) {
        paymentsTable.innerHTML = '<tr><td colspan="5">No upcoming payments</td></tr>';
        return;
    }

    // Clear the table
    paymentsTable.innerHTML = '';

    // Add payment rows
    payments.forEach(payment => {
        const row = document.createElement('tr');

        // Format date
        const dueDate = utils.formatDate(payment.dueDate);

        // Determine status class
        let statusClass = '';
        switch (payment.status) {
            case 'paid':
                statusClass = 'status-paid';
                break;
            case 'pending':
                statusClass = 'status-pending';
                break;
            case 'overdue':
                statusClass = 'status-overdue';
                break;
            default:
                statusClass = '';
        }

        // Create row HTML
        row.innerHTML = `
            <td>${dueDate}</td>
            <td>${payment.description}</td>
            <td>${payment.category}</td>
            <td>${utils.formatCurrency(payment.amount)}</td>
            <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
        `;

        paymentsTable.appendChild(row);
    });
}