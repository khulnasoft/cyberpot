import React, { useState } from 'react';
import { 
  Search, 
  ShieldAlert, 
  Globe, 
  Database, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  Cpu,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { SpiderFootResult } from '../types';

export const SpiderFootOsint: React.FC = () => {
  const [targetQuery, setTargetQuery] = useState('185.220.101.5');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<SpiderFootResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/spiderfoot/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetQuery.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error('Error running SpiderFoot scan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SpiderFoot Top Banner */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              SPIDERFOOT <span className="text-purple-400">OSINT RECONNAISSANCE</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Automated threat intelligence gatherer across 200+ OSINT modules
            </div>
          </div>
        </div>
      </div>

      {/* Target Search Box */}
      <form onSubmit={handleScan} className="cyber-box p-6 space-y-4">
        <label className="block text-xs font-mono text-gray-400 uppercase">
          Enter Target IP Address, Domain Name, or Subnet
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={targetQuery}
            onChange={(e) => setTargetQuery(e.target.value)}
            placeholder="e.g. 185.220.101.5 or malware-c2-domain.com"
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-russo text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
            <span>{loading ? 'ANALYZING OSINT...' : 'RUN SPIDERFOOT SCAN'}</span>
          </button>
        </div>
      </form>

      {/* Scan Results Output */}
      {scanResult && (
        <div className="space-y-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="cyber-box p-5 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                <span>THREAT RISK SCORE</span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div className="font-russo text-3xl text-red-400">
                {scanResult.summary.riskScore} / 100
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                High probability malicious entity
              </div>
            </div>

            <div className="cyber-box p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                <span>ABUSE REPORT SCORE</span>
                <AlertTriangle className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-russo text-3xl text-purple-400">
                {scanResult.summary.abuseScore}% Confidence
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                Correlated on AbuseIPDB & Shodan
              </div>
            </div>

            <div className="cyber-box p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                <span>OPEN EXPOSED PORTS</span>
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-russo text-xl text-white font-mono mt-1">
                {scanResult.summary.openPorts.join(', ')}
              </div>
            </div>
          </div>

          {/* Module Findings Detail */}
          <div className="cyber-box p-6">
            <h3 className="font-russo text-lg text-white flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
              <Layers className="w-5 h-5 text-purple-400" />
              SPIDERFOOT MODULE FINDINGS
            </h3>

            <div className="space-y-3">
              {scanResult.modules.map((mod) => (
                <div key={mod.name} className="p-4 bg-gray-900/80 rounded-xl border border-gray-800 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold uppercase text-sm">{mod.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      {mod.status}
                    </span>
                  </div>
                  <div className="text-gray-400">Category: <span className="text-gray-200">{mod.category}</span> ({mod.findings} findings)</div>
                  <div className="text-gray-300 bg-black p-2.5 rounded-lg border border-gray-800/80 mt-2 text-xs">
                    {mod.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
