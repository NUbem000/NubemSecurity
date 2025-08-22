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
