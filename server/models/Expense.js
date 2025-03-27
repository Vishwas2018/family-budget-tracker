const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for user queries
  },
  payee: {
    type: String,
    required: [true, 'Please provide payee/merchant']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount']
  },
  date: {
    type: Date,
    required: [true, 'Please provide date'],
    index: true // Add index for date queries
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['housing', 'food', 'transportation', 'utilities', 'healthcare', 'entertainment', 'education', 'personal', 'travel', 'other'],
    index: true // Add index for category queries
  },
  subcategory: {
    type: String,
    required: [true, 'Please provide subcategory']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'debit', 'bank', 'mobile', 'other', '']
  },
  paymentFrequency: {
    type: String,
    enum: ['one-time', 'daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  description: {
    type: String
  },
  comments: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual property for annual amount
ExpenseSchema.virtual('annualAmount').get(function () {
  const multipliers = {
    'one-time': 1,
    'daily': 365,
    'weekly': 52,
    'fortnightly': 26,
    'monthly': 12,
    'quarterly': 4,
    'yearly': 1
  };

  return this.amount * multipliers[this.paymentFrequency];
});

// Virtual property for percentage of total (will be calculated on the frontend)
ExpenseSchema.virtual('percentageOfTotal').get(function () {
  // This is calculated on the frontend since we need the total expenses
  return 0;
});

// Add compound index for frequent queries
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });

// Include virtuals when converting to JSON
ExpenseSchema.set('toJSON', { virtuals: true });
ExpenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', ExpenseSchema);