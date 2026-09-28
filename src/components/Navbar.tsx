import React, { useState } from 'react';
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
  Ban
} from 'lucide-react';
import { Clock } from './Clock';
import { SystemStatus } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  status: SystemStatus | null;
  onOpenBlackholeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  status,
  onOpenBlackholeModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'portal', label: 'Portal', icon: Home },
    { id: 'map', label: 'Attack Map', icon: Globe },
    { id: 'kibana', label: 'Kibana Analytics', icon: BarChart3 },
    { id: 'elasticvue', label: 'Elasticvue', icon: Database },
    { id: 'spiderfoot', label: 'SpiderFoot OSINT', icon: Search },
    { id: 'cyberchef', label: 'CyberChef', icon: Wrench },
    { id: 'honeypots', label: 'Honeypots', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#e20074]/30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand logo & Clock */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentTab('portal')} 
            className="flex items-center gap-3 group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#e20074] to-pink-500 flex items-center justify-center text-white shadow-lg shadow-[#e20074]/30 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-russo text-xl md:text-2xl text-white tracking-wider flex items-center gap-2">
                CYBER<span className="text-[#e20074] cyber-glow">POT</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                Multi-Honeypot Framework
              </div>
            </div>
          </button>

          <div className="hidden lg:block border-l border-gray-800 pl-6">
            <Clock />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#e20074] text-white shadow-md shadow-[#e20074]/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & System Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBlackholeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 text-red-300 text-xs font-mono transition-colors shadow-sm"
            title="Manage Blackhole IP Rules"
          >
            <Ban className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Blackhole</span>
            <span className="bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {status?.blackholedIPsCount ?? 0}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>ACTIVE</span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg bg-gray-900 border border-gray-800"
          >
            <span className="sr-only">Open menu</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 p-3 bg-gray-900/95 rounded-xl border border-gray-800 space-y-1">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-[#e20074] text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
