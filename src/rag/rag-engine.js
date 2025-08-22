/**
 * RAG Engine Module
 * Main RAG pipeline for retrieval and augmented generation
 */

import { VectorStore } from './vector-store.js';
import { DocumentProcessor } from './document-processor.js';
import { SecurityKnowledgeBase } from './knowledge-base.js';
import OpenAI from 'openai';
import chalk from 'chalk';
import { encoding_for_model } from 'js-tiktoken';

export class RAGEngine {
    constructor(config = {}) {
        this.vectorStore = new VectorStore(config.vectorStore);
        this.documentProcessor = new DocumentProcessor();
        this.knowledgeBase = new SecurityKnowledgeBase();
        
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.config = {
            maxContextTokens: config.maxContextTokens || 3000,
            retrievalK: config.retrievalK || 5,
            scoreThreshold: config.scoreThreshold || 0.7,
            model: config.model || 'gpt-4-turbo-preview',
            temperature: config.temperature || 0.7,
            ...config
        };

        this.tokenizer = encoding_for_model('gpt-4');
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log(chalk.cyan('🚀 Initializing RAG Engine...'));
        
        await this.vectorStore.initialize();
        await this.knowledgeBase.initialize();
        
        this.initialized = true;
        console.log(chalk.green('✅ RAG Engine ready'));
    }

    /**
     * Main RAG query pipeline
     */
    async query(userQuery, options = {}) {
        if (!this.initialized) await this.initialize();

        console.log(chalk.cyan('\n🔍 Processing RAG query...'));

        // Step 1: Enhance query with security context
        const enhancedQuery = await this.enhanceQuery(userQuery);
        
        // Step 2: Retrieve relevant documents
        const retrievedDocs = await this.retrieve(enhancedQuery, options);
        
        // Step 3: Rerank and filter documents
        const relevantDocs = await this.rerankDocuments(retrievedDocs, userQuery);
        
        // Step 4: Build context from documents
        const context = this.buildContext(relevantDocs);
        
        // Step 5: Generate response with augmented context
        const response = await this.generate(userQuery, context, options);
        
        // Step 6: Add citations and sources
        const augmentedResponse = this.addCitations(response, relevantDocs);
        
        return {
            response: augmentedResponse,
            sources: relevantDocs.map(doc => ({
                source: doc.metadata.source,
                score: doc.score,
                type: doc.metadata.type
            })),
            context: context,
            metadata: {
                documentsRetrieved: retrievedDocs.length,
                model: this.config.model,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Enhance query with security-specific terms and context
     */
    async enhanceQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // Detect security concepts and add relevant keywords
        const enhancements = [];
        
        // Tool detection
        const tools = this.knowledgeBase.detectTools(query);
        if (tools.length > 0) {
            enhancements.push(`tools: ${tools.join(', ')}`);
        }
        
        // Attack type detection
        const attackTypes = this.detectAttackTypes(lowerQuery);
        if (attackTypes.length > 0) {
            enhancements.push(`attack types: ${attackTypes.join(', ')}`);
        }
        
        // CVE detection
        const cvePattern = /CVE-\d{4}-\d+/gi;
        const cves = query.match(cvePattern);
        if (cves) {
            enhancements.push(`CVEs: ${cves.join(', ')}`);
        }
        
        // Combine original query with enhancements
        const enhanced = enhancements.length > 0 
            ? `${query} [${enhancements.join('; ')}]`
            : query;
        
        console.log(chalk.gray(`Enhanced query: ${enhanced}`));
        return enhanced;
    }

    /**
     * Retrieve relevant documents from vector store
     */
    async retrieve(query, options = {}) {
        const retrievalOptions = {
            k: options.k || this.config.retrievalK,
            scoreThreshold: options.scoreThreshold || this.config.scoreThreshold,
            filter: options.filter || {}
        };

        // Add type-specific filters if detected
        if (query.includes('exploit')) {
            retrievalOptions.filter.type = 'exploit';
        } else if (query.includes('tool')) {
            retrievalOptions.filter.type = 'tool_doc';
        }

        const documents = await this.vectorStore.search(query, retrievalOptions);
        
        console.log(chalk.green(`✅ Retrieved ${documents.length} documents`));
        return documents;
    }

    /**
     * Rerank documents based on relevance to query
     */
    async rerankDocuments(documents, query) {
        // Simple reranking based on keyword matching
        // In production, use a cross-encoder model
        
        const queryTerms = query.toLowerCase().split(/\s+/);
        
        const reranked = documents.map(doc => {
            const content = doc.content.toLowerCase();
            let relevanceScore = doc.score;
            
            // Boost score for exact matches
            queryTerms.forEach(term => {
                if (content.includes(term)) {
                    relevanceScore += 0.1;
                }
            });
            
            // Boost for recent documents
            if (doc.metadata.timestamp) {
                const age = Date.now() - new Date(doc.metadata.timestamp).getTime();
                const daysSinceUpdate = age / (1000 * 60 * 60 * 24);
                if (daysSinceUpdate < 7) {
                    relevanceScore += 0.2;
                } else if (daysSinceUpdate < 30) {
                    relevanceScore += 0.1;
                }
            }
            
            return {
                ...doc,
                score: Math.min(relevanceScore, 1.0)
            };
        });
        
        // Sort by score and return top documents
        return reranked
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.retrievalK);
    }

    /**
     * Build context from retrieved documents
     */
    buildContext(documents) {
        let context = '';
        let tokenCount = 0;
        
        for (const doc of documents) {
            const docText = `\n---\nSource: ${doc.metadata.source || 'Unknown'}\nType: ${doc.metadata.type || 'general'}\n${doc.metadata.tool ? `Tool: ${doc.metadata.tool}\n` : ''}Content: ${doc.content}\n`;
            
            const docTokens = this.countTokens(docText);
            
            if (tokenCount + docTokens > this.config.maxContextTokens) {
                break;
            }
            
            context += docText;
            tokenCount += docTokens;
        }
        
        return context;
    }

    /**
     * Generate response using retrieved context
     */
    async generate(query, context, options = {}) {
        const systemPrompt = `You are NubemSecurity, an advanced AI cybersecurity assistant with access to a comprehensive knowledge base.

Your responses should be:
1. Technical and accurate
2. Based on the provided context
3. Include specific commands and examples when relevant
4. Focus on ethical hacking and defensive security
5. Cite sources when using specific information from context

Context from knowledge base:
${context}

Remember: Always prioritize information from the context over general knowledge.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ];

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: messages,
                temperature: this.config.temperature,
                max_tokens: options.maxTokens || 2000
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.log(chalk.red(`❌ Generation error: ${error.message}`));
            throw error;
        }
    }

    /**
     * Add citations to the response
     */
    addCitations(response, documents) {
        // Add source references at the end
        let citedResponse = response;
        
        if (documents.length > 0) {
            citedResponse += '\n\n📚 Sources:';
            documents.forEach((doc, index) => {
                const source = doc.metadata.source || 'Internal KB';
                const type = doc.metadata.type || 'general';
                citedResponse += `\n[${index + 1}] ${source} (${type})`;
            });
        }
        
        return citedResponse;
    }

    /**
     * Detect attack types in query
     */
    detectAttackTypes(query) {
        const attackPatterns = {
            'sql injection': ['sql', 'injection', 'sqli', 'union select'],
            'xss': ['xss', 'cross-site', 'scripting', 'javascript injection'],
            'buffer overflow': ['buffer', 'overflow', 'bof', 'stack smash'],
            'privilege escalation': ['privesc', 'privilege', 'escalation', 'root'],
            'remote code execution': ['rce', 'remote code', 'execution'],
            'ddos': ['ddos', 'denial of service', 'dos attack'],
            'phishing': ['phishing', 'spear phishing', 'social engineering'],
            'mitm': ['mitm', 'man in the middle', 'arp spoofing']
        };

        const detected = [];
        for (const [type, keywords] of Object.entries(attackPatterns)) {
            if (keywords.some(keyword => query.includes(keyword))) {
                detected.push(type);
            }
        }
        
        return detected;
    }

    /**
     * Count tokens in text
     */
    countTokens(text) {
        try {
            return this.tokenizer.encode(text).length;
        } catch {
            // Fallback to simple estimation
            return Math.ceil(text.length / 4);
        }
    }

    /**
     * Index new documents
     */
    async indexDocuments(documents) {
        if (!this.initialized) await this.initialize();
        
        console.log(chalk.cyan(`📝 Indexing ${documents.length} documents...`));
        
        // Process documents
        const processedDocs = [];
        for (const doc of documents) {
            if (doc.filePath) {
                const chunks = await this.documentProcessor.processFile(
                    doc.filePath,
                    doc.metadata
                );
                processedDocs.push(...chunks);
            } else if (doc.content) {
                const chunks = await this.documentProcessor.splitDocuments(
                    [{ pageContent: doc.content, metadata: doc.metadata }],
                    doc.type
                );
                processedDocs.push(...chunks);
            }
        }
        
        // Add to vector store
        const ids = await this.vectorStore.addDocuments(
            processedDocs.map(doc => ({
                content: doc.pageContent,
                metadata: doc.metadata
            }))
        );
        
        console.log(chalk.green(`✅ Indexed ${processedDocs.length} chunks`));
        return ids;
    }

    /**
     * Update the knowledge base with new security data
     */
    async updateKnowledgeBase(data) {
        await this.knowledgeBase.update(data);
    }
}