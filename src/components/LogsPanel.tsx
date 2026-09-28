import { useEffect, useMemo, useRef, useState } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle2, Terminal, Trash2, Search } from 'lucide-react';
import type { BotLog, LogLevel } from '@/types';

interface LogsPanelProps {
  logs: BotLog[];
  onClear: () => void;
}

const levelConfig: Record<LogLevel, { icon: typeof Info; label: string; tone: string }> = {
  info: { icon: Info, label: 'INFO', tone: 'text-lilac-300' },
  warn: { icon: AlertTriangle, label: 'WARN', tone: 'text-amber-300' },
  error: { icon: XCircle, label: 'ERROR', tone: 'text-rose-300' },
  success: { icon: CheckCircle2, label: 'OK', tone: 'text-emerald-300' },
};

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | LogLevel>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesLevel = level === 'all' || log.level === level;
      const haystack = `${log.message} ${log.source || ''}`.toLowerCase();
      return matchesLevel && (!needle || haystack.includes(needle));
    });
  }, [logs, level, query]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  return (
    <section className="command-surface !p-0" aria-label="Activity logs">
      <div className="flex flex-col gap-4 border-b border-white/5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.025] text-lilac-300">
            <Terminal size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="eclipse-kicker">operational history</p>
            <h2 className="mt-1 text-sm font-medium text-white/85">Activity logs</h2>
            <p className="mt-1 text-[10px] text-white/30">{filtered.length} visible · {logs.length} stored locally</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={logs.length === 0}
          className="eclipse-button-secondary min-h-[42px] self-start"
          aria-label="Clear activity logs"
        >
          <Trash2 size={14} aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="grid gap-2 border-b border-white/5 p-4 md:grid-cols-[1fr_auto]">
        <label className="eclipse-input flex items-center gap-2">
          <Search size={14} className="text-white/25" aria-hidden="true" />
          <span className="sr-only">Search logs</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search message or source…"
            className="w-full bg-transparent text-xs outline-none"
          />
        </label>
        <div className="flex overflow-x-auto rounded-2xl border border-white/10 bg-black/10 p-1" role="group" aria-label="Filter log level">
          {(['all', 'info', 'success', 'warn', 'error'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={`min-h-[40px] rounded-xl px-3 text-[9px] font-bold uppercase tracking-[.12em] transition ${level === item ? 'bg-white/[.08] text-white/80' : 'text-white/25 hover:text-white/55'}`}
              aria-pressed={level === item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar-coquette max-h-[520px] overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="data-state" role="status">
            <strong>{logs.length ? 'No matching logs' : 'No logs yet'}</strong>
            <span>{logs.length ? 'Try another search or severity filter.' : 'Operational events will appear here as the dashboard runs.'}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((log) => {
              const cfg = levelConfig[log.level];
              const Icon = cfg.icon;
              return (
                <article key={log.id} className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-white/5 bg-white/[.018] px-3 py-3 transition hover:border-white/10 hover:bg-white/[.03]">
                  <Icon size={15} className={`mt-0.5 ${cfg.tone}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-bold tracking-[.12em] ${cfg.tone}`}>{cfg.label}</span>
                      {log.source && <span className="text-[9px] text-white/25">{log.source}</span>}
                      <time className="ml-auto text-[9px] text-white/20" dateTime={log.created_at}>
                        {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </time>
                    </div>
                    <p className="mt-1 break-words font-mono text-[10px] leading-5 text-white/55">{log.message}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
