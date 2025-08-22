#!/bin/bash

# Test NubemSecurity CLI Interactive Mode

echo "🧪 Testing NubemSecurity CLI Interactive Features"
echo "================================================"
echo ""

# Load environment
export $(cat /home/david/NubemSecurity/.env | grep -v '^#' | xargs) 2>/dev/null

# Test 1: Basic security question with OpenAI
echo "📝 Test 1: OpenAI - Security Question"
echo "What is SQL injection?" | timeout 10 node /home/david/NubemSecurity/src/index.js --provider openai 2>&1 | grep -A 3 "NubemSec:" || echo "⚠️ No response from OpenAI"
echo ""

# Test 2: Gemini provider
echo "📝 Test 2: Gemini - Security Question"
echo "Explain XSS vulnerability" | timeout 10 node /home/david/NubemSecurity/src/index.js --provider gemini 2>&1 | grep -A 3 "NubemSec:" || echo "⚠️ No response from Gemini"
echo ""

# Test 3: Commands test
echo "📝 Test 3: CLI Commands"
echo -e "/help\n/exit" | timeout 5 node /home/david/NubemSecurity/src/index.js 2>&1 | grep -E "(Available Commands|help|tools|clear)" || echo "⚠️ Commands not working"
echo ""

# Test 4: Tools listing
echo "📝 Test 4: Security Tools"
echo -e "/tools\n/exit" | timeout 5 node /home/david/NubemSecurity/src/index.js 2>&1 | grep -E "(nmap|metasploit|burpsuite|sqlmap)" || echo "⚠️ Tools not listed"
echo ""

echo "✅ Interactive tests completed!"