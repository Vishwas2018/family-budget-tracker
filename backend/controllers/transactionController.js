const Transaction = require('../models/Transaction');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * Get all transactions for the logged-in user
 * @route GET /api/transactions
 * @access Private
 */
const getTransactions = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { type, startDate, endDate, category, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add type filter if provided (income or expense)
    if (type) {
      filter.type = type;
    }
    
    // Add category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination info
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * @route GET /api/transactions/:id
 * @access Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Check if transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access this transaction', 403);
    }
    
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new transaction
 * @route POST /api/transactions
 * @access Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, isRecurring, recurringInterval } = req.body;
    
    // Validate required fields
    if (!type || !amount || !category || !date) {
      throw new ApiError('Please provide all required fields', 400);
    }
    
    // Validate transaction type
    if (!['income', 'expense'].includes(type)) {
      throw new ApiError('Transaction type must be either income or expense', 400);
    }
    
    // Validate amount is positive
    if (amount <= 0) {
      throw new ApiError('Amount must be greater than 0', 400);
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: new Date(date),
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || null
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a transaction
 * @route PUT /api/transactions/:id
 * @access Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Check if transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this transaction', 403);
    }
    
    // Update fields if provided
    const { type, amount, category, description, date, isRecurring, recurringInterval } = req.body;
    
    if (type) {
      // Validate transaction type
      if (!['income', 'expense'].includes(type)) {
        throw new ApiError('Transaction type must be either income or expense', 400);
      }
      transaction.type = type;
    }
    
    if (amount) {
      // Validate amount is positive
      if (amount <= 0) {
        throw new ApiError('Amount must be greater than 0', 400);
      }
      transaction.amount = amount;
    }
    
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringInterval !== undefined) transaction.recurringInterval = recurringInterval;
    
    const updatedTransaction = await transaction.save();
    
    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a transaction
 * @route DELETE /api/transactions/:id
 * @access Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Check if transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to delete this transaction', 403);
    }
    
    await transaction.deleteOne();
    
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction summary (total income, expenses, balance)
 * @route GET /api/transactions/summary
 * @access Private
 */
const getTransactionSummary = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Basic match for user
    const match = { user: req.user._id };
    
    // Add date filter if provided
    if (Object.keys(dateFilter).length > 0) {
      match.date = dateFilter;
    }
    
    // Aggregate to get summary stats
    const summary = await Transaction.aggregate([
      { $match: match },
      { 
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Transform aggregation result into a more usable format
    const summaryData = {
      income: 0,
      expenses: 0,
      balance: 0
    };
    
    summary.forEach(item => {
      summaryData[item._id] = item.total;
    });
    
    // Calculate balance
    summaryData.balance = summaryData.income - summaryData.expenses;
    
    res.json(summaryData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly transaction data for reports
 * @route GET /api/transactions/monthly
 * @access Private
 */
const getMonthlyTransactions = async (req, res, next) => {
  try {
    // Get year from query params or use current year
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Aggregate monthly data
    const monthlyData = await Transaction.aggregate([
      { 
        $match: { 
          user: req.user._id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);
    
    // Transform data for client
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Initialize result object
    const result = months.map((month, index) => ({
      month,
      monthNum: index + 1,
      income: 0,
      expenses: 0,
      balance: 0
    }));
    
    // Fill in the data from aggregation
    monthlyData.forEach(item => {
      const monthIndex = item._id.month - 1;
      const type = item._id.type;
      
      if (type === 'income') {
        result[monthIndex].income = item.total;
      } else if (type === 'expense') {
        result[monthIndex].expenses = item.total;
      }
      
      // Recalculate balance
      result[monthIndex].balance = result[monthIndex].income - result[monthIndex].expenses;
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category breakdown for expenses
 * @route GET /api/transactions/category-breakdown
 * @access Private
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { startDate, endDate, type = 'expense' } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Build match object
    const match = { 
      user: req.user._id,
      type
    };
    
    // Add date filter if provided
    if (Object.keys(dateFilter).length > 0) {
      match.date = dateFilter;
    }
    
    // Aggregate to get category breakdown
    const categoryData = await Transaction.aggregate([
      { $match: match },
      { 
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);
    
    // Calculate total for percentage calculation
    const total = categoryData.reduce((sum, category) => sum + category.amount, 0);
    
    // Format response with percentages
    const formattedData = categoryData.map(category => ({
      category: category._id,
      amount: category.amount,
      count: category.count,
      percentage: total > 0 ? (category.amount / total) * 100 : 0
    }));
    
    res.json({
      breakdown: formattedData,
      total
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getMonthlyTransactions,
  getCategoryBreakdown
};