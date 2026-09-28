import type { DashboardEvent } from '@/types';

export default function LiveEventFeed({ events }: { events: DashboardEvent[] }) {
  return (
    <div className="command-surface overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[.22em] text-white/25">live event stream</p>
          <p className="mt-1 text-sm text-white/75">Command Center activity</p>
        </div>
        <span className="status-orbit is-live"><span />stream</span>
      </div>
      <div className="space-y-2">
        {events.slice(0, 12).map((event) => (
          <div key={event.id} className="flex gap-3 rounded-xl border border-white/5 bg-white/[.02] px-3 py-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B9829B] shadow-[0_0_10px_rgba(185,130,155,.7)]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs text-white/65">{event.message}</p>
                <span className="shrink-0 text-[9px] text-white/20">{new Date(event.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/20">{event.type}</p>
            </div>
          </div>
        ))}
        {!events.length && <p className="py-6 text-center text-[10px] text-white/25">Waiting for runtime events…</p>}
      </div>
    </div>
  );
}
