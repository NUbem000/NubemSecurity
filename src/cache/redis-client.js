/**
 * Redis client with connection pooling and retry logic
 */

import { createClient } from 'redis';

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }
  
  async connect() {
    if (this.isConnected) return;
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts');
          }
          const delay = Math.min(retries * 50, 2000);
          console.log(`Redis: Reconnecting in ${delay}ms...`);
          return delay;
        }
      }
    });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });
    
    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });
    
    await this.client.connect();
  }
  
  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }
  
  async set(key, value, ttl = 300) {
    if (!this.isConnected) return false;
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }
  
  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }
  
  async flush() {
    if (!this.isConnected) return false;
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }
  
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default new RedisCache();
