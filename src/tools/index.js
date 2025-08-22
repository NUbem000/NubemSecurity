/**
 * Security Tools Module
 * Provides context and information about cybersecurity tools
 */

import chalk from 'chalk';

export class SecurityTools {
    constructor() {
        this.tools = {
            reconnaissance: {
                nmap: 'Network discovery and security auditing',
                masscan: 'Fast port scanner',
                shodan: 'Search engine for Internet-connected devices',
                recon_ng: 'Web reconnaissance framework',
                theHarvester: 'Email, subdomain and people names harvester',
                amass: 'In-depth attack surface mapping'
            },
            exploitation: {
                metasploit: 'Penetration testing framework',
                exploitdb: 'Archive of public exploits',
                sqlmap: 'Automatic SQL injection tool',
                beef: 'Browser Exploitation Framework',
                empire: 'Post-exploitation framework',
                cobalt_strike: 'Adversary simulation software'
            },
            web_testing: {
                burpsuite: 'Web vulnerability scanner',
                owasp_zap: 'Web application security scanner',
                nikto: 'Web server scanner',
                dirb: 'Web content scanner',
                gobuster: 'Directory/file & DNS busting tool',
                wpscan: 'WordPress vulnerability scanner'
            },
            password_attacks: {
                john: 'John the Ripper password cracker',
                hashcat: 'Advanced password recovery',
                hydra: 'Network login cracker',
                medusa: 'Parallel password cracker',
                cewl: 'Custom wordlist generator',
                crunch: 'Wordlist generator'
            },
            wireless: {
                aircrack_ng: 'WiFi security auditing',
                wifite: 'Automated wireless attack tool',
                kismet: 'Wireless network detector',
                reaver: 'WPS attack tool',
                bettercap: 'Network attack and monitoring',
                fluxion: 'Social engineering wireless tool'
            },
            forensics: {
                volatility: 'Memory forensics framework',
                autopsy: 'Digital forensics platform',
                foremost: 'File recovery tool',
                binwalk: 'Firmware analysis tool',
                exiftool: 'Metadata reader/writer',
                steghide: 'Steganography tool'
            },
            reverse_engineering: {
                ghidra: 'Software reverse engineering',
                radare2: 'Reverse engineering framework',
                gdb: 'GNU debugger',
                objdump: 'Object file information',
                strings: 'Extract strings from files',
                ida_pro: 'Interactive disassembler'
            },
            social_engineering: {
                setoolkit: 'Social Engineering Toolkit',
                gophish: 'Phishing framework',
                king_phisher: 'Phishing campaign toolkit',
                maltego: 'OSINT and graphical link analysis',
                spiderfoot: 'OSINT automation tool',
                recon_dog: 'Information gathering tool'
            }
        };
    }

    getToolContext(input) {
        const lowerInput = input.toLowerCase();
        const relevantTools = [];

        // Check for tool mentions
        for (const [category, tools] of Object.entries(this.tools)) {
            for (const [toolName, description] of Object.entries(tools)) {
                if (lowerInput.includes(toolName.replace('_', ' ')) || 
                    lowerInput.includes(toolName.replace('_', '-'))) {
                    relevantTools.push(`${toolName} (${category}): ${description}`);
                }
            }
        }

        // Check for category keywords
        const categoryKeywords = {
            reconnaissance: ['recon', 'scanning', 'discovery', 'enumeration', 'footprinting'],
            exploitation: ['exploit', 'vulnerability', 'payload', 'shellcode', 'rce'],
            web_testing: ['web', 'http', 'website', 'webapp', 'api', 'rest'],
            password_attacks: ['password', 'crack', 'hash', 'bruteforce', 'wordlist'],
            wireless: ['wifi', 'wireless', 'wpa', 'wep', 'access point', 'ap'],
            forensics: ['forensic', 'memory', 'disk', 'evidence', 'artifact'],
            reverse_engineering: ['reverse', 'malware', 'binary', 'assembly', 'disassemble'],
            social_engineering: ['phishing', 'social', 'osint', 'spear', 'human']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                const categoryTools = Object.entries(this.tools[category])
                    .map(([name, desc]) => `${name}: ${desc}`)
                    .join(', ');
                relevantTools.push(`Category ${category}: ${categoryTools}`);
            }
        }

        return relevantTools.length > 0 ? relevantTools.join('; ') : null;
    }

    showAvailableTools() {
        console.log(chalk.cyan('\n🛠️  Available Security Tools:\n'));
        
        for (const [category, tools] of Object.entries(this.tools)) {
            console.log(chalk.yellow(`📁 ${category.replace('_', ' ').toUpperCase()}`));
            
            for (const [toolName, description] of Object.entries(tools)) {
                console.log(chalk.white(`  • ${chalk.green(toolName.padEnd(20))} - ${description}`));
            }
            console.log();
        }
    }

    async executeToolCommand(tool, args) {
        // This is a placeholder for actual tool execution
        // In a real implementation, this would interface with actual tools
        console.log(chalk.yellow(`\n⚠️  Tool execution simulation for: ${tool}`));
        console.log(chalk.gray(`Arguments: ${args}`));
        console.log(chalk.red('Note: Actual tool execution requires system integration.\n'));
        
        // Return simulated output based on tool
        const simulatedOutputs = {
            nmap: `Starting Nmap scan...
Discovered open ports:
  22/tcp   open  ssh
  80/tcp   open  http
  443/tcp  open  https
  3306/tcp open  mysql`,
            
            dirb: `Starting directory enumeration...
Found directories:
  /admin/ (403)
  /api/ (200)
  /backup/ (403)
  /config/ (403)`,
            
            sqlmap: `Testing for SQL injection...
Parameter 'id' appears to be vulnerable
Database: MySQL 5.7
Available databases: [information_schema, webapp, users]`
        };
        
        return simulatedOutputs[tool] || 'Tool execution completed (simulated).';
    }
}