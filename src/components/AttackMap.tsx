import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Volume2, 
  VolumeX, 
  Filter, 
  ShieldAlert, 
  Zap,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { AttackLog } from '../types';

interface AttackMapProps {
  attacks: AttackLog[];
}

export const AttackMap: React.FC<AttackMapProps> = ({ attacks }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [paused, setPaused] = useState(false);
  const [activeVector, setActiveVector] = useState<AttackLog | null>(null);

  // Filtered attacks
  const filteredAttacks = attacks.filter(a => {
    if (selectedService !== 'all' && a.service !== selectedService) return false;
    if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) return false;
    return true;
  });

  useEffect(() => {
    if (filteredAttacks.length > 0 && !paused) {
      setActiveVector(filteredAttacks[0]);
    }
  }, [attacks, paused, selectedService, selectedSeverity]);

  // World map projection coordinate conversion (simple equirectangular)
  const getCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 450;
    return { x, y };
  };

  // CyberPot target node location (e.g. Frankfurt, Germany: 51.16, 10.45)
  const targetNodeCoords = getCoords(51.16, 10.45);

  return (
    <div className="space-y-6">
      
      {/* Map Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/80 p-4 rounded-xl border border-gray-800">
        <div>
          <div className="font-russo text-xl text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#e20074]" />
            LIVE ATTACK VECTOR MAP
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Intercepting incoming probe connections across active global sensor nodes
          </div>
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none"
            >
              <option value="all" className="bg-gray-900">All Honeypots</option>
              <option value="cowrie" className="bg-gray-900">Cowrie (SSH)</option>
              <option value="dionaea" className="bg-gray-900">Dionaea (SMB/FTP)</option>
              <option value="conpot" className="bg-gray-900">Conpot (ICS/SCADA)</option>
              <option value="tanner" className="bg-gray-900">Tanner (Web)</option>
              <option value="heralding" className="bg-gray-900">Heralding (Auth)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none"
            >
              <option value="all" className="bg-gray-900">All Severities</option>
              <option value="CRITICAL" className="bg-gray-900">Critical Only</option>
              <option value="HIGH" className="bg-gray-900">High Only</option>
              <option value="MEDIUM" className="bg-gray-900">Medium Only</option>
            </select>
          </div>

          <button
            onClick={() => setPaused(!paused)}
            className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              paused
                ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{paused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-[#e20074]/20 border-[#e20074] text-[#e20074]'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Toggle Attack Alert Chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Vector Map Display */}
      <div className="cyber-box p-4 relative overflow-hidden bg-gradient-to-b from-gray-950 to-black">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-auto max-h-[500px] rounded-lg bg-black/80"
        >
          {/* Map Grid Background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e20074" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e20074" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill="url(#grid)" />

          {/* World Continents Rough SVG Paths */}
          <g fill="#111827" stroke="#374151" strokeWidth="0.8" opacity="0.8">
            {/* North America */}
            <path d="M 100 80 L 220 70 L 250 140 L 180 220 L 110 180 L 80 120 Z" />
            {/* South America */}
            <path d="M 230 230 L 290 240 L 270 370 L 220 380 L 210 280 Z" />
            {/* Europe */}
            <path d="M 380 70 L 460 60 L 480 130 L 410 140 L 370 100 Z" />
            {/* Africa */}
            <path d="M 380 150 L 480 160 L 490 280 L 430 330 L 370 240 Z" />
            {/* Asia */}
            <path d="M 480 60 L 720 50 L 740 180 L 610 220 L 510 150 Z" />
            {/* Australia */}
            <path d="M 640 280 L 720 270 L 730 350 L 650 360 Z" />
          </g>

          {/* Central Target CyberPot Node (Frankfurt) */}
          <circle
            cx={targetNodeCoords.x}
            cy={targetNodeCoords.y}
            r="16"
            fill="url(#targetGlow)"
            className="animate-pulse"
          />
          <circle
            cx={targetNodeCoords.x}
            cy={targetNodeCoords.y}
            r="4"
            fill="#e20074"
          />
          <text
            x={targetNodeCoords.x}
            y={targetNodeCoords.y - 10}
            fill="#e20074"
            fontSize="9"
            fontFamily="Russo One"
            textAnchor="middle"
          >
            CYBERPOT HUB
          </text>

          {/* Active Attack Arcs */}
          {filteredAttacks.slice(0, 15).map((attack, idx) => {
            const src = getCoords(attack.lat, attack.lng);
            const isLatest = activeVector?.id === attack.id;
            const strokeColor = attack.severity === 'CRITICAL' ? '#ef4444' : attack.severity === 'HIGH' ? '#f97316' : '#e20074';

            // Quadratic bezier curve midpoint offset
            const midX = (src.x + targetNodeCoords.x) / 2;
            const midY = (src.y + targetNodeCoords.y) / 2 - 40;

            return (
              <g key={attack.id}>
                {/* Source marker */}
                <circle
                  cx={src.x}
                  cy={src.y}
                  r={isLatest ? 6 : 3}
                  fill={strokeColor}
                  className={isLatest ? "animate-ping" : ""}
                />

                {/* Vector Arc */}
                <path
                  d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${targetNodeCoords.x} ${targetNodeCoords.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isLatest ? 2 : 1}
                  strokeDasharray={isLatest ? "4,4" : "none"}
                  opacity={isLatest ? 1 : 0.4 - idx * 0.02}
                  className={isLatest ? "animate-dash" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* Live Vector Info Overlay */}
        {activeVector && (
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-md bg-black/90 p-4 rounded-xl border border-[#e20074]/50 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
              <span className="text-[#e20074] font-bold uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> INTERCEPTING VECTOR
              </span>
              <span>{new Date(activeVector.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-white font-mono">
                {activeVector.srcIp}
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                {activeVector.severity}
              </span>
            </div>
            <div className="text-xs text-gray-300 mt-1 font-mono flex items-center justify-between">
              <span>Origin: {activeVector.city}, {activeVector.country}</span>
              <span>Target: Port {activeVector.dstPort} ({activeVector.service})</span>
            </div>
            {activeVector.credentials && (
              <div className="mt-2 pt-2 border-t border-gray-800 text-xs font-mono text-amber-400">
                Captured Creds: <span className="text-white">{activeVector.credentials.user}:{activeVector.credentials.pass}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Intercept Log Feed */}
      <div className="cyber-box p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-russo text-lg text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            LIVE ATTACK STREAM
          </h3>
          <span className="text-xs font-mono text-gray-400">
            Showing {filteredAttacks.length} active events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">SOURCE IP</th>
                <th className="py-2.5 px-3">COUNTRY</th>
                <th className="py-2.5 px-3">SERVICE / PORT</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">PAYLOAD / CMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredAttacks.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-white font-bold">
                    {log.srcIp}
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {log.country}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[#e20074] font-bold uppercase">{log.service}</span>
                    <span className="text-gray-500"> ({log.dstPort})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : log.severity === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 max-w-sm truncate">
                    {log.payload || 'N/A'}
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
