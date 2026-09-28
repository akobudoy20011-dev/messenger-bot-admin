import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Gem,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Music2,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import GalaxyCanvas, { type GalaxyNodeId } from '@/components/GalaxyCanvas';
import ConnectionCard from '@/components/ConnectionCard';
import SessionCard from '@/components/SessionCard';
import BotStatusCard from '@/components/BotStatusCard';
import LogsPanel from '@/components/LogsPanel';
import type { BotLog, BotState, LogLevel } from '@/types';

const ECLIPSE_API_URL = String(import.meta.env.VITE_ECLIPSE_API_URL || '').replace(/\/$/, '');
const DASHBOARD_KEY_STORAGE = 'eclipse_dashboard_key';
const LOG_STORAGE_KEY = 'eclipse_dashboard_logs';

async function eclipseApi(path: string, method = 'GET', dashboardKey = '', body?: unknown) {
  if (!ECLIPSE_API_URL) throw new Error('VITE_ECLIPSE_API_URL is not configured.');

  const key = dashboardKey || sessionStorage.getItem(DASHBOARD_KEY_STORAGE) || '';
  const response = await fetch(`${ECLIPSE_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-ECLIPSE-DASHBOARD-KEY': key,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.error || `ECLIPSE API returned ${response.status}`));
  return payload;
}

const DEFAULT_STATE: BotState = {
  id: 1,
  facebook_connected: false,
  facebook_user_name: null,
  session_active: false,
  bot_running: false,
  login_in_progress: false,
  login_error: null,
  last_connected_at: null,
  last_disconnected_at: null,
  updated_at: new Date().toISOString(),
};

function loadStoredLogs(): BotLog[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BotLog[]).slice(0, 200) : [];
  } catch {
    return [];
  }
}

function persistLogs(logs: BotLog[]) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch {
    // Local logs are best-effort.
  }
}

function normalizeSessionExport(value: unknown): unknown {
  let current = value;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current === 'string') {
      const text = current.trim();
      if (!text) throw new Error('The selected session file is empty.');
      try {
        current = JSON.parse(text) as unknown;
        continue;
      } catch {
        return text;
      }
    }

    if (Array.isArray(current)) {
      if (!current.length) throw new Error('The selected session file contains no cookies.');
      return current;
    }

    if (current && typeof current === 'object') {
      const record = current as Record<string, unknown>;
      const nestedKey = ['appState', 'cookies', 'data'].find((key) => key in record);
      if (nestedKey) {
        current = record[nestedKey];
        continue;
      }
    }

    break;
  }

  throw new Error('Use a Facebook cookie export: an array, a wrapped export, or a cookie-header text file.');
}

const NAV: Array<{ id: GalaxyNodeId; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'messenger', label: 'Messenger', icon: MessageCircle },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'economy', label: 'Economy', icon: CircleDollarSign },
  { id: 'rpg', label: 'RPG', icon: Gem },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
  { id: 'music', label: 'Music', icon: Music2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'health', label: 'Bot Health', icon: HeartPulse },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MODULES: Record<Exclude<GalaxyNodeId, 'overview' | 'messenger' | 'logs' | 'health' | 'settings'>, {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}> = {
  users: {
    eyebrow: 'identity layer',
    title: 'Users',
    description: 'A single place for ECLIPSE player identity, activity, progression and history.',
    bullets: ['Messenger identity', 'Economy + XP snapshot', 'RPG character state', 'Moderation history'],
  },
  economy: {
    eyebrow: 'circulation layer',
    title: 'Economy',
    description: 'Wallet, bank, transactions and future economy analytics live behind this surface.',
    bullets: ['Wallet / bank balances', 'Transactions', 'Daily + work progression', 'Suspicious activity'],
  },
  rpg: {
    eyebrow: 'world layer',
    title: 'ECLIPSE RPG',
    description: 'The dashboard mirrors the RPG engine instead of treating it as a generic statistics page.',
    bullets: ['World + regions + weather', 'Classes + skills + spells', 'Guilds + companions + forge', 'Kingdoms + armies + bosses'],
  },
  games: {
    eyebrow: 'arcade layer',
    title: 'Games',
    description: 'Persistent game analytics without touching the existing game logic.',
    bullets: ['Blackjack', 'Trivia / riddles / math', 'RPS / slots / coinflip', 'XP + economy flow'],
  },
  moderation: {
    eyebrow: 'watch layer',
    title: 'Moderation',
    description: 'A live control surface for automod, warnings, spam and moderation events.',
    bullets: ['Spam + raid signals', 'Warnings / mutes / bans', 'AI classification', 'Thread controls'],
  },
  music: {
    eyebrow: 'audio layer',
    title: 'Music',
    description: 'A clean operational surface for the ECLIPSE music pipeline and queue.',
    bullets: ['Searching / preparing', 'Downloading / playback', 'Queue state', 'Failure + cancellation events'],
  },
  analytics: {
    eyebrow: 'signal layer',
    title: 'Analytics',
    description: 'The future reporting layer for the bot, RPG and economy.',
    bullets: ['Activity trends', 'Economy circulation', 'RPG progression', 'System performance'],
  },
};

function SectionIcon({ id }: { id: GalaxyNodeId }) {
  const item = NAV.find((entry) => entry.id === id);
  const Icon = item?.icon || Activity;
  return <Icon size={17} strokeWidth={1.8} />;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function App() {
  const [state, setState] = useState<BotState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<BotLog[]>(loadStoredLogs);
  const [loading, setLoading] = useState(true);
  const [connBusy, setConnBusy] = useState(false);
  const [botBusy, setBotBusy] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(
    () => sessionStorage.getItem(DASHBOARD_KEY_STORAGE) || ''
  );
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<GalaxyNodeId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const addLog = useCallback((level: LogLevel, message: string, source: string) => {
    setLogs((previous) => {
      const next: BotLog[] = [{
        id: crypto.randomUUID(),
        level,
        message,
        source,
        created_at: new Date().toISOString(),
      }, ...previous].slice(0, 200);
      persistLogs(next);
      return next;
    });
  }, []);

  const syncRuntimeState = useCallback(async () => {
    if (!dashboardKey) {
      setApiReady(false);
      return null;
    }

    const data = await eclipseApi('/api/dashboard/status', 'GET', dashboardKey);
    setState({
      id: 1,
      facebook_connected: data.facebook_connected === true,
      facebook_user_name: data.facebook_user_name ?? null,
      session_active: data.session_active === true,
      bot_running: data.bot_running === true,
      login_in_progress: data.login_in_progress === true,
      login_error: data.login_error ?? null,
      last_connected_at: data.last_connected_at ?? null,
      last_disconnected_at: data.last_disconnected_at ?? null,
      updated_at: data.updated_at || new Date().toISOString(),
    });
    setApiReady(true);
    setApiError(data.login_error ? String(data.login_error) : null);
    return data;
  }, [dashboardKey]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!dashboardKey) {
        setLoading(false);
        return;
      }
      try {
        await syncRuntimeState();
      } catch (error) {
        if (!cancelled) {
          setApiReady(false);
          setApiError(error instanceof Error ? error.message : 'ECLIPSE API unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const poll = window.setInterval(() => {
      void syncRuntimeState().catch(() => undefined);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [dashboardKey, syncRuntimeState]);

  const runAction = async (
    action: () => Promise<void>,
    busySetter: (value: boolean) => void,
    errorSource: string
  ) => {
    busySetter(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      setApiError(message);
      await addLog('error', message, errorSource);
    } finally {
      busySetter(false);
    }
  };

  const handleConnectRawCookie = async (cookieHeader: string) => {
    const cookie = cookieHeader.trim();
    if (!cookie) return;

    await runAction(async () => {
      await addLog('info', 'Submitting a Facebook session cookie to ECLIPSE…', 'facebook');
      await eclipseApi('/api/dashboard/connect-session', 'POST', dashboardKey, { appState: cookie });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const status = await syncRuntimeState();
      const loginError = status?.login_error ? String(status.login_error) : null;
      await addLog(
        loginError ? 'error' : 'success',
        loginError ? `Facebook session rejected: ${loginError}` : 'Facebook session submitted; ECLIPSE is connecting…',
        'facebook'
      );
    }, setConnBusy, 'facebook');
  };

  const handleConnectSession = async (file: File) => {
    await runAction(async () => {
      await addLog('info', 'Uploading a Facebook session to ECLIPSE…', 'facebook');
      const fileText = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(fileText);
      } catch {
        parsed = fileText.trim();
      }
      const session = normalizeSessionExport(parsed);
      await eclipseApi('/api/dashboard/connect-session', 'POST', dashboardKey, { appState: session });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const status = await syncRuntimeState();
      const loginError = status?.login_error ? String(status.login_error) : null;
      await addLog(
        loginError ? 'error' : 'success',
        loginError ? `Facebook session rejected: ${loginError}` : 'Facebook session submitted; ECLIPSE is connecting…',
        'facebook'
      );
    }, setConnBusy, 'facebook');
  };

  const handleReconnect = async () => {
    await runAction(async () => {
      await addLog('info', 'Requesting ECLIPSE Facebook reconnect…', 'facebook');
      await eclipseApi('/api/dashboard/reconnect', 'POST', dashboardKey);
      await new Promise((resolve) => setTimeout(resolve, 900));
      await syncRuntimeState();
      await addLog('success', 'ECLIPSE reconnect requested', 'facebook');
    }, setConnBusy, 'facebook');
  };

  const handleDisconnect = async () => {
    await runAction(async () => {
      await addLog('warn', 'Detaching ECLIPSE Messenger listener…', 'facebook');
      await eclipseApi('/api/dashboard/disconnect', 'POST', dashboardKey);
      await syncRuntimeState();
      await addLog('info', 'Messenger listener detached; saved session remains available for reconnect', 'facebook');
    }, setConnBusy, 'facebook');
  };

  const handleStartBot = async () => {
    await runAction(async () => {
      await addLog('info', 'Starting ECLIPSE message handling…', 'bot');
      await eclipseApi('/api/dashboard/bot/start', 'POST', dashboardKey);
      await syncRuntimeState();
      await addLog('success', 'ECLIPSE message handling enabled', 'bot');
    }, setBotBusy, 'bot');
  };

  const handleStopBot = async () => {
    await runAction(async () => {
      await addLog('warn', 'Pausing ECLIPSE message handling…', 'bot');
      await eclipseApi('/api/dashboard/bot/stop', 'POST', dashboardKey);
      await syncRuntimeState();
      await addLog('info', 'ECLIPSE message handling paused', 'bot');
    }, setBotBusy, 'bot');
  };

  const handleClearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  };

  const selectSection = (id: GalaxyNodeId) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  const activeNav = NAV.find((item) => item.id === activeSection);
  const module = activeSection in MODULES
    ? MODULES[activeSection as keyof typeof MODULES]
    : null;

  const liveSignals = useMemo(() => [
    { label: 'Messenger', value: state.facebook_connected ? 'connected' : 'offline', ok: state.facebook_connected },
    { label: 'Bot runtime', value: state.bot_running ? 'running' : 'paused', ok: state.bot_running },
    { label: 'Session', value: state.session_active ? 'active' : 'idle', ok: state.session_active },
    { label: 'Dashboard API', value: apiReady ? 'online' : 'waiting', ok: apiReady },
  ], [apiReady, state]);

  if (loading) {
    return (
      <div className="eclipse-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="eclipse-mark mx-auto mb-5 h-14 w-14">
            <span />
          </div>
          <p className="eclipse-kicker">E C L I P S E</p>
          <p className="mt-2 text-xs text-white/45">initializing command center</p>
        </div>
      </div>
    );
  }

  return (
    <main className="eclipse-shell relative min-h-screen overflow-hidden">
      <GalaxyCanvas focusId={activeSection} onSelect={selectSection} />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(5,5,9,.72),transparent_35%,transparent_68%,rgba(5,5,9,.62))]" />

      <header className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-7 lg:px-9">
        <button
          className="pointer-events-auto flex items-center gap-3"
          onClick={() => selectSection('overview')}
          aria-label="ECLIPSE command center"
        >
          <div className="eclipse-mark h-10 w-10">
            <span />
          </div>
          <div className="hidden text-left sm:block">
            <p className="font-display text-sm tracking-[.36em] text-white/90">ECLIPSE</p>
            <p className="text-[9px] uppercase tracking-[.24em] text-white/35">messenger operating system</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className={`status-orbit ${apiReady ? 'is-live' : ''}`}>
            <span />
            {apiReady ? 'runtime linked' : 'runtime waiting'}
          </div>
          <button
            className="pointer-events-auto rounded-full border border-white/10 bg-black/25 p-2.5 text-white/60 backdrop-blur-xl hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <nav className="relative z-30 mx-4 mb-3 hidden max-w-[calc(100vw-2rem)] overflow-x-auto rounded-full border border-white/10 bg-black/25 p-1.5 backdrop-blur-xl lg:mx-7 lg:flex xl:mx-9">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <button
              key={item.id}
              onClick={() => selectSection(item.id)}
              className={`nav-chip ${active ? 'is-active' : ''}`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {mobileNavOpen && (
        <nav className="relative z-40 mx-4 mb-4 grid grid-cols-2 gap-1.5 rounded-3xl border border-white/10 bg-[#0C0A11]/95 p-2 backdrop-blur-2xl sm:grid-cols-3 lg:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => selectSection(item.id)}
                className={`nav-chip justify-start ${item.id === activeSection ? 'is-active' : ''}`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {!dashboardKey ? (
        <section className="relative z-30 flex min-h-[calc(100vh-150px)] items-center px-5 pb-16 sm:px-8 lg:px-12">
          <div className="max-w-xl animate-slide-up">
            <p className="eclipse-kicker">THE MESSENGER OPERATING SYSTEM</p>
            <h1 className="mt-4 font-display text-5xl leading-[.95] text-white sm:text-7xl">
              Enter the <span className="text-[#B9829B]">veil.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/48">
              A private command center for ECLIPSE — Messenger, RPG, economy, games,
              moderation, music and runtime health orbiting one live system.
            </p>

            <div className="mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row">
              <input
                type="password"
                placeholder="ECLIPSE dashboard key"
                className="eclipse-input flex-1"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const value = event.currentTarget.value.trim();
                    if (value) {
                      sessionStorage.setItem(DASHBOARD_KEY_STORAGE, value);
                      setDashboardKey(value);
                    }
                  }
                }}
              />
              <button
                className="eclipse-button"
                onClick={(event) => {
                  const input = event.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null;
                  const value = input?.value.trim() || '';
                  if (value) {
                    sessionStorage.setItem(DASHBOARD_KEY_STORAGE, value);
                    setDashboardKey(value);
                  }
                }}
              >
                Connect <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase tracking-[.2em] text-white/25">
              <span>Economy</span><span>RPG</span><span>Games</span><span>Moderation</span><span>Music</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative z-20 min-h-[calc(100vh-124px)] px-4 pb-8 sm:px-7 lg:px-9">
          <div className={`command-panel ${activeSection === 'overview' ? 'is-overview' : ''}`}>
            <div className="command-panel-inner">
              <div className="mb-6 flex items-start justify-between gap-5">
                <div>
                  <p className="eclipse-kicker">{activeNav?.label || 'Overview'}</p>
                  <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
                    {activeSection === 'overview' ? 'ECLIPSE Command Center' : activeNav?.label}
                  </h1>
                  <p className="mt-2 max-w-xl text-xs leading-6 text-white/42">
                    {activeSection === 'overview'
                      ? 'Drag the galaxy, zoom through the system, or select a constellation to expand a control surface.'
                      : module?.description || 'Operational controls and runtime state for this ECLIPSE subsystem.'}
                  </p>
                </div>
                <button
                  className="hidden rounded-full border border-white/10 p-2 text-white/45 hover:bg-white/5 sm:block"
                  onClick={() => selectSection('overview')}
                  aria-label="Return to command center"
                >
                  <Radar size={17} />
                </button>
              </div>

              {apiError && (
                <div className="mb-5 rounded-2xl border border-[#7A3949]/35 bg-[#7A3949]/10 px-4 py-3 text-xs text-[#D8A9B8]">
                  {apiError}
                </div>
              )}

              {activeSection === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                    {liveSignals.map((signal) => (
                      <div key={signal.label} className="signal-card">
                        <div className={`signal-dot ${signal.ok ? 'is-live' : ''}`} />
                        <div>
                          <p className="text-[9px] uppercase tracking-[.18em] text-white/30">{signal.label}</p>
                          <p className="mt-1 text-xs text-white/75">{signal.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <button className="module-tile" onClick={() => selectSection('rpg')}>
                      <Gem size={18} />
                      <span><b>RPG WORLD</b><small>world · guilds · combat · companions</small></span>
                      <ChevronRight size={15} />
                    </button>
                    <button className="module-tile" onClick={() => selectSection('economy')}>
                      <CircleDollarSign size={18} />
                      <span><b>ECONOMY</b><small>wallet · bank · circulation</small></span>
                      <ChevronRight size={15} />
                    </button>
                    <button className="module-tile" onClick={() => selectSection('moderation')}>
                      <ShieldCheck size={18} />
                      <span><b>MODERATION</b><small>automod · spam · warnings</small></span>
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
                    <div className="command-surface">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] uppercase tracking-[.22em] text-white/28">runtime identity</p>
                          <p className="mt-1 text-sm text-white/80">
                            {state.facebook_user_name || 'ECLIPSE Messenger'}
                          </p>
                        </div>
                        <Bot size={18} className="text-[#A994C7]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="text-white/30">updated</span><p className="mt-1 text-white/65">{formatDate(state.updated_at)}</p></div>
                        <div><span className="text-white/30">last connected</span><p className="mt-1 text-white/65">{formatDate(state.last_connected_at)}</p></div>
                      </div>
                    </div>

                    <div className="command-surface">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-[#B9829B]" />
                        <p className="text-[9px] uppercase tracking-[.22em] text-white/28">activity pulse</p>
                      </div>
                      <p className="mt-3 font-display text-2xl text-white">{logs.length}</p>
                      <p className="mt-1 text-[11px] text-white/35">local dashboard events retained</p>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'messenger' && (
                <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
                  <ConnectionCard state={state} busy={connBusy} onConnectSession={handleConnectSession} onConnectRawCookie={handleConnectRawCookie} onReconnect={handleReconnect} onDisconnect={handleDisconnect} />
                  <SessionCard state={state} />
                </div>
              )}

              {activeSection === 'health' && (
                <div className="grid gap-4 xl:grid-cols-[1fr_.8fr]">
                  <BotStatusCard state={state} busy={botBusy} onStart={handleStartBot} onStop={handleStopBot} />
                  <div className="command-surface">
                    <div className="flex items-center gap-2"><HeartPulse size={17} className="text-[#B9829B]" /><p className="text-[9px] uppercase tracking-[.22em] text-white/28">runtime health</p></div>
                    <div className="mt-5 space-y-3">
                      {liveSignals.map((signal) => (
                        <div key={signal.label} className="flex items-center justify-between border-b border-white/5 pb-3 text-xs last:border-0">
                          <span className="text-white/38">{signal.label}</span>
                          <span className={signal.ok ? 'text-[#C8B9D9]' : 'text-white/35'}>{signal.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'logs' && (
                <LogsPanel logs={logs} onClear={handleClearLogs} />
              )}

              {module && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {module.bullets.map((bullet, index) => (
                    <div key={bullet} className="command-surface min-h-32">
                      <p className="text-[9px] uppercase tracking-[.22em] text-white/25">0{index + 1}</p>
                      <Sparkles size={17} className="mt-5 text-[#A994C7]" />
                      <p className="mt-4 text-sm text-white/75">{bullet}</p>
                      <p className="mt-1 text-[10px] text-white/25">module surface ready</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="command-surface">
                    <p className="text-[9px] uppercase tracking-[.22em] text-white/25">dashboard</p>
                    <h2 className="mt-2 text-sm text-white/80">Session access</h2>
                    <p className="mt-2 text-xs leading-6 text-white/35">The dashboard key is kept in browser session storage and is not written to the repository.</p>
                    <button
                      className="mt-5 eclipse-button-secondary"
                      onClick={() => {
                        sessionStorage.removeItem(DASHBOARD_KEY_STORAGE);
                        setDashboardKey('');
                        setApiReady(false);
                      }}
                    >
                      Disconnect dashboard
                    </button>
                  </div>
                  <div className="command-surface">
                    <p className="text-[9px] uppercase tracking-[.22em] text-white/25">visual system</p>
                    <h2 className="mt-2 text-sm text-white/80">Galaxy interaction</h2>
                    <p className="mt-2 text-xs leading-6 text-white/35">The background is a navigable command surface: drag to pan, scroll to zoom, and select constellations to expand modules.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
