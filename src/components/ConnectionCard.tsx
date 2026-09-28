import { useState } from 'react';
import { Facebook, FileJson, Eye, EyeOff, LockKeyhole, RefreshCw, ShieldCheck, UserCircle2, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface ConnectionCardProps {
  state: BotState;
  busy: boolean;
  onConnectSession: (file: File) => void;
  onConnectRawCookie: (cookieHeader: string) => void;
  onReconnect: () => void;
  onDisconnect: () => void;
}

interface RawCookieInputProps {
  busy: boolean;
  onSubmit: (cookieHeader: string) => void;
}

function RawCookieInput({ busy, onSubmit }: RawCookieInputProps) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const submit = () => {
    const cookie = value.trim();
    if (!cookie || busy) return;
    onSubmit(cookie);
    setValue('');
    setRevealed(false);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-coquette-200/80 bg-gradient-to-br from-white via-white to-lilac-50/60 shadow-[0_12px_35px_rgba(180,110,170,.10)]">
      <div className="flex items-center justify-between border-b border-coquette-100 bg-white/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-coquette-100 to-lilac-100 text-coquette-500">
            <LockKeyhole size={15} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coquette-600">Private session</p>
            <p className="text-[10px] text-coquette-300">browser cookie header</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-500">
          not stored here
        </span>
      </div>

      <div className="p-3">
        <div className="relative">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="c_user=…; xs=…; fr=…"
            className="min-h-28 w-full resize-y rounded-2xl border border-coquette-100 bg-[#fffafd] px-4 py-3 pr-12 font-mono text-[11px] leading-5 text-coquette-800 outline-none transition placeholder:text-coquette-200 focus:border-coquette-400 focus:ring-4 focus:ring-coquette-100/70 disabled:opacity-60"
            style={{ WebkitTextSecurity: revealed ? 'none' : 'disc' } as React.CSSProperties}
          />
          <button
            type="button"
            aria-label={revealed ? 'Hide cookie' : 'Reveal cookie'}
            title={revealed ? 'Hide cookie' : 'Reveal cookie'}
            onClick={() => setRevealed((current) => !current)}
            disabled={busy || !value}
            className="absolute right-3 top-3 rounded-xl border border-coquette-100 bg-white/90 p-2 text-coquette-400 shadow-sm transition hover:border-coquette-200 hover:bg-coquette-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coquette-400 via-pink-500 to-lilac-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(196,91,180,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(196,91,180,.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <ShieldCheck size={16} />
          {busy ? 'Connecting…' : 'Connect secure session'}
        </button>

        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-coquette-50/70 px-3 py-2.5">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-[10px] leading-5 text-coquette-400">
            The cookie is forwarded to ECLIPSE for this connection attempt, then cleared from this form. Never save it in GitHub, screenshots, or browser storage.
          </p>
        </div>
      </div>
    </div>
  );
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
  onConnectRawCookie,
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
              <h4 className="text-sm font-semibold text-coquette-800">Connect your Messenger session</h4>
              <p className="mt-1 text-xs leading-relaxed text-coquette-500">
                Use a saved browser session, or paste the cookie header directly. Your secret stays out of the dashboard UI after submission.
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

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-coquette-100" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-coquette-300">or paste raw cookie</span>
            <div className="h-px flex-1 bg-coquette-100" />
          </div>

          <RawCookieInput busy={busy} onSubmit={onConnectRawCookie} />

          <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-coquette-400">
            <p>Accepted: cookie arrays, wrapped exports, or a cookie-header text file.</p>
            <p className="flex items-start gap-1.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
              The dashboard does not put the session in localStorage or sessionStorage.
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
