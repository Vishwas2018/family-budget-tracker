const Income = require('../models/Income');
const { getDateFilter } = require('../utils/dateFilters');

// @desc    Get all incomes
// @route   GET /api/incomes
// @access  Private
exports.getIncomes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };

    // Add date filter
    if (req.query.dateRange || (req.query.startDate && req.query.endDate)) {
      const dateFilter = getDateFilter(req.query);
      if (dateFilter) {
        filter.date = dateFilter;
      }
    }

    // Add category filter
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    // Execute query
    const incomes = await Income.find(filter)
      .sort({ date: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Income.countDocuments(filter);

    // Calculate summary statistics
    const allIncomes = await Income.find({
      ...filter,
      date: getDateFilter({ dateRange: 'current-month' })
    });

    const summary = {
      total: allIncomes.reduce((sum, income) => sum + income.amount, 0),
      byCategoryMap: allIncomes.reduce((acc, income) => {
        acc[income.category] = (acc[income.category] || 0) + income.amount;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: {
        results: incomes,
        page,
        totalPages: Math.ceil(total / limit),
        count: incomes.length,
        total,
        summary
      }
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting incomes'
    });
  }
};

// @desc    Get single income
// @route   GET /api/incomes/:id
// @access  Private
exports.getIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns the income
    if (income.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this income'
      });
    }

    res.status(200).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting income'
    });
  }
};

// @desc    Create new income
// @route   POST /api/incomes
// @access  Private
exports.createIncome = async (req, res) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    const income = await Income.create(req.body);

    res.status(201).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Create income error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating income'
    });
  }
};

// @desc    Update income
// @route   PUT /api/incomes/:id
// @access  Private
exports.updateIncome = async (req, res) => {
  try {
    let income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns the income
    if (income.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this income'
      });
    }

    income = await Income.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Update income error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating income'
    });
  }
};

// @desc    Delete income
// @route   DELETE /api/incomes/:id
// @access  Private
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns the income
    if (income.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this income'
      });
    }

    await income.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting income'
    });
  }
};