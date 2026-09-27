import { Facebook, FileJson, RefreshCw, ShieldCheck, UserCircle2, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface ConnectionCardProps {
  state: BotState;
  busy: boolean;
  onConnectSession: (file: File) => void;
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
  onConnectSession,
  onReconnect,
  onDisconnect,
}: ConnectionCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-coquette animate-slide-up transition-all duration-300 hover:shadow-coquette-lg">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coquette-400 to-lilac-500 text-white shadow-glow-pink">
            <Facebook size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-coquette-800">Facebook Connection</h3>
            <p className="text-xs text-coquette-400">Messenger session link</p>
          </div>
        </div>
        <StatusBadge
          active={state.facebook_connected}
          activeLabel="Connected"
          inactiveLabel={state.login_in_progress ? 'Connecting…' : 'Disconnected'}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-coquette-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-coquette-700">
            <UserCircle2 size={16} className="text-lilac-400" />
            <span className="font-medium">Account</span>
          </div>
          <span className="text-right text-sm font-semibold text-coquette-800">{state.facebook_user_name ?? '— Not linked —'}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-lilac-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-lilac-700">
            <Wifi size={16} className="text-lilac-400" />
            <span className="font-medium">Last connected</span>
          </div>
          <span className="text-sm font-semibold text-lilac-800">{formatTime(state.last_connected_at)}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-blush-50/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blush-500">
            <WifiOff size={16} className="text-blush-400" />
            <span className="font-medium">Last disconnected</span>
          </div>
          <span className="text-sm font-semibold text-blush-500">{formatTime(state.last_disconnected_at)}</span>
        </div>
      </div>

      {!state.facebook_connected && (
        <div className="mt-5 rounded-2xl border border-coquette-200 bg-white/75 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coquette-100 text-coquette-500">
              <FileJson size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-coquette-800">Connect with a session export</h4>
              <p className="mt-1 text-xs leading-relaxed text-coquette-500">
                This bot connects with a saved Facebook browser session. Export your cookies after signing in to Facebook, then upload the JSON file here.
              </p>
            </div>
          </div>

          <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coquette-400 to-lilac-500 px-4 py-3 text-sm font-semibold text-white shadow-coquette transition-all duration-300 hover:-translate-y-0.5 hover:shadow-coquette-lg has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            <FileJson size={17} />
            {busy ? 'Uploading session…' : 'Choose session file'}
            <input
              type="file"
              accept=".json,application/json,.txt,text/plain"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = '';
                if (file) onConnectSession(file);
              }}
            />
          </label>

          <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-coquette-400">
            <p>Accepted: cookie arrays, wrapped exports, or a cookie-header text file.</p>
            <p className="flex items-start gap-1.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
              The dashboard forwards the file to ECLIPSE and does not save it in browser storage.
            </p>
          </div>
        </div>
      )}

      {state.login_error && !state.facebook_connected && (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs leading-relaxed text-rose-600">
          <span className="font-semibold">Connection failed:</span> {state.login_error}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onReconnect}
          disabled={busy || state.facebook_connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coquette-400 to-lilac-500 px-4 py-3 text-sm font-semibold text-white shadow-coquette transition-all duration-300 hover:-translate-y-0.5 hover:shadow-coquette-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <RefreshCw size={16} />
          {busy ? 'Reconnecting…' : 'Retry connection'}
        </button>
        <button
          onClick={onDisconnect}
          disabled={busy || !state.facebook_connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white/60 px-4 py-3 text-sm font-semibold text-rose-500 transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WifiOff size={16} />
          Disconnect
        </button>
      </div>
    </div>
  );
}
