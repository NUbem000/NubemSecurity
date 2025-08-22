# Multi-stage build for NubemSecurity
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --production --legacy-peer-deps

# Copy application code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install additional tools for security operations
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    curl \
    wget \
    nmap \
    nikto \
    openssh-client

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data ./data

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create directories for distribution and public assets
RUN mkdir -p /app/dist /app/public/scripts

# Copy distribution files
COPY dist /app/dist
COPY scripts/install-remote.sh /app/public/scripts/

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port for web interface (future enhancement)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# Start production server
CMD ["node", "src/server.js"]