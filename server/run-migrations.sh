#!/bin/bash

# Check if we're running in a production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Running migrations in production environment..."
  # For production, use the DATABASE_URL environment variable
  export NODE_ENV=production
else
  echo "Running migrations in development environment..."
  # For development, use the DB_CONNECTION_URI environment variable
fi

# Create directories if they don't exist
mkdir -p dist/db/migrations

# Copy migrations directory if it doesn't exist or is empty
if [ ! -d "dist/db/migrations" ] || [ -z "$(ls -A dist/db/migrations)" ]; then
  echo "Copying migrations to dist folder..."
  cp -rf ./src/db/migrations/* ./dist/db/migrations/
fi

# Run migrations
echo "Running database migrations..."
npx knex --knexfile ./dist/db/knexfile.js --client pg migrate:latest

# Check migration status
echo "Migration status:"
npx knex --knexfile ./dist/db/knexfile.js --client pg migrate:status
