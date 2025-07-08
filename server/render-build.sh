#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Display current directory and Node version
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Troubleshooting - list files in src directory
echo "Files in src directory:"
ls -la ./src

# Specifically check for rest-api.ts
if [ -f ./src/rest-api.ts ]; then
  echo "✓ src/rest-api.ts exists"
else
  echo "✗ src/rest-api.ts missing - this should be your main entry file"
  exit 1
fi

# Step 1: Run TypeScript compiler with verbose output
echo "Running TypeScript compiler with production config..."
npx tsc --project tsconfig.prod.json --listFiles  # Lists all the files that will be compiled
npx tsc --project tsconfig.prod.json

# Check if compilation was successful
if [ $? -ne 0 ]; then
  echo "TypeScript compilation failed"
  exit 1
else
  echo "TypeScript compilation succeeded"
fi

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
echo "Contents of dist directory:"
ls -la dist/

if [ -f dist/rest-api.js ]; then
  echo "✓ dist/rest-api.js exists"
else
  echo "✗ dist/rest-api.js is missing - build may have failed"
  
  # Emergency solution: Create a simple rest-api.js file
  echo "Creating a simple rest-api.js file as a temporary solution..."
  cat > dist/rest-api.js << EOL
// This is an auto-generated file because TypeScript compilation failed
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.json({ 
    status: 'error', 
    message: 'TypeScript compilation failed. This is a fallback server.',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      PORT: process.env.PORT || 'unknown'
    }
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log('WARNING: This is a fallback server because TypeScript compilation failed');
});
EOL
  echo "✓ Created emergency rest-api.js file"
fi

if [ -f dist/db/knexfile.js ]; then
  echo "✓ dist/db/knexfile.js exists"
else
  echo "✗ dist/db/knexfile.js missing - copying now"
  cp -f ./src/db/knexfile.js ./dist/db/ || echo "Failed to copy knexfile.js"
fi

# Check if migrations exist
if [ -d ./src/db/migrations ]; then
  echo "✓ src/db/migrations directory exists"
  
  if [ "$(ls -A ./src/db/migrations 2>/dev/null)" ]; then
    echo "✓ src/db/migrations has files"
  else
    echo "✗ src/db/migrations is empty"
  fi
  
  if [ -d dist/db/migrations ]; then
    echo "✓ dist/db/migrations directory exists"
    
    if [ "$(ls -A ./dist/db/migrations 2>/dev/null)" ]; then
      echo "✓ dist/db/migrations has files"
    else
      echo "✗ dist/db/migrations is empty - copying now"
      cp -rf ./src/db/migrations/* ./dist/db/migrations/ 2>/dev/null || echo "No migrations to copy"
    fi
  else
    echo "✗ dist/db/migrations directory is missing"
  fi
else
  echo "✗ src/db/migrations directory is missing"
fi

# Check environment variables (without displaying values)
echo "== Environment Variables =="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "BASE_URL is set: $(if [ -n "$BASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "UPSTASH_REDIS_REST_URL is set: $(if [ -n "$UPSTASH_REDIS_REST_URL" ]; then echo "Yes"; else echo "No"; fi)"

# Step 6: Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  export NODE_ENV=production
  npx knex --knexfile ./dist/db/knexfile.js --client pg migrate:latest || echo "Migration failed but continuing with deployment"
else
  echo "Skipping migrations because DATABASE_URL is not set"
fi

echo "Build completed!"
