const User = require('../models/User');
const { generateToken } = require('../utils/securityUtils');
const { ApiError } = require('../middleware/errorMiddleware');
const config = require('../config/config');

/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Enhanced input validation
    if (!name || !email || !password) {
      throw new ApiError('Please provide all required fields', 400);
    }

    // Email format validation (additional to mongoose validation)
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError('Please provide a valid email address', 400);
    }

    // Password strength validation
    if (password.length < 6) {
      throw new ApiError('Password must be at least 6 characters long', 400);
    }

    // Check if user already exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      throw new ApiError('User with this email already exists', 400);
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      // Role defaults to 'user' per schema
    });

    if (!user) {
      throw new ApiError('Invalid user data', 400);
    }

    // Generate token
    const token = generateToken(user._id, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    // Update last login time
    await user.updateLastLogin();

    // Create response with user data and token
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return next(new ApiError('This email is already registered', 400));
    }
    next(error);
  }
};

/**
 * Authenticate user & get token
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError('Please provide email and password', 400);
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    // Update last login time
    await user.updateLastLogin();

    // Send successful response
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    // req.user is already set by the protect middleware
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Update fields if provided
    user.name = req.body.name || user.name;
    
    // Only update email if it's changed and not already taken
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        throw new ApiError('Email already in use', 400);
      }
      user.email = req.body.email;
    }

    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Prevent admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError('You cannot delete your own account', 400);
    }
    
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser
};