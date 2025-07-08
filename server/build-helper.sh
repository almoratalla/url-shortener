#!/bin/bash

# Ensure dist directory exists
mkdir -p dist/db

# Check if TypeScript compilation was successful
if [ ! -f "dist/rest-api.js" ]; then
  echo "Error: TypeScript compilation failed. dist/rest-api.js not found."
  exit 1
fi

# Copy knexfile.js to dist/db if it wasn't copied by tsc
if [ ! -f "dist/db/knexfile.js" ] && [ -f "src/db/knexfile.js" ]; then
  echo "Copying knexfile.js to dist/db directory..."
  cp -f ./src/db/knexfile.js ./dist/db/
fi

# List contents of dist directory
echo "Contents of dist directory:"
ls -la dist

# List contents of dist/db directory if it exists
if [ -d "dist/db" ]; then
  echo "Contents of dist/db directory:"
  ls -la dist/db
fi

echo "Build preparation complete."
