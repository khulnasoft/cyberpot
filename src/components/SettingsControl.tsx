import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Sliders, 
  ShieldAlert, 
  Mail, 
  Webhook, 
  Ban, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Radio, 
  Send, 
  RefreshCw, 
  Zap, 
  Server, 
  Settings as SettingsIcon,
  Volume2,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { ThresholdRule, TriggeredAlert, HoneypotService } from '../types';
import { NotificationHistory } from './NotificationHistory';

interface SettingsControlProps {
  onOpenBlackholeModal?: () => void;
}

export const SettingsControl: React.FC<SettingsControlProps> = () => {
  const [rules, setRules] = useState<ThresholdRule[]>([]);
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [activeRates, setActiveRates] = useState<Record<string, number>>({});
  const [honeypots, setHoneypots] = useState<HoneypotService[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  const [ruleName, setRuleName] = useState('');
  const [targetHoneypot, setTargetHoneypot] = useState('all');
  const [thresholdLimit, setThresholdLimit] = useState(25);
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(1);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [emailAddress, setEmailAddress] = useState('bdkhulnasoft@gmail.com');
  const [notifyBrowser, setNotifyBrowser] = useState(true);
  const [autoBlackhole, setAutoBlackhole] = useState(false);
  const [notifyWebhook, setNotifyWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');

  // Browser Notification API status
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Fetch Threshold Settings & Active Rates from Server
  const fetchSettings = async () => {
    try {
      const [res, hpRes] = await Promise.all([
        fetch('/api/settings/thresholds'),
        fetch('/api/honeypots')
      ]);

      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setAlerts(data.alerts || []);
        setActiveRates(data.activeRates || {});
      }

      if (hpRes.ok) {
        const hData = await hpRes.json();
        setHoneypots(hData || []);
      }
    } catch (err) {
      console.error('Error fetching threshold settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 3000);
    return () => clearInterval(interval);
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        new Notification('CyberPot SOC Alert Engine', {
          body: 'Browser notification channel activated. Attack threshold alerts will pop up in real-time.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      const payload = {
        id: editingRuleId || `rule-${Date.now()}`,
        name: ruleName.trim(),
        honeypotId: targetHoneypot,
        thresholdLimit: Number(thresholdLimit),
        timeWindowMinutes: Number(timeWindowMinutes),
        notifyEmail,
        emailAddress,
        notifyBrowser,
        autoBlackhole,
        notifyWebhook,
        webhookUrl,
        enabled: true,
        severity
      };

      const res = await fetch('/api/settings/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchSettings();
      }
    } catch (err) {
      console.error('Error saving threshold rule:', err);
    }
  };

  const resetForm = () => {
    setEditingRuleId(null);
    setRuleName('');
    setTargetHoneypot('all');
    setThresholdLimit(25);
    setTimeWindowMinutes(1);
    setNotifyEmail(true);
    setEmailAddress('bdkhulnasoft@gmail.com');
    setNotifyBrowser(true);
    setAutoBlackhole(false);
    setNotifyWebhook(false);
    setWebhookUrl('');
    setSeverity('HIGH');
  };

  const handleEditRule = (rule: ThresholdRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setTargetHoneypot(rule.honeypotId);
    setThresholdLimit(rule.thresholdLimit);
    setTimeWindowMinutes(rule.timeWindowMinutes || 1);
    setNotifyEmail(rule.notifyEmail);
    setEmailAddress(rule.emailAddress || 'bdkhulnasoft@gmail.com');
    setNotifyBrowser(rule.notifyBrowser);
    setAutoBlackhole(rule.autoBlackhole);
    setNotifyWebhook(rule.notifyWebhook);
    setWebhookUrl(rule.webhookUrl || '');
    setSeverity(rule.severity || 'HIGH');
    setShowForm(true);
  };

  const handleToggleRule = async (id: string) => {
    try {
      const res = await fetch('/api/settings/thresholds/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchSettings();
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/thresholds/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSettings();
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const handleTestTrigger = async (ruleId: string) => {
    try {
      const res = await fetch('/api/settings/thresholds/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });
      if (res.ok) {
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
        
        // Trigger browser notification if allowed
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('⚡ CyberPot Attack Frequency Alert [TEST]', {
            body: 'Threshold breached on Cowrie Honeypot: 37 attempts/min (Limit: 25/min)',
            icon: '/favicon.ico'
          });
        }
        fetchSettings();
      }
    } catch (err) {
      console.error('Error triggering test alert:', err);
    }
  };

  // Quick Preset Add helper
  const addPreset = (presetType: 'cowrie' | 'tanner' | 'global' | 'scada') => {
    if (presetType === 'cowrie') {
      setRuleName('SSH Brute-Force Rate Limit');
      setTargetHoneypot('cowrie');
      setThresholdLimit(15);
      setNotifyEmail(true);
      setNotifyBrowser(true);
      setSeverity('HIGH');
    } else if (presetType === 'tanner') {
      setRuleName('Web RCE & Vulnerability Scanner Burst');
      setTargetHoneypot('tanner');
      setThresholdLimit(30);
      setNotifyEmail(true);
      setNotifyBrowser(true);
      setAutoBlackhole(true);
      setSeverity('CRITICAL');
    } else if (presetType === 'global') {
      setRuleName('DDoS / Global Attack Surge');
      setTargetHoneypot('all');
      setThresholdLimit(80);
      setNotifyEmail(true);
      setNotifyBrowser(true);
      setAutoBlackhole(true);
      setSeverity('CRITICAL');
    } else if (presetType === 'scada') {
      setRuleName('Industrial SCADA Zero-Trust Intrusion Alert');
      setTargetHoneypot('conpot');
      setThresholdLimit(5);
      setNotifyEmail(true);
      setNotifyBrowser(true);
      setSeverity('CRITICAL');
    }
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-950/80 via-gray-900 to-gray-900 p-6 rounded-2xl border border-purple-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner">
            <Bell className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="font-russo text-2xl text-white flex items-center gap-3">
              ATTACK FREQUENCY NOTIFICATION THRESHOLDS
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> CONFIGURATION
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              Configure real-time frequency limits (attempts/min) per honeypot to dispatch email, browser alerts, webhooks, or auto-blackhole rules.
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Threshold Rule
          </button>
        </div>
      </div>

      {/* Test Notification Banner Feedback */}
      {testNotificationSent && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Test Alert Dispatched! Simulated threshold breach fired to Browser, Email, & Audit Log.</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">ACTIVE</span>
        </div>
      )}

      {/* Global Notification Channel Settings Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Channel 1: Web Browser Alert API */}
        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-2">
            <span className="text-gray-300 font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-purple-400" /> BROWSER SYSTEM NOTIFICATIONS
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              browserPermission === 'granted' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {browserPermission}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-mono">
            Direct OS/Browser popup notifications when attack frequency breaches rules.
          </p>

          {browserPermission !== 'granted' ? (
            <button
              onClick={requestBrowserPermission}
              className="w-full py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-mono font-bold transition-all"
            >
              Enable Browser Alerts
            </button>
          ) : (
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> HTML5 Notification Permission Active
            </div>
          )}
        </div>

        {/* Channel 2: Primary Email Endpoint */}
        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-2">
            <span className="text-gray-300 font-bold flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" /> SOC EMAIL ALERT DISPATCH
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              READY
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">RECIPIENT EMAIL ADDRESS</span>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Channel 3: Auto-Blackhole Intercept */}
        <div className="cyber-box p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-2">
            <span className="text-gray-300 font-bold flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-red-400" /> AUTO-BLACKHOLE FIREWALL INTERCEPT
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
              AUTOMATIC
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-mono">
            Automatically add offending IP to Blackhole rules upon exceeding threshold rate.
          </p>
        </div>

      </div>

      {/* Main Grid: Threshold Rules List + Live Attack Frequency Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Active Threshold Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="font-russo text-lg text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                ACTIVE THRESHOLD RULES ({rules.length})
              </div>

              {/* Preset Quick Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-mono">Quick Presets:</span>
                <button onClick={() => addPreset('cowrie')} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono rounded">
                  SSH
                </button>
                <button onClick={() => addPreset('tanner')} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono rounded">
                  Web RCE
                </button>
                <button onClick={() => addPreset('scada')} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono rounded">
                  SCADA
                </button>
                <button onClick={() => addPreset('global')} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono rounded">
                  DDoS
                </button>
              </div>
            </div>

            {/* Rules Cards */}
            <div className="space-y-3">
              {rules.map((rule) => {
                const targetHpName = rule.honeypotId === 'all' 
                  ? 'All Honeypot Nodes' 
                  : honeypots.find(h => h.id === rule.honeypotId)?.name || rule.honeypotId;

                const currentRate = activeRates[rule.honeypotId] || activeRates['all'] || 0;
                const isBreached = currentRate >= rule.thresholdLimit && rule.enabled;

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all font-mono text-xs space-y-3 ${
                      isBreached
                        ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/40'
                        : rule.enabled
                        ? 'bg-black/70 border-gray-800 hover:border-purple-800/60'
                        : 'bg-black/30 border-gray-900 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            rule.enabled ? 'bg-purple-600' : 'bg-gray-800'
                          }`}
                          title="Toggle Rule Enable/Disable"
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>

                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {rule.name}
                            <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                              rule.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                              rule.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                              'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {rule.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                            <span>Node: <strong className="text-purple-300">{targetHpName}</strong></span>
                            <span>•</span>
                            <span>Limit: <strong className="text-amber-300">{rule.thresholdLimit} attempts / {rule.timeWindowMinutes || 1}m</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleTestTrigger(rule.id)}
                          className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-200 text-[11px] flex items-center gap-1 transition-colors"
                          title="Test Firing Alert"
                        >
                          <Zap className="w-3 h-3 text-amber-400" /> Test Fire
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 rounded bg-red-950/50 hover:bg-red-900 text-red-400 border border-red-900/50 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Badges & Live Rate Meter */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Configured Actions:</span>
                        {rule.notifyEmail && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                        {rule.notifyBrowser && (
                          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 text-[10px] font-bold flex items-center gap-1">
                            <Bell className="w-3 h-3" /> Browser
                          </span>
                        )}
                        {rule.notifyWebhook && (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-bold flex items-center gap-1">
                            <Webhook className="w-3 h-3" /> Webhook
                          </span>
                        )}
                        {rule.autoBlackhole && (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 text-[10px] font-bold flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Auto-Blackhole
                          </span>
                        )}
                      </div>

                      <div className="text-[11px]">
                        Triggered <strong className="text-white">{rule.triggerCount}</strong> times
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Attack Frequency Gauge / Sensor Meters */}
        <div className="space-y-4">
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="font-russo text-lg text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                LIVE FREQUENCY METERS
              </div>
              <span className="text-xs font-mono text-gray-500">attempts / 60s</span>
            </div>

            {/* Frequency Progress Gauges */}
            <div className="space-y-3 font-mono text-xs">
              
              {/* All Nodes Gauge */}
              <div className="bg-black/80 p-3 rounded-xl border border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-purple-400" /> All Honeypots Combined
                  </span>
                  <span className="font-bold text-amber-400">{activeRates['all'] || 0} req/min</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((activeRates['all'] || 0) / 100) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Individual Honeypots */}
              {honeypots.slice(0, 6).map((hp) => {
                const rate = activeRates[hp.id] || 0;
                // find lowest threshold for this honeypot
                const activeRule = rules.find(r => r.enabled && (r.honeypotId === hp.id || r.honeypotId === 'all'));
                const limit = activeRule ? activeRule.thresholdLimit : 50;
                const pct = Math.min(100, Math.round((rate / limit) * 100));
                const isOver = rate >= limit;

                return (
                  <div key={hp.id} className="bg-black/60 p-2.5 rounded-lg border border-gray-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300 font-bold">{hp.name}</span>
                      <span className={`font-bold ${isOver ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                        {rate} / {limit} req/min
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-900 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Triggered Alert Audit History */}
          <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-3">
            <div className="font-russo text-lg text-white flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> ALERT AUDIT LOG
              </span>
              <span className="text-xs font-mono text-gray-500">{alerts.length} events</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 font-mono text-[11px]">
              {alerts.length > 0 ? (
                alerts.map((al) => (
                  <div key={al.id} className="p-2.5 bg-black/80 rounded-lg border border-gray-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400 truncate">{al.ruleName}</span>
                      <span className="text-[9px] text-gray-500">{new Date(al.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="text-gray-400 text-[10px]">
                      Node: <strong className="text-white">{al.honeypotName}</strong> ({al.currentAttempts} / {al.thresholdLimit} req/min)
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {al.actionsTaken?.map((act, idx) => (
                        <span key={idx} className="text-[8px] px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded uppercase">
                          {act.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No threshold alert triggers logged yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Full-width Chronological Notification History Log */}
      <NotificationHistory 
        alerts={alerts} 
        onClearHistory={() => setAlerts([])} 
      />

      {/* Modal / Form Slide-Over for Creating/Editing Threshold Rule */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-800/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-russo text-lg text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                {editingRuleId ? 'EDIT THRESHOLD RULE' : 'CONFIGURE THRESHOLD RULE'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              
              {/* Rule Name */}
              <div>
                <label className="text-gray-400 text-[10px] block mb-1">RULE DESCRIPTIVE NAME</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. SSH Brute-Force Rate Limit Alert"
                  className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Target Honeypot Node */}
              <div>
                <label className="text-gray-400 text-[10px] block mb-1">TARGET HONEYPOT SENSOR NODE</label>
                <select
                  value={targetHoneypot}
                  onChange={(e) => setTargetHoneypot(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Honeypot Nodes Combined</option>
                  {honeypots.map(hp => (
                    <option key={hp.id} value={hp.id}>{hp.name} ({hp.type})</option>
                  ))}
                </select>
              </div>

              {/* Threshold Frequency Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-[10px] block mb-1">ATTACK FREQUENCY THRESHOLD</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={thresholdLimit}
                      onChange={(e) => setThresholdLimit(Number(e.target.value))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-gray-400 text-[10px]">attempts</span>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-[10px] block mb-1">TIME WINDOW</label>
                  <select
                    value={timeWindowMinutes}
                    onChange={(e) => setTimeWindowMinutes(Number(e.target.value))}
                    className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={1}>Per 1 Minute</option>
                    <option value={5}>Per 5 Minutes</option>
                    <option value={15}>Per 15 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Severity Selection */}
              <div>
                <label className="text-gray-400 text-[10px] block mb-1">ALERT SEVERITY LEVEL</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-lg border font-bold text-[11px] transition-all ${
                        severity === sev 
                          ? sev === 'CRITICAL' ? 'bg-red-950 border-red-500 text-red-300' :
                            sev === 'HIGH' ? 'bg-orange-950 border-orange-500 text-orange-300' :
                            'bg-amber-950 border-amber-500 text-amber-300'
                          : 'bg-black border-gray-800 text-gray-400'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Action Toggles */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <span className="text-gray-400 text-[10px] block">TRIGGERED NOTIFICATION ACTIONS</span>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-black/60 border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyBrowser}
                    onChange={(e) => setNotifyBrowser(e.target.checked)}
                    className="rounded border-gray-800 text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-white font-bold">Browser System Alert & Toast</div>
                    <div className="text-[10px] text-gray-500">HTML5 OS push notification & in-app banner</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-black/60 border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="rounded border-gray-800 text-purple-600 focus:ring-0"
                  />
                  <div className="flex-1">
                    <div className="text-white font-bold">Dispatch Email Alert</div>
                    <div className="text-[10px] text-gray-500">Send instant advisory email to SOC recipient</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-black/60 border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBlackhole}
                    onChange={(e) => setAutoBlackhole(e.target.checked)}
                    className="rounded border-gray-800 text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-red-400 font-bold">Auto-Blackhole Attacker IP</div>
                    <div className="text-[10px] text-gray-500">Automatically block offending source IP in firewall</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-black/60 border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWebhook}
                    onChange={(e) => setNotifyWebhook(e.target.checked)}
                    className="rounded border-gray-800 text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-amber-400 font-bold">Webhook Event Post (Slack / Discord)</div>
                    <div className="text-[10px] text-gray-500">POST JSON payload to external SIEM or messaging endpoint</div>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-950/50"
                >
                  {editingRuleId ? 'Update Rule' : 'Save Threshold Rule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
