#!/bin/bash

# Setup API Keys in GCP Secret Manager from local .env file

set -e

PROJECT_ID="nubemsecurity"
REGION="us-central1"

echo "🔐 Configuring API Keys in GCP Secret Manager"
echo "=============================================="

# Set project
gcloud config set project $PROJECT_ID

# Read API keys from .env file
if [ -f "/home/david/NubemSecurity/.env" ]; then
    source /home/david/NubemSecurity/.env
elif [ -f "/home/david/.env" ]; then
    source /home/david/.env
else
    echo "❌ No .env file found"
    exit 1
fi

# Function to create or update secret
create_or_update_secret() {
    SECRET_NAME=$1
    SECRET_VALUE=$2
    
    if [ -z "$SECRET_VALUE" ]; then
        echo "⚠️  Skipping $SECRET_NAME (no value)"
        return
    fi
    
    # Check if secret exists
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        echo "📝 Updating $SECRET_NAME..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    else
        echo "✨ Creating $SECRET_NAME..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME \
            --data-file=- \
            --replication-policy="automatic" \
            --project=$PROJECT_ID
    fi
}

# Create/Update API key secrets
echo ""
echo "📤 Uploading API Keys to Secret Manager..."

create_or_update_secret "openai-api-key-full" "$OPENAI_API_KEY"
create_or_update_secret "gemini-api-key-full" "$GEMINI_API_KEY"
create_or_update_secret "anthropic-api-key-full" "$ANTHROPIC_API_KEY"

# Create a master configuration secret
cat > /tmp/nubemsec-config.json << EOF
{
    "version": "1.0.0",
    "providers": {
        "openai": {
            "enabled": $([ -n "$OPENAI_API_KEY" ] && echo "true" || echo "false"),
            "model": "gpt-4"
        },
        "gemini": {
            "enabled": $([ -n "$GEMINI_API_KEY" ] && echo "true" || echo "false"),
            "model": "gemini-pro"
        },
        "anthropic": {
            "enabled": $([ -n "$ANTHROPIC_API_KEY" ] && echo "true" || echo "false"),
            "model": "claude-3"
        }
    },
    "deployment": {
        "url": "https://nubemsecurity-app-313818478262.us-central1.run.app",
        "region": "us-central1"
    }
}
EOF

create_or_update_secret "nubemsec-config" "$(cat /tmp/nubemsec-config.json)"

# Grant Cloud Run service account access to secrets
echo ""
echo "🔓 Granting access to Cloud Run service account..."

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in openai-api-key-full gemini-api-key-full anthropic-api-key-full nubemsec-config; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID \
        --quiet 2>/dev/null || true
done

echo ""
echo "✅ API Keys configured in GCP Secret Manager!"
echo ""
echo "Secrets created:"
echo "  - openai-api-key-full"
echo "  - gemini-api-key-full"
echo "  - anthropic-api-key-full"
echo "  - nubemsec-config"

rm -f /tmp/nubemsec-config.json