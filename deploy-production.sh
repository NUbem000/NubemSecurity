#!/bin/bash

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"
SERVICE_NAME="nubemsecurity-app"

echo "🚀 NubemSecurity Production Deployment v1.0.0"
echo "============================================"

# Set project
gcloud config set project $PROJECT_ID

# Build with production Dockerfile
echo "🔨 Building production image..."
docker build -t gcr.io/$PROJECT_ID/nubemsecurity:production -f Dockerfile.production .
docker push gcr.io/$PROJECT_ID/nubemsecurity:production

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/nubemsecurity:production \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --port 8080 \
    --min-instances 1 \
    --max-instances 100 \
    --concurrency 100 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production,VECTOR_DB_PROVIDER=memory,ALLOWED_ORIGINS=https://nubemsecurity.com" \
    --update-secrets "OPENAI_API_KEY=openai-api-key:latest,JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest,PINECONE_API_KEY=pinecone-api-key:latest"

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
echo "📊 Features Enabled:"
echo "  ✅ JWT Authentication"
echo "  ✅ Security Headers (Helmet)"
echo "  ✅ Rate Limiting"
echo "  ✅ Input Validation (Zod)"
echo "  ✅ XSS Protection"
echo "  ✅ SQL Injection Protection"
echo "  ✅ CORS Configuration"
echo "  ✅ Compression"
echo "  ✅ Request Logging"
echo ""
echo "🧪 Test with:"
echo "  curl $SERVICE_URL/health"
echo ""
echo "  # Login and get token:"
echo "  curl -X POST $SERVICE_URL/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"admin\",\"password\":\"NubemSec2025!\"}'"