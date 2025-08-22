/**
 * Document Processor Module
 * Handles document ingestion, chunking, and preprocessing for RAG
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class DocumentProcessor {
    constructor() {
        this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', '.', '!', '?', ';', ':', ' ', '']
        });

        // Specialized splitters for different content types
        this.codeSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1500,
            chunkOverlap: 300,
            separators: ['\n\n', '\n', 'def ', 'class ', 'function ', '{', '}']
        });

        this.commandSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 100,
            separators: ['\n', '&&', '||', ';', '|']
        });
    }

    /**
     * Process a single document from file
     */
    async processFile(filePath, metadata = {}) {
        console.log(chalk.cyan(`📄 Processing file: ${filePath}`));

        const ext = path.extname(filePath).toLowerCase();
        let loader;
        let documents;

        try {
            switch (ext) {
                case '.pdf':
                    loader = new PDFLoader(filePath);
                    documents = await loader.load();
                    break;
                
                case '.txt':
                case '.md':
                    loader = new TextLoader(filePath);
                    documents = await loader.load();
                    break;
                
                case '.csv':
                    loader = new CSVLoader(filePath);
                    documents = await loader.load();
                    break;
                
                case '.json':
                    loader = new JSONLoader(filePath);
                    documents = await loader.load();
                    break;
                
                default:
                    // Try to read as text
                    const content = await fs.readFile(filePath, 'utf-8');
                    documents = [{ pageContent: content, metadata: {} }];
            }

            // Add metadata
            documents = documents.map(doc => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    ...metadata,
                    source: filePath,
                    fileType: ext,
                    processedAt: new Date().toISOString()
                }
            }));

            // Split documents into chunks
            const chunks = await this.splitDocuments(documents, metadata.type);
            
            console.log(chalk.green(`✅ Processed ${filePath}: ${chunks.length} chunks created`));
            return chunks;

        } catch (error) {
            console.log(chalk.red(`❌ Error processing ${filePath}: ${error.message}`));
            throw error;
        }
    }

    /**
     * Process web content
     */
    async processWebContent(url, metadata = {}) {
        console.log(chalk.cyan(`🌐 Processing web content: ${url}`));

        try {
            const loader = new CheerioWebBaseLoader(url);
            const documents = await loader.load();

            // Add metadata
            const enrichedDocs = documents.map(doc => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    ...metadata,
                    source: url,
                    type: 'web',
                    processedAt: new Date().toISOString()
                }
            }));

            // Split documents
            const chunks = await this.splitDocuments(enrichedDocs, 'web');
            
            console.log(chalk.green(`✅ Processed ${url}: ${chunks.length} chunks created`));
            return chunks;

        } catch (error) {
            console.log(chalk.red(`❌ Error processing ${url}: ${error.message}`));
            throw error;
        }
    }

    /**
     * Process security tool documentation
     */
    async processToolDoc(toolName, content, metadata = {}) {
        const processedContent = this.preprocessSecurityContent(content);
        
        const document = {
            pageContent: processedContent,
            metadata: {
                tool: toolName,
                type: 'tool_doc',
                ...metadata,
                processedAt: new Date().toISOString()
            }
        };

        // Use command splitter for tool documentation
        const chunks = await this.commandSplitter.splitDocuments([document]);
        
        return chunks.map(chunk => ({
            ...chunk,
            metadata: {
                ...chunk.metadata,
                id: uuidv4(),
                tool: toolName
            }
        }));
    }

    /**
     * Process exploit/vulnerability data
     */
    async processExploit(exploitData) {
        const {
            id,
            title,
            description,
            code,
            cve,
            platform,
            type,
            author,
            date
        } = exploitData;

        const content = `
Exploit: ${title}
CVE: ${cve || 'N/A'}
Platform: ${platform || 'N/A'}
Type: ${type || 'N/A'}

Description:
${description}

${code ? `Code:\n${code}` : ''}
        `.trim();

        const document = {
            pageContent: content,
            metadata: {
                id: id || uuidv4(),
                type: 'exploit',
                cve,
                platform,
                exploitType: type,
                author,
                date,
                processedAt: new Date().toISOString()
            }
        };

        // Use code splitter for exploits
        const chunks = await this.codeSplitter.splitDocuments([document]);
        
        return chunks;
    }

    /**
     * Split documents into chunks based on type
     */
    async splitDocuments(documents, type = 'general') {
        let splitter;

        switch (type) {
            case 'code':
            case 'exploit':
                splitter = this.codeSplitter;
                break;
            
            case 'command':
            case 'tool_doc':
                splitter = this.commandSplitter;
                break;
            
            default:
                splitter = this.splitter;
        }

        const chunks = await splitter.splitDocuments(documents);
        
        // Add chunk metadata
        return chunks.map((chunk, index) => ({
            ...chunk,
            metadata: {
                ...chunk.metadata,
                chunkIndex: index,
                chunkId: uuidv4()
            }
        }));
    }

    /**
     * Preprocess security-specific content
     */
    preprocessSecurityContent(content) {
        // Remove unnecessary whitespace
        let processed = content.replace(/\s+/g, ' ').trim();
        
        // Standardize command formats
        processed = processed.replace(/\$ /g, '');
        processed = processed.replace(/# /g, '');
        
        // Extract and highlight important patterns
        // IP addresses
        processed = processed.replace(
            /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g,
            '[IP: $1]'
        );
        
        // Ports
        processed = processed.replace(
            /:(\d{1,5})\b/g,
            ':[PORT: $1]'
        );
        
        // CVE references
        processed = processed.replace(
            /(CVE-\d{4}-\d+)/gi,
            '[CVE: $1]'
        );
        
        return processed;
    }

    /**
     * Batch process multiple files
     */
    async processDirectory(dirPath, metadata = {}) {
        console.log(chalk.cyan(`📁 Processing directory: ${dirPath}`));
        
        const files = await fs.readdir(dirPath);
        const allChunks = [];
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isFile()) {
                try {
                    const chunks = await this.processFile(filePath, metadata);
                    allChunks.push(...chunks);
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ Skipping ${file}: ${error.message}`));
                }
            }
        }
        
        console.log(chalk.green(`✅ Processed directory: ${allChunks.length} total chunks`));
        return allChunks;
    }

    /**
     * Create a summary of a document
     */
    async createSummary(content, maxLength = 200) {
        // Simple truncation for now
        // In production, you'd use an LLM to generate a proper summary
        if (content.length <= maxLength) {
            return content;
        }
        
        return content.substring(0, maxLength) + '...';
    }
}