const Category = require('../models/Category');
const { ApiError } = require('../middleware/errorMiddleware');
const apiResponse = require('../utils/apiResponse');

/**
 * Get all categories
 * @route GET /api/categories
 * @access Private
 */
const getCategories = async (req, res, next) => {
  try {
    // Handle query parameters
    const { type, search } = req.query;
    
    // Build query object
    const queryObj = {};
    
    // Filter by type if provided
    if (type && ['income', 'expense', 'both'].includes(type)) {
      queryObj.$or = [{ type }, { type: 'both' }];
    }
    
    // Search by name or description if provided
    if (search) {
      queryObj.$text = { $search: search };
    }
    
    // Fetch categories
    const categories = await Category.find(queryObj).sort({ name: 1 });
    
    return apiResponse.success(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single category by ID
 * @route GET /api/categories/:id
 * @access Private
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return apiResponse.notFound(res, 'Category not found');
    }
    
    return apiResponse.success(res, 200, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private/Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color, description } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return apiResponse.badRequest(res, 'Please provide a name and type for the category');
    }
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (existingCategory) {
      return apiResponse.conflict(res, 'A category with this name already exists');
    }
    
    // Create new category
    const category = await Category.create({
      name,
      type,
      icon: icon || 'default-icon',
      color: color || '#10b981',
      description: description || '',
      isDefault: false // User-created categories are not default
    });
    
    return apiResponse.created(res, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private/Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color, description } = req.body;
    
    // Find category
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return apiResponse.notFound(res, 'Category not found');
    }
    
    // Prevent modification of default categories
    if (category.isDefault) {
      return apiResponse.forbidden(res, 'Default categories cannot be modified');
    }
    
    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: category._id }
      });
      
      if (existingCategory) {
        return apiResponse.conflict(res, 'A category with this name already exists');
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (type) category.type = type;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (description !== undefined) category.description = description;
    
    // Save changes
    const updatedCategory = await category.save();
    
    return apiResponse.success(res, 200, 'Category updated successfully', updatedCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private/Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    // Find category
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return apiResponse.notFound(res, 'Category not found');
    }
    
    // Prevent deletion of default categories
    if (category.isDefault) {
      return apiResponse.forbidden(res, 'Default categories cannot be deleted');
    }
    
    // Check if category is in use (optional, would require transaction model)
    // This would be a more complex query to check if any transactions use this category
    
    // Delete category
    await category.deleteOne();
    
    return apiResponse.success(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset categories to defaults
 * @route POST /api/categories/reset
 * @access Private/Admin
 */
const resetCategories = async (req, res, next) => {
  try {
    // Delete non-default categories
    await Category.deleteMany({ isDefault: false });
    
    // Ensure all default categories exist
    await Category.ensureDefaultCategories();
    
    // Get updated categories
    const categories = await Category.find().sort({ name: 1 });
    
    return apiResponse.success(res, 200, 'Categories reset to defaults', categories);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  resetCategories
};