/**
 * NubemSecurity Simple Server
 * Minimal API for testing deployment
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'NubemSecurity RAG', 
        version: '0.2.0',
        message: 'Welcome to NubemSecurity - AI-powered Cybersecurity Assistant'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Simple query endpoint
app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }
    
    // For now, return a mock response
    res.json({
        response: `You asked about: "${query}". NubemSecurity RAG system is being initialized. This is a demo response.`,
        sources: [],
        metadata: {
            model: 'demo',
            timestamp: new Date().toISOString()
        }
    });
});

// Tools endpoint
app.get('/api/tools', (req, res) => {
    res.json({
        tools: [
            { name: 'nmap', category: 'reconnaissance', description: 'Network discovery and security auditing' },
            { name: 'metasploit', category: 'exploitation', description: 'Penetration testing framework' },
            { name: 'sqlmap', category: 'web', description: 'Automatic SQL injection tool' },
            { name: 'burpsuite', category: 'web', description: 'Web application security testing' },
            { name: 'john', category: 'passwords', description: 'Password cracker' }
        ]
    });
});

// Stats endpoint  
app.get('/api/stats', (req, res) => {
    res.json({
        status: 'operational',
        vectorStore: { provider: 'chroma', initialized: false },
        knowledgeBase: { tools: 50, techniques: 20 }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 NubemSecurity Simple Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});