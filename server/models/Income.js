const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    required: [true, 'Please provide income source']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount']
  },
  date: {
    type: Date,
    required: [true, 'Please provide date'],
    index: true
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['salary', 'rental', 'investment', 'business', 'other'],
    index: true
  },
  description: {
    type: String
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for frequent queries
IncomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Income', IncomeSchema);