#!/bin/bash

# Multi-Region Deployment for NubemSecurity
# Deploy to US, Europe, and Asia regions

set -e

PROJECT_ID="nubemsecurity"
SERVICE_NAME="nubemsecurity-app"
IMAGE_NAME="nubemsecurity-enhanced"

# Regions for deployment
REGIONS=("us-central1" "europe-west1" "asia-southeast1")

echo "🌍 NubemSecurity Multi-Region Deployment"
echo "========================================="
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Build and push the enhanced image
echo "🔨 Building enhanced Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .

echo "📤 Pushing to Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

# Deploy to each region
for REGION in "${REGIONS[@]}"; do
    echo ""
    echo "🚀 Deploying to $REGION..."
    
    SERVICE_NAME_REGIONAL="${SERVICE_NAME}-${REGION}"
    
    gcloud run deploy $SERVICE_NAME_REGIONAL \
        --image gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300 \
        --min-instances 1 \
        --max-instances 50 \
        --port 8080 \
        --concurrency 1000 \
        --set-env-vars="NODE_ENV=production,REGION=$REGION" \
        --update-secrets="OPENAI_API_KEY=openai-api-key-full:latest" \
        --update-secrets="GEMINI_API_KEY=gemini-api-key-full:latest" \
        --update-secrets="ANTHROPIC_API_KEY=anthropic-api-key-full:latest" \
        --update-secrets="JWT_SECRET=jwt-secret:latest" \
        --update-secrets="JWT_REFRESH_SECRET=jwt-refresh-secret:latest" \
        --update-secrets="PROVISION_SECRET=provision-secret:latest" \
        --service-account="${PROJECT_ID}@appspot.gserviceaccount.com"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME_REGIONAL \
        --region=$REGION \
        --format="value(status.url)")
    
    echo "✅ Deployed to $REGION: $SERVICE_URL"
done

# Setup Cloud Load Balancer
echo ""
echo "⚖️ Setting up Global Load Balancer..."

# Create NEG (Network Endpoint Group) for each region
for REGION in "${REGIONS[@]}"; do
    gcloud compute network-endpoint-groups create "neg-${SERVICE_NAME}-${REGION}" \
        --region=$REGION \
        --network-endpoint-type=serverless \
        --cloud-run-service="${SERVICE_NAME}-${REGION}" || true
done

# Create backend service
gcloud compute backend-services create "${SERVICE_NAME}-backend" \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --protocol=HTTP || true

# Add backends for each region
for REGION in "${REGIONS[@]}"; do
    gcloud compute backend-services add-backend "${SERVICE_NAME}-backend" \
        --global \
        --network-endpoint-group="neg-${SERVICE_NAME}-${REGION}" \
        --network-endpoint-group-region=$REGION || true
done

# Create URL map
gcloud compute url-maps create "${SERVICE_NAME}-lb" \
    --default-service="${SERVICE_NAME}-backend" || true

# Create HTTP proxy
gcloud compute target-http-proxies create "${SERVICE_NAME}-proxy" \
    --url-map="${SERVICE_NAME}-lb" || true

# Reserve global IP
gcloud compute addresses create "${SERVICE_NAME}-ip" \
    --global || true

GLOBAL_IP=$(gcloud compute addresses describe "${SERVICE_NAME}-ip" \
    --global --format="value(address)")

# Create forwarding rule
gcloud compute forwarding-rules create "${SERVICE_NAME}-forwarding" \
    --global \
    --address=$GLOBAL_IP \
    --target-http-proxy="${SERVICE_NAME}-proxy" \
    --ports=80 || true

echo ""
echo "🌐 Setting up Cloud CDN..."

# Enable CDN on backend service
gcloud compute backend-services update "${SERVICE_NAME}-backend" \
    --global \
    --enable-cdn \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600 \
    --client-ttl=3600 \
    --max-ttl=86400 \
    --negative-caching \
    --serve-while-stale=86400

echo ""
echo "✅ Multi-Region Deployment Complete!"
echo "====================================="
echo ""
echo "🌍 Regional Endpoints:"
for REGION in "${REGIONS[@]}"; do
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}-${REGION}" \
        --region=$REGION \
        --format="value(status.url)")
    echo "  - $REGION: $SERVICE_URL"
done
echo ""
echo "🌐 Global Load Balancer:"
echo "  IP Address: $GLOBAL_IP"
echo "  URL: http://$GLOBAL_IP"
echo ""
echo "📊 CDN Status: Enabled"
echo "  - Cache Mode: CACHE_ALL_STATIC"
echo "  - Default TTL: 3600s"
echo "  - Max TTL: 86400s"
echo ""
echo "🔍 Monitor deployment:"
echo "  gcloud run services list --platform=managed"
echo ""
echo "📈 View metrics:"
echo "  https://console.cloud.google.com/run"
echo ""
echo "🎯 Next Steps:"
echo "  1. Configure DNS to point to $GLOBAL_IP"
echo "  2. Setup SSL certificate for HTTPS"
echo "  3. Configure monitoring alerts"
echo "  4. Test global latency"