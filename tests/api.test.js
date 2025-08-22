/**
 * API Tests for NubemSecurity
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

let server;
let authToken;
let refreshToken;

beforeAll(async () => {
    server = app.listen(0); // Random port for testing
});

afterAll(async () => {
    await server.close();
});

describe('NubemSecurity API Tests', () => {
    
    describe('Public Endpoints', () => {
        it('GET / should return health status', async () => {
            const res = await request(server)
                .get('/')
                .expect(200);
            
            expect(res.body).toHaveProperty('status', 'healthy');
            expect(res.body).toHaveProperty('service', 'NubemSecurity RAG');
            expect(res.body.features).toHaveProperty('authentication', true);
        });

        it('GET /health should return detailed health', async () => {
            const res = await request(server)
                .get('/health')
                .expect(200);
            
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
        });

        it('GET /api/nonexistent should return 404', async () => {
            const res = await request(server)
                .get('/api/nonexistent')
                .expect(404);
            
            expect(res.body).toHaveProperty('error', 'Not found');
        });
    });

    describe('Authentication', () => {
        it('POST /auth/login with valid credentials should return tokens', async () => {
            const res = await request(server)
                .post('/auth/login')
                .send({
                    username: 'admin',
                    password: 'NubemSec2025!'
                })
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user).toHaveProperty('role', 'admin');
            
            authToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        });

        it('POST /auth/login with invalid credentials should return 401', async () => {
            const res = await request(server)
                .post('/auth/login')
                .send({
                    username: 'admin',
                    password: 'wrongpassword'
                })
                .expect(401);
            
            expect(res.body).toHaveProperty('error', 'Authentication failed');
        });

        it('POST /auth/login with invalid input should return 400', async () => {
            const res = await request(server)
                .post('/auth/login')
                .send({
                    username: 'a', // Too short
                    password: '123' // Too short
                })
                .expect(400);
            
            expect(res.body).toHaveProperty('error', 'Validation failed');
        });

        it('POST /auth/refresh with valid token should return new access token', async () => {
            const res = await request(server)
                .post('/auth/refresh')
                .send({
                    refreshToken
                })
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('accessToken');
        });
    });

    describe('Protected Endpoints', () => {
        it('GET /api/stats without auth should return 401', async () => {
            const res = await request(server)
                .get('/api/stats')
                .expect(401);
            
            expect(res.body).toHaveProperty('error');
        });

        it('GET /api/stats with valid token should return stats', async () => {
            const res = await request(server)
                .get('/api/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(res.body).toHaveProperty('status', 'operational');
            expect(res.body).toHaveProperty('vectorStore');
            expect(res.body).toHaveProperty('server');
        });

        it('POST /api/query with auth should return results', async () => {
            const res = await request(server)
                .post('/api/query')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: 'How to use nmap for port scanning?',
                    k: 3
                })
                .expect(200);
            
            expect(res.body).toHaveProperty('query');
            expect(res.body).toHaveProperty('results');
            expect(res.body).toHaveProperty('context');
        });

        it('POST /api/query without auth should return limited response', async () => {
            const res = await request(server)
                .post('/api/query')
                .send({
                    query: 'How to use nmap?'
                })
                .expect(200);
            
            expect(res.body).toHaveProperty('limited', true);
        });

        it('GET /api/tools with auth should return all tools', async () => {
            const res = await request(server)
                .get('/api/tools')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(res.body).toHaveProperty('tools');
            expect(res.body).toHaveProperty('authenticated', true);
            expect(res.body.tools.length).toBeGreaterThan(0);
        });

        it('GET /api/tools with API key should work', async () => {
            const res = await request(server)
                .get('/api/tools')
                .set('X-API-Key', 'nsk_demo_key_2025')
                .expect(200);
            
            expect(res.body).toHaveProperty('authenticated', true);
        });
    });

    describe('Admin Endpoints', () => {
        it('POST /api/admin/documents should add document', async () => {
            const res = await request(server)
                .post('/api/admin/documents')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    id: 'test-doc-001',
                    text: 'This is a test document about security tools',
                    metadata: { category: 'test' }
                })
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
        });

        it('DELETE /api/admin/documents/:id should delete document', async () => {
            const res = await request(server)
                .delete('/api/admin/documents/test-doc-001')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(res.body).toHaveProperty('success', true);
        });

        it('Admin endpoints without admin role should return 403', async () => {
            // Login as analyst (non-admin)
            const loginRes = await request(server)
                .post('/auth/login')
                .send({
                    username: 'analyst',
                    password: 'Analyst2025!'
                });
            
            const analystToken = loginRes.body.accessToken;
            
            const res = await request(server)
                .post('/api/admin/documents')
                .set('Authorization', `Bearer ${analystToken}`)
                .send({
                    id: 'test',
                    text: 'test'
                })
                .expect(403);
            
            expect(res.body).toHaveProperty('error', 'Insufficient permissions');
        });
    });

    describe('Security Headers', () => {
        it('Should include security headers', async () => {
            const res = await request(server)
                .get('/')
                .expect(200);
            
            expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
            expect(res.headers).toHaveProperty('x-xss-protection', '1; mode=block');
            expect(res.headers).not.toHaveProperty('x-powered-by');
        });
    });

    describe('Rate Limiting', () => {
        it('Should rate limit auth endpoints', async () => {
            // Make 6 requests (limit is 5)
            for (let i = 0; i < 6; i++) {
                const res = await request(server)
                    .post('/auth/login')
                    .send({
                        username: 'invalid',
                        password: 'invalid'
                    });
                
                if (i === 5) {
                    expect(res.status).toBe(429);
                    expect(res.body).toHaveProperty('error', 'Too many requests');
                }
            }
        });
    });

    describe('Input Validation', () => {
        it('Should validate query input', async () => {
            const res = await request(server)
                .post('/api/query')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: '', // Empty query
                    k: 100 // Too high
                })
                .expect(400);
            
            expect(res.body).toHaveProperty('error', 'Validation failed');
        });

        it('Should sanitize XSS attempts', async () => {
            const res = await request(server)
                .post('/api/query')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: '<script>alert("XSS")</script>How to use nmap?'
                })
                .expect(200);
            
            expect(res.body.query).not.toContain('<script>');
        });
    });
});