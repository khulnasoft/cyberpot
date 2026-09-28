import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Globe, 
  RotateCw, 
  Eye, 
  Maximize2, 
  Zap, 
  ShieldAlert, 
  Filter, 
  Layers, 
  Crosshair,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Ban
} from 'lucide-react';
import { AttackLog } from '../types';

interface ThreeDThreatMapProps {
  attacks: AttackLog[];
  onOpenBlackholeModal?: () => void;
}

// Convert Lat/Lng to 3D Sphere coordinates
function latLngToVector3(lat: number, lng: number, radius: number, alt: number = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + alt;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Sample continent landmass coordinates for dots overlay
const LANDMASS_POINTS: [number, number][] = [
  // North America
  [40, -100], [45, -95], [35, -118], [50, -120], [60, -110], [30, -90], [25, -80], [45, -75], [55, -80], [65, -100],
  // South America
  [-10, -55], [-15, -48], [-23, -43], [-34, -58], [-5, -75], [-20, -70], [5, -73], [0, -60],
  // Europe
  [50, 10], [52, 5], [48, 2], [41, 12], [40, -3], [55, 37], [60, 25], [65, 18], [45, 25], [52, 13], [59, 18],
  // Africa
  [30, 31], [20, 10], [10, 0], [0, 20], [-10, 25], [-25, 28], [-30, 20], [5, 38], [15, 30], [25, 15],
  // Asia
  [23.81, 90.41], [22.35, 91.78], [24.89, 91.86], [35, 105], [40, 116], [30, 120], [22, 114], [35, 78], [28, 84], [60, 100], [55, 73], [40, 50], [25, 55], [35, 139],
  // Australia / Oceania
  [-25, 135], [-30, 150], [-20, 120], [-35, 138], [-38, 145], [-42, 172]
];

export const ThreeDThreatMap: React.FC<ThreeDThreatMapProps> = ({ attacks, onOpenBlackholeModal }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeVector, setActiveVector] = useState<AttackLog | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [hudViewMode, setHudViewMode] = useState<'globe' | 'tactical'>('globe');

  const controlsRef = useRef<OrbitControls | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);

  // Filtered attacks list
  const filteredAttacks = attacks.filter(a => {
    if (selectedService !== 'all' && a.service !== selectedService) return false;
    if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) return false;
    if (selectedCountry !== 'all' && a.countryCode !== selectedCountry) return false;
    return true;
  });

  useEffect(() => {
    if (filteredAttacks.length > 0 && !paused) {
      setActiveVector(filteredAttacks[0]);
    }
  }, [attacks, paused, selectedService, selectedSeverity, selectedCountry]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 260);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 120;
    controls.maxDistance = 450;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xe20074, 2);
    dirLight1.position.set(200, 100, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f2fe, 1.5);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    const GLOBE_RADIUS = 70;

    // 6. Globe Base Sphere (Dark Cyber Metal)
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x070d19,
      emissive: 0x020611,
      specular: 0x1e293b,
      shininess: 25,
      transparent: true,
      opacity: 0.95
    });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globe);

    // 7. Wireframe Overlay
    const wireframeGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.2, 36, 18);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    scene.add(wireframeMesh);

    // 8. Outer Atmosphere Glow Shell
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 3, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0xe20074,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // 9. Continent Dot Matrix
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions: number[] = [];
    
    // Density matrix generation around continent centers
    LANDMASS_POINTS.forEach(([plat, plng]) => {
      for (let i = 0; i < 40; i++) {
        const offsetLat = plat + (Math.random() - 0.5) * 18;
        const offsetLng = plng + (Math.random() - 0.5) * 22;
        const vec = latLngToVector3(offsetLat, offsetLng, GLOBE_RADIUS + 0.5);
        dotPositions.push(vec.x, vec.y, vec.z);
      }
    });

    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.6,
      transparent: true,
      opacity: 0.7
    });
    const continentPoints = new THREE.Points(dotGeo, dotMat);
    scene.add(continentPoints);

    // 10. Central Target CyberPot Node (Frankfurt Hub, Lat: 51.16, Lng: 10.45)
    const targetVector = latLngToVector3(51.16, 10.45, GLOBE_RADIUS + 0.8);

    // Glowing Target Ring
    const targetRingGeo = new THREE.RingGeometry(1, 2.5, 32);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0xe20074,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.position.copy(targetVector);
    targetRing.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(targetRing);

    // Laser Light Beam from Hub
    const laserGeo = new THREE.CylinderGeometry(0.4, 0.4, 30, 16);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xe20074,
      transparent: true,
      opacity: 0.8
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    const laserPos = latLngToVector3(51.16, 10.45, GLOBE_RADIUS + 15);
    laserBeam.position.copy(laserPos);
    laserBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetVector.clone().normalize());
    scene.add(laserBeam);

    // 11. Attack Arcs & Particle Trajectories
    const activeGroup = new THREE.Group();
    scene.add(activeGroup);

    const animatedParticles: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; speed: number; progress: number }[] = [];

    const visibleAttacks = filteredAttacks.slice(0, 25);

    visibleAttacks.forEach((attack) => {
      const srcVec = latLngToVector3(attack.lat, attack.lng, GLOBE_RADIUS + 0.8);
      const colorHex = attack.severity === 'CRITICAL' ? 0xef4444 : attack.severity === 'HIGH' ? 0xf97316 : 0xe20074;

      // Source point glowing marker
      const srcMarkerGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const srcMarkerMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const srcMarker = new THREE.Mesh(srcMarkerGeo, srcMarkerMat);
      srcMarker.position.copy(srcVec);
      activeGroup.add(srcMarker);

      // Arc midpoint calculated outwards
      const dist = srcVec.distanceTo(targetVector);
      const arcHeight = Math.min(dist * 0.35, 45);
      const midVec = srcVec.clone().add(targetVector).multiplyScalar(0.5);
      midVec.normalize().multiplyScalar(GLOBE_RADIUS + arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(srcVec, midVec, targetVector);
      const curvePoints = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

      const curveMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: attack.id === activeVector?.id ? 0.9 : 0.35,
        linewidth: 1
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      activeGroup.add(arcLine);

      // Animated Trajectory Particle
      const particleGeo = new THREE.SphereGeometry(1.4, 12, 12);
      const particleMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const particleMesh = new THREE.Mesh(particleGeo, particleMat);
      particleMesh.position.copy(srcVec);
      activeGroup.add(particleMesh);

      animatedParticles.push({
        mesh: particleMesh,
        curve,
        speed: 0.006 + Math.random() * 0.008,
        progress: Math.random()
      });
    });

    // 12. Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Animate trajectory particles
      animatedParticles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      // Target ring pulse effect
      const time = Date.now() * 0.003;
      targetRing.scale.setScalar(1 + Math.sin(time) * 0.2);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, [filteredAttacks.length, selectedService, selectedSeverity, selectedCountry, autoRotate]);

  // Handle camera focus on specific country
  const focusOnCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const countrySample = attacks.find(a => a.countryCode === countryCode);
    if (countrySample && controlsRef.current) {
      const vec = latLngToVector3(countrySample.lat, countrySample.lng, 220);
      controlsRef.current.object.position.copy(vec);
      controlsRef.current.update();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Cyber Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/90 p-4 rounded-xl border border-gray-800">
        <div>
          <div className="font-russo text-xl text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#e20074] animate-spin-slow" />
            3D GLOBAL CYBER THREAT GLOBE
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Interactive WebGL 3D telemetry visualization • Intercepting active attack arcs
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Honeypot Filter */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-mono"
            >
              <option value="all" className="bg-gray-900">All Honeypots</option>
              <option value="cowrie" className="bg-gray-900">Cowrie (SSH)</option>
              <option value="dionaea" className="bg-gray-900">Dionaea (SMB)</option>
              <option value="conpot" className="bg-gray-900">Conpot (SCADA)</option>
              <option value="tanner" className="bg-gray-900">Tanner (Web)</option>
              <option value="heralding" className="bg-gray-900">Heralding (Auth)</option>
            </select>
          </div>

          {/* Country Focus Filter */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
            <Crosshair className="w-3.5 h-3.5 text-[#e20074]" />
            <select
              value={selectedCountry}
              onChange={(e) => focusOnCountry(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-mono"
            >
              <option value="all" className="bg-gray-900">All Countries</option>
              <option value="BD" className="bg-gray-900">🇧🇩 Bangladesh (BD)</option>
              <option value="CN" className="bg-gray-900">🇨🇳 China (CN)</option>
              <option value="RU" className="bg-gray-900">🇷🇺 Russia (RU)</option>
              <option value="US" className="bg-gray-900">🇺🇸 United States (US)</option>
              <option value="BR" className="bg-gray-900">🇧🇷 Brazil (BR)</option>
              <option value="DE" className="bg-gray-900">🇩🇪 Germany (DE)</option>
              <option value="NL" className="bg-gray-900">🇳🇱 Netherlands (NL)</option>
              <option value="IN" className="bg-gray-900">🇮🇳 India (IN)</option>
              <option value="UA" className="bg-gray-900">🇺🇦 Ukraine (UA)</option>
              <option value="VN" className="bg-gray-900">🇻🇳 Vietnam (VN)</option>
              <option value="IR" className="bg-gray-900">🇮🇷 Iran (IR)</option>
            </select>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              autoRotate
                ? 'bg-[#e20074]/20 border-[#e20074] text-[#e20074]'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Toggle 3D Globe Auto Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{autoRotate ? 'ROTATING' : 'PAUSED'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Toggle Alert Audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="cyber-box relative overflow-hidden bg-black rounded-2xl border border-gray-800 shadow-2xl h-[560px]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D Viewport Corner HUD Overlay */}
        <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 font-mono text-[11px] text-gray-400">
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SENSOR NODE: <strong className="text-white">FRANKFURT HUB (DE)</strong></span>
          </div>
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800/80">
            ACTIVE ARCS: <strong className="text-[#e20074]">{filteredAttacks.length}</strong>
          </div>
        </div>

        {/* Live Attack Vector Spotlight Card */}
        {activeVector && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md bg-black/90 p-4 rounded-xl border border-[#e20074]/60 backdrop-blur-md shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#e20074] font-bold flex items-center gap-1.5 uppercase">
                <Zap className="w-3.5 h-3.5 animate-bounce" /> INTERCEPTING VECTOR
              </span>
              <span className="text-gray-400">{new Date(activeVector.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>{activeVector.srcIp}</span>
                <span className="text-xs text-gray-400 font-normal">({activeVector.countryCode})</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeVector.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                activeVector.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {activeVector.severity}
              </span>
            </div>

            <div className="text-xs text-gray-300 font-mono flex items-center justify-between border-t border-gray-800/80 pt-2">
              <span>Location: <strong className="text-white">{activeVector.city}, {activeVector.country}</strong></span>
              <span>Target Port: <strong className="text-[#e20074]">{activeVector.dstPort} ({activeVector.service})</strong></span>
            </div>

            {activeVector.credentials && (
              <div className="text-xs font-mono text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-900/50">
                Credentials Captured: <strong className="text-white">{activeVector.credentials.user}:{activeVector.credentials.pass}</strong>
              </div>
            )}

            {onOpenBlackholeModal && (
              <div className="pt-1 flex justify-end">
                <button
                  onClick={onOpenBlackholeModal}
                  className="px-3 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-1.5"
                >
                  <Ban className="w-3 h-3" /> Drop Attacker IP
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
