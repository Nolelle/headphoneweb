#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking prerequisites for HeadphoneWeb performance tests..."
echo ""

# Check Node.js version
echo -n "Checking Node.js... "
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    echo -e "${GREEN}✓ Found Node.js v$NODE_VERSION${NC}"
  else
    echo -e "${YELLOW}⚠ Found Node.js v$NODE_VERSION, but v18 or higher is recommended${NC}"
  fi
else
  echo -e "${RED}✗ Node.js not found${NC}"
  echo "Please install Node.js v18 or higher: https://nodejs.org/"
fi

# Check npm or yarn
echo -n "Checking package manager... "
if command -v yarn >/dev/null 2>&1; then
  YARN_VERSION=$(yarn -v)
  echo -e "${GREEN}✓ Found yarn v$YARN_VERSION${NC}"
elif command -v npm >/dev/null 2>&1; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ Found npm v$NPM_VERSION${NC}"
else
  echo -e "${RED}✗ Neither yarn nor npm found${NC}"
  echo "Please install yarn or npm"
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql >/dev/null 2>&1; then
  PG_VERSION=$(psql --version | awk '{print $3}')
  echo -e "${GREEN}✓ Found PostgreSQL v$PG_VERSION${NC}"
else
  echo -e "${RED}✗ PostgreSQL not found${NC}"
  echo "Please install PostgreSQL: https://www.postgresql.org/download/"
fi

# Check k6
echo -n "Checking k6... "
if command -v k6 >/dev/null 2>&1; then
  K6_VERSION=$(k6 version | awk '{print $3}')
  echo -e "${GREEN}✓ Found k6 v$K6_VERSION${NC}"
else
  echo -e "${RED}✗ k6 not found${NC}"
  echo "Please install k6 for load testing:"
  echo "  macOS: brew install k6"
  echo "  Linux: See https://k6.io/docs/getting-started/installation/"
  echo "  Windows: winget install k6"
fi

# Check required Node.js packages
echo -n "Checking required Node.js packages... "
PACKAGE_JSON_PATH="$(pwd)/../package.json"
# Try alternative location if first path doesn't work
if [ ! -f "$PACKAGE_JSON_PATH" ]; then
  PACKAGE_JSON_PATH="$(pwd)/../../package.json"
fi
# Try one more location
if [ ! -f "$PACKAGE_JSON_PATH" ]; then
  # Get the workspace root (current directory where script is being run from)
  PACKAGE_JSON_PATH="$(pwd)/package.json"
fi

if [ -f "$PACKAGE_JSON_PATH" ]; then
  MISSING_PACKAGES=()
  
  # Check for puppeteer
  if ! grep -q '"puppeteer"' "$PACKAGE_JSON_PATH"; then
    MISSING_PACKAGES+=("puppeteer")
  fi
  
  # Check for lighthouse
  if ! grep -q '"lighthouse"' "$PACKAGE_JSON_PATH"; then
    MISSING_PACKAGES+=("lighthouse")
  fi
  
  # Check for chart.js
  if ! grep -q '"chart.js"' "$PACKAGE_JSON_PATH"; then
    MISSING_PACKAGES+=("chart.js")
  fi
  
  # Check for dotenv
  if ! grep -q '"dotenv"' "$PACKAGE_JSON_PATH" && ! grep -q '"dotenv-cli"' "$PACKAGE_JSON_PATH"; then
    MISSING_PACKAGES+=("dotenv")
  fi
  
  if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required Node.js packages found${NC}"
  else
    echo -e "${YELLOW}⚠ Some packages may be missing: ${MISSING_PACKAGES[*]}${NC}"
    echo "Install missing packages with:"
    echo "  npm install --save-dev ${MISSING_PACKAGES[*]}"
    echo "  or"
    echo "  yarn add --dev ${MISSING_PACKAGES[*]}"
  fi
else
  echo -e "${RED}✗ Cannot check Node.js packages - package.json not found${NC}"
  echo "Looking for package.json at: $PACKAGE_JSON_PATH"
fi

# Check if results directory exists
echo -n "Checking results directory... "
if [ -d "./results" ]; then
  echo -e "${GREEN}✓ Results directory exists${NC}"
else
  echo -e "${YELLOW}⚠ Results directory does not exist${NC}"
  echo "Creating results directory..."
  mkdir -p ./results
  echo -e "${GREEN}✓ Results directory created${NC}"
fi

# Check if application is running
echo -n "Checking if application is running on localhost:3000... "
if curl -s http://localhost:3000 >/dev/null; then
  echo -e "${GREEN}✓ Application is running${NC}"
else
  echo -e "${RED}✗ Application is not running${NC}"
  echo "Please start the application with 'npm run dev' before running performance tests"
fi

# Optional: Check for wkhtmltopdf
echo -n "Checking for wkhtmltopdf (optional, for PDF reports)... "
if command -v wkhtmltopdf >/dev/null 2>&1; then
  WKHTML_VERSION=$(wkhtmltopdf --version | awk '{print $2}')
  echo -e "${GREEN}✓ Found wkhtmltopdf v$WKHTML_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ wkhtmltopdf not found (optional)${NC}"
  echo "For PDF report generation, install wkhtmltopdf: https://wkhtmltopdf.org/downloads.html"
fi

echo ""
echo "Prerequisites check completed!" 