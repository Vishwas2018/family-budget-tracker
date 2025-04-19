const dotenv = require('dotenv');
const { generateSecureSecret, validateSecretStrength } = require('../utils/securityUtils');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Enhanced configuration module with better security practices
 * - Validates environment variables
 * - Securely generates secrets when needed
 * - Enforces production security requirements
 */

// Load environment variables
dotenv.config();

// Environment-specific configuration file path
const envConfigPath = path.resolve(__dirname, `../config.${process.env.NODE_ENV || 'development'}.js`);

// Check if environment-specific config exists and load it
let envSpecificConfig = {};
if (fs.existsSync(envConfigPath)) {
  try {
    envSpecificConfig = require(envConfigPath);
    console.log(`Loaded environment-specific config: ${envConfigPath}`);
  } catch (error) {
    console.warn(`Warning: Failed to load environment config from ${envConfigPath}:`, error.message);
  }
}

// Ensure .env exists
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.warn('Warning: .env file not found. Using default or generated values.');
}

// Required environment variables with defaults and validation rules
const envConfig = {
  NODE_ENV: {
    value: process.env.NODE_ENV || 'development',
    required: true,
    validate: (value) => ['development', 'production', 'test'].includes(value),
    message: 'NODE_ENV must be one of: development, production, test'
  },
  PORT: {
    value: parseInt(process.env.PORT, 10) || 5001,
    required: true,
    validate: (value) => !isNaN(value) && value > 0 && value < 65536,
    message: 'PORT must be a valid port number (1-65535)'
  },
  MONGO_URI: {
    value: process.env.MONGO_URI || 'mongodb://localhost:27017/family-budget-tracker',
    required: true,
    validate: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
    message: 'MONGO_URI must be a valid MongoDB connection string'
  },
  JWT_SECRET: {
    value: process.env.JWT_SECRET,
    required: true,
    validate: (value, env) => {
      if (env === 'production') {
        const validation = validateSecretStrength(value);
        return validation.valid;
      }
      return true; // Non-production environments don't need strict validation
    },
    message: 'JWT_SECRET must be a strong secret in production',
    default: () => {
      // Create a secret based on machine-specific data that's still random
      // This helps maintain the same secret across app restarts in development
      const machineId = crypto
        .createHash('sha256')
        .update(`${os.hostname()}${os.platform()}${os.arch()}`)
        .digest('hex');
      
      // Create a development secret that's consistent for the machine
      // but still different for each app
      return `dev_secret_${machineId}_budget_tracker`;
    }
  },
  JWT_EXPIRES_IN: {
    value: process.env.JWT_EXPIRES_IN || '30d',
    required: false,
    validate: (value) => {
      // Should be a valid time string like 15m, 12h, 30d
      return /^\d+[smhdwy]$/.test(value);
    },
    message: 'JWT_EXPIRES_IN must be a valid time string (e.g., 15m, 12h, 30d)'
  }
};

// Check required variables and validate values
const missingVars = [];
const invalidVars = [];

Object.entries(envConfig).forEach(([key, config]) => {
  // Check if required and missing
  if (config.required && !config.value) {
    if (typeof config.default === 'function') {
      // Generate default value if available
      config.value = config.default();
      console.warn(`Warning: Required variable ${key} not provided. Using generated default.`);
    } else {
      missingVars.push(key);
    }
  }
  
  // Validate the value if present and has validation function
  if (config.value && config.validate && !config.validate(config.value, process.env.NODE_ENV)) {
    invalidVars.push({ key, message: config.message });
  }
});

// Handle missing required variables
if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Application cannot start without these variables.');
  process.exit(1);
}

// Handle invalid variables
if (invalidVars.length > 0) {
  console.error('Error: Invalid environment variable configuration:');
  invalidVars.forEach(({ key, message }) => {
    console.error(`- ${key}: ${message}`);
  });
  process.exit(1);
}

// Create JWT secret if not provided
let jwtSecret = envConfig.JWT_SECRET.value;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    jwtSecret = generateSecureSecret(64);
    console.warn('Warning: JWT_SECRET not provided in production environment. Generated a secure random secret.');
    console.warn('THIS WILL CHANGE ON RESTART! Set a persistent JWT_SECRET in .env file for production.');
  } else {
    // Use a development secret that's consistent across restarts but unique per machine
    jwtSecret = envConfig.JWT_SECRET.default();
    console.log('Using development JWT secret.');
  }
}

// Extra validation for production environment
if (process.env.NODE_ENV === 'production') {
  // Ensure we're not using the default JWT secret in production
  if (jwtSecret === 'supersecret123456789') {
    console.error('Error: Default JWT_SECRET detected in production environment. This is a serious security risk!');
    console.error('Please set a strong, unique JWT_SECRET in your production environment variables.');
    process.exit(1);
  }
  
  // Validate MONGO_URI in production to ensure it's not using localhost
  if (envConfig.MONGO_URI.value.includes('localhost') || envConfig.MONGO_URI.value.includes('127.0.0.1')) {
    console.warn('Warning: Using local MongoDB instance in production environment.');
    console.warn('Consider using a managed MongoDB service for production deployments.');
  }
  
  // Check JWT expiration - should not be too long in production
  const expiresIn = envConfig.JWT_EXPIRES_IN.value;
  if (expiresIn.endsWith('d') && parseInt(expiresIn) > 30) {
    console.warn('Warning: JWT_EXPIRES_IN is set to more than 30 days in production.');
    console.warn('Consider using a shorter expiration time for security reasons.');
  }
}

// Create final configuration object by merging default values, environment values and env-specific config
const config = {
  env: envConfig.NODE_ENV.value,
  port: envConfig.PORT.value,
  mongoUri: envConfig.MONGO_URI.value,
  jwtSecret,
  jwtExpiresIn: envConfig.JWT_EXPIRES_IN.value,
  
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
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
    format: process.env.LOG_FORMAT || 'combined'
  },
  
  // Override with environment-specific config
  ...envSpecificConfig
};

// Make configuration immutable
Object.freeze(config);
Object.freeze(config.security);
Object.freeze(config.security.rateLimit);
Object.freeze(config.security.cors);
Object.freeze(config.logging);

module.exports = config;