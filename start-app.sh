#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Family Budget Tracker Startup Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to check if port is in use
is_port_in_use() {
  if command -v lsof > /dev/null; then
    lsof -i:"$1" > /dev/null
    return $?
  elif command -v netstat > /dev/null; then
    netstat -tuln | grep ":$1 " > /dev/null
    return $?
  else
    echo -e "${YELLOW}Warning: Cannot check port availability (missing lsof/netstat)${NC}"
    return 1
  fi
}

# Check if MongoDB is running (simplified check)
echo -e "\n${YELLOW}Checking for MongoDB...${NC}"
if command -v mongod > /dev/null; then
  echo -e "${GREEN}MongoDB is installed.${NC}"
else
  echo -e "${YELLOW}MongoDB command not found. This might be fine if you're using MongoDB Atlas or another remote connection.${NC}"
fi

# Kill processes if needed
if is_port_in_use 5001; then
  echo -e "${YELLOW}Port 5001 is already in use. Attempting to free it...${NC}"
  if command -v lsof > /dev/null; then
    kill $(lsof -t -i:5001) 2>/dev/null || true
    sleep 1
  else
    echo -e "${RED}Cannot free port 5001. Please check for running processes manually.${NC}"
  fi
fi

if is_port_in_use 5173; then
  echo -e "${YELLOW}Port 5173 is already in use. Attempting to free it...${NC}"
  if command -v lsof > /dev/null; then
    kill $(lsof -t -i:5173) 2>/dev/null || true
    sleep 1
  else
    echo -e "${RED}Cannot free port 5173. Please check for running processes manually.${NC}"
  fi
fi

# Start backend
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd backend
npm install > ../logs/backend-install.log 2>&1 || {
  echo -e "${RED}Failed to install backend dependencies. Check logs/backend-install.log${NC}"
  exit 1
}

if [ -f "server.js" ]; then
  node server.js > ../logs/backend.log 2>&1 &
  BACKEND_PID=$!
  echo -e "${GREEN}Backend started with PID: ${BACKEND_PID}${NC}"
else
  echo -e "${RED}server.js not found in backend directory!${NC}"
  exit 1
fi
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to initialize (5 seconds)...${NC}"
sleep 5

# Check if backend is still running
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${GREEN}Backend is running.${NC}"
else
  echo -e "${RED}Backend failed to start. Check logs/backend.log for details.${NC}"
  echo -e "${YELLOW}Last 10 lines of the backend log:${NC}"
  tail -n 10 logs/backend.log
  exit 1
fi

# Install frontend dependencies
echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
npm install > logs/frontend-install.log 2>&1 || {
  echo -e "${RED}Failed to install frontend dependencies. Check logs/frontend-install.log${NC}"
  kill $BACKEND_PID
  exit 1
}

# Start frontend
echo -e "\n${YELLOW}Starting frontend development server...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: ${FRONTEND_PID}${NC}"

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to initialize (5 seconds)...${NC}"
sleep 5

# Check if frontend is still running
if kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${GREEN}Frontend is running.${NC}"
else
  echo -e "${RED}Frontend failed to start. Check logs/frontend.log for details.${NC}"
  echo -e "${YELLOW}Last 10 lines of the frontend log:${NC}"
  tail -n 10 logs/frontend.log
  kill $BACKEND_PID
  exit 1
fi

# Success message
echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${YELLOW}Backend API:${NC} http://localhost:5001"
echo -e "${YELLOW}Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}Log files:${NC}"
echo -e "  - ${BLUE}Backend:${NC} $(pwd)/logs/backend.log"
echo -e "  - ${BLUE}Frontend:${NC} $(pwd)/logs/frontend.log"
echo -e "${GREEN}==============================================================================${NC}"

# Function to clean up on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  kill $FRONTEND_PID 2>/dev/null || true
  kill $BACKEND_PID 2>/dev/null || true
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# Set up trap for clean shutdown
trap cleanup INT TERM

echo -e "\n${YELLOW}Monitoring logs. Press Ctrl+C to stop all services.${NC}"
echo -e "${BLUE}------ Backend Log ------${NC}"
tail -f logs/backend.log | sed 's/^/[Backend] /' &
BACKEND_TAIL_PID=$!

echo -e "${BLUE}\n------ Frontend Log ------${NC}"
tail -f logs/frontend.log | sed 's/^/[Frontend] /' &
FRONTEND_TAIL_PID=$!

# Wait for Ctrl+C
wait $BACKEND_TAIL_PID $FRONTEND_TAIL_PID