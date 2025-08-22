#!/bin/bash

# NubemSecurity CLI Launcher with automatic API key loading
# This script ensures API keys are loaded from .env

# Load environment variables
if [ -f "/home/david/NubemSecurity/.env" ]; then
    export $(cat /home/david/NubemSecurity/.env | grep -v '^#' | xargs)
elif [ -f "/home/david/.env" ]; then
    export $(cat /home/david/.env | grep -v '^#' | xargs)
fi

# Check if at least one API key is configured
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  No API keys found in .env file"
    echo "Please configure at least one of:"
    echo "  - OPENAI_API_KEY"
    echo "  - GEMINI_API_KEY"
    echo "  - GOOGLE_API_KEY"
    exit 1
fi

# Launch NubemSecurity with all arguments passed through
exec node /home/david/NubemSecurity/src/index.js "$@"