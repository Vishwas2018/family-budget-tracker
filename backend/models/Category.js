const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: {
        values: ['income', 'expense', 'both'],
        message: 'Category type must be income, expense, or both'
      }
    },
    icon: {
      type: String,
      default: 'default-icon'
    },
    color: {
      type: String,
      default: '#10b981' // Default to our primary green color
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [100, 'Description cannot exceed 100 characters']
    }
  },
  {
    timestamps: true
  }
);

// Add text index for search functionality
categorySchema.index({ name: 'text', description: 'text' });

// Method to get categories by type
categorySchema.statics.findByType = function(type) {
  return this.find({ 
    $or: [
      { type },
      { type: 'both' }
    ]
  });
};

// Static method to ensure default categories exist
categorySchema.statics.ensureDefaultCategories = async function() {
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981', isDefault: true, description: 'Regular employment income' },
    { name: 'Freelance', type: 'income', icon: 'edit', color: '#3b82f6', isDefault: true, description: 'Income from freelance work' },
    { name: 'Investments', type: 'income', icon: 'trending-up', color: '#6366f1', isDefault: true, description: 'Dividends, interest, capital gains' },
    { name: 'Gifts', type: 'income', icon: 'gift', color: '#ec4899', isDefault: true, description: 'Money received as gifts' },
    { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#64748b', isDefault: true, description: 'Miscellaneous income' },
    
    // Expense categories
    { name: 'Housing', type: 'expense', icon: 'home', color: '#f59e0b', isDefault: true, description: 'Rent, mortgage, property taxes' },
    { name: 'Food', type: 'expense', icon: 'shopping-cart', color: '#10b981', isDefault: true, description: 'Groceries and dining out' },
    { name: 'Transportation', type: 'expense', icon: 'truck', color: '#3b82f6', isDefault: true, description: 'Car payment, fuel, public transit' },
    { name: 'Utilities', type: 'expense', icon: 'zap', color: '#6366f1', isDefault: true, description: 'Electricity, water, internet' },
    { name: 'Healthcare', type: 'expense', icon: 'activity', color: '#ef4444', isDefault: true, description: 'Medical expenses and insurance' },
    { name: 'Entertainment', type: 'expense', icon: 'film', color: '#8b5cf6', isDefault: true, description: 'Movies, games, subscriptions' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899', isDefault: true, description: 'Clothing, electronics, etc.' },
    { name: 'Personal', type: 'expense', icon: 'user', color: '#14b8a6', isDefault: true, description: 'Personal care and hygiene' },
    { name: 'Debt', type: 'expense', icon: 'credit-card', color: '#f43f5e', isDefault: true, description: 'Credit card, loan payments' },
    { name: 'Savings', type: 'expense', icon: 'save', color: '#10b981', isDefault: true, description: 'Money set aside for future goals' },
    { name: 'Other Expenses', type: 'expense', icon: 'more-horizontal', color: '#64748b', isDefault: true, description: 'Miscellaneous expenses' }
  ];
  
  // Create default categories if they don't exist
  const operations = defaultCategories.map(category => ({
    updateOne: {
      filter: { name: category.name },
      update: { $setOnInsert: category },
      upsert: true
    }
  }));
  
  if (operations.length > 0) {
    return this.bulkWrite(operations);
  }
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;