const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Transaction type must be either income or expense'
      }
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringInterval: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual', null],
        message: 'Invalid recurring interval'
      },
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create compound index for optimal query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

// Virtual property to determine if a transaction is recent (within last 7 days)
transactionSchema.virtual('isRecent').get(function() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
  return this.date >= sevenDaysAgo;
});

// Pre-save middleware to validate recurring transactions
transactionSchema.pre('save', function(next) {
  if (this.isRecurring && !this.recurringInterval) {
    this.recurringInterval = 'monthly'; // Default to monthly if recurring but no interval specified
  }
  
  if (!this.isRecurring) {
    this.recurringInterval = null; // Clear interval if not recurring
  }
  
  next();
});

// Static method to find user's transactions by time period
transactionSchema.statics.findByTimePeriod = function(userId, startDate, endDate) {
  const query = { user: userId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to calculate summary statistics
transactionSchema.statics.calculateSummary = async function(userId, startDate = null, endDate = null) {
  const match = { user: mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: match },
    { 
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    income: 0,
    expenses: 0,
    balance: 0
  };
  
  summary.forEach(item => {
    result[item._id] = item.total;
  });
  
  result.balance = result.income - result.expenses;
  
  return result;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;