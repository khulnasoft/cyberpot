import React, { useState } from 'react';
import { 
  Search, 
  BarChart3, 
  PieChart, 
  Clock, 
  Filter, 
  Download, 
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers
} from 'lucide-react';
import { AttackLog } from '../types';

interface KibanaDashboardProps {
  attacks: AttackLog[];
}

export const KibanaDashboard: React.FC<KibanaDashboardProps> = ({ attacks }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedLog, setSelectedLog] = useState<AttackLog | null>(null);

  const filteredLogs = attacks.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.srcIp.toLowerCase().includes(q) ||
      a.service.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      (a.payload && a.payload.toLowerCase().includes(q)) ||
      (a.credentials?.user && a.credentials.user.toLowerCase().includes(q))
    );
  });

  // Calculate service breakdown for chart
  const serviceStats: Record<string, number> = {};
  filteredLogs.forEach((l) => {
    serviceStats[l.service] = (serviceStats[l.service] || 0) + 1;
  });

  const topServices = Object.entries(serviceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Calculate country breakdown
  const countryStats: Record<string, number> = {};
  filteredLogs.forEach((l) => {
    countryStats[l.country] = (countryStats[l.country] || 0) + 1;
  });

  const topCountries = Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Kibana Top Bar */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              KIBANA <span className="text-amber-400">DASHBOARD</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Index pattern: <span className="text-amber-400 font-bold">cyberpot-*</span>
            </div>
          </div>
        </div>

        {/* Time Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 text-xs text-gray-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none"
            >
              <option value="1h" className="bg-gray-900">Last 1 Hour</option>
              <option value="24h" className="bg-gray-900">Last 24 Hours</option>
              <option value="7d" className="bg-gray-900">Last 7 Days</option>
              <option value="30d" className="bg-gray-900">Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `cyberpot-kibana-export.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export NDJSON</span>
          </button>
        </div>
      </div>

      {/* Kibana KQL Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="KQL Search (e.g., service: cowrie AND srcIp: 185.* OR country: China)..."
          className="w-full pl-10 pr-4 py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Analytics Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Distribution Chart */}
        <div className="cyber-box p-5 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-russo text-sm text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              HONEYPOT ATTACK DISTRIBUTION
            </h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {topServices.map(([srv, count]) => {
              const pct = Math.round((count / filteredLogs.length) * 100) || 0;
              return (
                <div key={srv} className="space-y-1">
                  <div className="flex justify-between text-gray-300 uppercase">
                    <span className="font-bold">{srv}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-pink-500 h-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Attacking Countries */}
        <div className="cyber-box p-5 border-t-2 border-t-[#e20074]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-russo text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#e20074]" />
              TOP ORIGIN COUNTRIES
            </h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {topCountries.map(([ctry, count]) => {
              const pct = Math.round((count / filteredLogs.length) * 100) || 0;
              return (
                <div key={ctry} className="space-y-1">
                  <div className="flex justify-between text-gray-300">
                    <span className="font-bold">{ctry}</span>
                    <span>{count} probes</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#e20074] h-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Metrics */}
        <div className="cyber-box p-5 border-t-2 border-t-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-russo text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              THREAT LEVEL BREAKDOWN
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-950/40 p-3 rounded-lg border border-red-800/40 text-center">
              <div className="text-gray-400 text-[10px] font-mono">CRITICAL</div>
              <div className="font-russo text-xl text-red-400">
                {filteredLogs.filter(l => l.severity === 'CRITICAL').length}
              </div>
            </div>
            <div className="bg-orange-950/40 p-3 rounded-lg border border-orange-800/40 text-center">
              <div className="text-gray-400 text-[10px] font-mono">HIGH</div>
              <div className="font-russo text-xl text-orange-400">
                {filteredLogs.filter(l => l.severity === 'HIGH').length}
              </div>
            </div>
            <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-800/40 text-center">
              <div className="text-gray-400 text-[10px] font-mono">MEDIUM</div>
              <div className="font-russo text-xl text-amber-400">
                {filteredLogs.filter(l => l.severity === 'MEDIUM').length}
              </div>
            </div>
            <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-800/40 text-center">
              <div className="text-gray-400 text-[10px] font-mono">LOW</div>
              <div className="font-russo text-xl text-blue-400">
                {filteredLogs.filter(l => l.severity === 'LOW').length}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Discover Event Documents Table */}
      <div className="cyber-box p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-russo text-lg text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            DISCOVER DOCUMENTS ({filteredLogs.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase">
                <th className="py-2.5 px-3">@TIMESTAMP</th>
                <th className="py-2.5 px-3">SERVICE</th>
                <th className="py-2.5 px-3">SRC_IP</th>
                <th className="py-2.5 px-3">GEO.COUNTRY_NAME</th>
                <th className="py-2.5 px-3">CREDS / COMMAND</th>
                <th className="py-2.5 px-3">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-bold uppercase">
                      {log.service}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white font-bold">{log.srcIp}</td>
                  <td className="py-2.5 px-3 text-gray-300">{log.country}</td>
                  <td className="py-2.5 px-3 text-gray-400 max-w-xs truncate">
                    {log.credentials ? `${log.credentials.user}:${log.credentials.pass}` : log.payload || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-amber-500 hover:text-black text-amber-400 font-mono text-[11px] transition-colors"
                    >
                      JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-amber-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-russo text-lg text-white text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> DOCUMENT JSON VIEW ({selectedLog.id})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white font-mono text-sm"
              >
                ✕ CLOSE
              </button>
            </div>
            <pre className="p-4 bg-black rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto border border-gray-800">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
