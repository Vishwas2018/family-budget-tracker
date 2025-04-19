#!/usr/bin/env node

/**
 * useAuth Import Checker Utility (ES Module Version)
 * 
 * This script scans your project files for components that use the useAuth hook
 * but may be missing the necessary import statement.
 * 
 * Usage: node importChecker.js
 */

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

// Directories to scan (relative to project root)
const scanDirs = ['src', 'src/components', 'src/pages', 'src/contexts', 'src/hooks'];

// File extensions to scan
const extensions = ['.js', '.jsx'];

// Regular expressions for detection
const useAuthRegex = /\buseAuth\s*\(/;
const importRegex = /import\s+{[^}]*useAuth[^}]*}\s+from\s+['"]\.\.?\/contexts\/AuthContext['"];?/;

// Results container
const results = {
  scanned: 0,
  useAuthFound: 0,
  importMissing: 0,
  files: []
};

/**
 * Recursively scan a directory for JS/JSX files
 */
function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recurse into subdirectories
        scanDirectory(itemPath);
      } else if (stats.isFile() && extensions.includes(path.extname(itemPath))) {
        // Process JavaScript/JSX files
        processFile(itemPath);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dirPath}: ${error.message}${colors.reset}`);
  }
}

/**
 * Process a single file to check for useAuth usage and imports
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    results.scanned++;
    
    // Check if file uses useAuth
    if (useAuthRegex.test(content)) {
      results.useAuthFound++;
      
      // Check if import is missing
      if (!importRegex.test(content)) {
        results.importMissing++;
        results.files.push({
          path: filePath,
          content,
          fixed: false
        });
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error processing file ${filePath}: ${error.message}${colors.reset}`);
  }
}

/**
 * Fix missing imports in identified files
 */
function fixMissingImports() {
  for (const file of results.files) {
    try {
      // Determine the appropriate import path (context-specific)
      const importPath = getImportPath(file.path);
      
      // Add import at the top of the file, after other imports
      const lines = file.content.split('\n');
      let lastImportIndex = -1;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      // Insert our import after the last import or at the top if no imports
      const importStatement = `import { useAuth } from '${importPath}';`;
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      
      // Write the fixed content back to the file
      const fixedContent = lines.join('\n');
      fs.writeFileSync(file.path, fixedContent, 'utf8');
      
      file.fixed = true;
      console.log(`${colors.green}✓ Fixed import in ${file.path}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error fixing file ${file.path}: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Determine the appropriate import path based on file location
 */
function getImportPath(filePath) {
  // Simple path calculation
  const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src/contexts/AuthContext')).replace(/\\/g, '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

/**
 * Print a summary of results
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.blue}useAuth Import Checker Summary${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Files scanned: ${results.scanned}`);
  console.log(`Files using useAuth: ${results.useAuthFound}`);
  console.log(`Files with missing imports: ${results.importMissing}`);
  console.log(`Files fixed: ${results.files.filter(f => f.fixed).length}`);
  console.log('='.repeat(60));
  
  // If any files couldn't be fixed, list them
  const unfixed = results.files.filter(f => !f.fixed);
  if (unfixed.length > 0) {
    console.log(`\n${colors.yellow}The following files still need manual fixes:${colors.reset}`);
    unfixed.forEach(file => console.log(`- ${file.path}`));
  } else if (results.importMissing > 0) {
    console.log(`\n${colors.green}All files with missing imports have been fixed!${colors.reset}`);
  }
}

/**
 * Main function to run the script
 */
function main() {
  console.log(`${colors.bold}${colors.blue}useAuth Import Checker${colors.reset}`);
  console.log('Scanning project files for missing useAuth imports...\n');
  
  // Scan directories
  for (const dir of scanDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    }
  }
  
  // Fix missing imports if any found
  if (results.importMissing > 0) {
    console.log(`\n${colors.yellow}Found ${results.importMissing} files with missing useAuth imports.${colors.reset}`);
    console.log('Fixing missing imports...\n');
    fixMissingImports();
  } else {
    console.log(`\n${colors.green}No missing useAuth imports found!${colors.reset}`);
  }
  
  // Print summary
  printSummary();
}

// Run the script
main();