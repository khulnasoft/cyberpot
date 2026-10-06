import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Globe, 
  Activity, 
  Radio, 
  Ban, 
  Zap, 
  Server, 
  Building2, 
  Cpu, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Layers,
  Crosshair,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { AttackLog } from '../types';
import { BANGLADESH_CIDR_DATABASE, TOTAL_BD_IPS } from '../data/bangladeshCidrs';

interface BangladeshThreatMapProps {
  attacks: AttackLog[];
  onOpenBlackholeModal?: () => void;
}

interface DivisionData {
  id: string;
  name: string;
  bnName: string;
  lat: number;
  lng: number;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  activeNodes: number;
  primaryISP: string;
}

const BD_DIVISIONS: DivisionData[] = [
  { id: 'dhaka', name: 'Dhaka Division', bnName: 'ঢাকা বিভাগ', lat: 23.8103, lng: 90.4125, threatLevel: 'CRITICAL', activeNodes: 142, primaryISP: 'BTCL / AmberIT / Carnival' },
  { id: 'ctg', name: 'Chittagong Division', bnName: 'চট্টগ্রাম বিভাগ', lat: 22.3569, lng: 91.7832, threatLevel: 'HIGH', activeNodes: 89, primaryISP: 'Summit Comm / Link3' },
  { id: 'sylhet', name: 'Sylhet Division', bnName: 'সিলেট বিভাগ', lat: 24.8949, lng: 91.8687, threatLevel: 'ELEVATED', activeNodes: 42, primaryISP: 'Grameenphone / Robi Fiber' },
  { id: 'rajshahi', name: 'Rajshahi Division', bnName: 'রাজশাহী বিভাগ', lat: 24.3745, lng: 88.6042, threatLevel: 'HIGH', activeNodes: 38, primaryISP: 'Banglalink / BTCL' },
  { id: 'khulna', name: 'Khulna Division', bnName: 'খুলনা বিভাগ', lat: 22.8456, lng: 89.5403, threatLevel: 'HIGH', activeNodes: 51, primaryISP: 'AmberIT / West Zone Fiber' },
  { id: 'barisal', name: 'Barisal Division', bnName: 'বরিশাল বিভাগ', lat: 22.7010, lng: 90.3535, threatLevel: 'ELEVATED', activeNodes: 24, primaryISP: 'Coastal Net / GP' },
  { id: 'rangpur', name: 'Rangpur Division', bnName: 'রংপুর বিভাগ', lat: 25.7439, lng: 89.2752, threatLevel: 'ELEVATED', activeNodes: 29, primaryISP: 'Northern Fiber / BTCL' },
  { id: 'mymensingh', name: 'Mymensingh Division', bnName: 'ময়মনসিংহ বিভাগ', lat: 24.7471, lng: 90.4203, threatLevel: 'ELEVATED', activeNodes: 22, primaryISP: 'Summit Comm / Banglalink' }
];

const BD_SECTORS = [
  { name: 'Financial & Banking (bKash / Sonali Bank)', attacksToday: 12480, risk: 'CRITICAL', icon: Building2 },
  { name: 'National e-Gov Portals (bangladesh.gov.bd)', attacksToday: 8920, risk: 'HIGH', icon: Server },
  { name: 'Power & Smart Grid (DESCO / DPDC / PDB)', attacksToday: 3410, risk: 'HIGH', icon: Cpu },
  { name: 'Telecommunications & ISPs (GP, Robi, BTCL)', attacksToday: 15200, risk: 'CRITICAL', icon: Wifi }
];

export const BangladeshThreatMap: React.FC<BangladeshThreatMapProps> = ({ attacks, onOpenBlackholeModal }) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionData>(BD_DIVISIONS[0]);
  const [ispFilter, setIspFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bangladesh All CIDR Inspector State
  const [cidrSearch, setCidrSearch] = useState('');
  const [cidrCategoryFilter, setCidrCategoryFilter] = useState('all');
  const [copiedCidr, setCopiedCidr] = useState<string | null>(null);

  // Filter attacks for Bangladesh or regional relevance
  const bdAttacks = attacks.filter(a => a.countryCode === 'BD' || a.country === 'Bangladesh');
  const displayAttacks = bdAttacks.length > 0 ? bdAttacks : attacks;

  // Filter CIDR list
  const filteredCidrs = BANGLADESH_CIDR_DATABASE.filter(entry => {
    const matchesSearch = entry.cidr.toLowerCase().includes(cidrSearch.toLowerCase()) || 
                          entry.isp.toLowerCase().includes(cidrSearch.toLowerCase());
    const matchesCategory = cidrCategoryFilter === 'all' || entry.category === cidrCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/80 via-gray-900 to-gray-900 p-6 rounded-2xl border border-emerald-800/60 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🇧🇩</div>
          <div>
            <div className="font-russo text-2xl text-white flex items-center gap-3">
              BANGLADESH REAL-TIME CYBER THREAT MAP
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-ping" /> LIVE BGD e-GOV CIRT SENSOR
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              National cyber defense telemetry • 8 Divisional Hubs • ISP Gateway Intercept Engine (Dhaka, Chittagong, Sylhet, Khulna)
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {onOpenBlackholeModal && (
            <button
              onClick={onOpenBlackholeModal}
              className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Ban className="w-4 h-4" /> BGD Firewall Rules
            </button>
          )}
          <button
            onClick={() => alert("Generating BGD e-GOV CIRT Cyber Threat Advisory PDF Report...")}
            className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CIRT Report
          </button>
        </div>
      </div>

      {/* Top National Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>NATIONAL DEFENSE LEVEL</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-russo text-emerald-400">DEFCON 2 - ELEVATED</div>
          <div className="text-[10px] font-mono text-gray-500">CIRT Active Monitoring On</div>
        </div>

        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>BD SENSOR INTERCEPTS</span>
            <Activity className="w-4 h-4 text-[#e20074]" />
          </div>
          <div className="text-xl font-russo text-white">{displayAttacks.length * 142} <span className="text-xs text-gray-500">events</span></div>
          <div className="text-[10px] font-mono text-emerald-400">+18.4% in last 24h</div>
        </div>

        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>CRITICAL SECTOR TARGET</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-russo text-amber-300">Financial / bKash</div>
          <div className="text-[10px] font-mono text-gray-500">DDoS & Brute Force Attack Arc</div>
        </div>

        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>ACTIVE BD SUBSETS</span>
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-russo text-gray-200">103.205.0.0/16</div>
          <div className="text-[10px] font-mono text-gray-500">AmberIT / BTCL Backbone</div>
        </div>
      </div>

      {/* Main Grid: Divisional Radar Map + Sector Threat Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bangladesh Divisional Radar Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="font-russo text-lg text-white flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-emerald-400 animate-pulse" />
                8 DIVISIONAL HONEYPOT SENSORS
              </div>
              <div className="text-xs font-mono text-gray-400">
                Selected: <strong className="text-emerald-400">{selectedDivision.name} ({selectedDivision.bnName})</strong>
              </div>
            </div>

            {/* Divisional Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BD_DIVISIONS.map((div) => {
                const isSelected = selectedDivision.id === div.id;
                return (
                  <button
                    key={div.id}
                    onClick={() => setSelectedDivision(div)}
                    className={`p-3.5 rounded-xl border text-left font-mono transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                        : 'bg-black/60 border-gray-800 text-gray-300 hover:border-emerald-700/60 hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{div.name.replace(' Division', '')}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        div.threatLevel === 'CRITICAL' ? 'bg-red-500 animate-ping' :
                        div.threatLevel === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} />
                    </div>

                    <div className="text-[11px] text-gray-400 mt-1">{div.bnName}</div>

                    <div className="mt-2 text-xs font-bold text-emerald-400">
                      {div.activeNodes} <span className="text-[10px] text-gray-500 font-normal">nodes</span>
                    </div>

                    {isSelected && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Selected Division Tactical Visualizer */}
            <div className="cyber-box bg-black/90 p-5 rounded-xl border border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500 animate-bounce" /> {selectedDivision.name.toUpperCase()} SENSOR PROFILE
                </span>
                <span className="text-gray-400">Coordinates: {selectedDivision.lat.toFixed(4)} N, {selectedDivision.lng.toFixed(4)} E</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">PRIMARY INTERNET BACKBONE</span>
                  <span className="text-white font-bold">{selectedDivision.primaryISP}</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">THREAT LEVEL</span>
                  <span className={`font-bold ${
                    selectedDivision.threatLevel === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'
                  }`}>{selectedDivision.threatLevel}</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">HONEYPOT TRAPS DEPLOYED</span>
                  <span className="text-emerald-400 font-bold">Cowrie, Dionaea, Tanner, Conpot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Sectors Matrix */}
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="font-russo text-lg text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Building2 className="w-5 h-5 text-amber-400" />
              BANGLADESH CRITICAL INFRASTRUCTURE TARGET SECTORS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BD_SECTORS.map((sec, idx) => {
                const Icon = sec.icon;
                return (
                  <div key={idx} className="bg-black/60 p-4 rounded-xl border border-gray-800 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gray-800 text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{sec.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{sec.attacksToday.toLocaleString()} attacks logged</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sec.risk === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                    }`}>
                      {sec.risk}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry Ticker for Bangladesh */}
        <div className="space-y-4">
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="font-russo text-lg text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#e20074]" />
                  LIVE BANGLADESH STREAM
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="space-y-2.5 mt-4 max-h-[520px] overflow-y-auto pr-1">
                {displayAttacks.map((log) => (
                  <div key={log.id} className="p-3 bg-black/80 rounded-xl border border-gray-800/80 hover:border-[#e20074]/60 font-mono text-xs space-y-1.5 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        🇧🇩 {log.city || 'Dhaka'}, BD
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-300">
                      <span>IP: <strong className="text-white">{log.srcIp}</strong></span>
                      <span className="text-[#e20074] font-bold">{log.service} ({log.dstPort})</span>
                    </div>

                    {log.credentials && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-900/40 truncate">
                        Creds: {log.credentials.user}:{log.credentials.pass}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 text-center font-mono text-xs text-gray-400">
              Connected to BGD e-GOV CIRT Telemetry Stream
            </div>
          </div>
        </div>

      </div>

      {/* All Bangladesh CIDR Network Range Inspector & Coverage Explorer */}
      <div className="bg-gray-900/90 p-6 rounded-2xl border border-emerald-800/80 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-3">
              <Wifi className="w-6 h-6 text-emerald-400" />
              ALL BANGLADESH IPv4 CIDR NETWORK COVERAGE
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                {BANGLADESH_CIDR_DATABASE.length} CIDR BLOCKS
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              National BTRC & BGD e-GOV CIRT IP Address Registry • Total Monitored IPs: <strong className="text-emerald-400">{TOTAL_BD_IPS.toLocaleString()} IPs</strong>
            </div>
          </div>

          {/* CIDR Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={cidrSearch}
                onChange={(e) => setCidrSearch(e.target.value)}
                placeholder="Search CIDR or ISP (e.g. 103.205, BTCL, Robi, Grameenphone)..."
                className="bg-black border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>

            <select
              value={cidrCategoryFilter}
              onChange={(e) => setCidrCategoryFilter(e.target.value)}
              className="bg-black border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories ({BANGLADESH_CIDR_DATABASE.length})</option>
              <option value="Mobile / BroadBand">Mobile / BroadBand</option>
              <option value="Government / Education">Government / Education</option>
              <option value="Corporate / Enterprise">Corporate / Enterprise</option>
              <option value="IXP / Backbone">IXP / Backbone</option>
            </select>
          </div>
        </div>

        {/* CIDR Table / Cards Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase">
                <th className="py-2.5 px-3">CIDR SUBNET BLOCK</th>
                <th className="py-2.5 px-3">TELECOM ISP / BACKBONE PROVIDER</th>
                <th className="py-2.5 px-3">SECTOR CATEGORY</th>
                <th className="py-2.5 px-3">EST. IP CAPACITY</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredCidrs.slice(0, 35).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-emerald-400 font-bold flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {item.cidr}
                  </td>
                  <td className="py-2.5 px-3 text-white font-medium">{item.isp}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.category === 'Government / Education' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      item.category === 'Mobile / BroadBand' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      item.category === 'IXP / Backbone' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">{item.numIps.toLocaleString()} IPs</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.cidr);
                        setCopiedCidr(item.cidr);
                        setTimeout(() => setCopiedCidr(null), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] transition-colors"
                    >
                      {copiedCidr === item.cidr ? 'Copied!' : 'Copy CIDR'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-gray-500 font-mono text-xs">
          <span>Showing {Math.min(35, filteredCidrs.length)} of {filteredCidrs.length} matching CIDR blocks</span>
          <span>BTRC National Address Space • Updated 2026</span>
        </div>
      </div>

    </div>
  );
};
