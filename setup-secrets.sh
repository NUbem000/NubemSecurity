#!/bin/bash

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"

echo "🔐 Setting up secrets for NubemSecurity Production"

# Set project
gcloud config set project $PROJECT_ID

# Create JWT secrets
echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret \
    --data-file=- \
    --replication-policy="automatic" \
    2>/dev/null || echo "jwt-secret already exists"

echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-refresh-secret \
    --data-file=- \
    --replication-policy="automatic" \
    2>/dev/null || echo "jwt-refresh-secret already exists"

# Create Pinecone API key placeholder (user needs to provide real key)
echo -n "demo-pinecone-key" | gcloud secrets create pinecone-api-key \
    --data-file=- \
    --replication-policy="automatic" \
    2>/dev/null || echo "pinecone-api-key already exists"

# Grant access to Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secret accessor role
gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true

gcloud secrets add-iam-policy-binding jwt-refresh-secret \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true

gcloud secrets add-iam-policy-binding pinecone-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true

gcloud secrets add-iam-policy-binding openai-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true

echo "✅ Secrets configured successfully"