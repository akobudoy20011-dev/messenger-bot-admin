import { useEffect, useMemo, useRef } from 'react';

export type GalaxyNodeId =
  | 'overview'
  | 'messenger'
  | 'users'
  | 'economy'
  | 'rpg'
  | 'games'
  | 'moderation'
  | 'music'
  | 'analytics'
  | 'logs'
  | 'health'
  | 'settings';

type GalaxyNode = {
  id: GalaxyNodeId;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  radius: number;
  color: string;
};

type Props = {
  focusId: GalaxyNodeId;
  onSelect: (id: GalaxyNodeId) => void;
};

const NODES: GalaxyNode[] = [
  { id: 'overview', label: 'COMMAND', subtitle: 'core', x: 0, y: 0, radius: 34, color: '#F4EFF8' },
  { id: 'messenger', label: 'MESSENGER', subtitle: 'gateway', x: -330, y: -85, radius: 21, color: '#B9829B' },
  { id: 'users', label: 'USERS', subtitle: 'people', x: -500, y: 170, radius: 16, color: '#A994C7' },
  { id: 'economy', label: 'ECONOMY', subtitle: 'circulation', x: -210, y: 330, radius: 22, color: '#7A3949' },
  { id: 'rpg', label: 'RPG', subtitle: 'world', x: 260, y: 280, radius: 28, color: '#A994C7' },
  { id: 'games', label: 'GAMES', subtitle: 'arcade', x: 465, y: 40, radius: 18, color: '#B9829B' },
  { id: 'moderation', label: 'MODERATION', subtitle: 'watch', x: 390, y: -235, radius: 22, color: '#7A3949' },
  { id: 'music', label: 'MUSIC', subtitle: 'audio', x: 80, y: -360, radius: 17, color: '#A994C7' },
  { id: 'analytics', label: 'ANALYTICS', subtitle: 'signals', x: -120, y: 520, radius: 15, color: '#D8D2E3' },
  { id: 'logs', label: 'LOGS', subtitle: 'history', x: 620, y: 260, radius: 14, color: '#D8D2E3' },
  { id: 'health', label: 'BOT HEALTH', subtitle: 'vital signs', x: 600, y: -390, radius: 16, color: '#B9829B' },
  { id: 'settings', label: 'SETTINGS', subtitle: 'control', x: -540, y: -330, radius: 14, color: '#D8D2E3' },
];

const CONNECTIONS: [GalaxyNodeId, GalaxyNodeId][] = [
  ['overview', 'messenger'],
  ['overview', 'economy'],
  ['overview', 'rpg'],
  ['overview', 'moderation'],
  ['overview', 'music'],
  ['overview', 'games'],
  ['overview', 'analytics'],
  ['messenger', 'users'],
  ['economy', 'analytics'],
  ['rpg', 'games'],
  ['moderation', 'logs'],
  ['music', 'health'],
  ['health', 'logs'],
  ['settings', 'overview'],
];

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export default function GalaxyCanvas({ focusId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const viewRef = useRef({ x: 0, y: 0, zoom: 0.92 });
  const dragRef = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0 });
  const focusRef = useRef(focusId);

  const stars = useMemo(
    () =>
      Array.from({ length: 850 }, (_, index) => ({
        x: seeded(index + 1) * 1800 - 900,
        y: seeded(index + 901) * 1300 - 650,
        r: 0.35 + seeded(index + 1801) * 1.35,
        a: 0.25 + seeded(index + 2701) * 0.65,
        twinkle: 0.8 + seeded(index + 3601) * 2.4,
      })),
    []
  );

  const nodeMap = useMemo(
    () => new Map(NODES.map((node) => [node.id, node])),
    []
  );

  useEffect(() => {
    focusRef.current = focusId;
    const node = nodeMap.get(focusId);
    if (!node) return;
    const view = viewRef.current;
    const targetX = -node.x * 0.62;
    const targetY = -node.y * 0.62;
    view.x += (targetX - view.x) * 0.22;
    view.y += (targetY - view.y) * 0.22;
  }, [focusId, nodeMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1;
    let height = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (time: number) => {
      const view = viewRef.current;
      const focus = nodeMap.get(focusRef.current);
      if (focus && !dragRef.current.active) {
        const targetX = -focus.x * 0.62;
        const targetY = -focus.y * 0.62;
        view.x += (targetX - view.x) * 0.025;
        view.y += (targetY - view.y) * 0.025;
      }

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.78
      );
      bg.addColorStop(0, '#17131E');
      bg.addColorStop(0.48, '#0D0B12');
      bg.addColorStop(1, '#050509');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const nebula = (x: number, y: number, radius: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.13;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      nebula(width * 0.18, height * 0.28, Math.min(width, height) * 0.42, '#7A3949');
      nebula(width * 0.76, height * 0.30, Math.min(width, height) * 0.48, '#6B4D82');
      nebula(width * 0.60, height * 0.78, Math.min(width, height) * 0.45, '#463A61');

      const cx = width / 2 + view.x;
      const cy = height / 2 + view.y;
      const scale = view.zoom;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      for (let arm = 0; arm < 3; arm += 1) {
        ctx.beginPath();
        for (let i = 0; i <= 180; i += 1) {
          const t = i / 180;
          const angle = t * Math.PI * 4.5 + arm * ((Math.PI * 2) / 3);
          const radius = t * 570;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * 0.56;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = arm === 1 ? 'rgba(169,148,199,.13)' : 'rgba(216,210,227,.08)';
        ctx.lineWidth = 24;
        ctx.stroke();
      }

      stars.forEach((star, index) => {
        const pulse = 0.7 + Math.sin(time * 0.001 * star.twinkle + index) * 0.3;
        ctx.globalAlpha = star.a * pulse;
        ctx.fillStyle = '#F4EFF8';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r / Math.max(scale, 0.65), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      CONNECTIONS.forEach(([a, b]) => {
        const na = nodeMap.get(a);
        const nb = nodeMap.get(b);
        if (!na || !nb) return;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = 'rgba(216,210,227,.10)';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
      });

      NODES.forEach((node) => {
        const active = node.id === focusRef.current;
        const pulse = active ? 1 + Math.sin(time * 0.003) * 0.08 : 1;

        ctx.save();
        ctx.shadowBlur = active ? 28 : 15;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.globalAlpha = active ? 0.95 : 0.72;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#08070B';
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(3, node.radius * 0.34), 0, Math.PI * 2);
        ctx.fill();

        if (active) {
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2 / scale;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 13, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = active ? 0.9 : 0.55;
        ctx.fillStyle = '#F4EFF8';
        ctx.font = `600 ${Math.max(8, 11 / scale)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 19 / scale);
        ctx.globalAlpha = 0.42;
        ctx.font = `400 ${Math.max(7, 9 / scale)}px system-ui`;
        ctx.fillText(node.subtitle, node.x, node.y + node.radius + 31 / scale);
        ctx.restore();
      });

      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [nodeMap, stars]);

  const worldPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const view = viewRef.current;
    return {
      x: (clientX - rect.left - rect.width / 2 - view.x) / view.zoom,
      y: (clientY - rect.top - rect.height / 2 - view.y) / view.zoom,
    };
  };

  const pickNode = (clientX: number, clientY: number) => {
    const point = worldPoint(clientX, clientY);
    let hit: GalaxyNode | null = null;
    let distance = Infinity;

    for (const node of NODES) {
      const d = Math.hypot(point.x - node.x, point.y - node.y);
      if (d < node.radius + 22 / viewRef.current.zoom && d < distance) {
        hit = node;
        distance = d;
      }
    }

    if (hit) {
      onSelect(hit.id);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050509]">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(event) => {
          dragRef.current = { active: true, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current.active) return;
          const view = viewRef.current;
          view.x += event.clientX - dragRef.current.x;
          view.y += event.clientY - dragRef.current.y;
          dragRef.current.x = event.clientX;
          dragRef.current.y = event.clientY;
        }}
        onPointerUp={(event) => {
          const moved = Math.hypot(
            event.clientX - dragRef.current.x,
            event.clientY - dragRef.current.y
          );
          dragRef.current.active = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (moved < 3) pickNode(event.clientX, event.clientY);
        }}
        onDoubleClick={(event) => pickNode(event.clientX, event.clientY)}
        onWheel={(event) => {
          event.preventDefault();
          const view = viewRef.current;
          const before = worldPoint(event.clientX, event.clientY);
          const nextZoom = Math.min(2.4, Math.max(0.58, view.zoom * Math.exp(-event.deltaY * 0.001)));
          view.zoom = nextZoom;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          view.x = event.clientX - rect.left - rect.width / 2 - before.x * nextZoom;
          view.y = event.clientY - rect.top - rect.height / 2 - before.y * nextZoom;
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,9,.38)_100%)]" />

      <div className="pointer-events-none absolute bottom-5 left-5 hidden rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[.24em] text-white/45 backdrop-blur-md sm:block">
        drag · scroll to zoom · tap a constellation
      </div>
    </div>
  );
}
