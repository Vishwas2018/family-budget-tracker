// Get date filter object based on query parameters
exports.getDateFilter = (query) => {
  // Custom date range
  if (query.startDate && query.endDate) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day

    return {
      $gte: startDate,
      $lte: endDate
    };
  }

  // Predefined date ranges
  if (query.dateRange) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    switch (query.dateRange) {
      case 'current-month': {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return {
          $gte: startDate,
          $lte: endDate
        };
      }

      case 'last-month': {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return {
          $gte: startDate,
          $lte: endDate
        };
      }

      case 'last-3-months': {
        const startDate = new Date(year, month - 2, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return {
          $gte: startDate,
          $lte: endDate
        };
      }

      case 'last-6-months': {
        const startDate = new Date(year, month - 5, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return {
          $gte: startDate,
          $lte: endDate
        };
      }

      case 'current-year': {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        return {
          $gte: startDate,
          $lte: endDate
        };
      }
      
      case 'last-week': {
        const startDate = new Date(now);
        startDate.setDate(day - 7);
        
        return {
          $gte: startDate,
          $lte: now
        };
      }
      
      case 'year-to-date': {
        const startDate = new Date(year, 0, 1);
        
        return {
          $gte: startDate,
          $lte: now
        };
      }
      
      case 'upcoming': {
        const thirtyDaysLater = new Date(now);
        thirtyDaysLater.setDate(now.getDate() + 30);
        
        return {
          $gte: now,
          $lte: thirtyDaysLater
        };
      }

      default:
        return null;
    }
  }

  return null;
};