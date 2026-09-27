import type { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accent?: 'pink' | 'lilac' | 'blush';
}

const accentStyles = {
  pink: 'from-coquette-400 to-coquette-500 text-white shadow-glow-pink',
  lilac: 'from-lilac-400 to-lilac-500 text-white shadow-glow-lilac',
  blush: 'from-blush-400 to-coquette-500 text-white shadow-glow-pink',
};

export default function StatusCard({
  title,
  icon,
  children,
  accent = 'pink',
}: StatusCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-coquette animate-slide-up transition-all duration-300 hover:shadow-coquette-lg hover:-translate-y-0.5">
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accentStyles[accent]} shadow-lg`}
        >
          {icon}
        </div>
        <h3 className="font-display text-lg font-semibold text-coquette-800">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
