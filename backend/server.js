const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

// Import config and routes
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Initialize express
const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
}));

// Rate limiting to prevent brute force attacks
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Apply rate limiter to login and register routes
app.use('/api/users/login', loginLimiter);
app.use('/api/users/register', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 register attempts per hour
  message: { message: 'Too many accounts created, please try again later' },
}));

// CORS configuration with secure defaults
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin || config.env === 'development' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Parsing Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware for development
if (config.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
  // Add morgan for more detailed logging in development
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// API Routes - FIX: Use proper API routes configuration
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: config.env });
});

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Serve static assets in production
if (config.env === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Any route that's not api will be redirected to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB with enhanced options
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected successfully');
    
    // Initialize database with default data
    try {
      // Import models for initialization
      const Category = require('./models/Category');
      
      // Ensure default categories exist
      await Category.ensureDefaultCategories();
      console.log('Default categories initialized');
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit on failure
  }
};

// Connect to database before starting server
connectDB().then(() => {
  // Start server
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Server running in ${config.env} mode on port ${PORT}`);
    if (config.env === 'development') {
      console.log(`API available at http://localhost:${PORT}`);
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app; // Export for testing