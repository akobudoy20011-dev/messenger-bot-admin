import { Facebook, Wifi, WifiOff, UserCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface ConnectionCardProps {
  state: BotState;
  busy: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
}

function formatTime(ts: string | null): string {
  if (!ts) return 'Never';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConnectionCard({
  state,
  busy,
  onReconnect,
  onDisconnect,
}: ConnectionCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-coquette animate-slide-up transition-all duration-300 hover:shadow-coquette-lg">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coquette-400 to-lilac-500 text-white shadow-glow-pink">
            <Facebook size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-coquette-800">
              Facebook Connection
            </h3>
            <p className="text-xs text-coquette-400">Messenger platform link</p>
          </div>
        </div>
        <StatusBadge
          active={state.facebook_connected}
          activeLabel="Connected"
          inactiveLabel="Disconnected"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-coquette-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-coquette-700">
            <UserCircle2 size={16} className="text-lilac-400" />
            <span className="font-medium">Account</span>
          </div>
          <span className="text-sm font-semibold text-coquette-800">
            {state.facebook_user_name ?? '— Not linked —'}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-lilac-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-lilac-700">
            <Wifi size={16} className="text-lilac-400" />
            <span className="font-medium">Last connected</span>
          </div>
          <span className="text-sm font-semibold text-lilac-800">
            {formatTime(state.last_connected_at)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-blush-50/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blush-500">
            <WifiOff size={16} className="text-blush-400" />
            <span className="font-medium">Last disconnected</span>
          </div>
          <span className="text-sm font-semibold text-blush-500">
            {formatTime(state.last_disconnected_at)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onReconnect}
          disabled={busy || state.facebook_connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coquette-400 to-lilac-500 px-4 py-3 text-sm font-semibold text-white shadow-coquette transition-all duration-300 hover:shadow-coquette-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Wifi size={16} />
          {busy ? 'Reconnecting…' : 'Reconnect'}
        </button>
        <button
          onClick={onDisconnect}
          disabled={busy || !state.facebook_connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white/60 px-4 py-3 text-sm font-semibold text-rose-500 transition-all duration-300 hover:bg-rose-50 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WifiOff size={16} />
          Disconnect
        </button>
      </div>
    </div>
  );
}
