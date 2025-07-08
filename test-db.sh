#!/bin/bash

# Script for testing and setting up the database connection
# Run this script after deploying the backend to Render and setting up PostgreSQL

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== PostgreSQL Database Setup for URL Shortener ===${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}DATABASE_URL environment variable is not set.${NC}"
  echo -e "Please enter your Render PostgreSQL Internal Database URL:"
  read -s DATABASE_URL
  export DATABASE_URL
fi

# Test the database connection
echo -e "${YELLOW}Testing database connection...${NC}"
npx knex --knexfile ./server/dist/db/knexfile.js --client pg migrate:status

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database connection successful!${NC}"
  
  # Run migrations
  echo -e "${YELLOW}Would you like to run database migrations? (y/n)${NC}"
  read RUN_MIGRATIONS
  
  if [[ $RUN_MIGRATIONS == "y" || $RUN_MIGRATIONS == "Y" ]]; then
    echo -e "${YELLOW}Running migrations...${NC}"
    npx knex --knexfile ./server/dist/db/knexfile.js --client pg migrate:latest
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Migrations completed successfully!${NC}"
    else
      echo -e "${RED}✗ Migrations failed. Please check the errors above.${NC}"
    fi
  fi
else
  echo -e "${RED}✗ Database connection failed. Please check your DATABASE_URL and try again.${NC}"
  echo -e "${YELLOW}Tips for troubleshooting:${NC}"
  echo -e "1. Make sure the PostgreSQL service is running on Render."
  echo -e "2. Use the Internal Database URL for connecting from a Render service."
  echo -e "3. Use the External Database URL for connecting from your local machine."
  echo -e "4. Check if your IP is allowed in the database's allowed IPs list."
fi

echo -e "${BLUE}=== Setup Complete ===${NC}"
