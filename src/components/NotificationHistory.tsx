import React, { useState } from 'react';
import { 
  Clock, 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Zap, 
  Server, 
  Mail, 
  Webhook, 
  Ban,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { TriggeredAlert } from '../types';

interface NotificationHistoryProps {
  alerts: TriggeredAlert[];
  onClearHistory?: () => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({ 
  alerts,
  onClearHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHoneypot, setSelectedHoneypot] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Filter alerts chronologically (latest first)
  const filteredAlerts = alerts
    .filter(al => {
      const matchesSearch = 
        al.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        al.honeypotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        al.actionsTaken?.some(act => act.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesHoneypot = selectedHoneypot === 'all' || al.honeypotId === selectedHoneypot;
      const matchesSeverity = selectedSeverity === 'all' || al.severity === selectedSeverity;

      return matchesSearch && matchesHoneypot && matchesSeverity;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Export History as CSV
  const exportHistoryCSV = () => {
    const headers = ['Timestamp', 'Alert ID', 'Rule Name', 'Honeypot Node', 'Triggered Value (Req/Min)', 'Threshold Limit', 'Severity', 'Actions Taken'];
    const rows = filteredAlerts.map(al => [
      al.timestamp,
      al.id,
      `"${al.ruleName}"`,
      `"${al.honeypotName}"`,
      al.currentAttempts,
      al.thresholdLimit,
      al.severity,
      `"${(al.actionsTaken || []).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cyberpot-notification-history-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export History as JSON
  const exportHistoryJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({
        exportDate: new Date().toISOString(),
        totalHistoryCount: filteredAlerts.length,
        notificationHistory: filteredAlerts
      }, null, 2)
    )}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `cyberpot-notification-history-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-900/90 p-6 rounded-2xl border border-gray-800 space-y-4 shadow-2xl font-mono text-xs">
      
      {/* Component Header & Exporters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="font-russo text-xl text-white flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            NOTIFICATION & ALERT HISTORY CHRONICLE
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              {filteredAlerts.length} LOGGED ALERTS
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Chronological log of all triggered attack frequency threshold alerts, affected honeypot sensor nodes, and dispatched security actions.
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportHistoryCSV}
            className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Export History as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={exportHistoryJSON}
            className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Export History as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
          </button>

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className="px-3 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Clear Notification History Log"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" /> Clear History
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/60 p-3 rounded-xl border border-gray-800">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rule name, honeypot, or action..."
            className="bg-black border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-64"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedHoneypot}
            onChange={(e) => setSelectedHoneypot(e.target.value)}
            className="bg-black border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Honeypot Sensors</option>
            <option value="cowrie">Cowrie (SSH / Telnet)</option>
            <option value="tanner">Tanner (Web App)</option>
            <option value="dionaea">Dionaea (SMB / FTP)</option>
            <option value="conpot">Conpot (ICS / SCADA)</option>
            <option value="suricata">Suricata NIDS</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-black border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>
        </div>
      </div>

      {/* Chronological Table Log */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 bg-black text-gray-400 uppercase border-b border-gray-800">
            <tr>
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">HONEYPOT SENSOR NODE</th>
              <th className="py-2.5 px-3">TRIGGERED RULE</th>
              <th className="py-2.5 px-3">TRIGGERED VALUE vs LIMIT</th>
              <th className="py-2.5 px-3">SEVERITY</th>
              <th className="py-2.5 px-3">ACTIONS DISPATCHED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 bg-black/40">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((al) => {
                const excessPct = Math.round(((al.currentAttempts - al.thresholdLimit) / al.thresholdLimit) * 100);

                return (
                  <tr key={al.id} className="hover:bg-gray-800/40 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(al.timestamp).toLocaleString()}
                    </td>

                    {/* Honeypot Node Name */}
                    <td className="py-2.5 px-3 text-purple-300 font-bold flex items-center gap-1.5 whitespace-nowrap">
                      <Server className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {al.honeypotName || al.honeypotId}
                    </td>

                    {/* Triggered Rule Name */}
                    <td className="py-2.5 px-3 text-white font-bold">
                      {al.ruleName}
                    </td>

                    {/* Triggered Value vs Limit */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-400">{al.currentAttempts} req/min</span>
                        <span className="text-gray-500 text-[10px]">(Limit: {al.thresholdLimit})</span>
                        {excessPct > 0 && (
                          <span className="px-1.5 py-0.2 bg-red-950 text-red-300 border border-red-800 rounded text-[9px] font-bold">
                            +{excessPct}% OVER
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        al.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        al.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {al.severity}
                      </span>
                    </td>

                    {/* Actions Dispatched */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {al.actionsTaken?.map((act, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                              act.includes('EMAIL') ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                              act.includes('BROWSER') ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                              act.includes('BLACKHOLE') ? 'bg-red-950 text-red-300 border border-red-800' :
                              'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {act.includes('EMAIL') && <Mail className="w-2.5 h-2.5" />}
                            {act.includes('BROWSER') && <Bell className="w-2.5 h-2.5" />}
                            {act.includes('BLACKHOLE') && <Ban className="w-2.5 h-2.5" />}
                            {act.includes('WEBHOOK') && <Webhook className="w-2.5 h-2.5" />}
                            {act.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                  No chronological threshold notification alerts found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2 text-center text-gray-500 text-[11px] border-t border-gray-800">
        Chronological Alert Audit Store • CyberPot SOC v24.04
      </div>

    </div>
  );
};
