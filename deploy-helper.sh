# Update these variables
BACKEND_NAME="url-shortener-api"
DATABASE_NAME="url-shortener-db"
FRONTEND_REPO="https://github.com/yourusername/url-shortener"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== URL Shortener Deployment Helper ===${NC}"
echo -e "${GREEN}This script will help you verify your Render + Netlify deployment${NC}"
echo ""

# Check for Render CLI
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}Render CLI not found. Installing...${NC}"
    npm install -g @render/cli
    echo -e "${GREEN}Render CLI installed!${NC}"
else
    echo -e "${GREEN}Render CLI already installed.${NC}"
fi

# Check for Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
    echo -e "${GREEN}Netlify CLI installed!${NC}"
else
    echo -e "${GREEN}Netlify CLI already installed.${NC}"
fi

echo ""
echo -e "${BLUE}=== Deployment Verification ===${NC}"
echo ""

# Check Render services
echo -e "${YELLOW}Checking Render services...${NC}"
curl -s "https://api.render.com/v1/services?name=$BACKEND_NAME" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend service ($BACKEND_NAME) is accessible${NC}"
else
    echo -e "${RED}✗ Backend service not found or not accessible${NC}"
fi

curl -s "https://api.render.com/v1/services?name=$DATABASE_NAME" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database service ($DATABASE_NAME) is accessible${NC}"
else
    echo -e "${RED}✗ Database service not found or not accessible${NC}"
fi

# Check database migrations
echo ""
echo -e "${BLUE}To run database migrations, execute:${NC}"
echo -e "  cd server && npm run migration:latest"
echo ""

# Check if Upstash Redis is configured
echo -e "${YELLOW}Checking Upstash Redis configuration...${NC}"
if [[ -z "${UPSTASH_REDIS_REST_URL}" ]]; then
    echo -e "${RED}✗ UPSTASH_REDIS_REST_URL not set in environment${NC}"
    echo -e "${YELLOW}Please configure Redis cache for optimal performance${NC}"
else
    echo -e "${GREEN}✓ Upstash Redis URL configured${NC}"
fi

# Show deployment instructions
echo ""
echo -e "${BLUE}=== Quick Deployment Checklist ===${NC}"
echo ""
echo -e "1. ${GREEN}Render Setup${NC}"
echo "   ✓ Create PostgreSQL database"
echo "   ✓ Deploy backend web service from GitHub repo"
echo "   ✓ Set environment variables"
echo ""
echo -e "2. ${GREEN}Netlify Setup${NC}"
echo "   ✓ Connect GitHub repository"
echo "   ✓ Set build directory to 'client'"
echo "   ✓ Set build command to 'npm run build'"
echo "   ✓ Set publish directory to 'dist'"
echo "   ✓ Configure VITE_API_URL environment variable"
echo ""
echo -e "${BLUE}See DEPLOYMENT.md for complete instructions.${NC}"
echo ""
echo -e "${GREEN}Happy deploying!${NC}"
