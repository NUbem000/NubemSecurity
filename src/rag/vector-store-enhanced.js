/**
 * Enhanced Vector Store with Pinecone and ChromaDB support
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';

class EnhancedVectorStore {
    constructor() {
        this.provider = process.env.VECTOR_DB_PROVIDER || 'pinecone';
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-3-small'
        });
        this.initialized = false;
        this.client = null;
        this.index = null;
        this.namespace = 'nubemsecurity';
    }

    /**
     * Initialize vector store
     */
    async initialize() {
        if (this.initialized) return;

        try {
            if (this.provider === 'pinecone') {
                await this.initializePinecone();
            } else if (this.provider === 'chroma') {
                await this.initializeChroma();
            } else {
                // Fallback to in-memory store
                await this.initializeInMemory();
            }
            
            this.initialized = true;
            console.log(`✅ Vector store initialized: ${this.provider}`);
            
            // Load initial knowledge base
            await this.loadInitialKnowledge();
        } catch (error) {
            console.error('Failed to initialize vector store:', error);
            // Fallback to in-memory
            await this.initializeInMemory();
        }
    }

    /**
     * Initialize Pinecone
     */
    async initializePinecone() {
        const apiKey = process.env.PINECONE_API_KEY;
        const environment = process.env.PINECONE_ENVIRONMENT || 'gcp-starter';
        
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY not configured');
        }

        this.client = new Pinecone({
            apiKey,
            environment
        });

        const indexName = process.env.PINECONE_INDEX || 'nubemsecurity';
        
        // Check if index exists, create if not
        const indexes = await this.client.listIndexes();
        
        if (!indexes.includes(indexName)) {
            await this.client.createIndex({
                name: indexName,
                dimension: 1536, // OpenAI embedding dimension
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'gcp',
                        region: 'us-central1'
                    }
                }
            });
            
            // Wait for index to be ready
            await new Promise(resolve => setTimeout(resolve, 60000));
        }

        this.index = this.client.index(indexName);
    }

    /**
     * Initialize ChromaDB
     */
    async initializeChroma() {
        const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
        
        this.client = new ChromaClient({
            path: chromaUrl
        });

        const collectionName = 'nubemsecurity';
        
        try {
            this.collection = await this.client.getCollection({
                name: collectionName
            });
        } catch (error) {
            // Create collection if it doesn't exist
            this.collection = await this.client.createCollection({
                name: collectionName,
                metadata: { 
                    description: 'NubemSecurity knowledge base'
                }
            });
        }
    }

    /**
     * Initialize in-memory store as fallback
     */
    async initializeInMemory() {
        console.log('Using in-memory vector store (development mode)');
        this.provider = 'memory';
        this.memoryStore = new Map();
        this.documents = [];
    }

    /**
     * Load initial knowledge base
     */
    async loadInitialKnowledge() {
        const securityTools = [
            {
                id: 'nmap-001',
                text: 'Nmap is a network discovery and security auditing tool. Use nmap -sS for SYN stealth scan, -sV for version detection, -O for OS detection. Common commands: nmap -sn 192.168.1.0/24 for ping sweep, nmap -p- for all ports scan.',
                metadata: { tool: 'nmap', category: 'reconnaissance', difficulty: 'beginner' }
            },
            {
                id: 'metasploit-001',
                text: 'Metasploit is a penetration testing framework. Use msfconsole to start, search to find exploits, use to select module, set options, and exploit to run. Common workflow: search ms17-010, use exploit/windows/smb/ms17_010_eternalblue.',
                metadata: { tool: 'metasploit', category: 'exploitation', difficulty: 'intermediate' }
            },
            {
                id: 'sqlmap-001',
                text: 'SQLmap automates SQL injection detection and exploitation. Basic usage: sqlmap -u URL --batch for automatic mode, --dbs to enumerate databases, --tables to list tables, --dump to extract data. Use --risk and --level for thoroughness.',
                metadata: { tool: 'sqlmap', category: 'web', difficulty: 'intermediate' }
            },
            {
                id: 'burpsuite-001',
                text: 'Burp Suite is a web application security testing platform. Proxy intercepts requests, Scanner finds vulnerabilities, Intruder performs attacks, Repeater modifies and resends requests. Configure browser proxy to 127.0.0.1:8080.',
                metadata: { tool: 'burpsuite', category: 'web', difficulty: 'intermediate' }
            },
            {
                id: 'john-001',
                text: 'John the Ripper is a password cracker. Basic usage: john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt for dictionary attack, john --incremental hashes.txt for brute force. Use --format to specify hash type.',
                metadata: { tool: 'john', category: 'passwords', difficulty: 'beginner' }
            },
            {
                id: 'hydra-001',
                text: 'Hydra is a network login cracker. Syntax: hydra -l username -P passlist.txt protocol://IP. Examples: hydra -l admin -P pass.txt ssh://192.168.1.1, hydra -L users.txt -P pass.txt ftp://target.com.',
                metadata: { tool: 'hydra', category: 'passwords', difficulty: 'intermediate' }
            },
            {
                id: 'wireshark-001',
                text: 'Wireshark is a network protocol analyzer. Capture filters: host 192.168.1.1, port 80, tcp, udp. Display filters: http, dns, ip.addr == 192.168.1.1. Follow TCP stream to see full conversation.',
                metadata: { tool: 'wireshark', category: 'network', difficulty: 'beginner' }
            },
            {
                id: 'nikto-001',
                text: 'Nikto is a web server scanner. Usage: nikto -h target.com for basic scan, -ssl for HTTPS, -p 8080 for custom port, -o output.html for reports. Checks for outdated versions, dangerous files, misconfigurations.',
                metadata: { tool: 'nikto', category: 'web', difficulty: 'beginner' }
            }
        ];

        // Add documents to vector store
        for (const doc of securityTools) {
            await this.addDocument(doc.id, doc.text, doc.metadata);
        }
        
        console.log(`📚 Loaded ${securityTools.length} security tool documents`);
    }

    /**
     * Add document to vector store
     */
    async addDocument(id, text, metadata = {}) {
        try {
            const embedding = await this.embeddings.embedQuery(text);
            
            if (this.provider === 'pinecone') {
                await this.index.namespace(this.namespace).upsert([{
                    id,
                    values: embedding,
                    metadata: {
                        ...metadata,
                        text,
                        timestamp: new Date().toISOString()
                    }
                }]);
            } else if (this.provider === 'chroma') {
                await this.collection.add({
                    ids: [id],
                    embeddings: [embedding],
                    metadatas: [metadata],
                    documents: [text]
                });
            } else {
                // In-memory store
                this.memoryStore.set(id, {
                    embedding,
                    text,
                    metadata
                });
                this.documents.push({ id, text, metadata });
            }
        } catch (error) {
            console.error('Error adding document:', error);
        }
    }

    /**
     * Search similar documents
     */
    async search(query, k = 5, filter = {}) {
        try {
            const queryEmbedding = await this.embeddings.embedQuery(query);
            
            if (this.provider === 'pinecone') {
                const results = await this.index.namespace(this.namespace).query({
                    vector: queryEmbedding,
                    topK: k,
                    includeMetadata: true,
                    filter
                });
                
                return results.matches.map(match => ({
                    id: match.id,
                    score: match.score,
                    text: match.metadata.text,
                    metadata: match.metadata
                }));
            } else if (this.provider === 'chroma') {
                const results = await this.collection.query({
                    queryEmbeddings: [queryEmbedding],
                    nResults: k,
                    where: filter
                });
                
                return results.ids[0].map((id, idx) => ({
                    id,
                    score: 1 - results.distances[0][idx], // Convert distance to similarity
                    text: results.documents[0][idx],
                    metadata: results.metadatas[0][idx]
                }));
            } else {
                // In-memory search (simple cosine similarity)
                const scores = [];
                
                for (const [id, doc] of this.memoryStore.entries()) {
                    const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
                    scores.push({ id, score, text: doc.text, metadata: doc.metadata });
                }
                
                scores.sort((a, b) => b.score - a.score);
                return scores.slice(0, k);
            }
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Calculate cosine similarity
     */
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Delete document
     */
    async deleteDocument(id) {
        if (this.provider === 'pinecone') {
            await this.index.namespace(this.namespace).deleteOne(id);
        } else if (this.provider === 'chroma') {
            await this.collection.delete({ ids: [id] });
        } else {
            this.memoryStore.delete(id);
            this.documents = this.documents.filter(doc => doc.id !== id);
        }
    }

    /**
     * Get statistics
     */
    async getStats() {
        if (this.provider === 'pinecone') {
            const stats = await this.index.describeIndexStats();
            return {
                provider: 'pinecone',
                totalVectors: stats.totalVectorCount,
                dimensions: stats.dimension,
                namespaces: stats.namespaces
            };
        } else if (this.provider === 'chroma') {
            const count = await this.collection.count();
            return {
                provider: 'chroma',
                totalVectors: count,
                collection: this.collection.name
            };
        } else {
            return {
                provider: 'memory',
                totalVectors: this.memoryStore.size,
                documents: this.documents.length
            };
        }
    }
}

export default new EnhancedVectorStore();