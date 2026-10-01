import { useState } from 'react';
import {
  Eye,
  EyeOff,
  FileJson,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
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

function RawCookieInput({ busy, onSubmit }: { busy: boolean; onSubmit: (cookieHeader: string) => void }) {
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
    <div className="cookie-dock">
      <div className="cookie-dock-head">
        <div>
          <span className="cookie-eyebrow"><LockKeyhole size={12} /> FACEBOOK SESSION</span>
          <b>Paste cookie</b>
        </div>
        <span className="cookie-safe"><ShieldCheck size={12} /> NOT SAVED</span>
      </div>

      <div className="cookie-input-wrap">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="c_user=…; xs=…; fr=…"
          className={revealed ? 'cookie-input' : 'cookie-input cookie-secret'}
          aria-label="Facebook cookie header"
        />
        <button
          type="button"
          className="cookie-eye"
          onClick={() => setRevealed((current) => !current)}
          disabled={busy || !value}
          aria-label={revealed ? 'Hide cookie' : 'Show cookie'}
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <div className="cookie-buttons">
        <button type="button" className="cookie-connect" onClick={submit} disabled={busy || !value.trim()}>
          <ShieldCheck size={15} />
          {busy ? 'CONNECTING…' : 'CONNECT COOKIE'}
        </button>
      </div>

      <p className="cookie-note">
        The cookie is sent directly to ECLIPSE for the connection attempt and cleared from this form after submission.
      </p>
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
    <div className="deadpool-connection">
      <div className="deadpool-connection-head">
        <div className="deadpool-connection-title">
          <div className="deadpool-fb-mark">f</div>
          <div>
            <span>MESSENGER SESSION</span>
            <h2>Facebook connection</h2>
          </div>
        </div>
        <StatusBadge
          active={state.facebook_connected}
          activeLabel="Connected"
          inactiveLabel={state.login_in_progress ? 'Connecting…' : 'Disconnected'}
        />
      </div>

      <div className="deadpool-connection-meta">
        <div>
          <span><UserCircle2 size={13} /> ACCOUNT</span>
          <b>{state.facebook_user_name || 'Not linked'}</b>
        </div>
        <div>
          <span><Wifi size={13} /> LAST CONNECTED</span>
          <b>{formatTime(state.last_connected_at)}</b>
        </div>
        <div>
          <span><WifiOff size={13} /> LAST DISCONNECTED</span>
          <b>{formatTime(state.last_disconnected_at)}</b>
        </div>
      </div>

      <RawCookieInput busy={busy} onSubmit={onConnectRawCookie} />

      <div className="deadpool-session-row">
        <label className="deadpool-file-button">
          <Upload size={14} />
          {busy ? 'UPLOADING…' : 'USE SESSION FILE'}
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

        <button className="deadpool-secondary-button" onClick={onReconnect} disabled={busy || state.facebook_connected}>
          <RefreshCw size={14} />
          RECONNECT
        </button>

        <button className="deadpool-danger-button" onClick={onDisconnect} disabled={busy || !state.facebook_connected}>
          <WifiOff size={14} />
          DISCONNECT
        </button>
      </div>

      {state.login_error && !state.facebook_connected && (
        <div className="deadpool-connection-error">
          <FileJson size={14} />
          <span>{state.login_error}</span>
        </div>
      )}
    </div>
  );
}
