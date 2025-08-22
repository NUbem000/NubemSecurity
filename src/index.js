#!/usr/bin/env node

/**
 * NubemSecurity - AI-powered Cybersecurity Assistant
 * Forked from KaliGPT by @amarokdevs
 * Enhanced for NubemGenesis ecosystem
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { program } from 'commander';
import dotenv from 'dotenv';
import ora from 'ora';
import { AIProvider } from './providers/index.js';
import { SecurityTools } from './tools/index.js';
import { ConfigManager } from './config/manager.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from multiple possible locations
dotenv.config({ path: join(__dirname, '..', '.env') });  // Project .env
dotenv.config({ path: '/home/david/.env' });  // User home .env

// ASCII Art Banner
const banner = `
${chalk.cyan(`
╔═╗ ╦ ╦ ╔╗  ╔═╗ ╔╦╗  ╔═╗ ╔═╗ ╔═╗ ╦ ╦ ╦═╗ ╦ ╔╦╗ ╦ ╦
║ ║ ║ ║ ╠╩╗ ║╣  ║║║  ╚═╗ ║╣  ║   ║ ║ ╠╦╝ ║  ║  ╚╦╝
╚═╝ ╚═╝ ╚═╝ ╚═╝ ╩ ╩  ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╩╚═ ╩  ╩   ╩ 
`)}
${chalk.gray('AI-Powered Cybersecurity Assistant v0.1.0')}
${chalk.gray('─'.repeat(50))}
`;

class NubemSecurity {
    constructor() {
        this.config = new ConfigManager();
        this.aiProvider = null;
        this.securityTools = new SecurityTools();
        this.conversationHistory = [];
    }

    async initialize() {
        console.clear();
        console.log(banner);
        
        // Check for API keys
        const provider = await this.config.selectProvider();
        this.aiProvider = new AIProvider(provider);
        
        if (!this.aiProvider.isConfigured()) {
            console.log(chalk.yellow('⚠️  No API key found for selected provider.'));
            await this.setupAPIKey();
        }
        
        console.log(chalk.green('✓ NubemSecurity initialized successfully!\n'));
    }

    async setupAPIKey() {
        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: 'Enter your API key:',
                mask: '*'
            }
        ]);
        
        this.aiProvider.setAPIKey(apiKey);
        await this.config.saveAPIKey(this.aiProvider.provider, apiKey);
    }

    async startConversation() {
        console.log(chalk.cyan('💬 Start chatting! Type /help for commands.\n'));
        
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

            // Process with AI
            await this.processInput(input);
        }
    }

    async handleCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        switch (cmd) {
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
                this.securityTools.showAvailableTools();
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
        console.log(chalk.white('  /help    - Show this help message'));
        console.log(chalk.white('  /clear   - Clear the screen'));
        console.log(chalk.white('  /reset   - Reset conversation history'));
        console.log(chalk.white('  /tools   - Show available security tools'));
        console.log(chalk.white('  /exit    - Exit NubemSecurity\n'));
    }

    async processInput(input) {
        const spinner = ora('Thinking...').start();
        
        try {
            // Check if input is asking about security tools
            const toolContext = this.securityTools.getToolContext(input);
            
            // Prepare the prompt with security context
            const enhancedPrompt = this.enhancePromptWithSecurity(input, toolContext);
            
            // Get AI response
            const response = await this.aiProvider.generateResponse(
                enhancedPrompt,
                this.conversationHistory
            );
            
            spinner.stop();
            
            // Display response
            console.log(chalk.blue(`\n${this.config.botName}:`));
            console.log(chalk.white(response));
            console.log();
            
            // Update conversation history
            this.conversationHistory.push({ role: 'user', content: input });
            this.conversationHistory.push({ role: 'assistant', content: response });
            
            // Keep history limited
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
            
        } catch (error) {
            spinner.stop();
            console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
        }
    }

    enhancePromptWithSecurity(input, toolContext) {
        let enhanced = input;
        
        if (toolContext) {
            enhanced = `
Context: User is asking about cybersecurity tools/techniques.
Relevant tools: ${toolContext}

User Query: ${input}

Please provide a detailed, technical response focusing on practical implementation and security best practices.
`;
        }
        
        return enhanced;
    }

    async run() {
        await this.initialize();
        await this.startConversation();
    }
}

// CLI Setup
program
    .name('nubemsec')
    .description('NubemSecurity - AI-powered cybersecurity assistant')
    .version('0.1.0');

program
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, grok, deepseek)')
    .option('-o, --offline', 'Run in offline mode with cached responses')
    .action(async (options) => {
        const app = new NubemSecurity();
        
        if (options.provider) {
            process.env.DEFAULT_PROVIDER = options.provider;
        }
        
        if (options.offline) {
            process.env.OFFLINE_MODE = 'true';
        }
        
        await app.run();
    });

program.parse();

// If no command provided, run interactive mode
if (!process.argv.slice(2).length) {
    const app = new NubemSecurity();
    app.run().catch(console.error);
}