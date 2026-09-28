import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';

export type GalaxyNodeId =
  | 'overview' | 'messenger' | 'users' | 'economy' | 'rpg' | 'games'
  | 'moderation' | 'music' | 'analytics' | 'logs' | 'health' | 'settings';

interface Orbit { rx: number; ry: number; }

const ORBITS: Orbit[] = [
  { rx: 128, ry: 64 },
  { rx: 195, ry: 150 },
  { rx: 270, ry: 118 },
  { rx: 345, ry: 240 },
];

const BELT_ORBIT = 2;

interface GalaxyNode {
  id: GalaxyNodeId;
  label: string;
  orbit: number;
  angle: number;
  color: string;
  size: number;
}

const NODES: GalaxyNode[] = [
  { id: 'messenger', label: 'Messenger', orbit: 0, angle: 18, color: '#b9829b', size: 7 },
  { id: 'users', label: 'Users', orbit: 0, angle: 205, color: '#a994c7', size: 6 },
  { id: 'economy', label: 'Economy', orbit: 1, angle: 60, color: '#c9a86a', size: 7 },
  { id: 'rpg', label: 'RPG', orbit: 1, angle: 300, color: '#8fb0d2', size: 8 },
  { id: 'games', label: 'Games', orbit: 1, angle: 160, color: '#7ac9a0', size: 6 },
  { id: 'moderation', label: 'Moderation', orbit: 2, angle: 20, color: '#d88a8a', size: 6 },
  { id: 'music', label: 'Music', orbit: 2, angle: 130, color: '#e0a9d0', size: 6 },
  { id: 'analytics', label: 'Analytics', orbit: 2, angle: 240, color: '#9ac9e0', size: 6 },
  { id: 'logs', label: 'Logs', orbit: 3, angle: 80, color: '#c6c6c6', size: 5 },
  { id: 'health', label: 'Bot Health', orbit: 3, angle: 195, color: '#e08a8a', size: 5 },
  { id: 'settings', label: 'Settings', orbit: 3, angle: 310, color: '#a0a0a0', size: 5 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star { x: number; y: number; r: number; o: number; glow: boolean; tw: number; }\ninterface MilkyStar { x: number; y: number; r: number; o: number; phase: number; }
interface Bokeh { x: number; y: number; r: number; o: number; hue: string; }
interface DistantGalaxy { x: number; y: number; rx: number; ry: number; rot: number; o: number; hue: string; }
interface Belt { angle: number; jitter: number; r: number; o: number; }
interface Comet { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number; }

function buildStars(count: number, seed: number, w: number, h: number): Star[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h,
    r: rand() * 1.4 + 0.3,
    o: rand() * 0.6 + 0.25,
    glow: rand() > 0.9,
    tw: rand() * 6 + 3,
  }));
}

function buildMilkyWayStars(count: number, seed: number, w: number, h: number): MilkyStar[] {
  const rand = seededRandom(seed);
  const stars: MilkyStar[] = [];
  const centerY = h * 0.47;
  const bandHeight = Math.max(70, h * 0.18);

  for (let i = 0; i < count; i += 1) {
    const x = rand() * w;
    const spread = (rand() + rand() + rand() - 1.5) / 1.5;
    const y = centerY + spread * bandHeight + Math.sin(x / Math.max(1, w) * Math.PI * 5) * bandHeight * 0.18;
    stars.push({
      x,
      y,
      r: rand() * 0.65 + 0.18,
      o: rand() * 0.22 + 0.08,
      phase: rand() * Math.PI * 2,
    });
  }
  return stars;
}

function drawMilkyWayBand(ctx: CanvasRenderingContext2D, stars: MilkyStar[], t: number, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const star of stars) {
    const drift = ((t * 0.002) % w);
    const x = (star.x + drift) % w;
    const twinkle = 0.78 + Math.sin(t * 0.0012 + star.phase) * 0.22;
    ctx.globalAlpha = star.o * twinkle;
    ctx.fillStyle = '#dcd6e7';
    ctx.beginPath();
    ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function buildBokeh(count: number, seed: number, w: number, h: number): Bokeh[] {
  const rand = seededRandom(seed);
  const hues = ['rgba(185,130,155,', 'rgba(169,148,199,', 'rgba(143,176,210,'];
  return Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h,
    r: rand() * 30 + 18,
    o: rand() * 0.05 + 0.02,
    hue: hues[Math.floor(rand() * hues.length)],
  }));
}

function buildDistantGalaxies(count: number, seed: number, w: number, h: number): DistantGalaxy[] {
  const rand = seededRandom(seed);
  const hues = [
    'rgba(216,169,208,', 'rgba(154,201,224,',
    'rgba(201,168,106,', 'rgba(169,148,199,',
  ];
  return Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h,
    rx: rand() * 22 + 14,
    ry: rand() * 8 + 4,
    rot: rand() * Math.PI,
    o: rand() * 0.16 + 0.05,
    hue: hues[Math.floor(rand() * hues.length)],
  }));
}

function buildBelt(count: number, seed: number): Belt[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    angle: rand() * 360,
    jitter: (rand() - 0.5) * 14,
    r: rand() * 1.3 + 0.4,
    o: rand() * 0.35 + 0.12,
  }));
}

function drawStarLayer(ctx: CanvasRenderingContext2D, stars: Star[], t: number, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  for (const star of stars) {
    const twinkle = star.glow ? 0.55 + Math.sin(t / (star.tw * 500) + star.x) * 0.45 : 1;
    ctx.globalAlpha = star.o * twinkle;
    ctx.beginPath();
    if (star.glow) {
      const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 5);
      grad.addColorStop(0, 'rgba(244,239,248,0.9)');
      grad.addColorStop(1, 'rgba(244,239,248,0)');
      ctx.fillStyle = grad;
      ctx.arc(star.x, star.y, star.r * 5, 0, Math.PI * 2);
    } else {
      ctx.fillStyle = '#f4eff8';
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDistantGalaxies(ctx: CanvasRenderingContext2D, galaxies: DistantGalaxy[]) {
  for (const g of galaxies) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, g.rx);
    grad.addColorStop(0, g.hue + g.o + ')');
    grad.addColorStop(1, g.hue + '0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rx, g.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBokeh(ctx: CanvasRenderingContext2D, dots: Bokeh[]) {
  for (const b of dots) {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, b.hue + b.o + ')');
    grad.addColorStop(1, b.hue + '0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawComets(ctx: CanvasRenderingContext2D, comets: Comet[], w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  for (const c of comets) {
    const alpha = Math.max(0, 1 - c.life / c.maxLife);
    const tailX = c.x - c.vx * c.len;
    const tailY = c.y - c.vy * c.len;
    const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
    grad.addColorStop(0, `rgba(244,239,248,${alpha})`);
    grad.addColorStop(1, 'rgba(244,239,248,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  }
}

export interface GalaxyCanvasProps {
  focusId: GalaxyNodeId;
  onSelect: (id: GalaxyNodeId) => void;
}

const DRAG_THRESHOLD = 6;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;

function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function GalaxyCanvas({ focusId, onSelect }: GalaxyCanvasProps) {
  const farRef = useRef<HTMLCanvasElement | null>(null);
  const midRef = useRef<HTMLCanvasElement | null>(null);
  const nearRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<GalaxyNodeId | null>(null);\n  const [orbitPhase, setOrbitPhase] = useState(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const movedDistance = useRef(0);
  const suppressNextClick = useRef(false);
  const pinch = useRef<{ startDist: number; startZoom: number } | null>(null);
  const starsRef = useRef<{ far: Star[]; mid: Star[]; near: Star[]; milky: MilkyStar[] }>({ far: [], mid: [], near: [], milky: [] });\n  const dprRef = useRef(1);
  const galaxiesRef = useRef<DistantGalaxy[]>([]);
  const bokehRef = useRef<Bokeh[]>([]);
  const cometsRef = useRef<Comet[]>([]);
  const nextCometAt = useRef(0);
  const belt = useMemo(() => buildBelt(70, 77), []);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    const canvases = [farRef.current, midRef.current, nearRef.current, fxRef.current];
    if (canvases.some((canvas) => !canvas)) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvases.forEach((canvas) => {
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
        }
      });
      starsRef.current = {
        far: buildStars(180, 11, w, h),
        mid: buildStars(90, 29, w, h),
        near: buildStars(40, 53, w, h),
      };
      galaxiesRef.current = buildDistantGalaxies(6, 41, w, h);
      bokehRef.current = buildBokeh(10, 63, w, h);
    };

    resize();
    window.addEventListener('resize', resize);
    let raf = 0;
    let running = true;

    const spawnComet = (w: number, h: number) => {
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -40 : w + 40;
      const startY = Math.random() * h * 0.5;
      const speed = 5 + Math.random() * 3.5;
      const dir = fromLeft ? 1 : -1;
      cometsRef.current.push({
        x: startX, y: startY, vx: dir * speed * 0.9, vy: speed * 0.55,
        life: 0, maxLife: 60, len: 14,
      });
    };

    const loop = (t: number) => {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const far = farRef.current?.getContext('2d');
      const mid = midRef.current?.getContext('2d');
      const near = nearRef.current?.getContext('2d');
      const fx = fxRef.current?.getContext('2d');

      if (far) {
        far.clearRect(0, 0, w, h);
        drawDistantGalaxies(far, galaxiesRef.current);
        drawStarLayer(far, starsRef.current.far, t, w, h);
      }
      if (mid) drawStarLayer(mid, starsRef.current.mid, t, w, h);
      if (near) {
        near.clearRect(0, 0, w, h);
        drawBokeh(near, bokehRef.current);
        drawStarLayer(near, starsRef.current.near, t, w, h);
      }
      if (fx) {
        if (!reducedMotion) {
          if (t > nextCometAt.current) {
            spawnComet(w, h);
            nextCometAt.current = t + 6000 + Math.random() * 7000;
          }
          cometsRef.current.forEach((comet) => {
            comet.x += comet.vx;
            comet.y += comet.vy;
            comet.life += 1;
          });
          cometsRef.current = cometsRef.current.filter((comet) => comet.life < comet.maxLife);
        }
        drawComets(fx, cometsRef.current, w, h);
      }
      if (!reducedMotion) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (pointers.current.size === 1) {
      movedDistance.current = 0;
      dragOrigin.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      pinch.current = null;
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { startDist: pointerDistance(a, b), startZoom: zoom };
    }
  }, [pan, zoom]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const ratio = pointerDistance(a, b) / (pinch.current.startDist || 1);
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.current.startZoom * ratio)));
      movedDistance.current = DRAG_THRESHOLD + 1;
      return;
    }

    if (pointers.current.size === 1) {
      const dx = event.clientX - dragOrigin.current.x;
      const dy = event.clientY - dragOrigin.current.y;
      movedDistance.current = Math.max(movedDistance.current, Math.hypot(dx, dy));
      setPan({
        x: dragOrigin.current.panX + dx,
        y: dragOrigin.current.panY + dy,
      });
    }
  }, []);

  const endPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Browser may already have released pointer capture.
    }

    if (pointers.current.size === 0 && movedDistance.current > DRAG_THRESHOLD) {
      suppressNextClick.current = true;
    }
  }, []);

  const onWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((currentZoom) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom - event.deltaY * 0.0009))
    );
  }, []);

  const handleNodeClick = useCallback((id: GalaxyNodeId) => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    onSelect(id);
  }, [onSelect]);

  const beltOrbit = ORBITS[BELT_ORBIT];
  const depthFocus = hoveredNode ?? focusId;

  return (
    <div
      className="galaxy-root"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={onWheel}
    >
      <canvas ref={farRef} className="galaxy-layer galaxy-layer-far" aria-hidden="true"
        style={{ transform: `translate3d(${pan.x * 0.15}px, ${pan.y * 0.15}px, 0)` }} />
      <div className="galaxy-nebula" aria-hidden="true"
        style={{ transform: `translate3d(${pan.x * 0.2}px, ${pan.y * 0.2}px, 0) scale(${1 + (zoom - 1) * 0.08})` }}>
        <span className="nebula-a" /><span className="nebula-b" />
        <span className="nebula-c" /><span className="nebula-d" />
      </div>
      <canvas ref={midRef} className="galaxy-layer galaxy-layer-mid" aria-hidden="true"
        style={{ transform: `translate3d(${pan.x * 0.35}px, ${pan.y * 0.35}px, 0)` }} />
      <canvas ref={fxRef} className="galaxy-layer galaxy-layer-fx" aria-hidden="true"
        style={{ transform: `translate3d(${pan.x * 0.35}px, ${pan.y * 0.35}px, 0)` }} />
      <canvas ref={nearRef} className="galaxy-layer galaxy-layer-near" aria-hidden="true"
        style={{ transform: `translate3d(${pan.x * 0.55}px, ${pan.y * 0.55}px, 0)` }} />

      <div className="galaxy-system"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, ["--galaxy-depth" as string]: `${Math.min(1.8, Math.max(.6, zoom))}` }}>
        <button type="button" className="galaxy-sun" aria-label="Open ECLIPSE overview" onClick={() => handleNodeClick('overview')}><span className="galaxy-sun-corona" aria-hidden="true" /></button>

        <svg className="galaxy-orbits" viewBox="-400 -400 800 800" aria-hidden="true">
          {ORBITS.map((orbit, index) => (
            <ellipse key={index} cx="0" cy="0" rx={orbit.rx} ry={orbit.ry}
              className={`orbit-ring orbit-ring-${index}`} />
          ))}
          <g className="galaxy-belt">
            {belt.map((point, index) => {
              const rad = (point.angle * Math.PI) / 180;
              const rx = beltOrbit.rx + point.jitter;
              const ry = beltOrbit.ry + point.jitter * (beltOrbit.ry / beltOrbit.rx);
              return (
                <circle key={index}
                  cx={Math.cos(rad) * rx}
                  cy={Math.sin(rad) * ry}
                  r={point.r} fill="#d8d2e3" opacity={point.o} />
              );
            })}
          </g>
        </svg>

        {NODES.map((node) => {
          const orbit = ORBITS[node.orbit];
          const orbitSpeed = [8, -6, 4, -2.5][node.orbit] ?? 0;
          const rad = ((node.angle + orbitPhase * orbitSpeed) * Math.PI) / 180;
          const x = Math.cos(rad) * orbit.rx;
          const y = Math.sin(rad) * orbit.ry;
          const active = node.id === focusId;
          return (
            <button key={node.id} type="button"
              className={`galaxy-node ${active ? 'is-active' : ''} ${depthFocus === node.id ? 'is-depth-focus' : ''}`}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0)`,
                ['--node-color' as string]: node.color,
                ['--node-size' as string]: `${node.size}px`,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onFocus={() => setHoveredNode(node.id)}
              onBlur={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.id)}>
              <span className="galaxy-node-dot" />
              <span className="galaxy-node-label">{node.label}</span>
            </button>
          );
        })}
      </div>

      <div className="galaxy-vignette" aria-hidden="true" />
    </div>
  );
}
