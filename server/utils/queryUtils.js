const { getDateFilter } = require('./dateFilters');

exports.createFilter = (userId, query) => {
  const filter = { user: userId };
  
  // Add date filter
  if (query.dateRange || (query.startDate && query.endDate)) {
    const dateFilter = getDateFilter(query);
    if (dateFilter) {
      filter.date = dateFilter;
    }
  }
  
  // Add category filter
  if (query.category && query.category !== 'all') {
    filter.category = query.category;
  }
  
  // Add subcategory filter for expenses
  if (query.subcategory && query.subcategory !== 'all') {
    filter.subcategory = query.subcategory;
  }
  
  // Add status filter for reminders
  if (query.status && query.status !== 'all') {
    if (query.status.includes(',')) {
      // Handle comma-separated status values
      const statuses = query.status.split(',').map(s => s.trim());
      filter.status = { $in: statuses };
    } else {
      filter.status = query.status;
    }
  }
  
  return filter;
};

exports.handleApiError = (error, res) => {
  console.error('API Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }
  
  // Return error response
  res.status(500).json({
    success: false,
    message: error.message || 'Server error'
  });
};