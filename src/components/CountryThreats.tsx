import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  ShieldAlert, 
  TrendingUp, 
  Crosshair, 
  Ban, 
  ChevronRight, 
  ExternalLink,
  Layers,
  Zap,
  Filter,
  BarChart2,
  X
} from 'lucide-react';
import { AttackLog } from '../types';

interface CountryThreatsProps {
  attacks: AttackLog[];
  onOpenBlackholeModal?: () => void;
}

interface CountryMeta {
  code: string;
  name: string;
  region: string;
  flag: string;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  primaryTarget: string;
  threatActorGroup?: string;
  knownSubnets: string;
}

const COUNTRY_METADATA: Record<string, CountryMeta> = {
  BD: { code: 'BD', name: 'Bangladesh', region: 'Asia-Pacific', flag: '🇧🇩', riskTier: 'HIGH', primaryTarget: 'Cowrie (SSH) / Tanner', threatActorGroup: 'BGD e-GOV CIRT Watch / Local Botnet Scrapers', knownSubnets: '103.205.0.0/16, 118.179.0.0/16, 203.76.0.0/16' },
  CN: { code: 'CN', name: 'China', region: 'Asia-Pacific', flag: '🇨🇳', riskTier: 'CRITICAL', primaryTarget: 'Dionaea (SMB / FTP)', threatActorGroup: 'APT41 / Mustang Panda', knownSubnets: '183.220.0.0/16, 221.228.0.0/16' },
  RU: { code: 'RU', name: 'Russia', region: 'Eastern Europe', flag: '🇷🇺', riskTier: 'CRITICAL', primaryTarget: 'Cowrie (SSH / Telnet)', threatActorGroup: 'Fancy Bear / Sandworm', knownSubnets: '185.220.100.0/22, 193.142.0.0/16' },
  US: { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸', riskTier: 'HIGH', primaryTarget: 'Tanner (Web Apps)', threatActorGroup: 'Commercial Cloud Scrapers / Tor', knownSubnets: '45.155.200.0/22, 104.244.0.0/16' },
  BR: { code: 'BR', name: 'Brazil', region: 'South America', flag: '🇧🇷', riskTier: 'HIGH', primaryTarget: 'Heralding (Auth / RDP)', threatActorGroup: 'Grandoreiro / Banking Botnets', knownSubnets: '177.12.0.0/16, 187.32.0.0/16' },
  DE: { code: 'DE', name: 'Germany', region: 'Western Europe', flag: '🇩🇪', riskTier: 'MEDIUM', primaryTarget: 'Conpot (ICS / SCADA)', threatActorGroup: 'Hetzner Scanner Bots', knownSubnets: '88.198.0.0/16, 148.251.0.0/16' },
  NL: { code: 'NL', name: 'Netherlands', region: 'Western Europe', flag: '🇳🇱', riskTier: 'HIGH', primaryTarget: 'Endlessh (SSH Tarpit)', threatActorGroup: 'Tor Exit Nodes / Bulletproof Hosting', knownSubnets: '185.191.0.0/16, 195.206.0.0/16' },
  IN: { code: 'IN', name: 'India', region: 'Asia-Pacific', flag: '🇮🇳', riskTier: 'MEDIUM', primaryTarget: 'ADBHoney (Android Debug)', threatActorGroup: 'SideWinder / IoT Scanner Fleets', knownSubnets: '103.107.0.0/16, 117.200.0.0/16' },
  VN: { code: 'VN', name: 'Vietnam', region: 'Asia-Pacific', flag: '🇻🇳', riskTier: 'HIGH', primaryTarget: 'Elasticpot (Elasticsearch)', threatActorGroup: 'OceanLotus / Mirai Botnets', knownSubnets: '14.225.0.0/16, 113.160.0.0/16' },
  UA: { code: 'UA', name: 'Ukraine', region: 'Eastern Europe', flag: '🇺🇦', riskTier: 'HIGH', primaryTarget: 'Glutton (Sinkhole)', threatActorGroup: 'Gamaredon / Volunteer IT Fleets', knownSubnets: '91.200.0.0/16, 194.44.0.0/16' },
  IR: { code: 'IR', name: 'Iran', region: 'Middle East', flag: '🇮🇷', riskTier: 'CRITICAL', primaryTarget: 'Conpot (Industrial Siemens)', threatActorGroup: 'MuddyWater / Charming Kitten', knownSubnets: '185.143.0.0/16, 5.160.0.0/16' }
};

export const CountryThreats: React.FC<CountryThreatsProps> = ({ attacks, onOpenBlackholeModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [activeCountryCode, setActiveCountryCode] = useState<string | null>(null);

  // Group attacks by country code
  const countryStats: Record<string, {
    code: string;
    name: string;
    count: number;
    cities: Set<string>;
    ips: Set<string>;
    services: Record<string, number>;
    severities: Record<string, number>;
    credentialsCaptured: { user?: string; pass?: string }[];
    recentPayloads: string[];
  }> = {};

  attacks.forEach((log) => {
    const code = log.countryCode || 'UNKNOWN';
    if (!countryStats[code]) {
      countryStats[code] = {
        code,
        name: log.country || 'Unknown Country',
        count: 0,
        cities: new Set(),
        ips: new Set(),
        services: {},
        severities: {},
        credentialsCaptured: [],
        recentPayloads: []
      };
    }

    const c = countryStats[code];
    c.count += 1;
    if (log.city) c.cities.add(log.city);
    if (log.srcIp) c.ips.add(log.srcIp);
    c.services[log.service] = (c.services[log.service] || 0) + 1;
    c.severities[log.severity] = (c.severities[log.severity] || 0) + 1;
    if (log.credentials?.user) {
      c.credentialsCaptured.push(log.credentials);
    }
    if (log.payload && !c.recentPayloads.includes(log.payload) && c.recentPayloads.length < 5) {
      c.recentPayloads.push(log.payload);
    }
  });

  const sortedCountries = Object.values(countryStats).sort((a, b) => b.count - a.count);
  const totalAttacksCount = attacks.length || 1;

  // Filtered country list
  const filteredCountries = sortedCountries.filter((c) => {
    const meta = COUNTRY_METADATA[c.code];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedRegion !== 'all' && meta?.region !== selectedRegion) {
      return false;
    }
    if (selectedRisk !== 'all' && meta?.riskTier !== selectedRisk) {
      return false;
    }
    return true;
  });

  const activeCountryData = activeCountryCode ? countryStats[activeCountryCode] : null;
  const activeCountryMeta = activeCountryCode ? COUNTRY_METADATA[activeCountryCode] : null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/80 p-6 rounded-2xl border border-gray-800">
        <div>
          <div className="font-russo text-2xl text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#e20074]" />
            GEOPOLITICAL THREAT INTELLIGENCE BY COUNTRY
          </div>
          <div className="text-xs text-gray-400 font-mono mt-1">
            Real-time country attack volume, threat actor attribution, targeted honeypots & signature telemetry
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="pl-9 pr-4 py-2 bg-black border border-gray-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#e20074]"
            />
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-xl border border-gray-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-mono"
            >
              <option value="all" className="bg-gray-900">All Regions</option>
              <option value="Asia-Pacific" className="bg-gray-900">Asia-Pacific</option>
              <option value="Eastern Europe" className="bg-gray-900">Eastern Europe</option>
              <option value="Western Europe" className="bg-gray-900">Western Europe</option>
              <option value="North America" className="bg-gray-900">North America</option>
              <option value="South America" className="bg-gray-900">South America</option>
              <option value="Middle East" className="bg-gray-900">Middle East</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-xl border border-gray-800 text-xs">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-mono"
            >
              <option value="all" className="bg-gray-900">All Risk Tiers</option>
              <option value="CRITICAL" className="bg-gray-900">Critical Risk</option>
              <option value="HIGH" className="bg-gray-900">High Risk</option>
              <option value="MEDIUM" className="bg-gray-900">Medium Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Country Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((c) => {
          const meta = COUNTRY_METADATA[c.code] || {
            flag: '🌐',
            region: 'Global',
            riskTier: 'HIGH',
            primaryTarget: 'Multi-Protocol'
          };
          const sharePct = ((c.count / totalAttacksCount) * 100).toFixed(1);
          const topService = Object.entries(c.services).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          return (
            <div
              key={c.code}
              onClick={() => setActiveCountryCode(c.code)}
              className="cyber-box p-5 bg-gray-900/60 hover:bg-gray-900 transition-all border border-gray-800 hover:border-[#e20074]/60 cursor-pointer space-y-4 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meta.flag}</span>
                  <div>
                    <h4 className="font-russo text-lg text-white group-hover:text-[#e20074] transition-colors flex items-center gap-2">
                      {c.name}
                      <span className="text-xs font-mono text-gray-500 font-normal">({c.code})</span>
                    </h4>
                    <span className="text-xs text-gray-400 font-mono">{meta.region}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    meta.riskTier === 'CRITICAL'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : meta.riskTier === 'HIGH'
                      ? 'bg-orange-950 text-orange-400 border border-orange-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {meta.riskTier} RISK
                </span>
              </div>

              {/* Volume & Share Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-800/80 font-mono">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">ATTACKS</div>
                  <div className="text-lg font-bold text-white">{c.count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">GLOBAL SHARE</div>
                  <div className="text-lg font-bold text-[#e20074]">{sharePct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">ACTIVE IPs</div>
                  <div className="text-lg font-bold text-gray-300">{c.ips.size}</div>
                </div>
              </div>

              {/* Primary Targeted Honeypot */}
              <div className="text-xs font-mono text-gray-300 flex items-center justify-between">
                <span className="text-gray-500">Primary Target:</span>
                <span className="text-amber-400 font-semibold">{meta.primaryTarget}</span>
              </div>

              {/* Progress Bar Visual */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-[#e20074] rounded-full"
                    style={{ width: `${Math.min(parseFloat(sharePct) * 3, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1 group-hover:text-white">
                <span>View Threat Vector Detail</span>
                <ChevronRight className="w-4 h-4 text-[#e20074]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Country Detail Deep-Dive Modal */}
      {activeCountryData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-[#e20074]/60 rounded-2xl p-6 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeCountryMeta?.flag || '🌐'}</span>
                <div>
                  <h3 className="font-russo text-xl text-white flex items-center gap-2">
                    {activeCountryData.name} Threat Profile
                    <span className="text-xs font-mono text-gray-400">({activeCountryData.code})</span>
                  </h3>
                  <div className="text-xs text-gray-400 font-mono">
                    Region: {activeCountryMeta?.region} • Threat Group: <strong className="text-amber-400">{activeCountryMeta?.threatActorGroup || 'Automated Botnets'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveCountryCode(null)}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">TOTAL ATTACKS</div>
                <div className="text-xl font-bold text-white">{activeCountryData.count}</div>
              </div>
              <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">ATTACKER IPs</div>
                <div className="text-xl font-bold text-[#e20074]">{activeCountryData.ips.size}</div>
              </div>
              <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">TARGET CITIES</div>
                <div className="text-xl font-bold text-gray-300">{activeCountryData.cities.size}</div>
              </div>
              <div className="bg-black/60 p-3 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">CREDS HARVESTED</div>
                <div className="text-xl font-bold text-amber-400">{activeCountryData.credentialsCaptured.length}</div>
              </div>
            </div>

            {/* Targeted Honeypot Services Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Honeypot Service Target Distribution</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                {Object.entries(activeCountryData.services).map(([service, count]) => (
                  <div key={service} className="bg-black/40 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                    <span className="text-[#e20074] font-bold uppercase">{service}</span>
                    <span className="text-white font-semibold">{count} hits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Captured Payloads */}
            {activeCountryData.recentPayloads.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Captured Exploit Signature Payloads</h4>
                <div className="bg-black p-3 rounded-xl border border-gray-800 font-mono text-xs space-y-2 max-h-36 overflow-y-auto">
                  {activeCountryData.recentPayloads.map((payload, idx) => (
                    <div key={idx} className="text-gray-300 bg-gray-950 p-2 rounded border border-gray-800 truncate">
                      <span className="text-[#e20074] font-bold mr-2">#0{idx + 1}:</span>
                      {payload}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-800 font-mono text-xs">
              <div className="text-gray-400">
                Known CIDR: <span className="text-gray-300">{activeCountryMeta?.knownSubnets || '185.0.0.0/8'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCountryCode(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  Close
                </button>

                {onOpenBlackholeModal && (
                  <button
                    onClick={() => {
                      setActiveCountryCode(null);
                      onOpenBlackholeModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" /> Blackhole IP Rules
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
