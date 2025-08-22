#!/bin/bash

# Setup Monitoring for NubemSecurity
# Implements Prometheus, Grafana, and custom metrics

set -e

echo "📊 NubemSecurity Monitoring Setup"
echo "================================="
echo ""

PROJECT_ID="nubemsecurity"
REGION="us-central1"

# 1. Create monitoring module
echo "1. Creating monitoring module..."
mkdir -p src/monitoring

cat > src/monitoring/metrics.js << 'EOF'
/**
 * Custom metrics for NubemSecurity
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Authentication metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'status']
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['type']
});

// API metrics
export const apiCallsTotal = new Counter({
  name: 'api_calls_total',
  help: 'Total API calls',
  labelNames: ['provider', 'endpoint', 'status']
});

export const apiLatency = new Histogram({
  name: 'api_latency_seconds',
  help: 'API call latency',
  labelNames: ['provider', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// CLI provisioning metrics
export const cliInstallations = new Counter({
  name: 'cli_installations_total',
  help: 'Total CLI installations',
  labelNames: ['status', 'region']
});

// Vector store metrics
export const vectorOperations = new Counter({
  name: 'vector_operations_total',
  help: 'Vector store operations',
  labelNames: ['operation', 'status']
});

export const vectorStoreSize = new Gauge({
  name: 'vector_store_size',
  help: 'Number of documents in vector store'
});

// System metrics
export const systemHealth = new Gauge({
  name: 'system_health',
  help: 'System health status (1=healthy, 0=unhealthy)'
});

// Rate limiting metrics
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Rate limit hits',
  labelNames: ['endpoint', 'type']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(authAttempts);
register.registerMetric(activeUsers);
register.registerMetric(apiCallsTotal);
register.registerMetric(apiLatency);
register.registerMetric(cliInstallations);
register.registerMetric(vectorOperations);
register.registerMetric(vectorStoreSize);
register.registerMetric(systemHealth);
register.registerMetric(rateLimitHits);

export { register };
EOF

# 2. Create monitoring middleware
cat > src/monitoring/middleware.js << 'EOF'
/**
 * Monitoring middleware for Express
 */

import { httpRequestDuration, httpRequestTotal } from './metrics.js';

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};
EOF

# 3. Create health check module
cat > src/monitoring/health.js << 'EOF'
/**
 * Health check and readiness probes
 */

import { systemHealth } from './metrics.js';

export class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.startTime = Date.now();
  }
  
  addCheck(name, checkFn) {
    this.checks.set(name, checkFn);
  }
  
  async getHealth() {
    const results = {};
    let healthy = true;
    
    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = {
          status: 'healthy',
          ...result
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
        healthy = false;
      }
    }
    
    systemHealth.set(healthy ? 1 : 0);
    
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
  
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    };
  }
  
  async getReadiness() {
    const health = await this.getHealth();
    return {
      ready: health.status === 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}

export const healthChecker = new HealthChecker();

// Add default checks
healthChecker.addCheck('memory', async () => {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  if (heapUsedPercent > 90) {
    throw new Error('Memory usage too high');
  }
  
  return {
    heapUsedPercent: heapUsedPercent.toFixed(2),
    heapUsedMB: (usage.heapUsed / 1024 / 1024).toFixed(2)
  };
});

healthChecker.addCheck('eventLoop', async () => {
  const start = Date.now();
  await new Promise(resolve => setImmediate(resolve));
  const lag = Date.now() - start;
  
  if (lag > 100) {
    throw new Error('Event loop lag too high');
  }
  
  return { lagMs: lag };
});
EOF

# 4. Create Grafana dashboard config
cat > monitoring/grafana-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "NubemSecurity Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"4..|5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users"
          }
        ]
      },
      {
        "title": "API Provider Usage",
        "targets": [
          {
            "expr": "rate(api_calls_total[5m]) by (provider)"
          }
        ]
      },
      {
        "title": "CLI Installations",
        "targets": [
          {
            "expr": "increase(cli_installations_total[1h])"
          }
        ]
      }
    ]
  }
}
EOF

# 5. Create docker-compose for monitoring stack
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=NubemSec2025!
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
      - ./monitoring/grafana-dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml
      - ./monitoring/dashboards:/var/lib/grafana/dashboards
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
EOF

# 6. Create Prometheus configuration
mkdir -p monitoring
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: 'nubemsecurity'
    static_configs:
      - targets: ['host.docker.internal:8080']
    metrics_path: '/metrics'
    
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# 7. Create alert rules
cat > monitoring/alerts.yml << 'EOF'
groups:
  - name: nubemsecurity
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is above 2 seconds"
      
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Process memory usage is above 500MB"
      
      - alert: RateLimitExceeded
        expr: increase(rate_limit_hits_total[1h]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit hits"
          description: "More than 1000 rate limit hits in the last hour"
EOF

# 8. Create Grafana datasource config
cat > monitoring/grafana-datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# 9. Create Grafana dashboard provisioning
cat > monitoring/grafana-dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
EOF

# 10. Install monitoring dependencies
echo "2. Installing monitoring dependencies..."
npm install --save prom-client

# 11. Create monitoring endpoint update script
cat > src/monitoring/setup.js << 'EOF'
/**
 * Add monitoring endpoints to Express app
 */

import { register } from './metrics.js';
import { metricsMiddleware } from './middleware.js';
import { healthChecker } from './health.js';

export function setupMonitoring(app) {
  // Add metrics middleware
  app.use(metricsMiddleware);
  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  });
  
  // Health check endpoints
  app.get('/health', async (req, res) => {
    const health = await healthChecker.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });
  
  app.get('/liveness', async (req, res) => {
    const liveness = await healthChecker.getLiveness();
    res.json(liveness);
  });
  
  app.get('/readiness', async (req, res) => {
    const readiness = await healthChecker.getReadiness();
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
  });
  
  console.log('✅ Monitoring endpoints configured');
  console.log('  - /metrics (Prometheus metrics)');
  console.log('  - /health (Health check)');
  console.log('  - /liveness (Kubernetes liveness probe)');
  console.log('  - /readiness (Kubernetes readiness probe)');
}
EOF

echo ""
echo "✅ Monitoring setup complete!"
echo ""
echo "To start the monitoring stack locally:"
echo "  docker-compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "Access:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/NubemSec2025!)"
echo "  - AlertManager: http://localhost:9093"
echo ""
echo "To integrate with your app, add to server.js:"
echo "  import { setupMonitoring } from './monitoring/setup.js';"
echo "  setupMonitoring(app);"
echo ""
echo "For GCP deployment, use Google Cloud Monitoring instead."