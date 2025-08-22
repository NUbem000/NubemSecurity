/**
 * NubemSecurity Web API
 * RESTful API for RAG-powered security assistant
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RAGEngine } from './rag/rag-engine.js';
import { SecurityDataSources } from './rag/data-sources.js';
import { SecurityKnowledgeBase } from './rag/knowledge-base.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize RAG components
const ragEngine = new RAGEngine();
const dataSources = new SecurityDataSources();
const knowledgeBase = new SecurityKnowledgeBase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'NubemSecurity', version: '0.2.0' });
});

// Initialize RAG on startup
async function initializeServices() {
    console.log('🚀 Initializing NubemSecurity services...');
    await ragEngine.initialize();
    await knowledgeBase.initialize();
    await dataSources.initialize();
    console.log('✅ Services initialized');
}

// API Routes

/**
 * Query endpoint - Main RAG query
 */
app.post('/api/query', async (req, res) => {
    try {
        const { query, options = {} } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const result = await ragEngine.query(query, options);
        res.json(result);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Search endpoint - Search knowledge base
 */
app.post('/api/search', async (req, res) => {
    try {
        const { query, k = 5 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const results = await ragEngine.retrieve(query, { k });
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Tools endpoint - Get security tools information
 */
app.get('/api/tools', async (req, res) => {
    try {
        const tools = Array.from(knowledgeBase.tools.entries()).map(([name, info]) => ({
            name,
            ...info
        }));
        res.json({ tools });
    } catch (error) {
        console.error('Tools error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Tool detail endpoint
 */
app.get('/api/tools/:toolName', async (req, res) => {
    try {
        const { toolName } = req.params;
        const toolInfo = knowledgeBase.getToolInfo(toolName);
        
        if (!toolInfo) {
            return res.status(404).json({ error: 'Tool not found' });
        }
        
        res.json(toolInfo);
    } catch (error) {
        console.error('Tool detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * CVE lookup endpoint
 */
app.get('/api/cve/:cveId', async (req, res) => {
    try {
        const { cveId } = req.params;
        const cveInfo = await knowledgeBase.fetchCVE(cveId);
        res.json(cveInfo);
    } catch (error) {
        console.error('CVE lookup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update CVE data endpoint (for scheduled updates)
 */
app.post('/api/update-cve', async (req, res) => {
    try {
        console.log('📊 Updating CVE data...');
        const cveDocs = await dataSources.fetchCVEData();
        
        // Index new CVE data
        await ragEngine.indexDocuments(cveDocs.map(doc => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            type: 'cve'
        })));
        
        res.json({ 
            success: true, 
            message: `Updated ${cveDocs.length} CVE documents` 
        });
    } catch (error) {
        console.error('CVE update error:', error);
        res.status(500).json({ error: 'Failed to update CVE data' });
    }
});

/**
 * Index document endpoint
 */
app.post('/api/index', async (req, res) => {
    try {
        const { content, metadata = {}, type = 'general' } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        await ragEngine.indexDocuments([{ content, metadata, type }]);
        res.json({ success: true, message: 'Document indexed successfully' });
    } catch (error) {
        console.error('Index error:', error);
        res.status(500).json({ error: 'Failed to index document' });
    }
});

/**
 * Statistics endpoint
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await ragEngine.vectorStore.getStats();
        const toolCount = knowledgeBase.tools.size;
        const techniqueCount = knowledgeBase.techniques.size;
        
        res.json({
            vectorStore: stats,
            knowledgeBase: {
                tools: toolCount,
                techniques: techniqueCount
            },
            status: 'operational'
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * OWASP Top 10 endpoint
 */
app.get('/api/owasp', async (req, res) => {
    try {
        const owaspData = await dataSources.fetchOWASPTop10();
        res.json({ owasp: owaspData });
    } catch (error) {
        console.error('OWASP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Exploit search endpoint
 */
app.post('/api/exploits/search', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const exploits = await knowledgeBase.searchExploitDB(query);
        res.json({ exploits });
    } catch (error) {
        console.error('Exploit search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Static frontend (if exists)
app.use(express.static('public'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        await initializeServices();
        
        app.listen(PORT, () => {
            console.log(`🌐 NubemSecurity API running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();