import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Power, 
  RefreshCw, 
  Plus, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  Activity,
  HardDrive,
  Cpu,
  Trash2,
  Terminal
} from 'lucide-react';
import { HoneypotService } from '../types';

interface HoneypotControlProps {
  onOpenBlackholeModal: () => void;
}

export const HoneypotControl: React.FC<HoneypotControlProps> = ({ onOpenBlackholeModal }) => {
  const [honeypots, setHoneypots] = useState<HoneypotService[]>([]);
  const [blackholedIPs, setBlackholedIPs] = useState<string[]>([]);
  const [newBlackholeIP, setNewBlackholeIP] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = () => {
    fetch('/api/honeypots')
      .then((res) => res.json())
      .then((data) => setHoneypots(data))
      .catch((err) => console.error('Error fetching honeypots:', err));

    fetch('/api/blackhole')
      .then((res) => res.json())
      .then((data) => setBlackholedIPs(data.blackholedIPs || []))
      .catch((err) => console.error('Error fetching blackhole IPs:', err));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleHoneypot = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/honeypots/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (e) {
      console.error('Error toggling honeypot:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBlackhole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackholeIP.trim()) return;

    try {
      const res = await fetch('/api/blackhole/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newBlackholeIP.trim() }),
      });
      if (res.ok) {
        setNewBlackholeIP('');
        fetchServices();
      }
    } catch (e) {
      console.error('Error adding blackhole IP:', e);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#e20074]/20 text-[#e20074]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              HONEYPOT SERVICE <span className="text-[#e20074]">CONTROL CENTER</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Docker compose orchestration & active blackhole firewall filtering
            </div>
          </div>
        </div>

        <button
          onClick={fetchServices}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh State</span>
        </button>
      </div>

      {/* Honeypot Services Grid */}
      <div className="space-y-4">
        <h3 className="font-russo text-lg text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#e20074]" />
          ACTIVE DEPLOYED HONEYPOT NODES ({honeypots.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {honeypots.map((hp) => (
            <div
              key={hp.id}
              className={`cyber-box p-5 space-y-4 relative overflow-hidden ${
                hp.status === 'running' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-russo text-lg text-white">{hp.name}</div>
                  <div className="text-xs text-[#e20074] font-mono font-semibold">{hp.type}</div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    hp.status === 'running'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${hp.status === 'running' ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                  {hp.status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-gray-400 font-mono leading-relaxed h-10 overflow-hidden">
                {hp.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-gray-800">
                <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">LISTEN PORT</span>
                  <span className="text-white font-bold">{hp.port === 0 ? 'NIDS/Promisc' : hp.port}</span>
                </div>
                <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                  <span className="text-gray-500 text-[10px] block">PROBES CAPTURED</span>
                  <span className="text-emerald-400 font-bold">{hp.attacksCount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-gray-500 font-mono">
                  CPU: {hp.cpu}% | RAM: {hp.memory}MB
                </div>

                <button
                  onClick={() => handleToggleHoneypot(hp.id)}
                  disabled={actionLoading === hp.id}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                    hp.status === 'running'
                      ? 'bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{hp.status === 'running' ? 'STOP' : 'START'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blackhole Firewall Rule Management */}
      <div className="cyber-box p-6 space-y-6 border-t-2 border-t-red-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="font-russo text-lg text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              BLACKHOLE FIREWALL RULES (blackhole.sh)
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Automated IP routing drop rules preventing targeted malicious traffic
            </p>
          </div>
        </div>

        <form onSubmit={handleAddBlackhole} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newBlackholeIP}
            onChange={(e) => setNewBlackholeIP(e.target.value)}
            placeholder="Add attacker IPv4 to Blackhole list (e.g. 185.220.101.5)..."
            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 border border-red-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ADD DROP RULE</span>
          </button>
        </form>

        <div className="space-y-2 font-mono text-xs">
          <div className="text-gray-500 text-[11px] uppercase">Currently Blackholed Attacker Subnets ({blackholedIPs.length})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {blackholedIPs.map((ip) => (
              <div
                key={ip}
                className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center justify-between text-red-200"
              >
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{ip}</span>
                </div>
                <span className="text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                  DROPPED
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
