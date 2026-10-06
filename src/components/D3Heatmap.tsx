import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AttackLog } from '../types';
import { Flame, Layers, Sliders, Globe, Activity, Eye, Zap } from 'lucide-react';

interface D3HeatmapProps {
  attacks: AttackLog[];
  onOpenBlackholeModal?: () => void;
}

interface ContinentDensity {
  name: string;
  count: number;
  pct: number;
  color: string;
  topCountries: string[];
}

export const D3Heatmap: React.FC<D3HeatmapProps> = ({ attacks }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [blurRadius, setBlurRadius] = useState<number>(28);
  const [heatOpacity, setHeatOpacity] = useState<number>(0.85);
  const [hoveredPoint, setHoveredPoint] = useState<{
    country: string;
    city: string;
    count: number;
    x: number;
    y: number;
    service: string;
  } | null>(null);

  // Group attacks by country / location for density calculation
  const points = React.useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; country: string; city: string; count: number; service: string }>();

    attacks.forEach(a => {
      const key = `${a.country}-${a.city || 'Unknown'}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          lat: a.lat,
          lng: a.lng,
          country: a.country,
          city: a.city || 'Regional Center',
          count: 1,
          service: a.service
        });
      }
    });

    // Add extra global cluster seed points for richer heatmap density
    const seedClusters = [
      { lat: 35.86, lng: 104.19, country: 'China', city: 'Beijing Cluster', count: 420, service: 'Tanner / Cowrie' },
      { lat: 61.52, lng: 105.31, country: 'Russia', city: 'Moscow Data Center', count: 380, service: 'Cowrie / Dionaea' },
      { lat: 37.09, lng: -95.71, country: 'United States', city: 'Dallas / Ashburn Hub', count: 310, service: 'Suricata / Conpot' },
      { lat: 23.81, lng: 90.41, country: 'Bangladesh', city: 'Dhaka CIRT Range', count: 540, service: 'All Nodes' },
      { lat: 51.16, lng: 10.45, country: 'Germany', city: 'Frankfurt IX', count: 210, service: 'Endlessh' },
      { lat: 20.59, lng: 78.96, country: 'India', city: 'Mumbai Cluster', count: 290, service: 'Dionaea' },
      { lat: -14.23, lng: -51.92, country: 'Brazil', city: 'São Paulo Exchange', count: 180, service: 'ADBHoney' },
      { lat: 14.05, lng: 108.27, country: 'Vietnam', city: 'Hanoi Subnet', count: 160, service: 'Heralding' },
      { lat: 32.42, lng: 53.68, country: 'Iran', city: 'Tehran Hub', count: 220, service: 'Redishoney' }
    ];

    seedClusters.forEach(sc => {
      const existing = map.get(`${sc.country}-${sc.city}`);
      if (existing) {
        existing.count += sc.count;
      } else {
        map.set(`${sc.country}-${sc.city}`, sc);
      }
    });

    return Array.from(map.values());
  }, [attacks]);

  // Continent Density Aggregation
  const continentsDensity: ContinentDensity[] = React.useMemo(() => {
    const conts: Record<string, { count: number; countries: Set<string> }> = {
      'Asia & Far East': { count: 0, countries: new Set() },
      'Europe & CIS': { count: 0, countries: new Set() },
      'North America': { count: 0, countries: new Set() },
      'South America': { count: 0, countries: new Set() },
      'Africa & Middle East': { count: 0, countries: new Set() },
      'Oceania': { count: 0, countries: new Set() }
    };

    points.forEach(p => {
      if (p.lng > 60 && p.lng < 150 && p.lat > 0) {
        conts['Asia & Far East'].count += p.count;
        conts['Asia & Far East'].countries.add(p.country);
      } else if (p.lng >= -15 && p.lng <= 60 && p.lat > 35) {
        conts['Europe & CIS'].count += p.count;
        conts['Europe & CIS'].countries.add(p.country);
      } else if (p.lng < -30 && p.lat > 10) {
        conts['North America'].count += p.count;
        conts['North America'].countries.add(p.country);
      } else if (p.lng < -30 && p.lat <= 10) {
        conts['South America'].count += p.count;
        conts['South America'].countries.add(p.country);
      } else if (p.lng >= -20 && p.lng <= 60 && p.lat <= 35) {
        conts['Africa & Middle East'].count += p.count;
        conts['Africa & Middle East'].countries.add(p.country);
      } else {
        conts['Oceania'].count += p.count;
        conts['Oceania'].countries.add(p.country);
      }
    });

    const total = Object.values(conts).reduce((acc, c) => acc + c.count, 0) || 1;

    const colors: Record<string, string> = {
      'Asia & Far East': '#ef4444',
      'Europe & CIS': '#f97316',
      'North America': '#e20074',
      'South America': '#a855f7',
      'Africa & Middle East': '#eab308',
      'Oceania': '#06b6d4'
    };

    return Object.entries(conts).map(([name, data]) => ({
      name,
      count: data.count,
      pct: Math.round((data.count / total) * 100),
      color: colors[name] || '#e20074',
      topCountries: Array.from(data.countries).slice(0, 3)
    })).sort((a, b) => b.count - a.count);
  }, [points]);

  // Render D3 Density Heatmap to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1000;
    const height = 550;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create D3 color scale (Dark -> Cyan -> Yellow -> Orange -> Deep Crimson Red)
    const colorScale = d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateRgbBasis([
        'rgba(0, 0, 0, 0)',
        'rgba(6, 182, 212, 0.4)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(249, 115, 22, 0.9)',
        'rgba(226, 0, 116, 0.95)',
        'rgba(239, 68, 68, 1.0)'
      ]));

    // Projection mapping
    const project = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return { x, y };
    };

    // Find max count for normalization
    const maxVal = d3.max(points, p => p.count) || 1;

    // Draw Heatmap Radial Densities using D3 Scale
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = heatOpacity;

    points.forEach(p => {
      const { x, y } = project(p.lat, p.lng);
      const intensity = Math.min(1, p.count / maxVal);
      const radius = blurRadius * (0.8 + intensity * 0.8);

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, colorScale(intensity));
      grad.addColorStop(0.5, colorScale(intensity * 0.5));
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Reset composite mode for point centroids & glow pulses
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    points.forEach(p => {
      const { x, y } = project(p.lat, p.lng);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e20074';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    });

  }, [points, blurRadius, heatOpacity]);

  // Handle Canvas Mouse Move for Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const targetX = xPct * 1000;
    const targetY = yPct * 550;

    // Find nearest point within 30px
    const nearest = points.find(p => {
      const px = ((p.lng + 180) / 360) * 1000;
      const py = ((90 - p.lat) / 180) * 550;
      const dist = Math.hypot(px - targetX, py - targetY);
      return dist < 35;
    });

    if (nearest) {
      const px = ((nearest.lng + 180) / 360) * 1000;
      const py = ((90 - nearest.lat) / 180) * 550;
      setHoveredPoint({
        country: nearest.country,
        city: nearest.city,
        count: nearest.count,
        x: px,
        y: py,
        service: nearest.service
      });
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* D3 Heatmap Header Controls Bar */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-russo text-lg text-white flex items-center gap-2">
              D3 GLOBAL ATTACK DENSITY HEATMAP
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                D3.JS MULTI-SPECTRAL
              </span>
            </div>
            <div className="text-gray-400 text-[11px]">
              Continuous spatial density estimation of cyber probe origins across world continents
            </div>
          </div>
        </div>

        {/* Heatmap Tuning Sliders */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-[11px]">Heat Radius:</span>
            <input
              type="range"
              min={15}
              max={50}
              value={blurRadius}
              onChange={(e) => setBlurRadius(Number(e.target.value))}
              className="w-24 accent-[#e20074]"
            />
            <span className="text-white font-bold w-6">{blurRadius}px</span>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-[11px]">Opacity:</span>
            <input
              type="range"
              min={0.3}
              max={1.0}
              step={0.05}
              value={heatOpacity}
              onChange={(e) => setHeatOpacity(Number(e.target.value))}
              className="w-20 accent-[#e20074]"
            />
            <span className="text-white font-bold w-10">{Math.round(heatOpacity * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Canvas Stage */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        className="cyber-box p-4 relative overflow-hidden bg-black rounded-2xl border border-gray-800 shadow-2xl"
      >
        {/* SVG World Map Vector Grid Overlay */}
        <svg
          viewBox="0 0 1000 550"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
          {/* Map Grid */}
          <defs>
            <pattern id="heatmapGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1f2937" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1000" height="550" fill="url(#heatmapGrid)" />

          {/* Continents Base Outline */}
          <g fill="#111827" stroke="#374151" strokeWidth="0.8" opacity="0.6">
            <path d="M 120 100 L 280 90 L 310 180 L 220 280 L 140 230 L 100 150 Z" />
            <path d="M 290 290 L 370 300 L 340 470 L 280 480 L 260 350 Z" />
            <path d="M 480 90 L 580 80 L 600 170 L 510 180 L 460 130 Z" />
            <path d="M 480 190 L 600 200 L 610 350 L 540 420 L 460 310 Z" />
            <path d="M 600 80 L 900 70 L 930 230 L 760 280 L 640 190 Z" />
            <path d="M 800 350 L 900 340 L 910 440 L 810 450 Z" />
          </g>
        </svg>

        {/* D3 Heatmap Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full h-auto max-h-[520px] rounded-xl block"
        />

        {/* Hovered Density Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute z-30 bg-black/90 p-3 rounded-xl border border-[#e20074] backdrop-blur-md shadow-2xl font-mono text-xs text-white pointer-events-none space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in"
            style={{
              left: `${(hoveredPoint.x / 1000) * 100}%`,
              top: `${(hoveredPoint.y / 550) * 100}%`
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 pb-1">
              <span className="font-russo text-[#e20074] text-sm flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-500" /> {hoveredPoint.country}
              </span>
              <span className="text-[10px] text-gray-400">{hoveredPoint.city}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] gap-3 pt-0.5">
              <span>Attack Density:</span>
              <strong className="text-amber-400">{hoveredPoint.count} hits / min</strong>
            </div>
            <div className="text-[10px] text-gray-400">
              Primary Vector: <strong className="text-cyan-300">{hoveredPoint.service}</strong>
            </div>
          </div>
        )}

        {/* Heatmap Legend Bar */}
        <div className="absolute bottom-6 left-6 z-20 bg-black/80 p-3 rounded-xl border border-gray-800 backdrop-blur-md font-mono text-xs flex items-center gap-3">
          <span className="text-gray-400 text-[10px] uppercase font-bold">Density Scale:</span>
          <div className="w-36 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 via-amber-500 via-orange-500 to-red-600 border border-gray-700" />
          <div className="flex items-center gap-2 text-[10px] text-gray-300">
            <span>Low</span>
            <span>•</span>
            <span className="text-red-400 font-bold">Critical High</span>
          </div>
        </div>
      </div>

      {/* Continent Attack Density Distribution Matrix */}
      <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4">
        <div className="font-russo text-lg text-white flex items-center justify-between border-b border-gray-800 pb-3">
          <span className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#e20074]" /> CONTINENT ATTACK DENSITY BREAKDOWN
          </span>
          <span className="text-xs font-mono text-gray-400">Regional Density Matrix</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {continentsDensity.map((cont) => (
            <div key={cont.name} className="p-4 bg-black/80 rounded-xl border border-gray-800 space-y-2 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{cont.name}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold" style={{ backgroundColor: `${cont.color}20`, color: cont.color, borderColor: cont.color, borderWidth: '1px' }}>
                  {cont.pct}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cont.pct}%`, backgroundColor: cont.color }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <span>Total Hits: <strong className="text-white">{cont.count.toLocaleString()}</strong></span>
                <span className="truncate max-w-[120px]">Origins: {cont.topCountries.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
