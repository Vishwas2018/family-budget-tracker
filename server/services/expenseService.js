const Expense = require('../models/Expense');
const { getDateFilter } = require('../utils/dateFilters');

exports.getExpensesByFilter = async (filter, page, limit) => {
  const startIndex = (page - 1) * limit;
  
  return await Expense.find(filter)
    .sort({ date: -1 })
    .skip(startIndex)
    .limit(limit);
};

exports.getExpenseCount = async (filter) => {
  return await Expense.countDocuments(filter);
};

exports.calculateSummary = async (userId, dateFilter) => {
  // Create filter for current month if not provided
  const filter = { 
    user: userId,
    date: dateFilter || getDateFilter({ dateRange: 'current-month' })
  };
  
  // Get expenses for summary
  const expenses = await Expense.find(filter);
  
  // Calculate totals by category
  const categorySummary = {};
  expenses.forEach(expense => {
    categorySummary[expense.category] = (categorySummary[expense.category] || 0) + expense.amount;
  });
  
  // Calculate totals by subcategory
  const subcategorySummary = {};
  expenses.forEach(expense => {
    const key = `${expense.category}-${expense.subcategory}`;
    if (!subcategorySummary[key]) {
      subcategorySummary[key] = 0;
    }
    subcategorySummary[key] += expense.amount;
  });
  
  return {
    total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    byCategoryMap: categorySummary,
    bySubcategoryMap: subcategorySummary
  };
};

exports.getExpenseById = async (id, userId) => {
  const expense = await Expense.findById(id);
  
  if (!expense) {
    return null;
  }
  
  // Check ownership
  if (expense.user.toString() !== userId) {
    return false;
  }
  
  return expense;
};

exports.createExpense = async (expenseData) => {
  return await Expense.create(expenseData);
};

exports.updateExpense = async (id, userId, expenseData) => {
  const expense = await this.getExpenseById(id, userId);
  
  if (!expense) {
    return null;
  }
  
  if (expense === false) {
    return false;
  }
  
  return await Expense.findByIdAndUpdate(id, expenseData, {
    new: true,
    runValidators: true
  });
};

exports.deleteExpense = async (id, userId) => {
  const expense = await this.getExpenseById(id, userId);
  
  if (!expense) {
    return null;
  }
  
  if (expense === false) {
    return false;
  }
  
  await expense.deleteOne();
  return true;
};

exports.bulkDeleteExpenses = async (ids, userId) => {
  const results = {
    success: [],
    failed: []
  };
  
  // Process each ID
  for (const id of ids) {
    try {
      const result = await this.deleteExpense(id, userId);
      
      if (result === null) {
        results.failed.push({ id, reason: 'Expense not found' });
      } else if (result === false) {
        results.failed.push({ id, reason: 'Not authorized to delete this expense' });
      } else {
        results.success.push(id);
      }
    } catch (error) {
      results.failed.push({ id, reason: error.message });
    }
  }
  
  return results;
};