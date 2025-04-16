#!/usr/bin/env bash

# Budget Tracker App Launcher
# This script starts both frontend and backend servers simultaneously
# Author: Claude

set -e  # Exit immediately if a command exits with a non-zero status

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration variables
BACKEND_PORT=5001
FRONTEND_PORT=5173
PROJECT_ROOT=$(pwd)
BACKEND_DIR="${PROJECT_ROOT}/backend"
LOGS_DIR="${PROJECT_ROOT}/logs"

# Ensure log directory exists
mkdir -p "$LOGS_DIR"

log() {
  echo -e "${BLUE}[$(date +"%H:%M:%S")]${NC} $1"
}

success() {
  echo -e "${GREEN}$1${NC}"
}

warn() {
  echo -e "${YELLOW}$1${NC}"
}

error() {
  echo -e "${RED}$1${NC}"
  exit 1
}

# Function to check if a port is in use
is_port_in_use() {
  lsof -i :"$1" &>/dev/null
}

# Function to kill process running on a specific port
kill_process_on_port() {
  local port=$1
  local pid
  
  if is_port_in_use "$port"; then
    pid=$(lsof -t -i:"$port")
    log "Port $port is in use by process $pid. Attempting to kill..."
    
    if kill -15 "$pid" 2>/dev/null; then
      sleep 1
      success "Process $pid terminated gracefully."
    else
      warn "Could not terminate process gracefully. Trying force kill..."
      kill -9 "$pid" 2>/dev/null || error "Failed to kill process on port $port"
      success "Process $pid forcefully terminated."
    fi
  else
    log "Port $port is available. No need to kill any process."
  fi
}

# Function to start the backend server
start_backend() {
  log "Starting backend server on port ${BACKEND_PORT}..."
  
  # Check if backend directory exists
  if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found at $BACKEND_DIR"
  fi
  
  # Check for backend package.json
  if [ ! -f "$BACKEND_DIR/package.json" ]; then
    error "No package.json found in backend directory"
  fi
  
  # Kill any process running on the backend port
  kill_process_on_port "$BACKEND_PORT"
  
  # Set backend to use custom port
  export PORT="$BACKEND_PORT"
  
  # Start the backend
  cd "$BACKEND_DIR" || error "Failed to change to backend directory"
  
  if [ -f "server.js" ]; then
    node server.js > "$LOGS_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    success "Backend server started with PID $backend_pid"
    
    # Check if backend started successfully
    sleep 2
    if ! is_port_in_use "$BACKEND_PORT"; then
      warn "Backend may have failed to start. Check logs at $LOGS_DIR/backend.log"
    fi
  else
    error "server.js not found in backend directory"
  fi
  
  cd "$PROJECT_ROOT" || error "Failed to return to project root"
}

# Function to start the frontend server
start_frontend() {
  log "Starting frontend development server..."
  
  # Kill any process on frontend port if needed
  kill_process_on_port "$FRONTEND_PORT"
  
  # Start the frontend
  npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
  local frontend_pid=$!
  success "Frontend server started with PID $frontend_pid"
  
  # Check if frontend started successfully
  sleep 3
  if ! is_port_in_use "$FRONTEND_PORT"; then
    warn "Frontend may have failed to start. Check logs at $LOGS_DIR/frontend.log"
  fi
}

# Main function
main() {
  echo -e "${BOLD}=== Budget Tracker App Launcher ===${NC}"
  
  log "Setting up environment..."
  
  # Ensure the script is run from the project root
  if [ ! -f "package.json" ]; then
    error "This script must be run from the project root directory"
  fi
  
  # Start backend
  start_backend
  
  # Start frontend
  start_frontend
  
  # Summary
  log "Application startup complete."
  echo -e "${BOLD}URLs:${NC}"
  echo -e "  ${GREEN}Backend:${NC} http://localhost:${BACKEND_PORT}"
  echo -e "  ${GREEN}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
  echo -e "${BOLD}Logs:${NC}"
  echo -e "  ${BLUE}Backend:${NC} $LOGS_DIR/backend.log"
  echo -e "  ${BLUE}Frontend:${NC} $LOGS_DIR/frontend.log"
  
  # Monitor logs
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
  echo -e "${BOLD}Showing live logs:${NC}"
  
  # Use tail to show both logs simultaneously
  tail -f "$LOGS_DIR/backend.log" "$LOGS_DIR/frontend.log"
}

# Cleanup function
cleanup() {
  echo ""
  log "Shutting down servers..."
  
  kill_process_on_port "$BACKEND_PORT"
  kill_process_on_port "$FRONTEND_PORT"
  
  success "All servers stopped. Have a nice day!"
  exit 0
}

# Set up trap to handle script termination
trap cleanup SIGINT SIGTERM

# Run the main function
main