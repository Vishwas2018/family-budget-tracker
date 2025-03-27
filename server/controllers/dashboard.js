const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { getDateFilter } = require('../utils/dateFilters');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current month date filter
    const currentMonthFilter = getDateFilter({ dateRange: 'current-month' });

    // Get all incomes for current month
    const incomes = await Income.find({
      user: userId,
      date: currentMonthFilter
    });

    // Get all expenses for current month
    const expenses = await Expense.find({
      user: userId,
      date: currentMonthFilter
    });

    // Calculate totals
    const incomeTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const savings = incomeTotal - expenseTotal;

    // Get monthly data for the last 6 months
    const monthlyData = await getMonthlyData(userId);

    // Get expenses by category
    const expensesByCategory = await getExpensesByCategory(userId);

    // Get recent transactions (combined incomes and expenses)
    const recentTransactions = await getRecentTransactions(userId);

    // Get upcoming payments (recurring expenses due soon)
    const upcomingPayments = await getUpcomingPayments(userId);

    res.status(200).json({
      success: true,
      data: {
        income: {
          total: incomeTotal
        },
        expenses: {
          total: expenseTotal
        },
        savings,
        monthlyData,
        expensesByCategory,
        recentTransactions,
        upcomingPayments
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting dashboard data'
    });
  }
};

// Helper function to get monthly data for the last 6 months
async function getMonthlyData(userId) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate data for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const year = currentYear + Math.floor((currentMonth - i) / 12);
    const month = (currentMonth - i + 12) % 12;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get incomes for this month
    const incomes = await Income.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Get expenses for this month
    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Calculate totals
    const incomeTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    monthlyData.push({
      month: monthNames[month],
      income: incomeTotal,
      expenses: expenseTotal
    });
  }

  return monthlyData;
}

// Helper function to get expenses by category
async function getExpensesByCategory(userId) {
  // Get current month filter
  const currentMonthFilter = getDateFilter({ dateRange: 'current-month' });

  // Get all expenses for current month
  const expenses = await Expense.find({
    user: userId,
    date: currentMonthFilter
  });

  // Group expenses by category
  const categories = {};
  expenses.forEach(expense => {
    if (!categories[expense.category]) {
      categories[expense.category] = 0;
    }
    categories[expense.category] += expense.amount;
  });

  // Convert to array format needed by the frontend
  return Object.keys(categories).map(category => ({
    category,
    amount: categories[category]
  }));
}

// Helper function to get recent transactions
async function getRecentTransactions(userId) {
  // Get recent incomes
  const incomes = await Income.find({ user: userId })
    .sort({ date: -1 })
    .limit(5);

  // Get recent expenses
  const expenses = await Expense.find({ user: userId })
    .sort({ date: -1 })
    .limit(5);

  // Convert to common format
  const incomeTransactions = incomes.map(income => ({
    _id: income._id,
    date: income.date,
    description: income.source,
    category: income.category,
    amount: income.amount,
    type: 'income'
  }));

  const expenseTransactions = expenses.map(expense => ({
    _id: expense._id,
    date: expense.date,
    description: expense.payee,
    category: expense.category,
    amount: expense.amount,
    type: 'expense'
  }));

  // Combine and sort by date
  return [...incomeTransactions, ...expenseTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}

// Helper function to get upcoming payments
async function getUpcomingPayments(userId) {
  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);

  // Find recurring expenses to simulate upcoming payments
  const recurringExpenses = await Expense.find({
    user: userId,
    isRecurring: true
  });

  // Simulate upcoming payments based on recurring expenses
  return recurringExpenses.map((expense, index) => {
    // Generate a future date based on the recurring interval
    const dueDate = new Date();
    switch (expense.recurringInterval) {
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + (7 * (index % 4)) + 1);
        break;
      case 'monthly':
        dueDate.setDate(expense.date.getDate());
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case 'yearly':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + (index % 30) + 1);
    }

    // Assign a status based on due date
    let status;
    if (dueDate < now) {
      status = 'overdue';
    } else if (dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      status = 'pending';
    } else {
      status = 'upcoming';
    }

    return {
      _id: expense._id,
      description: expense.payee,
      category: expense.category,
      amount: expense.amount,
      dueDate,
      status
    };
  }).sort((a, b) => a.dueDate - b.dueDate).slice(0, 5);
}