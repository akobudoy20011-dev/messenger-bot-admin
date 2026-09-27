interface StatusBadgeProps {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  size = 'md',
}: StatusBadgeProps) {
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${textSize} transition-all duration-300 ${
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-rose-100 text-rose-600'
      }`}
    >
      <span className="relative flex">
        <span
          className={`inline-flex ${dotSize} rounded-full ${
            active ? 'bg-emerald-500' : 'bg-rose-400'
          }`}
        />
        {active && (
          <span
            className={`absolute inline-flex ${dotSize} animate-ping rounded-full bg-emerald-400 opacity-75`}
          />
        )}
      </span>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
