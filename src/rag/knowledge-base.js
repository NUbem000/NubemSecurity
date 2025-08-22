/**
 * Security Knowledge Base Module
 * Manages security-specific knowledge and tool information
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export class SecurityKnowledgeBase {
    constructor() {
        this.tools = new Map();
        this.exploits = new Map();
        this.cves = new Map();
        this.techniques = new Map();
        this.initialized = false;
        this.dataDir = path.join(process.cwd(), 'data', 'knowledge');
    }

    async initialize() {
        if (this.initialized) return;

        console.log(chalk.cyan('📚 Initializing Security Knowledge Base...'));
        
        // Ensure data directory exists
        await fs.mkdir(this.dataDir, { recursive: true });
        
        // Load base knowledge
        await this.loadBaseKnowledge();
        
        this.initialized = true;
        console.log(chalk.green('✅ Knowledge Base initialized'));
    }

    /**
     * Load base security knowledge
     */
    async loadBaseKnowledge() {
        // Security tools catalog
        this.tools = new Map([
            ['nmap', {
                name: 'Nmap',
                category: 'reconnaissance',
                description: 'Network discovery and security auditing',
                commands: [
                    'nmap -sS <target> # TCP SYN scan',
                    'nmap -sV <target> # Service version detection',
                    'nmap -O <target> # OS detection',
                    'nmap -A <target> # Aggressive scan',
                    'nmap -p- <target> # Scan all ports'
                ],
                flags: {
                    '-sS': 'TCP SYN scan (stealth)',
                    '-sT': 'TCP connect scan',
                    '-sU': 'UDP scan',
                    '-sV': 'Service version detection',
                    '-O': 'OS detection',
                    '-A': 'Aggressive scan',
                    '-p': 'Port specification',
                    '-Pn': 'Skip host discovery'
                }
            }],
            ['metasploit', {
                name: 'Metasploit Framework',
                category: 'exploitation',
                description: 'Penetration testing framework',
                commands: [
                    'msfconsole # Start Metasploit console',
                    'search <term> # Search for exploits',
                    'use <exploit> # Select exploit module',
                    'set RHOSTS <target> # Set target',
                    'exploit # Run the exploit'
                ],
                modules: ['exploits', 'auxiliary', 'post', 'payloads', 'encoders', 'nops']
            }],
            ['sqlmap', {
                name: 'SQLMap',
                category: 'web_exploitation',
                description: 'Automatic SQL injection tool',
                commands: [
                    'sqlmap -u <url> # Basic URL test',
                    'sqlmap -u <url> --dbs # Enumerate databases',
                    'sqlmap -u <url> -D <db> --tables # Enumerate tables',
                    'sqlmap -u <url> -D <db> -T <table> --dump # Dump table data',
                    'sqlmap -r request.txt # Use saved request'
                ],
                techniques: ['boolean-blind', 'time-blind', 'error-based', 'union-query', 'stacked-queries']
            }],
            ['burpsuite', {
                name: 'Burp Suite',
                category: 'web_testing',
                description: 'Web application security testing',
                features: ['proxy', 'scanner', 'intruder', 'repeater', 'decoder', 'comparer'],
                extensions: ['Active Scan++', 'Autorize', 'JWT Editor', 'Turbo Intruder']
            }],
            ['hydra', {
                name: 'Hydra',
                category: 'password_attacks',
                description: 'Network login cracker',
                commands: [
                    'hydra -l <user> -P <wordlist> <target> ssh',
                    'hydra -L users.txt -P pass.txt <target> ftp',
                    'hydra -l admin -P wordlist.txt <target> http-post-form "/login:user=^USER^&pass=^PASS^:Failed"'
                ],
                protocols: ['ssh', 'ftp', 'http', 'https', 'smb', 'rdp', 'vnc', 'telnet']
            }],
            ['john', {
                name: 'John the Ripper',
                category: 'password_attacks',
                description: 'Password cracker',
                commands: [
                    'john hash.txt # Basic crack',
                    'john --wordlist=rockyou.txt hash.txt # Wordlist attack',
                    'john --show hash.txt # Show cracked passwords',
                    'john --format=raw-md5 hash.txt # Specify hash format'
                ],
                formats: ['md5', 'sha1', 'sha256', 'sha512', 'bcrypt', 'ntlm', 'mysql']
            }],
            ['aircrack-ng', {
                name: 'Aircrack-ng',
                category: 'wireless',
                description: 'WiFi security auditing',
                commands: [
                    'airmon-ng start wlan0 # Enable monitor mode',
                    'airodump-ng wlan0mon # Scan for networks',
                    'airodump-ng -c <channel> --bssid <bssid> -w capture wlan0mon',
                    'aireplay-ng -0 10 -a <bssid> -c <client> wlan0mon # Deauth attack',
                    'aircrack-ng -w wordlist.txt capture.cap # Crack handshake'
                ]
            }],
            ['wireshark', {
                name: 'Wireshark',
                category: 'network_analysis',
                description: 'Network protocol analyzer',
                filters: [
                    'tcp.port == 80 # HTTP traffic',
                    'ip.addr == 192.168.1.1 # Specific IP',
                    'http.request # HTTP requests only',
                    'tcp.flags.syn == 1 # SYN packets',
                    'dns # DNS traffic'
                ]
            }]
        ]);

        // Common attack techniques
        this.techniques = new Map([
            ['sql_injection', {
                name: 'SQL Injection',
                category: 'web',
                description: 'Inject malicious SQL code',
                payloads: [
                    "' OR '1'='1",
                    "' OR '1'='1' --",
                    "' UNION SELECT NULL--",
                    "1' AND '1' = '2",
                    "admin'--"
                ],
                prevention: [
                    'Use parameterized queries',
                    'Input validation',
                    'Escape special characters',
                    'Least privilege database access'
                ]
            }],
            ['xss', {
                name: 'Cross-Site Scripting',
                category: 'web',
                description: 'Inject client-side scripts',
                payloads: [
                    '<script>alert(1)</script>',
                    '<img src=x onerror=alert(1)>',
                    '<svg onload=alert(1)>',
                    'javascript:alert(1)',
                    '<iframe src=javascript:alert(1)>'
                ],
                prevention: [
                    'Output encoding',
                    'Content Security Policy',
                    'Input validation',
                    'HTTPOnly cookies'
                ]
            }],
            ['privilege_escalation', {
                name: 'Privilege Escalation',
                category: 'system',
                description: 'Gain elevated access',
                techniques: [
                    'SUID/SGID binaries',
                    'Kernel exploits',
                    'Sudo misconfigurations',
                    'Cron jobs',
                    'Service exploits'
                ],
                tools: ['LinPEAS', 'LinEnum', 'Windows-Exploit-Suggester']
            }]
        ]);
    }

    /**
     * Detect tools mentioned in query
     */
    detectTools(query) {
        const lowerQuery = query.toLowerCase();
        const detected = [];

        for (const [toolKey, toolData] of this.tools) {
            if (lowerQuery.includes(toolKey) || 
                lowerQuery.includes(toolData.name.toLowerCase())) {
                detected.push(toolKey);
            }
        }

        return detected;
    }

    /**
     * Get tool information
     */
    getToolInfo(toolName) {
        return this.tools.get(toolName.toLowerCase());
    }

    /**
     * Get attack technique information
     */
    getTechniqueInfo(technique) {
        return this.techniques.get(technique.toLowerCase());
    }

    /**
     * Fetch CVE information (mock implementation)
     */
    async fetchCVE(cveId) {
        // In production, this would fetch from NVD API
        console.log(chalk.cyan(`📋 Fetching CVE: ${cveId}`));
        
        // Mock CVE data
        return {
            id: cveId,
            description: `Vulnerability in component X allowing remote code execution`,
            cvss: 9.8,
            published: '2024-01-15',
            modified: '2024-01-20',
            references: ['https://nvd.nist.gov/vuln/detail/' + cveId]
        };
    }

    /**
     * Search ExploitDB (mock implementation)
     */
    async searchExploitDB(query) {
        console.log(chalk.cyan(`🔍 Searching ExploitDB: ${query}`));
        
        // Mock exploit data
        return [
            {
                id: 'EDB-50000',
                title: 'Example Service 1.0 - Remote Code Execution',
                platform: 'linux',
                type: 'remote',
                author: 'researcher',
                date: '2024-01-01'
            }
        ];
    }

    /**
     * Get command examples for a specific tool
     */
    getToolCommands(toolName, scenario = 'basic') {
        const tool = this.tools.get(toolName.toLowerCase());
        if (!tool) return null;

        const scenarios = {
            'basic': tool.commands ? tool.commands.slice(0, 2) : [],
            'advanced': tool.commands || [],
            'all': tool.commands || []
        };

        return scenarios[scenario] || scenarios.basic;
    }

    /**
     * Update knowledge base with new data
     */
    async update(data) {
        if (data.tools) {
            for (const [name, info] of Object.entries(data.tools)) {
                this.tools.set(name, info);
            }
        }

        if (data.techniques) {
            for (const [name, info] of Object.entries(data.techniques)) {
                this.techniques.set(name, info);
            }
        }

        if (data.exploits) {
            for (const exploit of data.exploits) {
                this.exploits.set(exploit.id, exploit);
            }
        }

        console.log(chalk.green('✅ Knowledge base updated'));
    }

    /**
     * Export knowledge base to JSON
     */
    async export(filePath) {
        const data = {
            tools: Object.fromEntries(this.tools),
            techniques: Object.fromEntries(this.techniques),
            exploits: Object.fromEntries(this.exploits),
            cves: Object.fromEntries(this.cves),
            timestamp: new Date().toISOString()
        };

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(chalk.green(`✅ Knowledge base exported to ${filePath}`));
    }

    /**
     * Import knowledge base from JSON
     */
    async import(filePath) {
        const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        
        if (data.tools) {
            this.tools = new Map(Object.entries(data.tools));
        }
        if (data.techniques) {
            this.techniques = new Map(Object.entries(data.techniques));
        }
        if (data.exploits) {
            this.exploits = new Map(Object.entries(data.exploits));
        }
        if (data.cves) {
            this.cves = new Map(Object.entries(data.cves));
        }

        console.log(chalk.green(`✅ Knowledge base imported from ${filePath}`));
    }
}