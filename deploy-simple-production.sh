#!/bin/bash

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"
SERVICE_NAME="nubemsecurity-app"

echo "🚀 NubemSecurity Production Deployment v1.0.0"
echo "============================================"

# Set project
gcloud config set project $PROJECT_ID

# Use the existing Dockerfile and build with gcloud builds submit
echo "🔨 Building and deploying with Cloud Build..."

# Submit build
gcloud builds submit --config=cloudbuild-production.yaml .

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Production Deployment Complete!"
echo "=================================="
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "🔐 Authentication:"
echo "  Demo Admin: admin / NubemSec2025!"
echo "  Demo Analyst: analyst / Analyst2025!"
echo "  API Key: nsk_demo_key_2025"
echo ""
echo "📊 New Features Enabled:"
echo "  ✅ JWT Authentication"
echo "  ✅ Security Headers (Helmet)"
echo "  ✅ Rate Limiting"
echo "  ✅ Input Validation (Zod)"
echo "  ✅ XSS/SQL Injection Protection"
echo "  ✅ CORS Configuration"
echo "  ✅ Compression & Logging"