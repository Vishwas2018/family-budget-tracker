const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes
router
  .route('/')
  .get(protect, authorize('admin'), getUsers);

router
  .route('/:id')
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;