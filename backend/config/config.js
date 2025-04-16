const dotenv = require('dotenv');
const { generateSecureSecret } = require('../utils/securityUtils');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Ensure .env exists
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.warn('Warning: .env file not found. Using default or generated values.');
}

// Generate JWT secret if not provided
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = generateSecureSecret();
  console.warn('Warning: JWT_SECRET not provided in environment variables. Generated a random secret.');
  console.warn('For production environments, set a persistent JWT_SECRET in .env file.');
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/family-budget-tracker',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d'
};

module.exports = config;