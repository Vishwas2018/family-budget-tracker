const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  resetCategories
} = require('../controllers/categoryController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Routes that require admin privileges
router.post('/', authorize('admin'), createCategory);
router.put('/:id', authorize('admin'), updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);
router.post('/reset', authorize('admin'), resetCategories);

module.exports = router;