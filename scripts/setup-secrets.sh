#!/bin/bash

# Setup secrets in GCP Secret Manager

echo "🔐 Setting up secrets for NubemSecurity..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Load .env file
source .env

# Create secrets in Secret Manager
echo "Creating secrets in Secret Manager..."

# OpenAI API Key
if [ -n "$OPENAI_API_KEY" ]; then
    echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        2>/dev/null || echo "Secret openai-api-key already exists"
fi

# Google AI API Key (if provided)
if [ -n "$GOOGLE_AI_API_KEY" ]; then
    echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create google-ai-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        2>/dev/null || echo "Secret google-ai-api-key already exists"
fi

# Pinecone API Key (if provided)
if [ -n "$PINECONE_API_KEY" ]; then
    echo -n "$PINECONE_API_KEY" | gcloud secrets create pinecone-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        2>/dev/null || echo "Secret pinecone-api-key already exists"
fi

# Application secrets
echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret \
    --data-file=- \
    --replication-policy="automatic" \
    2>/dev/null || echo "Secret jwt-secret already exists"

echo -n "$(openssl rand -base64 32)" | gcloud secrets create session-secret \
    --data-file=- \
    --replication-policy="automatic" \
    2>/dev/null || echo "Secret session-secret already exists"

# Grant access to Cloud Run service account
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

echo "Granting access to service account: $SERVICE_ACCOUNT"

gcloud secrets add-iam-policy-binding openai-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null

echo "✅ Secrets configured successfully!"