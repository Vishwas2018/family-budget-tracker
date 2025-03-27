const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a reminder title']
  },
  description: {
    type: String
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date'],
    index: true
  },
  category: {
    type: String,
    enum: ['bill', 'subscription', 'tax', 'investment', 'insurance', 'other'],
    default: 'bill',
    index: true
  },
  amount: {
    type: Number
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound indexes
ReminderSchema.index({ user: 1, status: 1 });
ReminderSchema.index({ user: 1, dueDate: 1 });

// Pre-save hook to update status based on due date
ReminderSchema.pre('save', function (next) {
  const now = new Date();

  // If the due date is in the past and status is still pending, set to overdue
  if (this.dueDate < now && this.status === 'pending') {
    this.status = 'overdue';
  }

  next();
});

module.exports = mongoose.model('Reminder', ReminderSchema);