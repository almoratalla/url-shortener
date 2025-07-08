#!/bin/bash

# Test CORS configuration by simulating a request from your Netlify domain
echo "Testing CORS configuration with curl..."

BACKEND_URL="https://url-shortener-0jr9.onrender.com/api/health"
ORIGIN="https://url-shortener-alm.netlify.app"

# Send an OPTIONS request to check CORS headers
echo "Sending OPTIONS request with Origin: $ORIGIN"
curl -i -X OPTIONS $BACKEND_URL \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

echo -e "\n\n"

# Send a GET request to check CORS headers
echo "Sending GET request with Origin: $ORIGIN"
curl -i -X GET $BACKEND_URL \
  -H "Origin: $ORIGIN"

echo -e "\n\nIf you see 'Access-Control-Allow-Origin: $ORIGIN' in the headers above, CORS is configured correctly."
echo "You should also check for 'Access-Control-Allow-Methods' and 'Access-Control-Allow-Headers' in the OPTIONS response."
