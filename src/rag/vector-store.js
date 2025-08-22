/**
 * Vector Store Module
 * Manages vector database operations for RAG
 */

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

export class VectorStore {
    constructor(config = {}) {
        this.provider = config.provider || process.env.VECTOR_DB_PROVIDER || 'chroma';
        this.embeddings = null;
        this.vectorStore = null;
        this.dimension = 1536; // OpenAI embeddings dimension
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log(chalk.cyan('🔄 Initializing vector store...'));

        // Initialize embeddings
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-3-small'
        });

        // Initialize vector store based on provider
        switch (this.provider) {
            case 'chroma':
                await this.initializeChroma();
                break;
            case 'pinecone':
                await this.initializePinecone();
                break;
            default:
                throw new Error(`Unknown vector store provider: ${this.provider}`);
        }

        this.initialized = true;
        console.log(chalk.green('✅ Vector store initialized'));
    }

    async initializeChroma() {
        // Chroma runs locally by default
        this.vectorStore = await Chroma.fromExistingCollection({
            collectionName: 'nubem-security',
            embeddingFunction: this.embeddings,
            url: process.env.CHROMA_URL || 'http://localhost:8000'
        }).catch(async () => {
            // Create new collection if doesn't exist
            console.log(chalk.yellow('Creating new Chroma collection...'));
            return await Chroma.fromDocuments(
                [],
                this.embeddings,
                {
                    collectionName: 'nubem-security',
                    url: process.env.CHROMA_URL || 'http://localhost:8000'
                }
            );
        });
    }

    async initializePinecone() {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || 'nubem-security');

        this.vectorStore = await PineconeStore.fromExistingIndex(
            this.embeddings,
            { pineconeIndex }
        );
    }

    /**
     * Add documents to vector store
     */
    async addDocuments(documents) {
        if (!this.initialized) await this.initialize();

        console.log(chalk.cyan(`📝 Adding ${documents.length} documents to vector store...`));

        // Prepare documents with metadata
        const docs = documents.map(doc => ({
            pageContent: doc.content,
            metadata: {
                id: doc.id || uuidv4(),
                source: doc.source || 'unknown',
                type: doc.type || 'general',
                tool: doc.tool || null,
                category: doc.category || null,
                timestamp: doc.timestamp || new Date().toISOString(),
                ...doc.metadata
            }
        }));

        // Add to vector store
        const ids = await this.vectorStore.addDocuments(docs);
        
        console.log(chalk.green(`✅ Added ${documents.length} documents`));
        return ids;
    }

    /**
     * Search for similar documents
     */
    async search(query, options = {}) {
        if (!this.initialized) await this.initialize();

        const {
            k = 5,
            filter = {},
            scoreThreshold = 0.7
        } = options;

        console.log(chalk.cyan(`🔍 Searching for: "${query.substring(0, 50)}..."`));

        const results = await this.vectorStore.similaritySearchWithScore(
            query,
            k,
            filter
        );

        // Filter by score threshold
        const filtered = results.filter(([doc, score]) => score >= scoreThreshold);

        console.log(chalk.green(`✅ Found ${filtered.length} relevant documents`));

        return filtered.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score
        }));
    }

    /**
     * Update a document
     */
    async updateDocument(id, content, metadata = {}) {
        // Most vector stores don't support direct updates
        // So we delete and re-add
        await this.deleteDocument(id);
        await this.addDocuments([{
            id,
            content,
            metadata
        }]);
    }

    /**
     * Delete a document
     */
    async deleteDocument(id) {
        if (!this.initialized) await this.initialize();

        // Implementation depends on vector store
        // This is a placeholder
        console.log(chalk.yellow(`⚠️ Document deletion not implemented for ${this.provider}`));
    }

    /**
     * Get statistics about the vector store
     */
    async getStats() {
        if (!this.initialized) await this.initialize();

        // Implementation varies by provider
        return {
            provider: this.provider,
            initialized: this.initialized,
            dimension: this.dimension
        };
    }

    /**
     * Clear all documents (use with caution!)
     */
    async clear() {
        if (!this.initialized) await this.initialize();

        console.log(chalk.red('⚠️ Clearing all documents from vector store...'));
        
        // Implementation depends on provider
        // For Chroma, we can delete and recreate the collection
        if (this.provider === 'chroma') {
            // This would require additional implementation
            console.log(chalk.yellow('Clear operation not fully implemented'));
        }
    }
}