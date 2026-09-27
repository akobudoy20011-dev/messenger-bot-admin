import { useEffect, useRef } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle2, Terminal, Trash2 } from 'lucide-react';
import type { BotLog, LogLevel } from '@/types';

interface LogsPanelProps {
  logs: BotLog[];
  onClear: () => void;
}

const levelConfig: Record<
  LogLevel,
  { icon: typeof Info; color: string; bg: string; border: string; label: string }
> = {
  info: {
    icon: Info,
    color: 'text-lilac-600',
    bg: 'bg-lilac-50',
    border: 'border-lilac-200',
    label: 'INFO',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'WARN',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    label: 'ERROR',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'OK',
  },
};

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="glass-card flex flex-col rounded-3xl border border-white/60 shadow-lilac animate-slide-up">
      <div className="flex items-center justify-between border-b border-coquette-100/60 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coquette-400 to-lilac-500 text-white shadow-glow-pink">
            <Terminal size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-coquette-800">
              Activity Logs
            </h3>
            <p className="text-xs text-coquette-400">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white/60 px-3 py-2 text-xs font-semibold text-rose-500 transition-all duration-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-coquette max-h-[480px] flex-1 space-y-2 overflow-y-auto p-5"
      >
        {logs.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-coquette-300">
            <Terminal size={32} className="opacity-40" />
            <p className="text-sm">No logs yet</p>
          </div>
        ) : (
          logs.map((log) => {
            const cfg = levelConfig[log.level];
            const Icon = cfg.icon;
            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 rounded-2xl border ${cfg.border} ${cfg.bg} px-4 py-3 animate-fade-in`}
              >
                <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${cfg.color} ${cfg.bg} border ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                    {log.source && (
                      <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-coquette-500">
                        {log.source}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-coquette-300">
                      {new Date(log.created_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 break-words font-mono text-xs text-coquette-700">
                    {log.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
