const Income = require('../models/Income');
const { getDateFilter } = require('../utils/dateFilters');

exports.getIncomesByFilter = async (filter, page, limit) => {
  const startIndex = (page - 1) * limit;
  
  return await Income.find(filter)
    .sort({ date: -1 })
    .skip(startIndex)
    .limit(limit);
};

exports.getIncomeCount = async (filter) => {
  return await Income.countDocuments(filter);
};

exports.calculateSummary = async (userId, dateFilter) => {
  // Create filter for current month if not provided
  const filter = { 
    user: userId,
    date: dateFilter || getDateFilter({ dateRange: 'current-month' })
  };
  
  // Get incomes for summary
  const incomes = await Income.find(filter);
  
  // Calculate totals by category
  const categorySummary = {};
  incomes.forEach(income => {
    categorySummary[income.category] = (categorySummary[income.category] || 0) + income.amount;
  });
  
  return {
    total: incomes.reduce((sum, income) => sum + income.amount, 0),
    byCategoryMap: categorySummary
  };
};

exports.getIncomeById = async (id, userId) => {
  const income = await Income.findById(id);
  
  if (!income) {
    return null;
  }
  
  // Check ownership
  if (income.user.toString() !== userId) {
    return false;
  }
  
  return income;
};

exports.createIncome = async (incomeData) => {
  return await Income.create(incomeData);
};

exports.updateIncome = async (id, userId, incomeData) => {
  const income = await this.getIncomeById(id, userId);
  
  if (!income) {
    return null;
  }
  
  if (income === false) {
    return false;
  }
  
  return await Income.findByIdAndUpdate(id, incomeData, {
    new: true,
    runValidators: true
  });
};

exports.deleteIncome = async (id, userId) => {
  const income = await this.getIncomeById(id, userId);
  
  if (!income) {
    return null;
  }
  
  if (income === false) {
    return false;
  }
  
  await income.deleteOne();
  return true;
};