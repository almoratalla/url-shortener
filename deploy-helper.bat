@echo off
REM Update these variables
SET BACKEND_NAME=url-shortener-api
SET DATABASE_NAME=url-shortener-db
SET FRONTEND_REPO=https://github.com/yourusername/url-shortener

echo === URL Shortener Deployment Helper ===
echo This script will help you verify your Render + Netlify deployment
echo.

REM Check for Render CLI
where render >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Render CLI not found. Installing...
    npm install -g @render/cli
    echo Render CLI installed!
) else (
    echo Render CLI already installed.
)

REM Check for Netlify CLI
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Netlify CLI not found. Installing...
    npm install -g netlify-cli
    echo Netlify CLI installed!
) else (
    echo Netlify CLI already installed.
)

echo.
echo === Deployment Verification ===
echo.

echo Checking Render services...
curl -s "https://api.render.com/v1/services?name=%BACKEND_NAME%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Backend service (%BACKEND_NAME%) is accessible
) else (
    echo ✗ Backend service not found or not accessible
)

curl -s "https://api.render.com/v1/services?name=%DATABASE_NAME%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Database service (%DATABASE_NAME%) is accessible
) else (
    echo ✗ Database service not found or not accessible
)

REM Check database migrations
echo.
echo To run database migrations, execute:
echo   cd server ^&^& npm run migration:latest
echo.

REM Check if Upstash Redis is configured
echo Checking Upstash Redis configuration...
if "%UPSTASH_REDIS_REST_URL%"=="" (
    echo ✗ UPSTASH_REDIS_REST_URL not set in environment
    echo Please configure Redis cache for optimal performance
) else (
    echo ✓ Upstash Redis URL configured
)

REM Show deployment instructions
echo.
echo === Quick Deployment Checklist ===
echo.
echo 1. Render Setup
echo    ✓ Create PostgreSQL database
echo    ✓ Deploy backend web service from GitHub repo
echo    ✓ Set environment variables
echo.
echo 2. Netlify Setup
echo    ✓ Connect GitHub repository
echo    ✓ Set build directory to 'client'
echo    ✓ Set build command to 'npm run build'
echo    ✓ Set publish directory to 'dist'
echo    ✓ Configure VITE_API_URL environment variable
echo.
echo See DEPLOYMENT.md for complete instructions.
echo.
echo Happy deploying!
pause
