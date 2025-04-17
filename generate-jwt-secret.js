#!/usr/bin/env node

/**
 * JWT Secret Generator Script
 * 
 * Generates a secure JWT secret and helps update the .env file
 * Run with: node generate-jwt-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

/**
 * Generates a cryptographically secure random string
 * @param {number} bytes - Number of bytes to generate
 * @returns {string} - Hex string representation
 */
function generateSecureSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Updates the .env file with the new JWT secret
 * @param {string} envPath - Path to the .env file
 * @param {string} secret - The new JWT secret to set
 */
function updateEnvFile(envPath, secret) {
  try {
    // Check if the file exists
    if (!fs.existsSync(envPath)) {
      console.log(`${colors.yellow}Warning: .env file not found at ${envPath}${colors.reset}`);
      console.log(`${colors.yellow}Creating a new .env file...${colors.reset}`);
      
      // Create a basic .env template
      const envTemplate = `NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/family-budget-tracker
JWT_SECRET=${secret}
JWT_EXPIRES_IN=30d
`;
      
      fs.writeFileSync(envPath, envTemplate);
      console.log(`${colors.green}Created new .env file with secure JWT_SECRET${colors.reset}`);
      return;
    }
    
    // Read the existing file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if JWT_SECRET already exists
    if (envContent.includes('JWT_SECRET=')) {
      // Replace the existing JWT_SECRET
      envContent = envContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET=${secret}`
      );
    } else {
      // Add JWT_SECRET if it doesn't exist
      envContent += `\nJWT_SECRET=${secret}`;
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}Successfully updated JWT_SECRET in .env file${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}==== JWT Secret Generator ====${colors.reset}\n`);
  
  // Generate a secure JWT secret
  const newSecret = generateSecureSecret();
  console.log(`${colors.green}Generated secure JWT secret:${colors.reset}`);
  console.log(`${colors.yellow}${newSecret}${colors.reset}\n`);
  
  // Find the .env file
  const rootDir = path.resolve(__dirname);
  const defaultEnvPath = path.join(rootDir, '.env');
  const backendEnvPath = path.join(rootDir, 'backend', '.env');
  
  let envPath = '';
  if (fs.existsSync(defaultEnvPath)) {
    envPath = defaultEnvPath;
  } else if (fs.existsSync(backendEnvPath)) {
    envPath = backendEnvPath;
  }
  
  // Create interface for command-line input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Ask for confirmation before updating
  rl.question(`${colors.blue}Update .env file at ${envPath || 'path to be specified'}? (y/n) ${colors.reset}`, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      if (!envPath) {
        rl.question(`${colors.blue}Enter path to .env file: ${colors.reset}`, (specifiedPath) => {
          const resolvedPath = path.resolve(specifiedPath);
          updateEnvFile(resolvedPath, newSecret);
          rl.close();
        });
      } else {
        updateEnvFile(envPath, newSecret);
        rl.close();
      }
    } else {
      console.log(`${colors.yellow}No changes made to .env file.${colors.reset}`);
      console.log(`${colors.yellow}Remember to manually update your JWT_SECRET for security.${colors.reset}`);
      rl.close();
    }
  });
}

// Execute the script
main();