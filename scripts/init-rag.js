#!/usr/bin/env node

/**
 * RAG Initialization Script
 * Populates the vector database with security knowledge
 */

import { RAGEngine } from '../src/rag/rag-engine.js';
import { SecurityDataSources } from '../src/rag/data-sources.js';
import { VectorStore } from '../src/rag/vector-store.js';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

dotenv.config();

async function initializeRAG() {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════╗
║     NubemSecurity RAG Initialization Script      ║
╚══════════════════════════════════════════════════╝
    `));

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
        console.log(chalk.red('❌ Error: OPENAI_API_KEY not found in environment'));
        console.log(chalk.yellow('Please set your OpenAI API key in .env file'));
        process.exit(1);
    }

    const spinner = ora('Initializing RAG components...').start();

    try {
        // Initialize RAG engine
        const ragEngine = new RAGEngine();
        await ragEngine.initialize();
        spinner.succeed('RAG engine initialized');

        // Initialize data sources
        spinner.start('Initializing data sources...');
        const dataSources = new SecurityDataSources();
        await dataSources.initialize();
        spinner.succeed('Data sources initialized');

        // Fetch and index security data
        console.log(chalk.cyan('\n📚 Fetching security knowledge base...\n'));

        // Fetch Kali tools documentation
        spinner.start('Fetching Kali Linux tools...');
        const kaliDocs = await dataSources.fetchKaliTools();
        spinner.succeed(`Fetched ${kaliDocs.length} Kali tool documents`);

        // Fetch CVE data
        spinner.start('Fetching CVE data...');
        const cveDocs = await dataSources.fetchCVEData();
        spinner.succeed(`Fetched ${cveDocs.length} CVE documents`);

        // Fetch ExploitDB
        spinner.start('Fetching ExploitDB entries...');
        const exploitDocs = await dataSources.fetchExploitDB();
        spinner.succeed(`Fetched ${exploitDocs.length} exploit documents`);

        // Fetch OWASP Top 10
        spinner.start('Fetching OWASP Top 10...');
        const owaspDocs = await dataSources.fetchOWASPTop10();
        spinner.succeed(`Fetched ${owaspDocs.length} OWASP documents`);

        // Fetch MITRE ATT&CK
        spinner.start('Fetching MITRE ATT&CK techniques...');
        const mitreDocs = await dataSources.fetchMITREAttack();
        spinner.succeed(`Fetched ${mitreDocs.length} MITRE ATT&CK documents`);

        // Combine all documents
        const allDocuments = [
            ...kaliDocs,
            ...cveDocs,
            ...exploitDocs,
            ...owaspDocs,
            ...mitreDocs
        ];

        console.log(chalk.cyan(`\n📊 Total documents to index: ${allDocuments.length}\n`));

        // Index documents in vector store
        spinner.start('Indexing documents in vector store...');
        
        // Convert to format expected by RAG engine
        const documentsToIndex = allDocuments.map(doc => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            type: doc.metadata.type || 'general'
        }));

        await ragEngine.indexDocuments(documentsToIndex);
        spinner.succeed('Documents indexed successfully');

        // Cache the data for offline use
        spinner.start('Caching data for offline use...');
        await dataSources.cacheData(allDocuments, 'security-knowledge-base.json');
        spinner.succeed('Data cached successfully');

        // Display statistics
        console.log(chalk.green.bold(`
╔══════════════════════════════════════════════════╗
║            RAG Initialization Complete!           ║
╠══════════════════════════════════════════════════╣
║  Documents Indexed: ${String(allDocuments.length).padEnd(29)}║
║  Vector Store: ${(process.env.VECTOR_DB_PROVIDER || 'chroma').padEnd(34)}║
║  Embedding Model: text-embedding-3-small         ║
╚══════════════════════════════════════════════════╝
        `));

        console.log(chalk.cyan('\n✨ Your NubemSecurity RAG system is now ready!'));
        console.log(chalk.gray('Run "npm start" to begin using the assistant.\n'));

    } catch (error) {
        spinner.fail('Initialization failed');
        console.log(chalk.red(`\n❌ Error: ${error.message}`));
        console.log(chalk.yellow('\nTroubleshooting:'));
        console.log(chalk.gray('1. Check your API keys in .env file'));
        console.log(chalk.gray('2. Ensure you have internet connection'));
        console.log(chalk.gray('3. Check if Chroma DB is running (if using local Chroma)'));
        process.exit(1);
    }
}

// Run initialization
initializeRAG().catch(console.error);