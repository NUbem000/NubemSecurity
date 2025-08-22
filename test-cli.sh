#!/bin/bash

# Test NubemSecurity CLI with configured API keys

echo "🧪 Testing NubemSecurity CLI with API Keys"
echo "=========================================="
echo ""

# Source the .env file
export $(cat /home/david/NubemSecurity/.env | grep -v '^#' | xargs)

# Test OpenAI provider
echo "1️⃣ Testing OpenAI Provider..."
echo "How to perform a basic port scan?" | timeout 10 node /home/david/NubemSecurity/src/index.js --provider openai 2>&1 | grep -A 5 "NubemSec:" || echo "❌ OpenAI test failed"

echo ""
echo "2️⃣ Testing Gemini Provider..."
echo "What is SQL injection?" | timeout 10 node /home/david/NubemSecurity/src/index.js --provider gemini 2>&1 | grep -A 5 "NubemSec:" || echo "❌ Gemini test failed"

echo ""
echo "3️⃣ Checking API Key Status..."
node /home/david/NubemSecurity/test-env.js | grep "API Keys Status" -A 3

echo ""
echo "✅ Configuration Complete!"
echo ""
echo "You can now use NubemSecurity with:"
echo "  nubemsec                    # Interactive mode with OpenAI"
echo "  nubemsec --provider gemini  # Use Gemini"
echo "  nubemsec --server           # Start API server"