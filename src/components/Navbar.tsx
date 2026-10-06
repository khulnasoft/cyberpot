import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  BarChart3, 
  Database, 
  Search, 
  Wrench, 
  ShieldAlert, 
  Radio, 
  Home,
  Plus,
  Ban,
  Flag,
  Sparkles,
  Command,
  ChevronDown,
  Activity,
  Layers,
  Terminal,
  Cpu,
  Sliders
} from 'lucide-react';
import { Clock } from './Clock';
import { SystemStatus } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  status: SystemStatus | null;
  onOpenBlackholeModal: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  category: 'maps' | 'ops';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  status,
  onOpenBlackholeModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdSearchOpen, setCmdSearchOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');

  const navItems: NavItem[] = [
    { id: 'portal', label: 'Portal', icon: Home, category: 'maps' },
    { id: 'bdmap', label: 'Bangladesh', icon: Radio, badge: 'CIRT', badgeColor: 'bg-emerald-500 text-black', category: 'maps' },
    { id: '3dmap', label: '3D Globe', icon: Sparkles, badge: 'WebGL', badgeColor: 'bg-[#e20074] text-white', category: 'maps' },
    { id: 'map', label: 'Attack Map', icon: Globe, category: 'maps' },
    { id: 'countries', label: 'Countries', icon: Flag, category: 'maps' },
    { id: 'kibana', label: 'Kibana', icon: BarChart3, badge: 'ELK', badgeColor: 'bg-blue-600 text-white', category: 'ops' },
    { id: 'elasticvue', label: 'Elasticvue', icon: Database, category: 'ops' },
    { id: 'spiderfoot', label: 'SpiderFoot', icon: Search, badge: 'OSINT', badgeColor: 'bg-amber-600 text-white', category: 'ops' },
    { id: 'cyberchef', label: 'CyberChef', icon: Wrench, category: 'ops' },
    { id: 'honeypots', label: 'Nodes', icon: ShieldAlert, badge: status ? `${status.activeHoneypots}` : '12', badgeColor: 'bg-gray-700 text-gray-200', category: 'ops' },
    { id: 'analysis', label: 'Analysis', icon: Activity, badge: 'Vectors', badgeColor: 'bg-[#e20074] text-white', category: 'ops' },
    { id: 'settings', label: 'Settings', icon: Sliders, badge: 'Alerts', badgeColor: 'bg-purple-600 text-white', category: 'ops' },
  ];

  // Quick Command Palette Keyboard Shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCmdSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCmdItems = navItems.filter(item => 
    item.label.toLowerCase().includes(cmdQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#e20074]/30 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand logo & Live System Pulse */}
        <div className="flex items-center gap-5 shrink-0">
          <button 
            onClick={() => setCurrentTab('portal')} 
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e20074] via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-[#e20074]/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center text-[#e20074]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="font-russo text-xl text-white tracking-wider flex items-center gap-1.5 leading-none">
                CYBER<span className="text-[#e20074] cyber-glow">POT</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 font-normal">v24.04</span>
              </div>
              <div className="text-[9px] text-gray-400 font-mono tracking-widest uppercase mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Multi-Honeypot SOC
              </div>
            </div>
          </button>

          <div className="hidden lg:block border-l border-gray-800 pl-5">
            <Clock />
          </div>
        </div>

        {/* Desktop Navigation - Clean Segmented Bar */}
        <nav className="hidden xl:flex items-center gap-1 bg-gray-950/90 p-1.5 rounded-2xl border border-gray-800/90 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-[#e20074] text-white shadow-lg shadow-[#e20074]/40 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>

                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${item.badgeColor || 'bg-gray-800 text-gray-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tablet Navigation Dropdown for 10 items on medium-large screens */}
        <div className="hidden md:flex xl:hidden items-center gap-2">
          <nav className="flex items-center gap-1 bg-gray-950/90 p-1 rounded-xl border border-gray-800">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isActive ? 'bg-[#e20074] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Controls, Command Palette & Status Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Quick Command Search Trigger */}
          <button
            onClick={() => setCmdSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-mono transition-colors"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-[#e20074]" />
            <span className="text-[11px]">Search View</span>
            <kbd className="bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded text-[10px] border border-gray-800">⌘K</kbd>
          </button>

          {/* Blackhole Firewall Rules Button */}
          <button
            onClick={onOpenBlackholeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-red-300 text-xs font-mono transition-all shadow-sm hover:shadow-red-950/50"
            title="Manage Blackhole IP Rules"
          >
            <Ban className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="hidden sm:inline font-bold">Blackhole</span>
            <span className="bg-red-900/90 text-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-700/50">
              {status?.blackholedIPsCount ?? 5}
            </span>
          </button>

          {/* System Active Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">SOC ONLINE</span>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-gray-300 hover:text-white rounded-xl bg-gray-950 border border-gray-800"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 p-4 bg-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-800 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider px-2">Navigation Modules</div>
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-[#e20074] text-white font-bold shadow-md shadow-[#e20074]/30'
                      : 'text-gray-300 hover:bg-gray-900 border border-transparent hover:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.badgeColor || 'bg-gray-800 text-gray-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Command Palette Modal (⌘K) */}
      {cmdSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
          <div className="bg-gray-900 border border-[#e20074]/60 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden font-mono text-xs">
            
            {/* Search Input */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-black">
              <Command className="w-5 h-5 text-[#e20074]" />
              <input
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Type view name (e.g. 3D Globe, Bangladesh, Kibana, CyberChef)..."
                autoFocus
                className="w-full bg-transparent text-white border-none focus:outline-none text-sm font-mono placeholder:text-gray-500"
              />
              <button
                onClick={() => setCmdSearchOpen(false)}
                className="text-gray-500 hover:text-white text-xs bg-gray-900 px-2 py-1 rounded"
              >
                ESC
              </button>
            </div>

            {/* View Items List */}
            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {filteredCmdItems.length > 0 ? (
                filteredCmdItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setCmdSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/80 text-left text-gray-200 hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-950 text-[#e20074] group-hover:bg-[#e20074] group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{item.label}</div>
                          <div className="text-[10px] text-gray-400">Switch active dashboard tab to {item.label}</div>
                        </div>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.badgeColor || 'bg-gray-800'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No matching SOC dashboard modules found.
                </div>
              )}
            </div>

            <div className="p-3 bg-black border-t border-gray-800 text-[10px] text-gray-500 text-center flex items-center justify-between">
              <span>Use <strong>⌘K</strong> or <strong>Ctrl+K</strong> anytime</span>
              <span>CyberPot v24.04 SOC</span>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
