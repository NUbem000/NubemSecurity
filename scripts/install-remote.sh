#!/bin/bash

# NubemSecurity CLI Remote Installation Script
# This script requests and installs NubemSecurity CLI on remote machines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="${NUBEMSEC_SERVER:-https://nubemsecurity-app-313818478262.us-central1.run.app}"
MACHINE_ID="${MACHINE_ID:-$(hostname)-$(date +%s)}"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     NubemSecurity CLI Remote Installer     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    echo "Please install Node.js v18+ and try again:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed.${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed.${NC}"
    echo "Please install curl: sudo apt-get install curl"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js v18+ is required (found v$NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Request provision token
if [ -z "$PROVISION_TOKEN" ]; then
    echo -e "${YELLOW}Requesting installation from server...${NC}"
    
    # Check if we have admin credentials
    if [ -z "$NUBEMSEC_ADMIN_USER" ] || [ -z "$NUBEMSEC_ADMIN_PASS" ]; then
        echo -e "${YELLOW}Please provide admin credentials to request installation:${NC}"
        read -p "Username: " NUBEMSEC_ADMIN_USER
        read -sp "Password: " NUBEMSEC_ADMIN_PASS
        echo ""
    fi
    
    # Login to get access token
    echo -e "${YELLOW}Authenticating...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$NUBEMSEC_ADMIN_USER\",\"password\":\"$NUBEMSEC_ADMIN_PASS\"}")
    
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}❌ Authentication failed${NC}"
        echo "$LOGIN_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Authentication successful${NC}"
    
    # Request provision token
    echo -e "${YELLOW}Requesting provision token...${NC}"
    PROVISION_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/cli/provision" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"machineId\":\"$MACHINE_ID\",\"description\":\"Remote installation from $(hostname)\"}")
    
    PROVISION_TOKEN=$(echo "$PROVISION_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$PROVISION_TOKEN" ]; then
        echo -e "${RED}❌ Failed to get provision token${NC}"
        echo "$PROVISION_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Provision token received${NC}"
fi

# Download and execute installation script
echo ""
echo -e "${YELLOW}Downloading installation script...${NC}"

INSTALL_SCRIPT=$(curl -s -H "Authorization: Bearer $PROVISION_TOKEN" \
    "$SERVER_URL/api/cli/install")

if [ -z "$INSTALL_SCRIPT" ] || [[ "$INSTALL_SCRIPT" == *"error"* ]]; then
    echo -e "${RED}❌ Failed to download installation script${NC}"
    echo "$INSTALL_SCRIPT"
    exit 1
fi

# Save and execute the installation script
TEMP_SCRIPT="/tmp/nubemsec-install-$$.sh"
echo "$INSTALL_SCRIPT" > "$TEMP_SCRIPT"
chmod +x "$TEMP_SCRIPT"

echo -e "${YELLOW}Installing NubemSecurity CLI...${NC}"
echo ""

# Execute installation
bash "$TEMP_SCRIPT"

# Cleanup
rm -f "$TEMP_SCRIPT"

# Final verification
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"

if command -v nubemsec &> /dev/null; then
    VERSION=$(nubemsec --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ NubemSecurity CLI installed successfully!${NC}"
    echo -e "${GREEN}   Version: $VERSION${NC}"
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo "  nubemsec --help     # Show help"
    echo "  nubemsec            # Start interactive mode"
    echo ""
    echo -e "${BLUE}Configuration:${NC}"
    echo "  Config file: ~/.nubemsecurity/config.json"
    echo "  API keys are pre-configured and encrypted"
else
    echo -e "${RED}❌ Installation verification failed${NC}"
    echo "Please check the installation manually"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"