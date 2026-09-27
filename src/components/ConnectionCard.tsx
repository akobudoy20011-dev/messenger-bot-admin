import { useState } from 'react';
import { Facebook, Wifi, WifiOff, UserCircle2, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface ConnectionCardProps {
  state: BotState;
  busy: boolean;
  onConnectSession: (file: File) => void;
  onConnectCredentials: (email: string, password: string) => Promise<void>;
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
  onConnectCredentials,
  onReconnect,
  onDisconnect,
}: ConnectionCardProps) {
  const [facebookEmail, setFacebookEmail] = useState('');
  const [facebookPassword, setFacebookPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitCredentials = async () => {
    const email = facebookEmail.trim();

    if (!email || !facebookPassword) return;

    await onConnectCredentials(email, facebookPassword);
  };

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

      <div className="mt-5 space-y-3">
        {!state.facebook_connected && (
          <>
            <div className="rounded-2xl border border-coquette-200 bg-white/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-coquette-700">
                <LockKeyhole size={16} />
                Facebook login
              </div>

              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                value={facebookEmail}
                onChange={(event) => setFacebookEmail(event.target.value)}
                placeholder="Email or phone"
                disabled={busy}
                className="mb-2 w-full rounded-xl border border-coquette-200 bg-white/80 px-3 py-2.5 text-sm text-coquette-800 outline-none focus:border-coquette-400"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={facebookPassword}
                  onChange={(event) => setFacebookPassword(event.target.value)}
                  placeholder="Facebook password"
                  disabled={busy}
                  className="w-full rounded-xl border border-coquette-200 bg-white/80 px-3 py-2.5 pr-11 text-sm text-coquette-800 outline-none focus:border-coquette-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={busy}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-coquette-400 hover:bg-coquette-50"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => void submitCredentials()}
                disabled={busy || !facebookEmail.trim() || !facebookPassword}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coquette-400 to-lilac-500 px-4 py-2.5 text-sm font-semibold text-white shadow-coquette transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LockKeyhole size={16} />
                {busy ? 'Connecting…' : 'Login with Facebook'}
              </button>

              <p className="mt-2 text-[10px] leading-relaxed text-coquette-400">
                Credentials are sent directly to ECLIPSE over HTTPS and are not shown in activity logs.
                They are kept only in the ECLIPSE server process for automatic reconnects.
              </p>
            </div>

            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-coquette-200 bg-white/70 px-4 py-3 text-sm font-semibold text-coquette-700 transition-all duration-300 hover:bg-coquette-50 hover:border-coquette-300">
              <UserCircle2 size={16} />
              {busy ? 'Connecting…' : 'Connect Facebook session'}
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  if (file) onConnectSession(file);
                }}
              />
            </label>
          </>
        )}

        <div className="flex gap-3">
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
        {!state.facebook_connected && (
          <p className="text-center text-[11px] leading-relaxed text-coquette-400">
            Upload the JSON appState/cookie export from your Facebook session.
            It is sent directly to your ECLIPSE server; it is not stored in this dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
