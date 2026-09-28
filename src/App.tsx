import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ParticleBackground } from './components/ParticleBackground';
import { PortalHome } from './components/PortalHome';
import { AttackMap } from './components/AttackMap';
import { KibanaDashboard } from './components/KibanaDashboard';
import { ElasticvueExplorer } from './components/ElasticvueExplorer';
import { SpiderFootOsint } from './components/SpiderFootOsint';
import { CyberChefSuite } from './components/CyberChefSuite';
import { HoneypotControl } from './components/HoneypotControl';
import { SystemStatus, AttackLog } from './types';
import { Ban, X, Plus } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('portal');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [blackholeModalOpen, setBlackholeModalOpen] = useState(false);
  const [blackholeInput, setBlackholeInput] = useState('');

  const fetchTelemetry = async () => {
    try {
      const [statusRes, attacksRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/attacks?limit=150'),
      ]);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatus(sData);
      }
      if (attacksRes.ok) {
        const aData = await attacksRes.json();
        setAttacks(aData.events || []);
      }
    } catch (err) {
      console.error('Error fetching CyberPot telemetry:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBlackholeRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackholeInput.trim()) return;

    try {
      const res = await fetch('/api/blackhole/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: blackholeInput.trim() }),
      });
      if (res.ok) {
        setBlackholeInput('');
        setBlackholeModalOpen(false);
        fetchTelemetry();
      }
    } catch (e) {
      console.error('Error adding blackhole rule:', e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col relative selection:bg-[#e20074] selection:text-white">
      {/* Interactive Canvas Particles */}
      <ParticleBackground />

      {/* Header Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        status={status}
        onOpenBlackholeModal={() => setBlackholeModalOpen(true)}
      />

      {/* Main Container View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 z-10">
        {currentTab === 'portal' && (
          <PortalHome
            setCurrentTab={setCurrentTab}
            status={status}
            recentAttacks={attacks}
          />
        )}
        {currentTab === 'map' && <AttackMap attacks={attacks} />}
        {currentTab === 'kibana' && <KibanaDashboard attacks={attacks} />}
        {currentTab === 'elasticvue' && <ElasticvueExplorer />}
        {currentTab === 'spiderfoot' && <SpiderFootOsint />}
        {currentTab === 'cyberchef' && <CyberChefSuite />}
        {currentTab === 'honeypots' && (
          <HoneypotControl onOpenBlackholeModal={() => setBlackholeModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/90 py-6 text-center text-xs font-mono text-gray-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CYBERPOT v24.04 • KhulnaSoft Multi-Honeypot Framework
          </div>
          <div className="text-gray-600">
            Node.js 22 AI Studio Engine • Suricata NIDS Active
          </div>
        </div>
      </footer>

      {/* Global Blackhole Rule Modal */}
      {blackholeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800/80 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-russo text-lg text-white text-red-400 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" /> BLACKHOLE ATTACKER IP
              </h3>
              <button
                onClick={() => setBlackholeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 font-mono">
              Enter an IPv4 address to immediately drop all incoming packets across Cowrie, Dionaea, Conpot, and Tanner honeypot nodes.
            </p>

            <form onSubmit={handleAddBlackholeRule} className="space-y-4">
              <input
                type="text"
                value={blackholeInput}
                onChange={(e) => setBlackholeInput(e.target.value)}
                placeholder="e.g. 185.220.101.5"
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBlackholeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Drop Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
export default App;
