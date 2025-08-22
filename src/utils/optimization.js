/**
 * Performance optimization utilities
 */

import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

export class ResponseOptimizer {
  static async compress(data, encoding = 'gzip') {
    const json = JSON.stringify(data);
    
    if (encoding === 'br') {
      return await brotli(json, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4
        }
      });
    }
    
    return await gzip(json, { level: 6 });
  }
  
  static shouldCompress(data) {
    const json = JSON.stringify(data);
    return json.length > 1024; // Only compress if > 1KB
  }
  
  static async optimizeResponse(data, acceptEncoding = '') {
    if (!this.shouldCompress(data)) {
      return { data, encoding: null };
    }
    
    if (acceptEncoding.includes('br')) {
      const compressed = await this.compress(data, 'br');
      return { data: compressed, encoding: 'br' };
    }
    
    if (acceptEncoding.includes('gzip')) {
      const compressed = await this.compress(data, 'gzip');
      return { data: compressed, encoding: 'gzip' };
    }
    
    return { data, encoding: null };
  }
}

export class QueryOptimizer {
  static createIndex(field) {
    return `CREATE INDEX CONCURRENTLY idx_${field} ON documents(${field})`;
  }
  
  static analyzeQuery(query) {
    // Simple query analysis
    const suggestions = [];
    
    if (query.includes('SELECT *')) {
      suggestions.push('Avoid SELECT *, specify needed columns');
    }
    
    if (!query.includes('LIMIT')) {
      suggestions.push('Add LIMIT clause to prevent large result sets');
    }
    
    if (query.includes('LIKE %')) {
      suggestions.push('Leading wildcard in LIKE prevents index usage');
    }
    
    return suggestions;
  }
}

export class MemoryOptimizer {
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
  }
  
  static async garbageCollect() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }
  
  static isMemoryHigh() {
    const usage = this.getMemoryUsage();
    const threshold = parseInt(process.env.MEMORY_THRESHOLD || '500');
    return usage.heapUsed > threshold;
  }
}
