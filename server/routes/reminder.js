// routes/reminder.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getReminders, 
  getReminder, 
  createReminder, 
  updateReminder, 
  deleteReminder,
  completeReminder,
  bulkDeleteReminders
} = require('../controllers/reminderController');

// Apply authentication middleware to all routes
router.use(protect);

// Routes for /api/reminders
router.route('/')
  .get(getReminders)
  .post(createReminder);

// Routes for /api/reminders/:id
router.route('/:id')
  .get(getReminder)
  .put(updateReminder)
  .delete(deleteReminder);

// Route for /api/reminders/:id/complete
router.route('/:id/complete')
  .put(completeReminder);

// Route for /api/reminders/bulk-delete
router.route('/bulk-delete')
  .post(bulkDeleteReminders);

module.exports = router;