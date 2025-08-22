#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 NubemSecurity Environment Configuration');
console.log('==========================================\n');

// Check for API keys
const providers = [
    { name: 'OpenAI', key: 'OPENAI_API_KEY', env: process.env.OPENAI_API_KEY },
    { name: 'Gemini', key: 'GEMINI_API_KEY', env: process.env.GEMINI_API_KEY },
    { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', env: process.env.ANTHROPIC_API_KEY }
];

console.log('📋 API Keys Status:');
providers.forEach(provider => {
    if (provider.env) {
        const masked = provider.env.substring(0, 10) + '...' + provider.env.substring(provider.env.length - 4);
        console.log(`✅ ${provider.name}: Configured (${masked})`);
    } else {
        console.log(`❌ ${provider.name}: Not configured`);
    }
});

console.log('\n📁 Configuration Files:');
console.log(`✅ .env file: ${fs.existsSync(join(__dirname, '.env')) ? 'Found' : 'Not found'}`);
console.log(`✅ Config dir: ${fs.existsSync('/home/david/.nubemsecurity') ? 'Exists' : 'Not found'}`);

console.log('\n🚀 Ready to use NubemSecurity with:');
providers.forEach(provider => {
    if (provider.env) {
        console.log(`   - ${provider.name} API`);
    }
});

console.log('\n💡 You can now run:');
console.log('   nubemsec              # Interactive CLI with OpenAI');
console.log('   nubemsec -p gemini    # Use Gemini provider');
console.log('   nubemsec --server     # Start API server');