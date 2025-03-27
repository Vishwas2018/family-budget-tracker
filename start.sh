#!/bin/bash
# start.sh

# Kill any existing servers
pkill -f "node server.js" || true
pkill -f "http-server" || true

# Wait a moment for ports to clear
sleep 1

# Store project root
PROJECT_ROOT=$(pwd)

# Start backend server with specific port
cd server
PORT=5003 node server.js &
SERVER_PID=$!

# Start frontend server with no-cache headers
cd $PROJECT_ROOT
cd server/public
echo "Starting frontend server in $(pwd) with cache disabled"
npx http-server -c-1 --cors

# Clean up
kill $SERVER_PID || true