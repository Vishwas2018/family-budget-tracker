exports.getExpenses = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        // Build filter
        const filter = { user: req.user.id };

        // Add date filter
        if (req.query.dateRange || (req.query.startDate && req.query.endDate)) {
            const dateFilter = getDateFilter(req.query);
            if (dateFilter) {
                filter.date = dateFilter;
            }
        }

        // Add category filter
        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        // Add subcategory filter
        if (req.query.subcategory && req.query.subcategory !== 'all') {
            filter.subcategory = req.query.subcategory;
        }

        // Execute query
        const expenses = await Expense.find(filter)
            .sort({ date: -1 })
            .skip(startIndex)
            .limit(limit);

        // Get total count
        const total = await Expense.countDocuments(filter);

        // Calculate summary statistics
        const allExpenses = await Expense.find({
            ...filter,
            date: getDateFilter({ dateRange: 'current-month' })
        });

        // Calculate totals by category
        const categorySummary = {};
        allExpenses.forEach(expense => {
            if (!categorySummary[expense.category]) {
                categorySummary[expense.category] = 0;
            }
            categorySummary[expense.category] += expense.amount;
        });

        // Calculate totals by subcategory
        const subcategorySummary = {};
        allExpenses.forEach(expense => {
            const key = `${expense.category}-${expense.subcategory}`;
            if (!subcategorySummary[key]) {
                subcategorySummary[key] = 0;
            }
            subcategorySummary[key] += expense.amount;
        });

        const summary = {
            total: allExpenses.reduce((sum, expense) => sum + expense.amount, 0),
            byCategoryMap: categorySummary,
            bySubcategoryMap: subcategorySummary
        };

        res.status(200).json({
            success: true,
            data: {
                results: expenses,
                page,
                totalPages: Math.ceil(total / limit),
                count: expenses.length,
                total,
                summary
            }
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while getting expenses'
        });
    }
};