const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getMonthlyTransactions,
  getCategoryBreakdown
} = require('../controllers/transactionController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Transaction summary routes
router.get('/summary', getTransactionSummary);
router.get('/monthly', getMonthlyTransactions);
router.get('/category-breakdown', getCategoryBreakdown);

// CRUD routes
router
  .route('/')
  .get(getTransactions)
  .post(createTransaction);

router
  .route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;