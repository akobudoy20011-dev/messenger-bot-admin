import type { DashboardAnalytics } from '@/types';

function n(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maxOf(values: number[]) {
  return Math.max(1, ...values);
}

function Series({ label, values, formatter = (value: number) => value.toLocaleString() }: { label: string; values: number[]; formatter?: (value: number) => string }) {
  const max = maxOf(values);
  return (
    <div className="command-surface">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[.2em] text-white/25">{label}</p>
        <span className="text-[9px] text-white/20">{values.length} buckets</span>
      </div>
      <div className="flex h-28 items-end gap-1">
        {values.map((value, index) => (
          <div key={index} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t-md bg-gradient-to-t from-[#7A3949]/70 to-[#B9829B]/80 transition-all group-hover:from-[#8F485A] group-hover:to-[#D8A9B8]" style={{ height: `${Math.max(4, (value / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[8px] text-white/70 opacity-0 group-hover:opacity-100">{formatter(value)}</span>
          </div>
        ))}
        {!values.length && <div className="w-full self-center text-center text-[10px] text-white/20">No historical data yet.</div>}
      </div>
    </div>
  );
}

export default function AnalyticsSurface({ analytics }: { analytics: DashboardAnalytics | null }) {
  if (!analytics) {
    return <div className="command-surface text-xs text-white/30">Historical analytics are loading…</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Series label="economy inflow / hour" values={analytics.economy.map((row) => n(row.inflow))} />
      <Series label="economy outflow / hour" values={analytics.economy.map((row) => n(row.outflow))} />
      <Series label="rpg player activity / hour" values={analytics.rpg.map((row) => n(row.players))} />
      <Series label="battles / hour" values={analytics.battles.map((row) => n(row.battles))} />
      <Series label="moderation incidents / hour" values={analytics.moderation.map((row) => n(row.incidents))} />
      <div className="command-surface">
        <p className="text-[9px] uppercase tracking-[.2em] text-white/25">window</p>
        <p className="mt-3 font-display text-2xl text-white">{analytics.hours}h</p>
        <p className="mt-1 text-[10px] text-white/25">Historical metrics are read from the same Neon/Postgres source of truth.</p>
      </div>
    </div>
  );
}
