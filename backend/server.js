const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Add helmet for security headers

// Import config and routes
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Initialize express
const app = express();

// Security Middleware
app.use(helmet()); // Adds various HTTP headers for security

// Rate limiting to prevent brute force attacks
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
      // Add your production origin when deployed
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
app.use(express.json({ limit: '10kb' })); // Limit size of JSON payloads
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

// Connect to MongoDB with enhanced options
mongoose
  .connect(config.mongoUri, {
    // Options are now managed automatically by Mongoose 6+
  })
  .then(async () => {
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
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit on failure
  });

// Import routes
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// API Routes
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

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  if (config.env === 'development') {
    console.log(`API available at http://localhost:${PORT}`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = server; // Export for testing