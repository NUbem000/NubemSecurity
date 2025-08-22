#!/bin/bash

# NubemSecurity API Testing Script
URL="https://nubemsecurity-app-313818478262.us-central1.run.app"

echo "🧪 Testing NubemSecurity API Endpoints"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check (/)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$URL/")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_STATUS)"
    echo "Response: $BODY"
else
    echo "❌ Health check failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 2: Health Endpoint
echo "2️⃣ Testing /health endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$URL/health")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health endpoint passed (HTTP $HTTP_STATUS)"
else
    echo "❌ Health endpoint failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 3: Tools API
echo "3️⃣ Testing /api/tools..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$URL/api/tools")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")
if [ "$HTTP_STATUS" = "200" ]; then
    TOOL_COUNT=$(echo "$BODY" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['tools']))" 2>/dev/null || echo "0")
    echo "✅ Tools API passed (HTTP $HTTP_STATUS)"
    echo "   Found $TOOL_COUNT tools"
else
    echo "❌ Tools API failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 4: Stats API
echo "4️⃣ Testing /api/stats..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$URL/api/stats")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Stats API passed (HTTP $HTTP_STATUS)"
else
    echo "❌ Stats API failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 5: Query API - Valid Request
echo "5️⃣ Testing /api/query with valid request..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL/api/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"How to use nmap for scanning?"}')
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Query API passed (HTTP $HTTP_STATUS)"
else
    echo "❌ Query API failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 6: Query API - Invalid Request
echo "6️⃣ Testing /api/query with invalid request..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL/api/query" \
    -H "Content-Type: application/json" \
    -d '{}')
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "400" ]; then
    echo "✅ Query API validation passed (HTTP $HTTP_STATUS)"
else
    echo "❌ Query API validation failed (Expected 400, got HTTP $HTTP_STATUS)"
fi
echo ""

# Test 7: Non-existent endpoint
echo "7️⃣ Testing non-existent endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$URL/api/nonexistent")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "404" ]; then
    echo "✅ 404 handling passed (HTTP $HTTP_STATUS)"
else
    echo "❌ 404 handling failed (Expected 404, got HTTP $HTTP_STATUS)"
fi
echo ""

# Test 8: Response time
echo "8️⃣ Testing response time..."
TIME=$(curl -o /dev/null -s -w "%{time_total}" "$URL/health")
echo "   Response time: ${TIME}s"
if (( $(echo "$TIME < 2" | bc -l) )); then
    echo "✅ Response time acceptable"
else
    echo "⚠️  Response time slow (>2s)"
fi
echo ""

echo "======================================"
echo "Testing complete!"