# 🚀 NubemSecurity CLI - Remote Installation Guide

## Overview

NubemSecurity CLI can be installed on remote machines with pre-configured API keys securely distributed from the central server. This guide explains how to provision and install the CLI on remote systems.

## Prerequisites

Remote machines must have:
- Node.js v18+ installed
- npm package manager
- curl or wget
- Internet access to reach the NubemSecurity server

## Installation Methods

### Method 1: Quick Installation (with credentials)

For immediate installation with admin credentials:

```bash
NUBEMSEC_ADMIN_USER=admin \
NUBEMSEC_ADMIN_PASS=NubemSec2025! \
curl -sL https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/scripts/install-remote.sh | bash
```

### Method 2: Pre-authorized Installation (with token)

First, request a provision token from an admin account:

```bash
# On admin machine, get access token
TOKEN=$(curl -s -X POST https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NubemSec2025!"}' | jq -r .accessToken)

# Request provision token for remote machine
PROVISION_INFO=$(curl -s -X POST https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/api/cli/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"machineId":"remote-server-01","description":"Production server"}')

# Extract provision token
PROVISION_TOKEN=$(echo $PROVISION_INFO | jq -r .token)
```

Then on the remote machine:

```bash
PROVISION_TOKEN="<token-from-above>" \
curl -sL https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/scripts/install-remote.sh | bash
```

### Method 3: Manual Installation

Download and run the installation script manually:

```bash
# Download the script
curl -o install-nubemsec.sh \
  https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/scripts/install-remote.sh

# Review the script
less install-nubemsec.sh

# Make executable and run
chmod +x install-nubemsec.sh
./install-nubemsec.sh
```

## API Endpoints

### Authentication

**POST** `/auth/login`
```bash
curl -X POST https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NubemSec2025!"}'
```

### Request Provision Token

**POST** `/api/cli/provision` (requires authentication)
```bash
curl -X POST https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/api/cli/provision \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"machineId":"unique-machine-id","description":"Server description"}'
```

### Get Installation Script

**GET** `/api/cli/install` (requires provision token)
```bash
curl -H "Authorization: Bearer <provision-token>" \
  https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/api/cli/install
```

### View Installation Statistics

**GET** `/api/cli/stats` (requires admin authentication)
```bash
curl -H "Authorization: Bearer <access-token>" \
  https://nubemsecurity-app-wxxe6ekd2q-uc.a.run.app/api/cli/stats
```

## Security Features

1. **Encrypted API Keys**: All API keys are encrypted during transmission
2. **Token-based Authorization**: Provision tokens expire after 1 hour
3. **Single-use Tokens**: Each provision token can only be used once
4. **Audit Logging**: All installations are tracked and logged
5. **HTTPS Only**: All communication is encrypted with TLS

## Configuration

After installation, the CLI configuration is stored in:
```
~/.nubemsecurity/config.json
```

This file contains:
- Server URL
- Encrypted API keys
- Provider configurations
- Security settings

## Verification

After installation, verify the CLI is working:

```bash
# Check version
nubemsec --version

# View help
nubemsec --help

# Start interactive mode
nubemsec
```

## Troubleshooting

### Node.js Not Found
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Permission Denied
```bash
# Install without sudo to user directory
PREFIX=$HOME/.local npm install -g nubemsecurity-cli

# Add to PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Connection Failed
- Verify internet connectivity
- Check firewall rules allow HTTPS (port 443)
- Verify the server URL is accessible

### Invalid Token
- Tokens expire after 1 hour
- Request a new provision token if expired
- Ensure correct admin credentials

## Uninstallation

To remove NubemSecurity CLI:

```bash
# Remove global command
sudo rm /usr/local/bin/nubemsec

# Remove installation directory
rm -rf ~/.nubemsecurity

# Remove from npm (if installed via npm)
npm uninstall -g nubemsecurity-cli
```

## Support

For issues or questions:
- Check server logs: `gcloud run services logs read nubemsecurity-app --region=us-central1`
- View installation stats: Use the `/api/cli/stats` endpoint
- Contact: admin@nubemsecurity.com

## License

NubemSecurity is licensed under the MIT License. See LICENSE file for details.