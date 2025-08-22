/**
 * NubemSecurity Production Server
 * Enhanced with authentication, security, and real RAG
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { applySecurityMiddleware, rateLimiters } from './middleware/security.js';
import jwtManager from './auth/jwt-manager.js';
import vectorStore from './rag/vector-store-enhanced.js';
import cliProvisioning from './services/cli-provisioning.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDemoCredentials } from './config/demo.js';
import { setupMonitoring } from './monitoring/setup.js';
import redisCache from './cache/redis-client.js';
import { cacheMiddleware } from './cache/middleware.js';

// Load environment variables
dotenv.config({ path: '/home/david/NubemSecurity/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Body parsing middleware (must be before security middleware)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply security middleware
applySecurityMiddleware(app);

// Additional middleware
app.use(compression());
app.use(morgan('combined'));

// Setup monitoring
setupMonitoring(app);

// Initialize Redis cache
redisCache.connect().catch(console.error);

// Apply caching to specific routes
app.use('/api/tools', cacheMiddleware({ ttl: 600 }));
app.use('/api/stats', cacheMiddleware({ ttl: 60 }));

// Serve static files (installation scripts, etc.)
app.use('/scripts', express.static(join(__dirname, '../public/scripts')));

// Initialize vector store
vectorStore.initialize().catch(console.error);

// Input validation schemas
const schemas = {
    login: z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(8).max(100)
    }),
    
    query: z.object({
        query: z.string().min(1).max(1000),
        k: z.number().min(1).max(20).optional().default(5),
        filter: z.record(z.any()).optional()
    }),
    
    document: z.object({
        id: z.string().min(1).max(100),
        text: z.string().min(1).max(10000),
        metadata: z.record(z.any()).optional()
    })
};

// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }
    };
};

// ==================== PUBLIC ENDPOINTS ====================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'NubemSecurity RAG',
        version: '1.0.0',
        message: 'Production-ready cybersecurity assistant',
        features: {
            authentication: true,
            vectorStore: vectorStore.initialized,
            rateLimit: true,
            security: true
        }
    });
});

app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        vectorStore: vectorStore.initialized
    };
    
    res.json(health);
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// Login endpoint
app.post('/auth/login', rateLimiters.auth, validate(schemas.login), async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await jwtManager.authenticateUser(username, password);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        
        const decoded = jwtManager.verifyRefreshToken(refreshToken);
        const user = jwtManager.users.get(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        
        const accessToken = jwtManager.generateAccessToken(user);
        
        res.json({
            success: true,
            accessToken
        });
    } catch (error) {
        res.status(401).json({
            error: 'Token refresh failed',
            message: error.message
        });
    }
});

// ==================== PROTECTED API ENDPOINTS ====================

// Main RAG query endpoint
app.post('/api/query', 
    jwtManager.optionalAuthMiddleware(),
    rateLimiters.query,
    validate(schemas.query),
    async (req, res) => {
        try {
            const { query, k, filter } = req.body;
            
            // Check if user has permissions
            if (req.auth.type === 'anonymous') {
                // Limited functionality for anonymous users
                return res.json({
                    response: 'Please authenticate for full access. Use /auth/login or provide an API key.',
                    sources: [],
                    limited: true
                });
            }
            
            // Search vector store
            const results = await vectorStore.search(query, k, filter);
            
            // Format response
            const response = {
                query,
                results: results.map(r => ({
                    text: r.text,
                    score: r.score,
                    metadata: r.metadata
                })),
                context: results.map(r => r.text).join('\n\n'),
                timestamp: new Date().toISOString(),
                user: req.auth.username || 'api-key'
            };
            
            res.json(response);
        } catch (error) {
            res.status(500).json({
                error: 'Query processing failed',
                message: error.message
            });
        }
    }
);

// List available tools
app.get('/api/tools',
    jwtManager.optionalAuthMiddleware(),
    async (req, res) => {
        const tools = [
            { name: 'nmap', category: 'reconnaissance', description: 'Network discovery and security auditing', premium: false },
            { name: 'metasploit', category: 'exploitation', description: 'Penetration testing framework', premium: true },
            { name: 'sqlmap', category: 'web', description: 'Automatic SQL injection tool', premium: false },
            { name: 'burpsuite', category: 'web', description: 'Web application security testing', premium: true },
            { name: 'john', category: 'passwords', description: 'Password cracker', premium: false },
            { name: 'hydra', category: 'passwords', description: 'Network login cracker', premium: false },
            { name: 'wireshark', category: 'network', description: 'Network protocol analyzer', premium: false },
            { name: 'nikto', category: 'web', description: 'Web server scanner', premium: false }
        ];
        
        // Filter based on user permissions
        const filteredTools = req.auth.type === 'anonymous' 
            ? tools.filter(t => !t.premium)
            : tools;
        
        res.json({
            tools: filteredTools,
            total: filteredTools.length,
            authenticated: req.auth.type !== 'anonymous'
        });
    }
);

// System statistics
app.get('/api/stats',
    jwtManager.authMiddleware(['read']),
    async (req, res) => {
        try {
            const vectorStats = await vectorStore.getStats();
            
            res.json({
                status: 'operational',
                vectorStore: vectorStats,
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    node: process.version
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get statistics',
                message: error.message
            });
        }
    }
);

// ==================== CLI PROVISIONING ENDPOINTS ====================

// Request CLI installation token
app.post('/api/cli/provision',
    jwtManager.authMiddleware(['admin']),
    async (req, res) => {
        try {
            const { machineId, description } = req.body;
            
            if (!machineId) {
                return res.status(400).json({ error: 'Machine ID required' });
            }
            
            const provisionInfo = cliProvisioning.generateProvisionToken(machineId, {
                ip: req.ip,
                requestedBy: req.auth.username,
                description
            });
            
            res.json({
                success: true,
                ...provisionInfo,
                instructions: `
To install NubemSecurity CLI on the remote machine, run:

curl -H "Authorization: Bearer ${provisionInfo.token}" \\
     ${provisionInfo.installUrl} | bash
                `.trim()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to generate provision token',
                message: error.message
            });
        }
    }
);

// Download installation script with API keys
app.get('/api/cli/install',
    async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Provision token required' });
            }
            
            const token = authHeader.split(' ')[1];
            const validation = cliProvisioning.validateProvisionToken(token);
            
            if (!validation.valid) {
                return res.status(401).json({ 
                    error: 'Invalid provision token',
                    message: validation.error 
                });
            }
            
            // Mark token as used
            validation.tokenInfo.used = true;
            
            // Get API keys from environment
            const apiKeys = {
                openai: process.env.OPENAI_API_KEY,
                gemini: process.env.GEMINI_API_KEY,
                anthropic: process.env.ANTHROPIC_API_KEY
            };
            
            // Generate installation script
            const script = await cliProvisioning.generateInstallScript({
                apiKeys,
                serverUrl: `https://nubemsecurity-app-313818478262.us-central1.run.app`,
                version: '0.1.0'
            });
            
            // Track installation
            cliProvisioning.trackInstallation(validation.decoded.machineId, {
                ip: req.ip,
                tokenId: validation.decoded.tokenId
            });
            
            // Send script
            res.set('Content-Type', 'text/plain');
            res.send(script);
        } catch (error) {
            res.status(500).json({
                error: 'Installation failed',
                message: error.message
            });
        }
    }
);

// Get CLI package (tar.gz)
app.get('/api/cli/package',
    async (req, res) => {
        try {
            // For now, send the CLI source as a package
            const cliPath = join(__dirname, '../cli');
            const packagePath = join(__dirname, '../dist/nubemsec-cli.tar.gz');
            
            // Check if package exists, otherwise create it
            try {
                await fs.access(packagePath);
            } catch {
                // Create package on the fly
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                
                await execAsync(`cd ${cliPath} && tar -czf ${packagePath} .`);
            }
            
            const packageData = await fs.readFile(packagePath);
            res.set('Content-Type', 'application/gzip');
            res.send(packageData);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get CLI package',
                message: error.message
            });
        }
    }
);

// Confirm installation
app.post('/api/cli/confirm',
    async (req, res) => {
        try {
            const { machineId, version } = req.body;
            
            console.log(`CLI installation confirmed: ${machineId} (v${version})`);
            
            res.json({
                success: true,
                message: 'Installation confirmed'
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to confirm installation'
            });
        }
    }
);

// Get provisioning stats
app.get('/api/cli/stats',
    jwtManager.authMiddleware(['admin']),
    (req, res) => {
        const stats = cliProvisioning.getStats();
        res.json(stats);
    }
);

// ==================== ADMIN ENDPOINTS ====================

// Add document to vector store
app.post('/api/admin/documents',
    jwtManager.authMiddleware(['admin']),
    validate(schemas.document),
    async (req, res) => {
        try {
            const { id, text, metadata } = req.body;
            
            await vectorStore.addDocument(id, text, metadata);
            
            res.json({
                success: true,
                message: 'Document added successfully',
                id
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to add document',
                message: error.message
            });
        }
    }
);

// Delete document from vector store
app.delete('/api/admin/documents/:id',
    jwtManager.authMiddleware(['admin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            await vectorStore.deleteDocument(id);
            
            res.json({
                success: true,
                message: 'Document deleted successfully',
                id
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete document',
                message: error.message
            });
        }
    }
);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `The endpoint ${req.method} ${req.path} does not exist`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: isDevelopment ? err.message : 'An error occurred processing your request',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, '0.0.0.0', () => {
    const demoConfig = getDemoCredentials();
    console.log(`
╔════════════════════════════════════════════╗
║     NubemSecurity Production Server        ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}           ║
║  🔐 Authentication: Enabled                ║
║  🛡️  Security: Helmet + Rate Limiting      ║
║  📊 Vector Store: ${vectorStore.provider.padEnd(24)} ║
║  🌐 CORS: Configured                       ║
║  📝 Logging: Enabled                       ║
╠════════════════════════════════════════════╣
║  Demo Mode: ${demoConfig.enabled ? 'Enabled' : 'Disabled'}                       ║
${demoConfig.enabled ? `║  - Username: ${demoConfig.username || 'Not set'}                    ║
║  - API Key: ${demoConfig.apiKey || 'Not set'}               ║` : ''}
╚════════════════════════════════════════════╝

📍 Endpoints:
  GET  /                     - Health check
  GET  /health               - Detailed health
  POST /auth/login           - Get access token
  POST /auth/refresh         - Refresh token
  POST /api/query            - RAG query (auth optional)
  GET  /api/tools            - List tools
  GET  /api/stats            - Statistics (auth required)
  POST /api/admin/documents  - Add document (admin only)
  DELETE /api/admin/documents/:id - Delete document (admin only)
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;