import { dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define expected files and directories
const expectedPaths = [
  'backend/server.js',
  'backend/models/User.js',
  'backend/routes/userRoutes.js',
  'backend/middleware/authMiddleware.js',
  'backend/.env',
  'backend/package.json'
];

console.log('Checking project structure...\n');

// Check each path
let missingFiles = false;
for (const filePath of expectedPaths) {
  const fullPath = join(__dirname, filePath);
  if (existsSync(fullPath)) {
    console.log(`✅ Found: ${filePath}`);
  } else {
    console.log(`❌ Missing: ${filePath}`);
    missingFiles = true;
  }
}

if (missingFiles) {
  console.log('\n❗ Some files are missing. Please create them before running the server.');
} else {
  console.log('\n✅ All files exist in the correct locations!');
}