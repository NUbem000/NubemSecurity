/**
 * AI Provider Manager
 * Handles multiple AI providers (OpenAI, Gemini, Grok, DeepSeek)
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIProvider {
    constructor(provider = process.env.DEFAULT_PROVIDER || 'openai') {
        this.provider = provider;
        this.client = null;
        this.apiKey = null;
        this.initializeProvider();
    }

    initializeProvider() {
        switch (this.provider) {
            case 'openai':
                this.apiKey = process.env.OPENAI_API_KEY;
                if (this.apiKey) {
                    this.client = new OpenAI({ apiKey: this.apiKey });
                }
                break;
            
            case 'gemini':
                // Support multiple environment variable names for Gemini
                this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
                if (this.apiKey) {
                    this.client = new GoogleGenerativeAI(this.apiKey);
                }
                break;
            
            case 'grok':
                // Grok implementation (when available)
                this.apiKey = process.env.GROK_API_KEY;
                console.log('Grok provider selected (implementation pending)');
                break;
            
            case 'deepseek':
                // DeepSeek uses OpenAI-compatible API
                this.apiKey = process.env.DEEPSEEK_API_KEY;
                if (this.apiKey) {
                    this.client = new OpenAI({
                        apiKey: this.apiKey,
                        baseURL: 'https://api.deepseek.com/v1'
                    });
                }
                break;
            
            default:
                throw new Error(`Unknown provider: ${this.provider}`);
        }
    }

    isConfigured() {
        return this.apiKey !== null && this.apiKey !== undefined && this.apiKey !== '';
    }

    setAPIKey(apiKey) {
        this.apiKey = apiKey;
        this.initializeProvider();
    }

    async generateResponse(prompt, history = []) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured');
        }

        const systemPrompt = `You are NubemSecurity, an advanced AI cybersecurity assistant specialized in:
- Penetration testing and ethical hacking
- Security vulnerability analysis
- Network security and monitoring
- Malware analysis and reverse engineering
- Security tools (Nmap, Metasploit, Burp Suite, etc.)
- Incident response and forensics
- Security best practices and compliance

Always provide technical, accurate, and actionable responses. Include command examples when relevant.
Focus on ethical hacking and defensive security only.`;

        try {
            switch (this.provider) {
                case 'openai':
                case 'deepseek':
                    return await this.generateOpenAIResponse(prompt, history, systemPrompt);
                
                case 'gemini':
                    return await this.generateGeminiResponse(prompt, history, systemPrompt);
                
                case 'grok':
                    return 'Grok integration coming soon. Please use OpenAI or Gemini for now.';
                
                default:
                    throw new Error('Provider not implemented');
            }
        } catch (error) {
            throw new Error(`AI Provider Error: ${error.message}`);
        }
    }

    async generateOpenAIResponse(prompt, history, systemPrompt) {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: prompt }
        ];

        const completion = await this.client.chat.completions.create({
            model: this.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4-turbo-preview',
            messages: messages,
            max_tokens: parseInt(process.env.MAX_TOKENS || '2000'),
            temperature: parseFloat(process.env.TEMPERATURE || '0.7')
        });

        return completion.choices[0].message.content;
    }

    async generateGeminiResponse(prompt, history, systemPrompt) {
        const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
        
        // Prepare conversation context
        let fullPrompt = systemPrompt + '\n\n';
        
        // Add history
        history.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        
        fullPrompt += `User: ${prompt}\nAssistant:`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    }
}