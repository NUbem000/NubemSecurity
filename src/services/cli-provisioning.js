/**
 * CLI Provisioning Service
 * Securely distributes NubemSecurity CLI to remote machines
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

class CLIProvisioningService {
    constructor() {
        this.PROVISION_SECRET = process.env.PROVISION_SECRET || crypto.randomBytes(32).toString('hex');
        this.provisionTokens = new Map(); // Store temporary provision tokens
        this.installations = new Map(); // Track installations
    }

    /**
     * Generate a unique provision token for a remote machine
     */
    generateProvisionToken(machineId, requestInfo = {}) {
        const tokenId = crypto.randomUUID();
        const token = jwt.sign(
            {
                tokenId,
                machineId,
                ip: requestInfo.ip,
                timestamp: Date.now(),
                type: 'cli-provision'
            },
            this.PROVISION_SECRET,
            { expiresIn: '1h' }
        );

        // Store token info for tracking
        this.provisionTokens.set(tokenId, {
            machineId,
            requestInfo,
            createdAt: new Date(),
            used: false
        });

        return {
            token,
            tokenId,
            expiresIn: '1h',
            installUrl: `https://nubemsecurity-app-313818478262.us-central1.run.app/api/cli/install`
        };
    }

    /**
     * Validate provision token
     */
    validateProvisionToken(token) {
        try {
            const decoded = jwt.verify(token, this.PROVISION_SECRET);
            const tokenInfo = this.provisionTokens.get(decoded.tokenId);
            
            if (!tokenInfo) {
                throw new Error('Token not found');
            }
            
            if (tokenInfo.used) {
                throw new Error('Token already used');
            }
            
            return { valid: true, decoded, tokenInfo };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Generate CLI installation script with embedded configuration
     */
    async generateInstallScript(config = {}) {
        const {
            apiKeys = {},
            serverUrl = 'https://nubemsecurity-app-313818478262.us-central1.run.app',
            version = 'latest'
        } = config;

        // Create secure configuration
        const secureConfig = {
            serverUrl,
            version,
            providers: {
                openai: apiKeys.openai ? { enabled: true, model: 'gpt-4' } : { enabled: false },
                gemini: apiKeys.gemini ? { enabled: true, model: 'gemini-pro' } : { enabled: false },
                anthropic: apiKeys.anthropic ? { enabled: true, model: 'claude-3' } : { enabled: false }
            },
            security: {
                encryptedKeys: this.encryptApiKeys(apiKeys),
                serverPublicKey: process.env.SERVER_PUBLIC_KEY || 'placeholder'
            }
        };

        const script = `#!/bin/bash
#
# NubemSecurity CLI Remote Installation Script
# Generated: ${new Date().toISOString()}
#

set -e

echo "🚀 Installing NubemSecurity CLI..."
echo "================================="

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js v18+ and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

# Create installation directory
INSTALL_DIR="$HOME/.nubemsecurity"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download CLI package
echo "📦 Downloading NubemSecurity CLI..."
curl -sL "${serverUrl}/api/cli/package" -o nubemsec-cli.tar.gz

# Extract package
echo "📂 Extracting files..."
tar -xzf nubemsec-cli.tar.gz
rm nubemsec-cli.tar.gz

# Install dependencies
echo "📚 Installing dependencies..."
npm install --production --silent

# Create configuration
echo "⚙️ Configuring CLI..."
cat > config.json << 'EOF'
${JSON.stringify(secureConfig, null, 2)}
EOF

# Create global command
echo "🔗 Creating global command..."
sudo ln -sf "$INSTALL_DIR/cli.js" /usr/local/bin/nubemsec
sudo chmod +x /usr/local/bin/nubemsec

# Verify installation
echo "✅ Verifying installation..."
if nubemsec --version &> /dev/null; then
    echo "✨ NubemSecurity CLI installed successfully!"
    echo ""
    echo "Usage: nubemsec --help"
    echo ""
    echo "Configuration stored in: $INSTALL_DIR/config.json"
else
    echo "⚠️ Installation completed but verification failed."
    echo "Please check the installation manually."
fi

# Report installation to server
curl -sX POST "${serverUrl}/api/cli/confirm" \\
    -H "Content-Type: application/json" \\
    -d '{"machineId":"$(hostname)-$(date +%s)","version":"${version}"}' \\
    > /dev/null 2>&1 || true

echo "🎉 Installation complete!"
`;

        return script;
    }

    /**
     * Encrypt API keys for secure transmission
     */
    encryptApiKeys(apiKeys) {
        const cipher = crypto.createCipher('aes-256-cbc', this.PROVISION_SECRET);
        let encrypted = cipher.update(JSON.stringify(apiKeys), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * Decrypt API keys
     */
    decryptApiKeys(encryptedKeys) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', this.PROVISION_SECRET);
            let decrypted = decipher.update(encryptedKeys, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Failed to decrypt API keys:', error);
            return {};
        }
    }

    /**
     * Track CLI installation
     */
    trackInstallation(machineId, details) {
        this.installations.set(machineId, {
            ...details,
            installedAt: new Date(),
            lastSeen: new Date()
        });
    }

    /**
     * Get installation statistics
     */
    getStats() {
        return {
            totalInstallations: this.installations.size,
            activeTokens: Array.from(this.provisionTokens.values()).filter(t => !t.used).length,
            installations: Array.from(this.installations.entries()).map(([id, info]) => ({
                machineId: id,
                ...info
            }))
        };
    }
}

export default new CLIProvisioningService();