# ChromaDB for NubemSecurity
FROM chromadb/chroma:latest

# Expose the default ChromaDB port
EXPOSE 8000

# Configure ChromaDB for production
ENV CHROMA_SERVER_HOST=0.0.0.0
ENV CHROMA_SERVER_PORT=8000
ENV CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]'
ENV ANONYMIZED_TELEMETRY=false
ENV ALLOW_RESET=false

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/heartbeat || exit 1

# Use default ChromaDB command
# The base image already has the correct entrypoint