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
