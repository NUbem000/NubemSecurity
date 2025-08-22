#!/usr/bin/env node

/**
 * NubemSecurity with RAG - AI-powered Cybersecurity Assistant
 * Enhanced with Retrieval Augmented Generation
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { program } from 'commander';
import dotenv from 'dotenv';
import ora from 'ora';
import { RAGEngine } from './rag/rag-engine.js';
import { SecurityKnowledgeBase } from './rag/knowledge-base.js';
import { ConfigManager } from './config/manager.js';

// Load environment variables
dotenv.config();

// ASCII Art Banner
const banner = `
${chalk.cyan(`
╔═╗ ╦ ╦ ╔╗  ╔═╗ ╔╦╗  ╔═╗ ╔═╗ ╔═╗ ╦ ╦ ╦═╗ ╦ ╔╦╗ ╦ ╦
║ ║ ║ ║ ╠╩╗ ║╣  ║║║  ╚═╗ ║╣  ║   ║ ║ ╠╦╝ ║  ║  ╚╦╝
╚═╝ ╚═╝ ╚═╝ ╚═╝ ╩ ╩  ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╩╚═ ╩  ╩   ╩ 
`)}
${chalk.magenta('🚀 RAG-Powered Edition v0.2.0')}
${chalk.gray('─'.repeat(50))}
`;

class NubemSecurityRAG {
    constructor() {
        this.config = new ConfigManager();
        this.ragEngine = new RAGEngine();
        this.knowledgeBase = new SecurityKnowledgeBase();
        this.conversationHistory = [];
        this.ragMode = true; // Use RAG by default
    }

    async initialize() {
        console.clear();
        console.log(banner);
        
        // Check for API keys
        if (!process.env.OPENAI_API_KEY) {
            console.log(chalk.yellow('⚠️  No OpenAI API key found.'));
            await this.setupAPIKey();
        }
        
        // Initialize RAG engine
        const spinner = ora('Initializing RAG system...').start();
        try {
            await this.ragEngine.initialize();
            await this.knowledgeBase.initialize();
            spinner.succeed('RAG system initialized');
            console.log(chalk.green('✅ NubemSecurity RAG ready!\n'));
        } catch (error) {
            spinner.fail('Failed to initialize RAG');
            console.log(chalk.yellow('⚠️  Running in limited mode without RAG'));
            this.ragMode = false;
        }
    }

    async setupAPIKey() {
        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: 'Enter your OpenAI API key:',
                mask: '*'
            }
        ]);
        
        process.env.OPENAI_API_KEY = apiKey;
        await this.config.saveAPIKey('openai', apiKey);
    }

    async startConversation() {
        console.log(chalk.cyan('💬 Start chatting! Type /help for commands.'));
        console.log(chalk.magenta('🚀 RAG Mode: ' + (this.ragMode ? 'ENABLED' : 'DISABLED') + '\n'));
        
        while (true) {
            const { input } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'input',
                    message: chalk.green(`${this.config.userName}>`),
                    prefix: ''
                }
            ]);

            // Handle commands
            if (input.startsWith('/')) {
                const handled = await this.handleCommand(input);
                if (handled === 'exit') break;
                continue;
            }

            // Process with RAG or fallback
            if (this.ragMode) {
                await this.processWithRAG(input);
            } else {
                await this.processBasic(input);
            }
        }
    }

    async handleCommand(command) {
        const cmd = command.toLowerCase().trim();
        const args = cmd.split(' ').slice(1);
        
        switch (cmd.split(' ')[0]) {
            case '/help':
                this.showHelp();
                break;
                
            case '/clear':
                console.clear();
                console.log(banner);
                break;
                
            case '/reset':
                this.conversationHistory = [];
                console.log(chalk.yellow('🔄 Conversation reset.\n'));
                break;
                
            case '/tools':
                this.showTools();
                break;
                
            case '/rag':
                this.toggleRAG();
                break;
                
            case '/search':
                await this.searchKnowledge(args.join(' '));
                break;
                
            case '/stats':
                await this.showStats();
                break;
                
            case '/index':
                await this.indexDocument(args.join(' '));
                break;
                
            case '/exit':
            case '/quit':
                console.log(chalk.cyan('\n👋 Goodbye! Stay secure!\n'));
                return 'exit';
                
            default:
                console.log(chalk.red(`Unknown command: ${command}`));
                console.log(chalk.gray('Type /help for available commands.\n'));
        }
        return 'continue';
    }

    showHelp() {
        console.log(chalk.cyan('\n📚 Available Commands:'));
        console.log(chalk.white('  /help      - Show this help message'));
        console.log(chalk.white('  /clear     - Clear the screen'));
        console.log(chalk.white('  /reset     - Reset conversation history'));
        console.log(chalk.white('  /tools     - Show available security tools'));
        console.log(chalk.magenta('  /rag       - Toggle RAG mode on/off'));
        console.log(chalk.magenta('  /search    - Search knowledge base'));
        console.log(chalk.magenta('  /stats     - Show RAG statistics'));
        console.log(chalk.magenta('  /index     - Index a new document'));
        console.log(chalk.white('  /exit      - Exit NubemSecurity\n'));
    }

    showTools() {
        console.log(chalk.cyan('\n🛠️  Security Tools in Knowledge Base:\n'));
        
        const tools = this.knowledgeBase.tools;
        const categories = {};
        
        // Group tools by category
        for (const [name, info] of tools) {
            if (!categories[info.category]) {
                categories[info.category] = [];
            }
            categories[info.category].push(name);
        }
        
        // Display by category
        for (const [category, toolList] of Object.entries(categories)) {
            console.log(chalk.yellow(`📁 ${category.toUpperCase()}`));
            toolList.forEach(tool => {
                const info = tools.get(tool);
                console.log(chalk.white(`  • ${chalk.green(tool.padEnd(15))} - ${info.description}`));
            });
            console.log();
        }
    }

    toggleRAG() {
        this.ragMode = !this.ragMode;
        console.log(chalk.magenta(`\n🚀 RAG Mode: ${this.ragMode ? 'ENABLED' : 'DISABLED'}\n`));
    }

    async searchKnowledge(query) {
        if (!query) {
            console.log(chalk.red('Please provide a search query.\n'));
            return;
        }

        const spinner = ora('Searching knowledge base...').start();
        
        try {
            const results = await this.ragEngine.retrieve(query, { k: 3 });
            spinner.stop();
            
            if (results.length === 0) {
                console.log(chalk.yellow('No results found.\n'));
                return;
            }
            
            console.log(chalk.cyan(`\n📚 Found ${results.length} results:\n`));
            
            results.forEach((doc, index) => {
                console.log(chalk.yellow(`[${index + 1}] Score: ${doc.score.toFixed(3)}`));
                console.log(chalk.gray(`Source: ${doc.metadata.source || 'Unknown'}`));
                console.log(chalk.gray(`Type: ${doc.metadata.type || 'general'}`));
                console.log(chalk.white(doc.content.substring(0, 200) + '...\n'));
            });
            
        } catch (error) {
            spinner.fail('Search failed');
            console.log(chalk.red(`Error: ${error.message}\n`));
        }
    }

    async showStats() {
        const spinner = ora('Fetching RAG statistics...').start();
        
        try {
            const stats = await this.ragEngine.vectorStore.getStats();
            spinner.stop();
            
            console.log(chalk.cyan('\n📊 RAG System Statistics:\n'));
            console.log(chalk.white(`  Vector Store: ${stats.provider}`));
            console.log(chalk.white(`  Embedding Dimension: ${stats.dimension}`));
            console.log(chalk.white(`  Status: ${stats.initialized ? 'Active' : 'Inactive'}`));
            console.log(chalk.white(`  Knowledge Sources: 5 (Kali, CVE, ExploitDB, OWASP, MITRE)\n`));
            
        } catch (error) {
            spinner.fail('Failed to fetch statistics');
            console.log(chalk.red(`Error: ${error.message}\n`));
        }
    }

    async indexDocument(filePath) {
        if (!filePath) {
            console.log(chalk.red('Please provide a file path.\n'));
            return;
        }

        const spinner = ora(`Indexing ${filePath}...`).start();
        
        try {
            await this.ragEngine.indexDocuments([{ filePath }]);
            spinner.succeed('Document indexed successfully');
        } catch (error) {
            spinner.fail('Indexing failed');
            console.log(chalk.red(`Error: ${error.message}\n`));
        }
    }

    async processWithRAG(input) {
        const spinner = ora('Thinking with RAG...').start();
        
        try {
            // Check if this is a tool-specific query
            const detectedTools = this.knowledgeBase.detectTools(input);
            
            // Process with RAG
            const result = await this.ragEngine.query(input, {
                conversationHistory: this.conversationHistory
            });
            
            spinner.stop();
            
            // Display response
            console.log(chalk.blue(`\n${this.config.botName}:`));
            console.log(chalk.white(result.response));
            
            // Show sources if available
            if (result.sources && result.sources.length > 0) {
                console.log(chalk.gray('\n📎 Sources used:'));
                result.sources.forEach((source, index) => {
                    console.log(chalk.gray(`  [${index + 1}] ${source.source} (score: ${source.score.toFixed(2)})`));
                });
            }
            
            console.log();
            
            // Update conversation history
            this.conversationHistory.push({ role: 'user', content: input });
            this.conversationHistory.push({ role: 'assistant', content: result.response });
            
            // Keep history limited
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }
            
        } catch (error) {
            spinner.stop();
            console.log(chalk.red(`\n❌ Error: ${error.message}`));
            console.log(chalk.yellow('Falling back to basic mode...\n'));
            await this.processBasic(input);
        }
    }

    async processBasic(input) {
        // Fallback to basic processing without RAG
        console.log(chalk.yellow('\n⚠️  RAG unavailable. Using basic mode.'));
        console.log(chalk.white('Response: I can help with security questions, but RAG features are currently unavailable.\n'));
    }

    async run() {
        await this.initialize();
        await this.startConversation();
    }
}

// CLI Setup
program
    .name('nubemsec-rag')
    .description('NubemSecurity RAG - AI-powered cybersecurity assistant with knowledge retrieval')
    .version('0.2.0');

program
    .option('--no-rag', 'Disable RAG mode')
    .option('--init', 'Initialize RAG knowledge base')
    .action(async (options) => {
        if (options.init) {
            // Run initialization script
            const { spawn } = await import('child_process');
            const init = spawn('node', ['scripts/init-rag.js'], { stdio: 'inherit' });
            init.on('close', (code) => {
                process.exit(code);
            });
            return;
        }
        
        const app = new NubemSecurityRAG();
        
        if (options.rag === false) {
            app.ragMode = false;
        }
        
        await app.run();
    });

program.parse();

// If no command provided, run interactive mode
if (!process.argv.slice(2).length) {
    const app = new NubemSecurityRAG();
    app.run().catch(console.error);
}