#!/usr/bin/env node

/**
 * MongoDB User Security Validator
 * 
 * Analyzes the security of user password storage in MongoDB.
 * Verifies proper bcrypt hashing and secure data practices.
 */

import { dirname, join, resolve } from 'path';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

// Find the project root by looking for package.json
const findProjectRoot = (startPath) => {
  let currentPath = startPath;
  
  while (currentPath !== '/') {
    if (fs.existsSync(join(currentPath, 'package.json'))) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }
  return null;
};

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find project root
const projectRoot = findProjectRoot(__dirname);

if (!projectRoot) {
  console.error(`${colors.red}Cannot find project root. Ensure you're running this from within the project.${colors.reset}`);
  process.exit(1);
}

// Look for .env file in potential locations
const envLocations = [
  join(projectRoot, '.env'),
  join(projectRoot, 'backend', '.env'),
];

let envPath = null;
for (const path of envLocations) {
  if (fs.existsSync(path)) {
    envPath = path;
    break;
  }
}

if (!envPath) {
  console.warn(`${colors.yellow}No .env file found. Using default MongoDB connection.${colors.reset}`);
} else {
  dotenv.config({ path: envPath });
  console.log(`${colors.green}Using environment variables from: ${envPath}${colors.reset}`);
}

/**
 * Connects to MongoDB using environment variables or default connection string
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
const connectToDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/family-budget-tracker';
  
  try {
    console.log(`${colors.blue}Connecting to MongoDB...${colors.reset}`);
    const connection = await mongoose.connect(mongoUri);
    console.log(`${colors.green}Connected to MongoDB: ${connection.connection.host}${colors.reset}`);
    return connection;
  } catch (error) {
    console.error(`${colors.red}MongoDB connection error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

/**
 * Validates a password hash to ensure it's using bcrypt
 * @param {string} hash - The stored password hash
 * @returns {Object} Validation result with status and details
 */
const validatePasswordHash = (hash) => {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$
  const bcryptPattern = /^\$2[aby]\$\d+\$/;
  
  if (!hash) {
    return {
      secure: false,
      reason: 'Missing password hash',
    };
  }
  
  if (!bcryptPattern.test(hash)) {
    return {
      secure: false,
      reason: 'Not a bcrypt hash',
    };
  }
  
  // Extract the cost factor from the hash
  const costFactor = parseInt(hash.split('$')[2], 10);
  
  return {
    secure: true,
    algorithm: 'bcrypt',
    costFactor,
    strength: costFactor >= 12 ? 'high' : costFactor >= 10 ? 'medium' : 'low',
  };
};

/**
 * Analyzes database security for password storage
 */
const analyzeDatabaseSecurity = async () => {
  let connection;
  
  try {
    connection = await connectToDatabase();
    const db = connection.connection.db;
    
    // Check if the users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    
    if (collections.length === 0) {
      console.log(`${colors.yellow}No users collection found in the database.${colors.reset}`);
      return;
    }
    
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`\n${colors.bold}${colors.blue}=== USER PASSWORD SECURITY ANALYSIS ===${colors.reset}\n`);
    
    if (users.length === 0) {
      console.log(`${colors.yellow}No users found in the database.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}Found ${users.length} user records.${colors.reset}\n`);
    
    // Security metrics
    let securePasswordCount = 0;
    let insecurePasswordCount = 0;
    let highStrengthCount = 0;
    let mediumStrengthCount = 0;
    let lowStrengthCount = 0;
    
    // Analyze each user
    users.forEach((user, index) => {
      console.log(`${colors.bold}User ${index + 1}:${colors.reset}`);
      console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
      
      // Validate the password hash
      const passwordValidation = validatePasswordHash(user.password);
      
      if (passwordValidation.secure) {
        securePasswordCount++;
        console.log(`${colors.green}✓ Password is properly hashed using ${passwordValidation.algorithm}${colors.reset}`);
        console.log(`${colors.green}✓ Security strength: ${passwordValidation.strength} (cost factor: ${passwordValidation.costFactor})${colors.reset}`);
        
        // Track security strength
        if (passwordValidation.strength === 'high') highStrengthCount++;
        else if (passwordValidation.strength === 'medium') mediumStrengthCount++;
        else lowStrengthCount++;
      } else {
        insecurePasswordCount++;
        console.log(`${colors.red}✗ Insecure password storage: ${passwordValidation.reason}${colors.reset}`);
      }
      
      // Display user data safely
      console.log(`\n${colors.blue}User Information:${colors.reset}`);
      
      const safeUserData = {
        _id: user._id.toString(),
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        passwordHash: user.password ? `${user.password.substring(0, 15)}...` : 'MISSING',
        created: user.createdAt || 'N/A',
        updated: user.updatedAt || 'N/A',
      };
      
      // Format user data
      Object.entries(safeUserData).forEach(([key, value]) => {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        
        if (key === 'passwordHash') {
          console.log(`  ${displayKey}: ${colors.yellow}${value}${colors.reset}`);
        } else {
          console.log(`  ${displayKey}: ${value}`);
        }
      });
      
      console.log();
    });
    
    // Security summary
    console.log(`\n${colors.bold}${colors.blue}=== SECURITY SUMMARY ===${colors.reset}\n`);
    
    const totalUsers = users.length;
    const securePercentage = (securePasswordCount / totalUsers) * 100;
    
    console.log(`${colors.blue}Total users analyzed: ${totalUsers}${colors.reset}`);
    console.log(`${colors.green}Secure passwords: ${securePasswordCount} (${securePercentage.toFixed(1)}%)${colors.reset}`);
    
    if (insecurePasswordCount > 0) {
      console.log(`${colors.red}Insecure passwords: ${insecurePasswordCount} (${(100 - securePercentage).toFixed(1)}%)${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}Password security strength:${colors.reset}`);
    console.log(`  ${colors.green}High: ${highStrengthCount} (cost factor ≥ 12)${colors.reset}`);
    console.log(`  ${colors.blue}Medium: ${mediumStrengthCount} (cost factor = 10-11)${colors.reset}`);
    console.log(`  ${colors.yellow}Low: ${lowStrengthCount} (cost factor < 10)${colors.reset}`);
    
    // Overall assessment
    console.log(`\n${colors.bold}${colors.blue}=== ASSESSMENT ===${colors.reset}\n`);
    
    if (securePercentage === 100) {
      if (highStrengthCount === totalUsers) {
        console.log(`${colors.green}✓ Excellent security! All passwords are properly hashed with high-strength settings.${colors.reset}`);
      } else if (mediumStrengthCount > 0) {
        console.log(`${colors.green}✓ Good security. All passwords are properly hashed, but consider increasing the cost factor to 12+ for optimal security.${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ Adequate security. All passwords are hashed, but the strength should be improved by increasing the bcrypt cost factor.${colors.reset}`);
      }
    } else if (securePercentage >= 90) {
      console.log(`${colors.yellow}⚠ Most passwords are properly secured, but ${insecurePasswordCount} accounts need attention.${colors.reset}`);
    } else {
      console.log(`${colors.red}⚠ Critical security issue! Many passwords (${insecurePasswordCount}) are not properly secured.${colors.reset}`);
    }
    
    // Database metadata
    try {
      const serverInfo = await db.admin().serverInfo();
      console.log(`\n${colors.blue}MongoDB Server: ${serverInfo.version}${colors.reset}`);
    } catch (error) {
      console.log(`\n${colors.yellow}Could not retrieve MongoDB server info: ${error.message}${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error during security analysis: ${error.message}${colors.reset}`);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log(`\n${colors.green}Database connection closed${colors.reset}`);
    }
  }
};

// Execute the analysis
analyzeDatabaseSecurity();