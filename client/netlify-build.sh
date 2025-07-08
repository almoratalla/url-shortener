#!/bin/bash

# Display current directory
echo "Current directory: $(pwd)"

# Clean up node_modules if needed
# rm -rf node_modules

# Install dependencies with force flag to ensure all peer dependencies are satisfied
echo "Installing dependencies..."
npm install --force

# Run build with simplified tsconfig
echo "Building application with simplified tsconfig..."
npx tsc -p tsconfig.netlify.json && npx vite build

# Check if build was successful
if [ -d "dist" ]; then
  echo "Build successful! Contents of dist directory:"
  ls -la dist
else
  echo "Build failed! Check errors above."
  exit 1
fi
