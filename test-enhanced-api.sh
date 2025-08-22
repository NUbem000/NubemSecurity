#!/bin/bash

# NubemSecurity Enhanced API Testing Script
URL="https://nubemsecurity-app-313818478262.us-central1.run.app"

echo "🧪 Testing NubemSecurity Enhanced API Endpoints"
echo "=============================================="
echo ""

# Test 1: Health Check with new features
echo "1️⃣ Testing Health Check (/)..."
RESPONSE=$(curl -s "$URL/")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Authentication - Login
echo "2️⃣ Testing Authentication (/auth/login)..."
LOGIN_RESPONSE=$(curl -s -X POST "$URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"NubemSec2025!"}')
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token if available
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null || echo "")
echo ""

# Test 3: Protected endpoint without auth
echo "3️⃣ Testing Protected Endpoint without Auth (/api/stats)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$URL/api/stats"
echo ""

# Test 4: Protected endpoint with auth
if [ -n "$TOKEN" ]; then
    echo "4️⃣ Testing Protected Endpoint with Auth (/api/stats)..."
    STATS_RESPONSE=$(curl -s "$URL/api/stats" \
        -H "Authorization: Bearer $TOKEN")
    echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
else
    echo "4️⃣ Skipping auth test (no token received)"
fi
echo ""

# Test 5: Query endpoint with API key
echo "5️⃣ Testing Query with API Key..."
QUERY_RESPONSE=$(curl -s -X POST "$URL/api/query" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: nsk_demo_key_2025" \
    -d '{"query":"How to use nmap for scanning?"}')
echo "$QUERY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$QUERY_RESPONSE"
echo ""

# Test 6: Security headers
echo "6️⃣ Testing Security Headers..."
curl -s -I "$URL/" | grep -E "^(X-|Content-Security|Strict-Transport|Helmet)" || echo "No security headers found"
echo ""

# Test 7: Rate limiting test
echo "7️⃣ Testing Rate Limiting..."
for i in {1..3}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}')
    echo "Attempt $i: HTTP $STATUS"
done
echo ""

# Test 8: Input validation
echo "8️⃣ Testing Input Validation..."
VALIDATION_RESPONSE=$(curl -s -X POST "$URL/api/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"","k":100}')
echo "$VALIDATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VALIDATION_RESPONSE"
echo ""

echo "======================================"
echo "Enhanced Testing Complete!"