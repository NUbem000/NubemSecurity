# 🔑 NubemSecurity API Configuration

## ✅ Current Status

The NubemSecurity CLI is now **fully configured** with API keys from the local machine's `.env` file.

## 📋 Configured API Keys

The following API keys have been loaded from `/home/david/.env`:

1. **OpenAI API** ✅
   - Provider: OpenAI GPT-4
   - Environment Variable: `OPENAI_API_KEY`
   - Status: Configured and ready

2. **Google Gemini API** ✅
   - Provider: Google Gemini Pro
   - Environment Variable: `GEMINI_API_KEY`
   - Status: Configured and ready

3. **Anthropic Claude API** ✅
   - Provider: Anthropic Claude
   - Environment Variable: `ANTHROPIC_API_KEY`
   - Status: Configured (not yet integrated in CLI)

## 📁 Configuration Files

- **Primary .env**: `/home/david/NubemSecurity/.env`
- **Backup .env**: `/home/david/.env`
- **Config Directory**: `~/.nubemsecurity/`
- **Launcher Script**: `/usr/local/bin/nubemsec`

## 🚀 Usage

### Start with Default Provider (OpenAI)
```bash
nubemsec
```

### Use Specific Provider
```bash
# Use Gemini
nubemsec --provider gemini

# Use OpenAI explicitly
nubemsec --provider openai
```

### Start API Server
```bash
nubemsec --server
```

### Open Web Interface
```bash
nubemsec --web
```

## 🔧 How It Works

1. **Automatic Loading**: The CLI automatically loads API keys from `.env` file
2. **Multiple Sources**: Checks both project directory and home directory for `.env`
3. **Provider Selection**: Can switch between providers using `--provider` flag
4. **No Manual Configuration**: No need to manually enter API keys

## 📝 Environment Variables

The CLI reads these environment variables:
- `OPENAI_API_KEY` - For OpenAI GPT models
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - For Google Gemini
- `ANTHROPIC_API_KEY` - For Claude (future integration)

## 🧪 Testing

Test the configuration:
```bash
# Check API key status
node /home/david/NubemSecurity/test-env.js

# Test OpenAI
echo "What is XSS?" | nubemsec --provider openai

# Test Gemini
echo "Explain SQL injection" | nubemsec --provider gemini
```

## 🔒 Security Notes

- API keys are stored in `.env` file with restricted permissions
- Keys are never logged or displayed in full
- Keys are loaded at runtime, not hardcoded
- `.env` file is excluded from git repository

## 🛠️ Troubleshooting

If API keys are not working:

1. Check `.env` file exists:
   ```bash
   ls -la /home/david/NubemSecurity/.env
   ```

2. Verify keys are set:
   ```bash
   grep API_KEY /home/david/NubemSecurity/.env
   ```

3. Test environment loading:
   ```bash
   node /home/david/NubemSecurity/test-env.js
   ```

4. Check permissions:
   ```bash
   chmod 600 /home/david/NubemSecurity/.env
   ```

## ✨ Features Enabled

With API keys configured, you can now:
- 💬 Chat with AI about cybersecurity topics
- 🔍 Get detailed explanations of security tools
- 📚 Learn about vulnerabilities and exploits
- 🛠️ Get command examples and best practices
- 🤖 Switch between different AI models
- 🌐 Access via CLI, API, or web interface

---

**Configuration completed successfully!** The NubemSecurity CLI is ready to use with your API keys. 🎉