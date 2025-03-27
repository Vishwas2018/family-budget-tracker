// Fixed controller with correct export
const Reminder = require('../models/Reminder');
const { getDateFilter } = require('../utils/dateFilters');

// @desc    Get all reminders
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };

    // Add date filter
    if (req.query.dateRange === 'upcoming') {
      // Special filter for upcoming reminders - due in the next 30 days or overdue
      const now = new Date();
      const thirtyDaysLater = new Date(now);
      thirtyDaysLater.setDate(now.getDate() + 30);
      
      filter.dueDate = {
        $lte: thirtyDaysLater
      };
      
      // Handle status parameter for upcoming reminders
      if (req.query.status && req.query.status !== 'all') {
        if (req.query.status.includes(',')) {
          // Handle comma-separated status values
          const statuses = req.query.status.split(',').map(s => s.trim());
          filter.status = { $in: statuses };
        } else {
          filter.status = req.query.status;
        }
      } else {
        // Default to non-completed reminders for upcoming view
        filter.status = { $ne: 'completed' };
      }
    } else if (req.query.dateRange || (req.query.startDate && req.query.endDate)) {
      // Standard date range filtering
      const dateFilter = getDateFilter(req.query);
      if (dateFilter) {
        filter.dueDate = dateFilter;
      }
    }

    // Add category filter
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    // Add status filter if not already set by upcoming filter
    if (!filter.status && req.query.status && req.query.status !== 'all') {
      if (req.query.status.includes(',')) {
        // Handle comma-separated status values
        const statuses = req.query.status.split(',').map(s => s.trim());
        filter.status = { $in: statuses };
      } else {
        filter.status = req.query.status;
      }
    }

    // Execute query
    const reminders = await Reminder.find(filter)
      .sort({ dueDate: 1 }) // Sort by due date ascending
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Reminder.countDocuments(filter);

    // Calculate summary statistics
    const now = new Date();
    const pendingFilter = { 
      user: req.user.id, 
      status: 'pending',
      dueDate: { $gte: now }
    };
    
    const overdueFilter = { 
      user: req.user.id, 
      status: 'overdue'
    };
    
    const upcomingFilter = { 
      user: req.user.id, 
      status: { $ne: 'completed' },
      dueDate: { 
        $gte: now,
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    };
    
    // Get all upcoming reminders
    const upcomingReminders = await Reminder.find(upcomingFilter);
    
    // Calculate stats
    const totalPending = await Reminder.countDocuments(pendingFilter);
    const totalOverdue = await Reminder.countDocuments(overdueFilter);
    const upcomingTotal = upcomingReminders.reduce((sum, reminder) => {
      return sum + (reminder.amount || 0);
    }, 0);
    
    // Count by category
    const byCategoryMap = {};
    for (const reminder of upcomingReminders) {
      byCategoryMap[reminder.category] = (byCategoryMap[reminder.category] || 0) + 1;
    }

    const summary = {
      totalPending,
      totalOverdue,
      upcomingTotal,
      byCategoryMap
    };

    res.status(200).json({
      success: true,
      data: {
        results: reminders,
        page,
        totalPages: Math.ceil(total / limit),
        count: reminders.length,
        total,
        summary
      }
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting reminders'
    });
  }
};

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this reminder'
      });
    }

    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting reminder'
    });
  }
};

// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    // Validate required fields
    if (!req.body.title || !req.body.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required fields'
      });
    }

    // Set status based on due date if not provided
    if (!req.body.status) {
      const now = new Date();
      const dueDate = new Date(req.body.dueDate);
      req.body.status = dueDate < now ? 'overdue' : 'pending';
    }

    const reminder = await Reminder.create(req.body);

    res.status(201).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);

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
      message: 'Server error while creating reminder'
    });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
  try {
    let reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reminder'
      });
    }

    // Update due date status automatically if date is changed
    if (req.body.dueDate && !req.body.status) {
      const now = new Date();
      const dueDate = new Date(req.body.dueDate);
      
      // Only update status if it's not completed
      if (reminder.status !== 'completed') {
        req.body.status = dueDate < now ? 'overdue' : 'pending';
      }
    }

    reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);

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
      message: 'Server error while updating reminder'
    });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reminder'
      });
    }

    await reminder.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reminder'
    });
  }
};

// @desc    Complete a reminder
// @route   PUT /api/reminders/:id/complete
// @access  Private
exports.completeReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reminder'
      });
    }

    // Update the status to completed
    reminder.status = 'completed';
    await reminder.save();

    // If this is a recurring reminder, create the next occurrence
    let nextReminder = null;
    if (reminder.isRecurring) {
      const nextDueDate = calculateNextDueDate(reminder.dueDate, reminder.recurringInterval);
      
      const newReminder = new Reminder({
        user: reminder.user,
        title: reminder.title,
        description: reminder.description,
        dueDate: nextDueDate,
        category: reminder.category,
        amount: reminder.amount,
        isRecurring: reminder.isRecurring,
        recurringInterval: reminder.recurringInterval,
        status: 'pending'
      });
      
      nextReminder = await newReminder.save();
    }

    res.status(200).json({
      success: true,
      data: {
        reminder,
        next: nextReminder
      }
    });
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing reminder'
    });
  }
};

// @desc    Bulk delete reminders
// @route   POST /api/reminders/bulk-delete
// @access  Private
exports.bulkDeleteReminders = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reminder IDs provided for deletion'
      });
    }

    // Get all reminders to check ownership
    const reminders = await Reminder.find({
      _id: { $in: ids },
      user: req.user.id
    });

    // Check if all IDs belong to the user
    if (reminders.length !== ids.length) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete one or more of the requested reminders'
      });
    }

    // Delete the reminders
    await Reminder.deleteMany({
      _id: { $in: ids },
      user: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        deleted: reminders.length
      }
    });
  } catch (error) {
    console.error('Bulk delete reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reminders'
    });
  }
};

// Helper function to calculate next due date for recurring reminders
function calculateNextDueDate(currentDueDate, interval) {
  const nextDate = new Date(currentDueDate);
  
  switch (interval) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly if interval is not specified
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}