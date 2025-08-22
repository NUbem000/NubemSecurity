#!/bin/bash

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"
SERVICE_NAME="nubemsecurity-app"

echo "🚀 NubemSecurity Simple Deployment"
echo "=================================="

# Set project
gcloud config set project $PROJECT_ID

# Step 1: Create OpenAI secret if not exists
echo "🔐 Setting up secrets..."
if [ -n "$OPENAI_API_KEY" ]; then
    echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        2>/dev/null || echo "Secret already exists"
fi

# Step 2: Build and deploy main application with embedded vector store
echo "🔨 Building NubemSecurity..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/nubemsecurity:latest .

# Step 3: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/nubemsecurity:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --port 8080 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "VECTOR_DB_PROVIDER=chroma,NODE_ENV=production,CHROMA_URL=http://localhost:8000" \
    --update-secrets "OPENAI_API_KEY=openai-api-key:latest"

# Get application URL
APP_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo "🌐 Application URL: $APP_URL"
echo ""
echo "📝 API Endpoints:"
echo "  POST $APP_URL/api/query     - Main RAG query"
echo "  POST $APP_URL/api/search    - Search knowledge base"
echo "  GET  $APP_URL/api/tools     - List security tools"
echo "  GET  $APP_URL/api/stats     - System statistics"
echo "  GET  $APP_URL/health        - Health check"
echo ""
echo "🔧 Test with:"
echo "  curl -X POST $APP_URL/api/query \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\":\"How to use nmap for port scanning?\"}'"