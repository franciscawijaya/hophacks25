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
$PKG run start &
BACKEND_PID=$!
cd ..

# start database
cd packages/market-data
$PKG install
$PKG run generate
$PKG run migrate
echo "Starting database..."
$PKG run dev &
DB_PID=$!
$PKG run dev:api &
DBAPI_PID=$!
cd ../..

# start frontend
cd frontend
$PKG install
echo "Starting frontend..."
$PKG run dev &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Database PID: $DB_PID"
echo "Database API PID: $DBAPI_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "backend, database, frontend are running."

wait $BACKEND_PID $DB_PID $DBAPI_PID $FRONTEND_PID
