import type { DashboardAnalytics } from '@/types';

function n(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maxOf(values: number[]) {
  return Math.max(1, ...values);
}

function Series({
  label,
  values,
  formatter = (value: number) => value.toLocaleString(),
}: {
  label: string;
  values: number[];
  formatter?: (value: number) => string;
}) {
  const max = maxOf(values);
  const latest = values.length ? values[values.length - 1] : 0;

  return (
    <section className="command-surface" aria-label={label}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[.2em] text-white/25">{label}</p>
          <p className="mt-1 text-[10px] text-white/35">
            Latest <span className="text-white/65">{formatter(latest)}</span>
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.025] px-2 py-1 text-[8px] uppercase tracking-[.14em] text-white/25">
          {values.length}h
        </span>
      </div>

      {values.length ? (
        <>
          <div className="flex h-32 items-end gap-1" role="img" aria-label={`${label}: ${values.map(formatter).join(', ')}`}>
            {values.map((value, index) => {
              const height = Math.max(5, (value / max) * 100);
              return (
                <div key={index} className="group relative flex h-full flex-1 items-end" title={formatter(value)}>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#7A3949]/70 to-[#B9829B]/80 transition-all group-hover:from-[#8F485A] group-hover:to-[#D8A9B8]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[8px] text-white/20">
            <span>oldest</span>
            <span>now</span>
          </div>
        </>
      ) : (
        <div className="data-state">
          <strong>No historical data yet</strong>
          <span>The backend has not returned enough buckets to render this trend.</span>
        </div>
      )}
    </section>
  );
}

export default function AnalyticsSurface({ analytics }: { analytics: DashboardAnalytics | null }) {
  if (!analytics) {
    return (
      <div className="data-state" role="status">
        <strong>Analytics are loading</strong>
        <span>Waiting for the historical metrics bridge to respond.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="command-surface flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eclipse-kicker">signal window</p>
          <h2 className="mt-2 text-base font-medium text-white/85">System activity over the last {analytics.hours} hours</h2>
          <p className="mt-1 text-[10px] leading-5 text-white/30">
            Historical metrics come from the same Neon/Postgres source of truth as the bot.
          </p>
        </div>
        <div className="status-orbit is-live" aria-label="Analytics source is connected">
          <span />
          LIVE SOURCE
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Series label="Economy inflow / hour" values={analytics.economy.map((row) => n(row.inflow))} />
        <Series label="Economy outflow / hour" values={analytics.economy.map((row) => n(row.outflow))} />
        <Series label="RPG player activity / hour" values={analytics.rpg.map((row) => n(row.players))} />
        <Series label="Battles / hour" values={analytics.battles.map((row) => n(row.battles))} />
        <Series label="Moderation incidents / hour" values={analytics.moderation.map((row) => n(row.incidents))} />
      </div>
    </div>
  );
}
