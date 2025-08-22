#!/bin/bash

# NubemSecurity CLI Installation Script
# Run with: ./install.sh

set -e

echo "🛡️ NubemSecurity CLI Installer"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production --legacy-peer-deps --silent || npm install --production --legacy-peer-deps

# Make CLI executable
echo "🔧 Configuring CLI..."
chmod +x nubemsec

# Create global link
echo "🔗 Creating global command..."
npm link 2>/dev/null || sudo ln -sf "$(pwd)/nubemsec" /usr/local/bin/nubemsec

# Create config directory
echo "📁 Setting up configuration..."
mkdir -p ~/.nubemsecurity

# Create default config if not exists
if [ ! -f ~/.nubemsecurity/config.json ]; then
    cat > ~/.nubemsecurity/config.json << 'EOF'
{
  "version": "1.0.0",
  "defaultProvider": "openai",
  "userName": "SecurityAnalyst",
  "botName": "NubemSec",
  "settings": {
    "colorOutput": true,
    "saveHistory": true,
    "maxHistorySize": 100
  }
}
EOF
    echo "✅ Configuration created at ~/.nubemsecurity/config.json"
fi

# Verify installation
if command -v nubemsec &> /dev/null; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "🚀 Quick Start:"
    echo "  nubemsec              # Start interactive CLI"
    echo "  nubemsec --help       # Show help"
    echo "  nubemsec --server     # Start API server"
    echo "  nubemsec --web        # Open web interface"
    echo ""
    echo "📝 Configuration:"
    echo "  Edit ~/.nubemsecurity/config.json to customize settings"
    echo ""
    echo "🔑 API Keys:"
    echo "  Set your API keys in environment variables:"
    echo "  export OPENAI_API_KEY='your-key-here'"
    echo "  export GOOGLE_API_KEY='your-gemini-key'"
    echo ""
else
    echo "⚠️ Installation completed but global command not available."
    echo "You can still run: node $(pwd)/src/index.js"
fi