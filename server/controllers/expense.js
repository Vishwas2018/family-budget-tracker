const expenseService = require('../services/expenseService');
const { createFilter, handleApiError } = require('../utils/queryUtils');

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses for the authenticated user
 *     description: Retrieves a paginated list of expenses with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of expenses
 *       401:
 *         description: Not authorized
 */
exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const filter = createFilter(req.user.id, req.query);

    // Execute queries in parallel
    const [expenses, total, summary] = await Promise.all([
      expenseService.getExpensesByFilter(filter, page, limit),
      expenseService.getExpenseCount(filter),
      expenseService.calculateSummary(req.user.id, filter.date)
    ]);

    res.status(200).json({
      success: true,
      data: {
        results: expenses,
        page,
        totalPages: Math.ceil(total / limit),
        count: expenses.length,
        total,
        summary
      }
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get a single expense
 *     description: Retrieves a specific expense by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense details
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Not authorized
 */
exports.getExpense = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id, req.user.id);
    
    if (expense === null) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    if (expense === false) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     description: Creates a new expense record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payee
 *               - amount
 *               - date
 *               - category
 *               - subcategory
 *     responses:
 *       201:
 *         description: Created expense
 *       400:
 *         description: Validation error
 */
exports.createExpense = async (req, res) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    // Validate subcategory is provided
    if (!req.body.subcategory) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subcategory'
      });
    }

    const expense = await expenseService.createExpense(req.body);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     description: Updates an existing expense record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Updated expense
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Not authorized
 */
exports.updateExpense = async (req, res) => {
  try {
    // Validate subcategory is provided if category is changing
    if (req.body.category && !req.body.subcategory) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subcategory'
      });
    }

    const expense = await expenseService.updateExpense(
      req.params.id, 
      req.user.id, 
      req.body
    );
    
    if (expense === null) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    if (expense === false) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     description: Deletes an existing expense record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Not authorized
 */
exports.deleteExpense = async (req, res) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user.id);
    
    if (result === null) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    if (result === false) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * @swagger
 * /api/expenses/bulk-delete:
 *   post:
 *     summary: Delete multiple expenses
 *     description: Deletes multiple expense records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Result of bulk delete operation
 */
exports.bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expense IDs to delete'
      });
    }
    
    const results = await expenseService.bulkDeleteExpenses(ids, req.user.id);
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${results.success.length} expense(s), failed to delete ${results.failed.length} expense(s)`,
      data: results
    });
  } catch (error) {
    handleApiError(error, res);
  }
};