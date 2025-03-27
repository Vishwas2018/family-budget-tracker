const Reminder = require('../models/Reminder');
const { getDateFilter } = require('../utils/dateFilters');

exports.getRemindersByFilter = async (filter, page, limit) => {
  const startIndex = (page - 1) * limit;
  
  return await Reminder.find(filter)
    .sort({ dueDate: 1 })
    .skip(startIndex)
    .limit(limit);
};

exports.getReminderCount = async (filter) => {
  return await Reminder.countDocuments(filter);
};

exports.calculateSummary = async (userId) => {
  const now = new Date();
  
  // Define filters for different summary stats
  const pendingFilter = { 
    user: userId, 
    status: 'pending',
    dueDate: { $gte: now }
  };
  
  const overdueFilter = { 
    user: userId, 
    status: 'overdue'
  };
  
  const upcomingFilter = { 
    user: userId, 
    status: { $ne: 'completed' },
    dueDate: { 
      $gte: now,
      $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  };
  
  // Execute queries in parallel
  const [pendingCount, overdueCount, upcomingReminders] = await Promise.all([
    Reminder.countDocuments(pendingFilter),
    Reminder.countDocuments(overdueFilter),
    Reminder.find(upcomingFilter)
  ]);
  
  // Calculate upcoming total amount
  const upcomingTotal = upcomingReminders.reduce((sum, reminder) => {
    return sum + (reminder.amount || 0);
  }, 0);
  
  // Count by category
  const byCategoryMap = {};
  for (const reminder of upcomingReminders) {
    byCategoryMap[reminder.category] = (byCategoryMap[reminder.category] || 0) + 1;
  }
  
  // services/reminderService.js (continued)
  return {
    totalPending: pendingCount,
    totalOverdue: overdueCount,
    upcomingTotal,
    byCategoryMap
  };
};

exports.getReminderById = async (id, userId) => {
  const reminder = await Reminder.findById(id);
  
  if (!reminder) {
    return null;
  }
  
  // Check ownership
  if (reminder.user.toString() !== userId) {
    return false;
  }
  
  return reminder;
};

exports.createReminder = async (reminderData) => {
  // Set status based on due date if not provided
  if (!reminderData.status) {
    const now = new Date();
    const dueDate = new Date(reminderData.dueDate);
    reminderData.status = dueDate < now ? 'overdue' : 'pending';
  }
  
  return await Reminder.create(reminderData);
};

exports.updateReminder = async (id, userId, reminderData) => {
  const reminder = await this.getReminderById(id, userId);
  
  if (!reminder) {
    return null;
  }
  
  if (reminder === false) {
    return false;
  }
  
  // Update due date status automatically if date is changed
  if (reminderData.dueDate && !reminderData.status) {
    const now = new Date();
    const dueDate = new Date(reminderData.dueDate);
    
    // Only update status if it's not completed
    if (reminder.status !== 'completed') {
      reminderData.status = dueDate < now ? 'overdue' : 'pending';
    }
  }
  
  return await Reminder.findByIdAndUpdate(id, reminderData, {
    new: true,
    runValidators: true
  });
};

exports.deleteReminder = async (id, userId) => {
  const reminder = await this.getReminderById(id, userId);
  
  if (!reminder) {
    return null;
  }
  
  if (reminder === false) {
    return false;
  }
  
  await reminder.deleteOne();
  return true;
};

exports.completeReminder = async (id, userId) => {
  const reminder = await this.getReminderById(id, userId);
  
  if (!reminder) {
    return null;
  }
  
  if (reminder === false) {
    return false;
  }
  
  // Update the status to completed
  reminder.status = 'completed';
  await reminder.save();
  
  // If recurring, create next occurrence
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
  
  return {
    reminder,
    next: nextReminder
  };
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