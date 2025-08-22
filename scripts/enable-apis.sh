#!/bin/bash

# Enable necessary GCP APIs for NubemSecurity

echo "🚀 Enabling GCP APIs for NubemSecurity..."

# Core APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudscheduler.googleapis.com

# Storage and Database
gcloud services enable firestore.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage.googleapis.com

# Security and Monitoring
gcloud services enable containerscanning.googleapis.com
gcloud services enable binaryauthorization.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# AI/ML APIs
gcloud services enable aiplatform.googleapis.com

echo "✅ All APIs enabled successfully!"