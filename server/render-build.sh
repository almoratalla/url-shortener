#!/bin/bash

# Display current directory and Node version
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Step 1: Run TypeScript compiler
echo "Running TypeScript compiler..."
npx tsc

# Step 2: Create necessary directories
mkdir -p dist/db

# Step 3: Copy JavaScript files that TypeScript doesn't process
echo "Copying knexfile.js to dist directory..."
cp -f ./src/db/knexfile.js ./dist/db/

# Step 4: Copy migrations directory
echo "Copying migrations directory..."
mkdir -p dist/db/migrations
cp -rf ./src/db/migrations/* ./dist/db/migrations/ 2>/dev/null || :

# Step 5: Verify the structure
echo "Verifying build output structure:"
if [ -f dist/rest-api.js ]; then
  echo "✓ dist/rest-api.js exists"
else
  echo "✗ dist/rest-api.js is missing - build may have failed"
fi

if [ -f dist/db/knexfile.js ]; then
  echo "✓ dist/db/knexfile.js exists"
else
  echo "✗ dist/db/knexfile.js is missing"
fi

if [ -d dist/db/migrations ]; then
  echo "✓ dist/db/migrations directory exists"
else
  echo "✗ dist/db/migrations directory is missing"
fi

# Step 6: Run database migrations
echo "Running database migrations..."
export NODE_ENV=production
npx knex --knexfile ./dist/db/knexfile.js --client pg migrate:latest

echo "Build completed!"
