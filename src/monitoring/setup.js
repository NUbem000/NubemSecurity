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
