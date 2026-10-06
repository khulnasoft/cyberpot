export interface AttackLog {
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

export interface HoneypotService {
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

export interface SystemStatus {
  status: string;
  version: string;
  totalAttacks: number;
  activeHoneypots: number;
  totalHoneypots: number;
  blackholedIPsCount: number;
  cpuLoad: string;
  memoryUsage: string;
  topCountries: { name: string; code: string; count: number }[];
  uptime: string;
}

export interface ElasticIndex {
  name: string;
  docsCount: number;
  health: string;
  status: string;
  size: string;
  primaryShards: number;
  replicaShards: number;
}

export interface SpiderFootResult {
  target: string;
  scanId: string;
  timestamp: string;
  summary: {
    riskScore: number;
    openPorts: number[];
    abuseScore: number;
    threatFeeds: string[];
  };
  modules: {
    name: string;
    status: string;
    findings: number;
    category: string;
    detail: string;
  }[];
}

export interface ThresholdRule {
  id: string;
  name: string;
  honeypotId: string; // 'all' or specific service id e.g. 'cowrie'
  thresholdLimit: number; // e.g. 20 attempts per minute
  timeWindowMinutes: number; // e.g. 1
  notifyEmail: boolean;
  emailAddress?: string;
  notifyBrowser: boolean;
  autoBlackhole: boolean;
  notifyWebhook: boolean;
  webhookUrl?: string;
  enabled: boolean;
  createdTime: string;
  triggerCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  honeypotId: string;
  honeypotName: string;
  currentAttempts: number;
  thresholdLimit: number;
  timestamp: string;
  actionsTaken: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AttackVectorAnalysis {
  vectorName: string;
  category: string;
  count: number;
  percentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  topService: string;
  mitreTechnique: string;
  samplePayload: string;
  topCredentials?: string[];
}


