const dotenv = require('dotenv');
const { generateSecureSecret } = require('../utils/securityUtils');
const fs = require('fs');
const path = require('path');

/**
 * Load and validate environment configuration
 */

// Load environment variables
dotenv.config();

// Ensure .env exists
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.warn('Warning: .env file not found. Using default or generated values.');
}

// Required environment variables
const requiredEnvVars = ['NODE_ENV', 'PORT', 'MONGO_URI'];

// Check for missing required variables
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.warn(`Warning: Missing required environment variables: ${missingVars.join(', ')}`);
  console.warn('Application may not function correctly without these variables.');
}

// Generate JWT secret if not provided
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = generateSecureSecret();
  console.warn('Warning: JWT_SECRET not provided in environment variables. Generated a random secret.');
  console.warn('For production environments, set a persistent JWT_SECRET in .env file.');
}

// Create configuration object with defaults for all values
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/family-budget-tracker',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Add security-related configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // 100 requests per windowMs
    },
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
        ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:5173', 'http://localhost:4173']
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug')
  }
};

// Validate MongoDB connection string
if (!config.mongoUri.startsWith('mongodb://') && !config.mongoUri.startsWith('mongodb+srv://')) {
  console.error('Error: Invalid MongoDB connection string. Must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

// Extra validation for production environment
if (config.env === 'production') {
  // Ensure we're not using the default JWT secret in production
  if (jwtSecret === 'supersecret123456789') {
    console.error('Error: Default JWT_SECRET detected in production environment. This is a serious security risk!');
    console.error('Please set a strong, unique JWT_SECRET in your production environment variables.');
    process.exit(1);
  }
  
  // Validate MONGO_URI in production to ensure it's not using localhost
  if (config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1')) {
    console.warn('Warning: Using local MongoDB instance in production environment.');
    console.warn('Consider using a managed MongoDB service for production deployments.');
  }
}

module.exports = config;