import React from 'react';
import { 
  Globe, 
  BarChart3, 
  Database, 
  Search, 
  Wrench, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Server,
  Zap,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { SystemStatus, AttackLog } from '../types';

interface PortalHomeProps {
  setCurrentTab: (tab: string) => void;
  status: SystemStatus | null;
  recentAttacks: AttackLog[];
}

export const PortalHome: React.FC<PortalHomeProps> = ({
  setCurrentTab,
  status,
  recentAttacks,
}) => {
  return (
    <div className="space-y-10 py-6">
      
      {/* Hero Header Section matching iconic CyberPot aesthetic */}
      <div className="text-center space-y-4 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e20074]/10 border border-[#e20074]/30 text-[#e20074] text-xs font-mono font-semibold uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" /> CyberPot Telemetry & Threat Intelligence Active
        </div>
        <h1 className="font-russo text-4xl sm:text-6xl text-white tracking-wider">
          CYBER<span className="text-[#e20074] cyber-glow">POT</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          All-in-one multi-honeypot system capturing real-time attack telemetry, automated threat analysis, and network intrusion logs across global honeypot nodes.
        </p>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-box p-5 border-l-4 border-l-[#e20074]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>TOTAL CAPTURED ATTACKS</span>
            <Flame className="w-4 h-4 text-[#e20074]" />
          </div>
          <div className="font-russo text-2xl sm:text-3xl text-white">
            {status?.totalAttacks ? status.totalAttacks.toLocaleString() : '142,850'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>+128/min live capture</span>
          </div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>ACTIVE HONEYPOTS</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-russo text-2xl sm:text-3xl text-white">
            {status?.activeHoneypots ?? 12} <span className="text-sm font-sans text-gray-500">/ {status?.totalHoneypots ?? 12}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">
            CPU: {status?.cpuLoad ?? '18.4%'} | RAM: {status?.memoryUsage ?? '3.8 GB'}
          </div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>BLACKHOLED ATTACKERS</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-russo text-2xl sm:text-3xl text-white">
            {status?.blackholedIPsCount ?? 5}
          </div>
          <div className="text-[11px] text-red-400 mt-1 font-mono">
            Auto-blocked malicious subnets
          </div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>NODE UPTIME</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-russo text-lg sm:text-xl text-white truncate">
            {status?.uptime ?? '14d 06h 22m'}
          </div>
          <div className="text-[11px] text-blue-400 mt-1 font-mono">
            Suricata NIDS Active
          </div>
        </div>
      </div>

      {/* Main Link Boxes — Exact representation of original CyberPot Nginx Portal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* Core Tools Box */}
        <div className="cyber-box p-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#e20074]/10 rounded-full blur-2xl group-hover:bg-[#e20074]/20 transition-all" />
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-800">
            <Wrench className="w-6 h-6 text-[#e20074]" />
            <h2 className="font-russo text-xl text-white tracking-wider">CYBERPOT TOOLS</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentTab('map')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-[#e20074]/20 border border-gray-800 hover:border-[#e20074]/50 transition-all text-left group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#e20074]/20 text-[#e20074]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-[#e20074] transition-colors">Attack Map</div>
                  <div className="text-xs text-gray-400 font-mono">Real-time global attack vector visualization</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover/btn:text-[#e20074] transition-colors" />
            </button>

            <button
              onClick={() => setCurrentTab('cyberchef')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-[#e20074]/20 border border-gray-800 hover:border-[#e20074]/50 transition-all text-left group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-[#e20074] transition-colors">CyberChef</div>
                  <div className="text-xs text-gray-400 font-mono">Data conversion, hashing & string decoding suite</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover/btn:text-[#e20074] transition-colors" />
            </button>

            <button
              onClick={() => setCurrentTab('elasticvue')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-[#e20074]/20 border border-gray-800 hover:border-[#e20074]/50 transition-all text-left group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-[#e20074] transition-colors">Elasticvue</div>
                  <div className="text-xs text-gray-400 font-mono">Elasticsearch index browser and cluster metrics</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover/btn:text-[#e20074] transition-colors" />
            </button>

            <button
              onClick={() => setCurrentTab('kibana')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-[#e20074]/20 border border-gray-800 hover:border-[#e20074]/50 transition-all text-left group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-[#e20074] transition-colors">Kibana</div>
                  <div className="text-xs text-gray-400 font-mono">Interactive security dashboards & log analytics</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover/btn:text-[#e20074] transition-colors" />
            </button>

            <button
              onClick={() => setCurrentTab('spiderfoot')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-[#e20074]/20 border border-gray-800 hover:border-[#e20074]/50 transition-all text-left group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-[#e20074] transition-colors">SpiderFoot</div>
                  <div className="text-xs text-gray-400 font-mono">Automated OSINT threat intelligence reconnaissance</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover/btn:text-[#e20074] transition-colors" />
            </button>
          </div>
        </div>

        {/* External Resources Box */}
        <div className="cyber-box p-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-800">
            <ExternalLink className="w-6 h-6 text-blue-400" />
            <h2 className="font-russo text-xl text-white tracking-wider">CYBERPOT LINKS</h2>
          </div>
          <div className="space-y-3">
            <a
              href="https://sicherheitstacho.eu/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-blue-500/20 border border-gray-800 hover:border-blue-500/50 transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-blue-400 transition-colors">SecurityMeter</div>
                  <div className="text-xs text-gray-400 font-mono">Global cyber threat statistics & safety scores</div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover/btn:text-blue-400 transition-colors" />
            </a>

            <a
              href="https://github.com/khulnasoft/cyberpot/blob/master/README.md"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-blue-500/20 border border-gray-800 hover:border-blue-500/50 transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-blue-400 transition-colors">CyberPot ReadMe</div>
                  <div className="text-xs text-gray-400 font-mono">Documentation, architecture & installation guide</div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover/btn:text-blue-400 transition-colors" />
            </a>

            <a
              href="https://github.com/khulnasoft/cyberpot/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 hover:bg-blue-500/20 border border-gray-800 hover:border-blue-500/50 transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-russo text-white text-lg group-hover/btn:text-blue-400 transition-colors">CyberPot @ GitHub</div>
                  <div className="text-xs text-gray-400 font-mono">Source code, Docker compose templates & issues</div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover/btn:text-blue-400 transition-colors" />
            </a>
          </div>

          {/* Quick Honeypot Management Button */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentTab('honeypots')}
              className="w-full py-3 px-4 rounded-xl cyber-button font-russo flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>MANAGE HONEYPOT SERVICES & BLACKHOLE RULES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Recent Threat Ticker Feed */}
      <div className="cyber-box p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="font-russo text-lg text-white">REAL-TIME THREAT INTEL TICKER</h3>
          </div>
          <button
            onClick={() => setCurrentTab('map')}
            className="text-xs text-[#e20074] hover:underline font-mono"
          >
            Open Live Map →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="py-2 px-3">TIMESTAMP</th>
                <th className="py-2 px-3">HONEYPOT</th>
                <th className="py-2 px-3">SRC IP / ORIGIN</th>
                <th className="py-2 px-3">PAYLOAD / DLS</th>
                <th className="py-2 px-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentAttacks.slice(0, 5).map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-gray-400">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-pink-950/60 border border-pink-800/50 text-pink-300 font-bold uppercase">
                      {evt.service}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white">
                    {evt.srcIp} <span className="text-gray-500">({evt.country})</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300 max-w-xs truncate">
                    {evt.payload || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.action === 'BLOCKED'
                          ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                          : evt.action === 'TARPITTED'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {evt.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
