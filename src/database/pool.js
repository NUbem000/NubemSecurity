/**
 * Database connection pooling
 */

import pg from 'pg';
const { Pool } = pg;

class DatabasePool {
  constructor() {
    this.pool = null;
  }
  
  initialize() {
    if (this.pool) return this.pool;
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      maxUses: 7500, // Close and recreate a connection after it has been used 7500 times
    });
    
    this.pool.on('error', (err, client) => {
      console.error('Unexpected error on idle database client', err);
    });
    
    this.pool.on('connect', (client) => {
      console.log('New database client connected');
    });
    
    this.pool.on('acquire', (client) => {
      console.log('Database client acquired from pool');
    });
    
    this.pool.on('remove', (client) => {
      console.log('Database client removed from pool');
    });
    
    return this.pool;
  }
  
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text);
      }
      
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
  
  async getClient() {
    return await this.pool.connect();
  }
  
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export default new DatabasePool();
