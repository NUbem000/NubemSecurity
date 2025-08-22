#!/bin/bash

# Deploy NubemSecurity with CLI Provisioning Features

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"
SERVICE_NAME="nubemsecurity-app"
IMAGE_NAME="nubemsecurity-provisioning"

echo "🚀 Deploying NubemSecurity with CLI Provisioning"
echo "================================================"

# Set project
gcloud config set project $PROJECT_ID

# First, update secrets with API keys from local .env
echo "📤 Updating API keys in Secret Manager..."
bash /home/david/NubemSecurity/scripts/setup-api-keys-gcp.sh

# Build and push Docker image
echo "🔨 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .

echo "📤 Pushing to Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

# Deploy to Cloud Run with environment variables pointing to secrets
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --min-instances 0 \
    --max-instances 10 \
    --port 8080 \
    --set-env-vars="NODE_ENV=production" \
    --update-secrets="OPENAI_API_KEY=openai-api-key-full:latest" \
    --update-secrets="GEMINI_API_KEY=gemini-api-key-full:latest" \
    --update-secrets="ANTHROPIC_API_KEY=anthropic-api-key-full:latest" \
    --update-secrets="JWT_SECRET=jwt-secret:latest" \
    --update-secrets="JWT_REFRESH_SECRET=jwt-refresh-secret:latest" \
    --update-secrets="PROVISION_SECRET=provision-secret:latest"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format="value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo "========================"
echo ""
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📱 CLI Remote Installation:"
echo "  1. On the remote machine, run:"
echo "     curl -sL $SERVICE_URL/scripts/install-remote.sh | bash"
echo ""
echo "  2. Or with credentials:"
echo "     NUBEMSEC_ADMIN_USER=admin NUBEMSEC_ADMIN_PASS=NubemSec2025! \\"
echo "     curl -sL $SERVICE_URL/scripts/install-remote.sh | bash"
echo ""
echo "🔐 Admin Access:"
echo "  Username: admin"
echo "  Password: NubemSec2025!"
echo ""
echo "📊 API Endpoints:"
echo "  POST $SERVICE_URL/api/cli/provision - Request installation token"
echo "  GET  $SERVICE_URL/api/cli/install   - Download installation script"
echo "  GET  $SERVICE_URL/api/cli/stats     - View installation statistics"
echo ""
echo "🔍 View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION"