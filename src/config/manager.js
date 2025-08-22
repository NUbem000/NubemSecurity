/**
 * Configuration Manager
 * Handles settings, API keys, and user preferences
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class ConfigManager {
    constructor() {
        this.configDir = path.join(os.homedir(), '.nubemsecurity');
        this.configFile = path.join(this.configDir, 'config.json');
        this.cacheFile = path.join(this.configDir, 'cache.json');
        
        this.ensureConfigDir();
        this.loadConfig();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    loadConfig() {
        if (fs.existsSync(this.configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.config = config;
            } catch (error) {
                console.log(chalk.yellow('⚠️  Config file corrupted. Creating new one.'));
                this.config = this.getDefaultConfig();
                this.saveConfig();
            }
        } else {
            this.config = this.getDefaultConfig();
            this.saveConfig();
        }
        
        // Apply config to environment
        this.applyConfig();
    }

    getDefaultConfig() {
        return {
            provider: process.env.DEFAULT_PROVIDER || 'openai',
            botName: process.env.BOT_NAME || 'NubemSec',
            userName: process.env.USER_NAME || 'Hacker',
            apiKeys: {
                openai: process.env.OPENAI_API_KEY || '',
                gemini: process.env.GOOGLE_AI_API_KEY || '',
                grok: process.env.GROK_API_KEY || '',
                deepseek: process.env.DEEPSEEK_API_KEY || ''
            },
            settings: {
                offlineMode: process.env.OFFLINE_MODE === 'true',
                cacheEnabled: process.env.CACHE_ENABLED !== 'false',
                logLevel: process.env.LOG_LEVEL || 'info',
                maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
                temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
                timeout: parseInt(process.env.TIMEOUT || '30000')
            },
            theme: {
                primaryColor: 'cyan',
                successColor: 'green',
                warningColor: 'yellow',
                errorColor: 'red'
            }
        };
    }

    applyConfig() {
        // Apply API keys to environment
        if (this.config.apiKeys.openai) {
            process.env.OPENAI_API_KEY = this.config.apiKeys.openai;
        }
        if (this.config.apiKeys.gemini) {
            process.env.GOOGLE_AI_API_KEY = this.config.apiKeys.gemini;
        }
        if (this.config.apiKeys.grok) {
            process.env.GROK_API_KEY = this.config.apiKeys.grok;
        }
        if (this.config.apiKeys.deepseek) {
            process.env.DEEPSEEK_API_KEY = this.config.apiKeys.deepseek;
        }
        
        // Apply settings
        process.env.DEFAULT_PROVIDER = this.config.provider;
        process.env.BOT_NAME = this.config.botName;
        process.env.USER_NAME = this.config.userName;
        process.env.OFFLINE_MODE = this.config.settings.offlineMode.toString();
        process.env.CACHE_ENABLED = this.config.settings.cacheEnabled.toString();
        process.env.LOG_LEVEL = this.config.settings.logLevel;
        process.env.MAX_TOKENS = this.config.settings.maxTokens.toString();
        process.env.TEMPERATURE = this.config.settings.temperature.toString();
        process.env.TIMEOUT = this.config.settings.timeout.toString();
    }

    saveConfig() {
        fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
    }

    async selectProvider() {
        const availableProviders = [];
        
        if (this.config.apiKeys.openai) {
            availableProviders.push('openai');
        }
        if (this.config.apiKeys.gemini) {
            availableProviders.push('gemini');
        }
        if (this.config.apiKeys.grok) {
            availableProviders.push('grok');
        }
        if (this.config.apiKeys.deepseek) {
            availableProviders.push('deepseek');
        }
        
        // If only one provider is configured, use it
        if (availableProviders.length === 1) {
            this.config.provider = availableProviders[0];
            return availableProviders[0];
        }
        
        // If multiple providers are available, let user choose
        if (availableProviders.length > 1) {
            const { provider } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'provider',
                    message: 'Select AI provider:',
                    choices: availableProviders,
                    default: this.config.provider
                }
            ]);
            
            this.config.provider = provider;
            this.saveConfig();
            return provider;
        }
        
        // If no providers are configured, ask which one to set up
        const { provider } = await inquirer.prompt([
            {
                type: 'list',
                name: 'provider',
                message: 'No API keys configured. Select provider to set up:',
                choices: ['openai', 'gemini', 'deepseek', 'grok']
            }
        ]);
        
        this.config.provider = provider;
        return provider;
    }

    async saveAPIKey(provider, apiKey) {
        this.config.apiKeys[provider] = apiKey;
        this.saveConfig();
        this.applyConfig();
        
        console.log(chalk.green(`✓ API key saved for ${provider}`));
    }

    get botName() {
        return this.config.botName;
    }

    get userName() {
        return this.config.userName;
    }

    // Cache management
    loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
            } catch (error) {
                return {};
            }
        }
        return {};
    }

    saveCache(cache) {
        fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
    }

    getCachedResponse(prompt) {
        if (!this.config.settings.cacheEnabled) return null;
        
        const cache = this.loadCache();
        const hash = this.hashPrompt(prompt);
        
        if (cache[hash] && cache[hash].timestamp > Date.now() - 86400000) { // 24 hours
            return cache[hash].response;
        }
        
        return null;
    }

    setCachedResponse(prompt, response) {
        if (!this.config.settings.cacheEnabled) return;
        
        const cache = this.loadCache();
        const hash = this.hashPrompt(prompt);
        
        cache[hash] = {
            response: response,
            timestamp: Date.now()
        };
        
        // Limit cache size
        const keys = Object.keys(cache);
        if (keys.length > 100) {
            // Remove oldest entries
            keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            keys.slice(0, 20).forEach(key => delete cache[key]);
        }
        
        this.saveCache(cache);
    }

    hashPrompt(prompt) {
        // Simple hash function for caching
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}