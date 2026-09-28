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
