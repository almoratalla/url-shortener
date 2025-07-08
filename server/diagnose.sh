#!/bin/bash

echo "==== Render Environment Diagnostic Tool ===="
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

if [ -d "dist" ]; then
  echo "✓ dist directory exists"
else
  echo "✗ dist directory missing"
fi

if [ -d "dist/db" ]; then
  echo "✓ dist/db directory exists"
else
  echo "✗ dist/db directory missing"
fi

if [ -f "dist/rest-api.js" ]; then
  echo "✓ dist/rest-api.js exists"
else
  echo "✗ dist/rest-api.js missing"
fi

if [ -f "dist/db/knexfile.js" ]; then
  echo "✓ dist/db/knexfile.js exists"
else
  echo "✗ dist/db/knexfile.js missing"
fi

# Check environment variables (without displaying values)
echo "== Environment Variables =="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "BASE_URL is set: $(if [ -n "$BASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "UPSTASH_REDIS_REST_URL is set: $(if [ -n "$UPSTASH_REDIS_REST_URL" ]; then echo "Yes"; else echo "No"; fi)"
