⚠️ **Development Status**

This is a fork of KaliGPT, adapted as NubemSecurity for the NubemGenesis ecosystem.  
The project is currently being customized and enhanced with additional security features.

**Note:** This is an experimental fork under active development.  
Original project by [@amarokdevs](https://github.com/amarokdevs/KaliGPT)

Contributions and feedback are welcome! 💻🚀

---

# NubemSecurity 🛡️

NubemSecurity is a lightweight terminal AI assistant for cybersecurity, forked from KaliGPT and enhanced by NubemGenesis.  
Supports OpenAI, Google Gemini, Grok AI, DeepSeek — all with your own API key.

## 📦 Features
- Any API Key support (auto-detect)
- Custom bot & user names
- Works offline with cached settings
- Cross-platform CLI (Windows, macOS, Linux)
- Commands: `/reset`, `/clear`, `/exit`

### 🐧 Linux / macOS

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API key from at least one provider (OpenAI, Gemini, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/NubemSecurity.git
cd NubemSecurity

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env and add your API keys
nano .env

# Run NubemSecurity
npm start
```

### Quick Start

```bash
# Run with specific provider
node src/index.js --provider openai

# Run in offline mode (cached responses)
node src/index.js --offline

# Show help
node src/index.js --help
```

## 🔧 Configuration

NubemSecurity stores configuration in `~/.nubemsecurity/config.json`. You can edit this file directly or use the interactive setup.

## 🛠️ Available Commands

Once running, you can use these commands:
- `/help` - Show available commands
- `/tools` - List all security tools
- `/clear` - Clear the screen
- `/reset` - Reset conversation
- `/exit` - Exit the application

## 🔒 Security Tools

NubemSecurity provides intelligent assistance with:
- **Reconnaissance**: nmap, masscan, shodan, recon-ng
- **Exploitation**: metasploit, sqlmap, beef
- **Web Testing**: burpsuite, OWASP ZAP, nikto
- **Password Attacks**: john, hashcat, hydra
- **Wireless**: aircrack-ng, wifite, kismet
- **Forensics**: volatility, autopsy, binwalk
- **Reverse Engineering**: ghidra, radare2, gdb
- **Social Engineering**: SET, gophish, maltego

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Credits

- Original KaliGPT by [@amarokdevs](https://github.com/amarokdevs/KaliGPT)
- Enhanced for NubemGenesis ecosystem

NubemSecurity will be compatible with all major Linux distributions, not just Kali Linux
