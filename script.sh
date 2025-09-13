#!/bin/bash

if command -v pnpm &> /dev/null; then
	PKG=pnpm
elif command -v npm &> /dev/null; then
	PKG=npm
else
	echo "Neither pnpm nor npm is installed. Please install one of them."
	exit 1
fi
echo "Using package manager: $PKG"

# start backend
cd backend
$PKG install
echo "Starting backend..."
$PKG start &
BACKEND_PID=$!
cd ..

# start frontend
cd frontend
$PKG install
echo "Starting frontend..."
$PKG dev &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Both backend and frontend are running."

wait $BACKEND_PID $FRONTEND_PID
