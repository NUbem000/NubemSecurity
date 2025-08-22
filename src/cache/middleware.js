/**
 * Caching middleware for API responses
 */

import crypto from 'crypto';
import redisCache from './redis-client.js';

export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300,
    keyPrefix = 'api',
    excludePaths = ['/auth', '/admin'],
    includeQuery = true,
    includeBody = false
  } = options;
  
  return async (req, res, next) => {
    // Skip caching for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && !options.allowNonGet) {
      return next();
    }
    
    // Generate cache key
    const keyParts = [keyPrefix, req.method, req.path];
    
    if (includeQuery && Object.keys(req.query).length > 0) {
      keyParts.push(JSON.stringify(req.query));
    }
    
    if (includeBody && req.body && Object.keys(req.body).length > 0) {
      keyParts.push(JSON.stringify(req.body));
    }
    
    const cacheKey = crypto
      .createHash('md5')
      .update(keyParts.join(':'))
      .digest('hex');
    
    // Try to get from cache
    const cached = await redisCache.get(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', ttl);
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      res.setHeader('X-Cache', 'MISS');
      
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisCache.set(cacheKey, data, ttl).catch(console.error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

export const invalidateCache = async (pattern) => {
  // Implement cache invalidation logic
  // This would require Redis SCAN command for pattern matching
  console.log(`Cache invalidation requested for pattern: ${pattern}`);
};
