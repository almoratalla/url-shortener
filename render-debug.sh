#!/bin/bash

# Display current working directory
echo "Current working directory: $(pwd)"

# Check if package.json exists in the current directory
if [ -f package.json ]; then
    echo "package.json found in current directory"
    cat package.json
else
    echo "package.json NOT found in current directory"
fi

# Check if server directory exists
if [ -d server ]; then
    echo "server directory exists"
    
    # List files in server directory
    echo "Files in server directory:"
    ls -la server
    
    # Check if package.json exists in server directory
    if [ -f server/package.json ]; then
        echo "package.json found in server directory"
    else
        echo "package.json NOT found in server directory"
    fi
else
    echo "server directory does NOT exist"
    echo "Listing root directory contents:"
    ls -la
fi

# Check node version
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Output environment variables (without sensitive values)
echo "Environment variables (non-sensitive):"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "BASE_URL is set: $(if [ -n "$BASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "UPSTASH_REDIS_REST_URL is set: $(if [ -n "$UPSTASH_REDIS_REST_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "UPSTASH_REDIS_REST_TOKEN is set: $(if [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then echo "Yes"; else echo "No"; fi)"
