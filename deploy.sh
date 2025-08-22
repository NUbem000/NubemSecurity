#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ID="nubemsecurity"
REGION="us-central1"
SERVICE_NAME="nubemsecurity-app"
CHROMADB_SERVICE="nubemsecurity-chromadb"

echo -e "${GREEN}🚀 NubemSecurity Deployment Script${NC}"
echo "=================================="

# Set project
gcloud config set project $PROJECT_ID

# Step 1: Build and deploy ChromaDB
echo -e "\n${YELLOW}📦 Building ChromaDB image...${NC}"
cd docker/chromadb
gcloud builds submit --tag gcr.io/$PROJECT_ID/chromadb:latest .
cd ../..

echo -e "${YELLOW}🚢 Deploying ChromaDB to Cloud Run...${NC}"
gcloud run deploy $CHROMADB_SERVICE \
    --image gcr.io/$PROJECT_ID/chromadb:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --port 8000 \
    --min-instances 0 \
    --max-instances 5

# Get ChromaDB URL
CHROMADB_URL=$(gcloud run services describe $CHROMADB_SERVICE --region $REGION --format 'value(status.url)')
echo -e "${GREEN}✅ ChromaDB deployed at: $CHROMADB_URL${NC}"

# Step 2: Build main application
echo -e "\n${YELLOW}🔨 Building NubemSecurity application...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/nubemsecurity:latest .

# Step 3: Deploy main application
echo -e "${YELLOW}🚀 Deploying NubemSecurity to Cloud Run...${NC}"
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
    --set-env-vars "CHROMA_URL=$CHROMADB_URL,VECTOR_DB_PROVIDER=chroma,NODE_ENV=production" \
    --set-secrets "OPENAI_API_KEY=openai-api-key:latest" \
    --service-account "${PROJECT_ID}@appspot.gserviceaccount.com"

# Get application URL
APP_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Step 4: Set up Cloud Scheduler for CVE updates
echo -e "\n${YELLOW}⏰ Setting up automated CVE updates...${NC}"
gcloud scheduler jobs create http update-cve-data \
    --location $REGION \
    --schedule "0 */6 * * *" \
    --uri "${APP_URL}/api/update-cve" \
    --http-method POST \
    --oidc-service-account-email "${PROJECT_ID}@appspot.gserviceaccount.com" \
    2>/dev/null || echo "Scheduler job already exists"

# Step 5: Create Cloud Build trigger for CI/CD
echo -e "\n${YELLOW}🔄 Setting up CI/CD...${NC}"
cat > cloudbuild.yaml << EOF
steps:
  # Build ChromaDB
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/\$PROJECT_ID/chromadb:latest', './docker/chromadb']
  
  # Build main app
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/\$PROJECT_ID/nubemsecurity:latest', '.']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/chromadb:latest']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/nubemsecurity:latest']
  
  # Deploy ChromaDB
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - '$CHROMADB_SERVICE'
    - '--image'
    - 'gcr.io/\$PROJECT_ID/chromadb:latest'
    - '--region'
    - '$REGION'
    - '--platform'
    - 'managed'
  
  # Deploy main app
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - '$SERVICE_NAME'
    - '--image'
    - 'gcr.io/\$PROJECT_ID/nubemsecurity:latest'
    - '--region'
    - '$REGION'
    - '--platform'
    - 'managed'

images:
  - 'gcr.io/\$PROJECT_ID/chromadb:latest'
  - 'gcr.io/\$PROJECT_ID/nubemsecurity:latest'
EOF

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "=================================="
echo -e "🌐 Application URL: ${GREEN}$APP_URL${NC}"
echo -e "📊 ChromaDB URL: ${GREEN}$CHROMADB_URL${NC}"
echo -e "\n📝 Next steps:"
echo "  1. Initialize the knowledge base: npm run init:rag"
echo "  2. Configure additional API keys if needed"
echo "  3. Set up monitoring and alerts in GCP"
echo "  4. Configure custom domain (optional)"