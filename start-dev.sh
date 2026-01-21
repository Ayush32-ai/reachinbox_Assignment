#!/bin/bash

# Start Backend and Frontend Development Servers
echo "Starting ReachInbox Scheduler Development Servers..."
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Start Backend
if check_port 4000; then
    echo "⚠ Backend is already running on http://localhost:4000"
else
    echo "Starting Backend Server..."
    cd backend && npm run dev &
    sleep 2
fi

# Start Frontend
if check_port 3000; then
    echo "⚠ Frontend is already running on http://localhost:3000"
else
    echo "Starting Frontend Server..."
    cd frontend && npm run dev &
    sleep 2
fi

echo ""
echo "✅ Development servers are starting..."
echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
wait
