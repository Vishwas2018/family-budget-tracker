// routes/expense.js
// routes/expense.js
const express = require('express');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses
} = require('../controllers/expense');
const { protect } = require('../middleware/auth');
// Fix the import path - make sure this points to where you created the file
const rateLimit = require('../middleware/rateLimit');

// Create rate limiter
const expenseRateLimit = rateLimit(100, 15 * 60 * 1000);

// Rest of the code...

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(expenseRateLimit);

router
  .route('/')
  .get(getExpenses)
  .post(createExpense);

router
  .route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

router.route('/bulk-delete')
  .post(bulkDeleteExpenses);

module.exports = router;