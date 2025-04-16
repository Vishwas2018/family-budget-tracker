#!/bin/bash

# Create necessary directories
echo "Creating directory structure..."
mkdir -p backend/middleware backend/models backend/routes

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Create the backend files
echo "Setting up backend files..."

# Create backend package.json if it doesn't exist
if [ ! -f "backend/package.json" ]; then
  echo "Creating backend/package.json..."
  cat > backend/package.json << EOF
{
  "name": "family-budget-tracker-backend",
  "version": "1.0.0",
  "description": "Backend for Family Budget Tracker",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
fi

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
  echo "Creating backend/.env..."
  cat > backend/.env << EOF
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/family-budget-tracker
JWT_SECRET=supersecret123456789
EOF
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Setup completed successfully!"
echo "To start the application:"
echo "1. Make sure MongoDB is running"
echo "2. Start the frontend: npm run dev"
echo "3. Start the backend: cd backend && node server.js"
echo "   Or run both: npm run dev:all (after installing concurrently)"