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
import type { BotLog, BotState, DashboardRuntime, DashboardSnapshot, LogLevel } from '@/types';

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

function toNumber(value: number | string | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCount(value: number | string | null | undefined) {
  return toNumber(value).toLocaleString();
}

function formatDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  const date = new Date(Number(value) || value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function ModuleDataSurface({
  section,
  snapshot,
  runtime,
}: {
  section: GalaxyNodeId;
  snapshot: DashboardSnapshot | null;
  runtime: DashboardRuntime | null;
}) {
  if (!snapshot) {
    return (
      <div className="command-surface">
        <p className="text-xs text-white/40">Waiting for the ECLIPSE data bridge…</p>
      </div>
    );
  }

  const rowClass = "border-b border-white/5 last:border-0";
  const cellClass = "px-3 py-2.5 text-xs";

  if (section === 'users') {
    return (
      <div className="command-surface overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[.22em] text-white/25">live directory</p>
            <p className="mt-1 text-sm text-white/80">Recent ECLIPSE participants</p>
          </div>
          <span className="text-[10px] text-white/30">{formatCount(snapshot.users.total_users)} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead><tr className="text-left text-[9px] uppercase tracking-[.16em] text-white/25">
              <th className={cellClass}>identity</th><th className={cellClass}>level</th><th className={cellClass}>wallet</th><th className={cellClass}>bank</th><th className={cellClass}>XP</th><th className={cellClass}>games</th>
            </tr></thead>
            <tbody>{snapshot.users.recent_users.map((user) => (
              <tr key={user.thread_id + ':' + user.user_id} className={rowClass}>
                <td className={cellClass}><div className="text-white/75">{user.display_name || user.user_id}</div><div className="text-[9px] text-white/25">{user.user_id}</div></td>
                <td className={cellClass}>{formatCount(user.level)}</td>
                <td className={cellClass}>{formatCount(user.balance)}</td>
                <td className={cellClass}>{formatCount(user.bank_balance)}</td>
                <td className={cellClass}>{formatCount(user.xp)}</td>
                <td className={cellClass}>{formatCount(user.games_played)} / {formatCount(user.wins)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'economy') {
    return (
      <div className="command-surface overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[9px] uppercase tracking-[.22em] text-white/25">ledger</p><p className="mt-1 text-sm text-white/80">Recent economy transactions</p></div>
          <span className="text-[10px] text-white/30">{formatCount(snapshot.economy.transaction_count)} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead><tr className="text-left text-[9px] uppercase tracking-[.16em] text-white/25">
              <th className={cellClass}>time</th><th className={cellClass}>user</th><th className={cellClass}>type</th><th className={cellClass}>amount</th><th className={cellClass}>description</th>
            </tr></thead>
            <tbody>{snapshot.economy.recent_transactions.map((tx) => (
              <tr key={String(tx.id)} className={rowClass}>
                <td className={cellClass}>{formatDate(tx.created_at)}</td>
                <td className={cellClass}>{tx.user_id}</td>
                <td className={cellClass}>{tx.type}</td>
                <td className={cellClass}>{formatCount(tx.amount)}</td>
                <td className={cellClass + " text-white/45"}>{tx.description || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'rpg') {
    return (
      <div className="grid gap-4 xl:grid-cols-[.75fr_.75fr_1.5fr]">
        <div className="command-surface">
          <p className="text-[9px] uppercase tracking-[.22em] text-white/25">classes</p>
          <div className="mt-4 space-y-2">{snapshot.rpg.classes.map((item) => (
            <div key={item.character_class} className="flex justify-between text-xs"><span className="text-white/55">{item.character_class}</span><span className="text-white/80">{formatCount(item.count)}</span></div>
          ))}</div>
        </div>
        <div className="command-surface">
          <p className="text-[9px] uppercase tracking-[.22em] text-white/25">regions</p>
          <div className="mt-4 space-y-2">{snapshot.rpg.regions.map((item) => (
            <div key={item.region_id} className="flex justify-between text-xs"><span className="text-white/55">{item.region_id}</span><span className="text-white/80">{formatCount(item.count)}</span></div>
          ))}</div>
        </div>
        <div className="command-surface overflow-hidden">
          <div className="mb-4 flex items-center justify-between"><p className="text-[9px] uppercase tracking-[.22em] text-white/25">progression feed</p><span className="text-[10px] text-white/30">{formatCount(snapshot.rpg.players)} players</span></div>
          <div className="space-y-2">{snapshot.rpg.recent_players.map((player) => (
            <div key={player.thread_id + ':' + player.user_id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.02] px-3 py-2.5">
              <div><p className="text-xs text-white/70">{player.user_id}</p><p className="text-[9px] text-white/25">{player.character_class} · {player.region_id}</p></div>
              <div className="text-right"><p className="text-xs text-white/75">Lv {formatCount(player.level)}</p><p className="text-[9px] text-white/25">renown {formatCount(player.renown)}</p></div>
            </div>
          ))}</div>
        </div>
      </div>
    );
  }

  if (section === 'games') {
    const rate = toNumber(snapshot.games.games_played) ? (toNumber(snapshot.games.wins) / toNumber(snapshot.games.games_played) * 100).toFixed(1) : '0.0';
    return (
      <div className="command-surface">
        <p className="text-[9px] uppercase tracking-[.22em] text-white/25">game engine telemetry</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['plays', formatCount(snapshot.games.games_played)],
            ['wins', formatCount(snapshot.games.wins)],
            ['players', formatCount(snapshot.games.players_with_games)],
            ['win rate', rate + '%'],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/5 bg-white/[.02] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-white/25">{label}</p><p className="mt-2 text-lg text-white/80">{value}</p></div>)}
        </div>
        <p className="mt-4 text-[10px] text-white/25">Game logic remains in the Messenger bot; this surface only reads persisted counters.</p>
      </div>
    );
  }

  if (section === 'moderation') {
    return (
      <div className="command-surface overflow-hidden">
        <div className="mb-4"><p className="text-[9px] uppercase tracking-[.22em] text-white/25">automod feed</p><p className="mt-1 text-sm text-white/80">Recent moderation incidents</p></div>
        <div className="space-y-2">{snapshot.moderation.recent_incidents.map((incident) => (
          <div key={String(incident.id)} className="rounded-2xl border border-white/5 bg-white/[.02] p-3">
            <div className="flex items-center justify-between gap-3"><span className="text-xs text-white/70">{incident.category}</span><span className="text-[9px] uppercase tracking-[.15em] text-white/30">{incident.action} · severity {incident.severity}</span></div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/35"><span>user {incident.user_id}</span><span>confidence {Number(incident.confidence).toFixed(2)}</span><span>{formatDate(incident.created_at)}</span></div>
            {incident.reason && <p className="mt-2 text-[10px] leading-5 text-white/40">{incident.reason}</p>}
          </div>
        ))}</div>
      </div>
    );
  }

  if (section === 'music') {
    const music = runtime?.music || {};
    return (
      <div className="command-surface">
        <p className="text-[9px] uppercase tracking-[.22em] text-white/25">music pipeline</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['active jobs', formatCount(music.activeJobs as number)],
            ['pending', formatCount(music.pendingJobs as number)],
            ['downloads', formatCount(music.activeDownloads as number)],
            ['tracked GCs', formatCount(music.trackedGCs as number)],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/5 bg-white/[.02] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-white/25">{label}</p><p className="mt-2 text-lg text-white/80">{value}</p></div>)}
        </div>
        <p className="mt-4 text-[10px] text-white/25">Music state is read directly from the live runtime queue; no duplicate queue exists in the dashboard.</p>
      </div>
    );
  }

  if (section === 'analytics') {
    return (
      <div className="command-surface">
        <p className="text-[9px] uppercase tracking-[.22em] text-white/25">system analytics</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['participants', formatCount(snapshot.users.total_users)],
            ['wallet + bank', formatCount(toNumber(snapshot.users.wallet_circulation) + toNumber(snapshot.users.bank_circulation))],
            ['RPG players', formatCount(snapshot.rpg.players)],
            ['economy tx', formatCount(snapshot.economy.transaction_count)],
            ['RPG inventory', formatCount(snapshot.rpg.inventory_items)],
            ['equipment', formatCount(snapshot.rpg.equipment)],
            ['battles 24h', formatCount(snapshot.rpg.battles_24h)],
            ['automod 24h', formatCount(snapshot.moderation.incidents_24h)],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/5 bg-white/[.02] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-white/25">{label}</p><p className="mt-2 text-lg text-white/80">{value}</p></div>)}
        </div>
      </div>
    );
  }

  return null;
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
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [runtime, setRuntime] = useState<DashboardRuntime | null>(null);
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
  
  const syncDashboardSnapshot = useCallback(async () => {
    if (!dashboardKey) {
      setSnapshot(null);
      setRuntime(null);
      return null;
    }

    const data = await eclipseApi('/api/dashboard/snapshot', 'GET', dashboardKey);
    setSnapshot(data.snapshot ?? null);
    setRuntime(data.runtime ?? null);
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
        await syncDashboardSnapshot();
      } catch (error) {
        if (!cancelled) {
          setApiReady(false);
          setApiError(error instanceof Error ? error.message : 'ECLIPSE API unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const runtimePoll = window.setInterval(() => {
      void syncRuntimeState().catch(() => undefined);
    }, 5000);

    const snapshotPoll = window.setInterval(() => {
      void syncDashboardSnapshot().catch(() => undefined);
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(runtimePoll);
      window.clearInterval(snapshotPoll);
    };
  }, [dashboardKey, syncRuntimeState, syncDashboardSnapshot]);

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
  
  const telemetry = snapshot
    ? activeSection === 'users'
      ? [['users', formatCount(snapshot.users.total_users)], ['funded', formatCount(snapshot.users.funded_users)], ['XP', formatCount(snapshot.users.total_xp)], ['game activity', formatCount(snapshot.users.games_played)]]
      : activeSection === 'economy'
        ? [['wallet', formatCount(snapshot.users.wallet_circulation)], ['bank', formatCount(snapshot.users.bank_circulation)], ['transactions', formatCount(snapshot.economy.transaction_count)], ['inflow', formatCount(snapshot.economy.inflow)]]
        : activeSection === 'rpg'
          ? [['players', formatCount(snapshot.rpg.players)], ['active', formatCount(snapshot.rpg.active_players)], ['guilds', formatCount(snapshot.guilds.guilds)], ['guild members', formatCount(snapshot.guilds.members)]]
          : activeSection === 'games'
            ? [['games played', formatCount(snapshot.games.games_played)], ['wins', formatCount(snapshot.games.wins)], ['players', formatCount(snapshot.games.players_with_games)], ['win rate', toNumber(snapshot.games.games_played) ? (toNumber(snapshot.games.wins) / toNumber(snapshot.games.games_played) * 100).toFixed(1) + '%' : '—']]
            : activeSection === 'moderation'
              ? [['warnings', formatCount(snapshot.moderation.active_warnings)], ['bans', formatCount(snapshot.moderation.active_bans)], ['mutes', formatCount(snapshot.moderation.active_mutes)], ['incidents 24h', formatCount(snapshot.moderation.incidents_24h)]]
              : activeSection === 'analytics'
                ? [['users', formatCount(snapshot.users.total_users)], ['XP', formatCount(snapshot.users.total_xp)], ['economy in', formatCount(snapshot.economy.inflow)], ['economy out', formatCount(snapshot.economy.outflow)]]
                : activeSection === 'music'
                  ? [['active jobs', formatCount(runtime?.music?.activeJobs as number)], ['pending', formatCount(runtime?.music?.pendingJobs as number)], ['downloads', formatCount(runtime?.music?.activeDownloads as number)], ['queues', formatCount(runtime?.music?.trackedGCs as number)]]
                  : [];


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
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                        <span className="text-white/38">Database</span>
                        <span className={runtime?.database ? 'text-[#C8B9D9]' : 'text-white/35'}>{runtime?.database ? 'healthy' : 'unavailable'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                        <span className="text-white/38">Watchdog</span>
                        <span className="text-white/55">{String(runtime?.watchdog?.mode || 'unknown')}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                        <span className="text-white/38">Traffic queue</span>
                        <span className="text-white/55">{formatCount(runtime?.traffic?.queue as number)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/38">Uptime</span>
                        <span className="text-white/55">{Math.floor((runtime?.uptime_seconds || 0) / 3600)}h {Math.floor(((runtime?.uptime_seconds || 0) % 3600) / 60)}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'logs' && (
                <LogsPanel logs={logs} onClear={handleClearLogs} />
              )}

              {module && telemetry.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                  {telemetry.map(([label, value]) => (
                    <div key={label} className="signal-card">
                      <div className="signal-dot is-live" />
                      <div>
                        <p className="text-[9px] uppercase tracking-[.18em] text-white/30">{label}</p>
                        <p className="mt-1 text-sm text-white/80">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {module && (
                <ModuleDataSurface section={activeSection} snapshot={snapshot} runtime={runtime} />
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
