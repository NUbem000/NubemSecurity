/**
 * API Integration Tests for NubemSecurity
 */

import request from 'supertest';
import app from '../src/server.js';

describe('NubemSecurity API Tests', () => {
    let accessToken;
    let refreshToken;
    
    describe('Health Checks', () => {
        test('GET / should return health status', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.body.status).toBe('healthy');
            expect(response.body.service).toBe('NubemSecurity RAG');
        });
        
        test('GET /health should return detailed health', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body.status).toBe('healthy');
            expect(response.body.checks).toBeDefined();
        });
        
        test('GET /metrics should return Prometheus metrics', async () => {
            const response = await request(app)
                .get('/metrics')
                .expect(200);
            
            expect(response.text).toContain('# HELP');
            expect(response.text).toContain('# TYPE');
        });
    });
    
    describe('Authentication', () => {
        test('POST /auth/login with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'admin',
                    password: 'NubemSec2025!'
                })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            
            accessToken = response.body.accessToken;
            refreshToken = response.body.refreshToken;
        });
        
        test('POST /auth/login with invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'invalid',
                    password: 'wrong'
                })
                .expect(401);
            
            expect(response.body.error).toBe('Authentication failed');
        });
        
        test('POST /auth/refresh with valid token', async () => {
            const response = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.accessToken).toBeDefined();
        });
    });
    
    describe('API Endpoints', () => {
        test('GET /api/tools should return tools list', async () => {
            const response = await request(app)
                .get('/api/tools')
                .expect(200);
            
            expect(response.body.tools).toBeInstanceOf(Array);
            expect(response.body.tools.length).toBeGreaterThan(0);
        });
        
        test('POST /api/query without auth should return limited response', async () => {
            const response = await request(app)
                .post('/api/query')
                .send({
                    query: 'test query',
                    k: 5
                })
                .expect(200);
            
            expect(response.body.limited).toBe(true);
        });
        
        test('POST /api/query with auth should return full response', async () => {
            const response = await request(app)
                .post('/api/query')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    query: 'test query',
                    k: 5
                })
                .expect(200);
            
            expect(response.body.results).toBeDefined();
            expect(response.body.context).toBeDefined();
        });
        
        test('GET /api/stats with auth should return statistics', async () => {
            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            
            expect(response.body.status).toBe('operational');
            expect(response.body.server).toBeDefined();
        });
    });
    
    describe('Rate Limiting', () => {
        test('Should enforce rate limits on auth endpoints', async () => {
            const requests = [];
            
            // Make 6 requests (limit is 5)
            for (let i = 0; i < 6; i++) {
                requests.push(
                    request(app)
                        .post('/auth/login')
                        .send({
                            username: 'test',
                            password: 'wrong'
                        })
                );
            }
            
            const responses = await Promise.all(requests);
            const rateLimited = responses.filter(r => r.status === 429);
            
            expect(rateLimited.length).toBeGreaterThan(0);
        });
    });
    
    describe('Input Validation', () => {
        test('Should reject invalid login data', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'a', // Too short
                    password: '123' // Too short
                })
                .expect(400);
            
            expect(response.body.error).toBe('Validation failed');
        });
        
        test('Should reject invalid query data', async () => {
            const response = await request(app)
                .post('/api/query')
                .send({
                    query: '', // Empty query
                    k: 100 // Too large
                })
                .expect(400);
            
            expect(response.body.error).toBe('Validation failed');
        });
    });
    
    describe('Security Headers', () => {
        test('Should include security headers', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        });
    });
    
    describe('CLI Provisioning', () => {
        test('POST /api/cli/provision should require admin auth', async () => {
            await request(app)
                .post('/api/cli/provision')
                .expect(401);
        });
        
        test('POST /api/cli/provision with admin auth should work', async () => {
            const response = await request(app)
                .post('/api/cli/provision')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    machineId: 'test-machine-001',
                    description: 'Test machine'
                })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.installUrl).toBeDefined();
        });
    });
});

// Cleanup after tests
afterAll(async () => {
    // Close server and connections
    if (app.server) {
        await app.server.close();
    }
});