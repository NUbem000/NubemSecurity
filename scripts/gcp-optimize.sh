#!/bin/bash

# GCP-specific optimizations

echo "🚀 Optimizing GCP deployment..."

# Enable Cloud CDN
gcloud compute backend-services update nubemsecurity-backend \
  --enable-cdn \
  --cache-mode="CACHE_ALL_STATIC" \
  --default-ttl=3600 \
  --max-ttl=86400 \
  --client-ttl=3600

# Configure autoscaling
gcloud run services update nubemsecurity-app \
  --min-instances=1 \
  --max-instances=100 \
  --cpu-throttling \
  --concurrency=1000 \
  --memory=2Gi \
  --cpu=2

# Enable HTTP/2
gcloud run services update nubemsecurity-app \
  --use-http2

echo "✅ GCP optimizations applied"
