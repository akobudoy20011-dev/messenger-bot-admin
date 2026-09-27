import { useCallback, useEffect, useState } from 'react';
import type { BotState, BotLog, LogLevel } from '@/types';
import Header from '@/components/Header';
import ConnectionCard from '@/components/ConnectionCard';
import SessionCard from '@/components/SessionCard';
import BotStatusCard from '@/components/BotStatusCard';
import LogsPanel from '@/components/LogsPanel';

const ECLIPSE_API_URL = String(
  import.meta.env.VITE_ECLIPSE_API_URL || ""
).replace(/\/$/, "");

const DASHBOARD_KEY_STORAGE = "eclipse_dashboard_key";

async function eclipseApi(
  path: string,
  method = "GET",
  dashboardKey = "",
  body?: unknown
) {
  if (!ECLIPSE_API_URL) {
    throw new Error("VITE_ECLIPSE_API_URL is not configured.");
  }

  const key =
    dashboardKey ||
    sessionStorage.getItem(DASHBOARD_KEY_STORAGE) ||
    "";

  const response = await fetch(
    `${ECLIPSE_API_URL}${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-ECLIPSE-DASHBOARD-KEY": key,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      String(payload.error || `ECLIPSE API returned ${response.status}`)
    );
  }

  return payload;
}

async function syncRuntimeState(
  setState: (state: BotState) => void,
  dashboardKey: string
) {
  const data = await eclipseApi(
    "/api/dashboard/status",
    "GET",
    dashboardKey
  );

  setState({
    id: 1,
    facebook_connected: data.facebook_connected === true,
    facebook_user_name: data.facebook_user_name ?? null,
    session_active: data.session_active === true,
    bot_running: data.bot_running === true,
    last_connected_at: data.last_connected_at ?? null,
    last_disconnected_at: data.last_disconnected_at ?? null,
    updated_at: data.updated_at || new Date().toISOString(),
  });
}

const DEFAULT_STATE: BotState = {
  id: 1,
  facebook_connected: false,
  facebook_user_name: null,
  session_active: false,
  bot_running: false,
  last_connected_at: null,
  last_disconnected_at: null,
  updated_at: new Date().toISOString(),
};

const LOG_STORAGE_KEY = "eclipse_dashboard_logs";

function loadStoredLogs(): BotLog[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BotLog[]).slice(0, 200) : [];
  } catch {
    return [];
  }
}

function persistLogs(logs: BotLog[]) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch {
    // Local activity logs are best-effort and never block dashboard controls.
  }
}

export default function App() {
  const [state, setState] = useState<BotState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<BotLog[]>(loadStoredLogs);
  const [loading, setLoading] = useState(true);
  const [connBusy, setConnBusy] = useState(false);
  const [botBusy, setBotBusy] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(
    () => sessionStorage.getItem(DASHBOARD_KEY_STORAGE) || ""
  );
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const addLog = useCallback((level: LogLevel, message: string, source: string) => {
    setLogs((prev) => {
      const next: BotLog[] = [
        {
          id: crypto.randomUUID(),
          level,
          message,
          source,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 200);

      persistLogs(next);
      return next;
    });
  }, []);


  const fetchState = useCallback(async () => {
    if (!dashboardKey) {
      setApiReady(false);
      return;
    }

    try {
      await syncRuntimeState(setState, dashboardKey);
      setApiReady(true);
      setApiError(null);
    } catch (error) {
      setApiReady(false);
      setApiError(error instanceof Error ? error.message : "ECLIPSE API unavailable");
    }
  }, [dashboardKey]);

  useEffect(() => {
    (async () => {
      await fetchState();
      setLoading(false);
    })();

    const poll = window.setInterval(() => {
      void fetchState();
    }, 5000);

    return () => {
      window.clearInterval(poll);
    };
  }, [fetchState]);

  const handleConnectCredentials = async (email: string, password: string) => {
    setConnBusy(true);
    await addLog('info', 'Submitting Facebook login to ECLIPSE…', 'facebook');

    try {
      await eclipseApi('/api/dashboard/connect-credentials', 'POST', dashboardKey, {
        email,
        password,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await syncRuntimeState(setState, dashboardKey);
      setApiReady(true);
      setApiError(null);
      await addLog('success', 'Facebook login submitted; ECLIPSE is connecting…', 'facebook');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facebook login failed';
      setApiError(message);
      await addLog('error', 'Facebook login failed. Check the dashboard error message.', 'facebook');
    } finally {
      setConnBusy(false);
    }
  };

  const handleConnectSession = async (file: File) => {
    setConnBusy(true);
    await addLog('info', 'Uploading a Facebook session to ECLIPSE…', 'facebook');

    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('The selected file must contain a non-empty Facebook cookie/appState array.');
      }

      await eclipseApi('/api/dashboard/connect-session', 'POST', dashboardKey, {
        appState: parsed,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await syncRuntimeState(setState, dashboardKey);
      setApiReady(true);
      setApiError(null);
      await addLog('success', 'Facebook session submitted; ECLIPSE is connecting…', 'facebook');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facebook session upload failed';
      setApiError(message);
      await addLog('error', `Facebook session upload failed: ${message}`, 'facebook');
    } finally {
      setConnBusy(false);
    }
  };

  const handleReconnect = async () => {
    setConnBusy(true);
    await addLog('info', 'Requesting ECLIPSE Facebook reconnect…', 'facebook');

    try {
      await eclipseApi('/api/dashboard/reconnect', 'POST', dashboardKey);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await syncRuntimeState(setState, dashboardKey);
      setApiReady(true);
      setApiError(null);
      await addLog('success', 'ECLIPSE reconnect requested', 'facebook');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reconnect failed';
      setApiError(message);
      await addLog('error', `Reconnect failed: ${message}`, 'facebook');
    } finally {
      setConnBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setConnBusy(true);
    await addLog('warn', 'Detaching ECLIPSE Messenger listener…', 'facebook');

    try {
      await eclipseApi('/api/dashboard/disconnect', 'POST', dashboardKey);
      await syncRuntimeState(setState, dashboardKey);
      await addLog('info', 'Messenger listener detached; saved session remains available for reconnect', 'facebook');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Disconnect failed';
      setApiError(message);
      await addLog('error', `Disconnect failed: ${message}`, 'facebook');
    } finally {
      setConnBusy(false);
    }
  };

  const handleStartBot = async () => {
    setBotBusy(true);
    await addLog('info', 'Starting ECLIPSE message handling…', 'bot');

    try {
      await eclipseApi('/api/dashboard/bot/start', 'POST', dashboardKey);
      await syncRuntimeState(setState, dashboardKey);
      await addLog('success', 'ECLIPSE message handling enabled', 'bot');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bot start failed';
      setApiError(message);
      await addLog('error', `Bot start failed: ${message}`, 'bot');
    } finally {
      setBotBusy(false);
    }
  };

  const handleStopBot = async () => {
    setBotBusy(true);
    await addLog('warn', 'Pausing ECLIPSE message handling…', 'bot');

    try {
      await eclipseApi('/api/dashboard/bot/stop', 'POST', dashboardKey);
      await syncRuntimeState(setState, dashboardKey);
      await addLog('info', 'ECLIPSE message handling paused', 'bot');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bot stop failed';
      setApiError(message);
      await addLog('error', `Bot stop failed: ${message}`, 'bot');
    } finally {
      setBotBusy(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch {
      // Ignore local storage failures.
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-coquette-200 border-t-coquette-500" />
          <p className="font-display text-lg text-coquette-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {!dashboardKey && (
        <div className="mb-6 glass-card rounded-3xl border border-white/60 p-5 shadow-coquette">
          <p className="mb-2 font-display text-sm font-semibold text-coquette-800">
            ECLIPSE dashboard access
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              placeholder="Enter your ECLIPSE dashboard key"
              className="flex-1 rounded-2xl border border-coquette-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-coquette-400"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  const value = event.currentTarget.value.trim();
                  if (value) {
                    sessionStorage.setItem(DASHBOARD_KEY_STORAGE, value);
                    setDashboardKey(value);
                  }
                }
              }}
            />
            <button
              className="rounded-2xl bg-gradient-to-r from-coquette-400 to-lilac-500 px-5 py-3 text-sm font-semibold text-white"
              onClick={(event) => {
                const input = event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null;
                const value = input?.value.trim() || "";
                if (value) {
                  sessionStorage.setItem(DASHBOARD_KEY_STORAGE, value);
                  setDashboardKey(value);
                }
              }}
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {apiError && dashboardKey && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {apiError}
        </div>
      )}

      {apiReady && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          Live ECLIPSE runtime connection active.
        </div>
      )}

      <Header botRunning={state.bot_running} fbConnected={state.facebook_connected} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectionCard
          state={state}
          busy={connBusy}
          onConnectSession={handleConnectSession}
          onConnectCredentials={handleConnectCredentials}
          onReconnect={handleReconnect}
          onDisconnect={handleDisconnect}
        />
        <BotStatusCard
          state={state}
          busy={botBusy}
          onStart={handleStartBot}
          onStop={handleStopBot}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SessionCard state={state} />
        </div>
        <div className="lg:col-span-2">
          <LogsPanel logs={logs} onClear={handleClearLogs} />
        </div>
      </div>

      <footer className="mt-10 text-center">
        <p className="text-xs text-coquette-300">
          Messenger Bot Admin · Private dashboard
        </p>
      </footer>
    </div>
  );
}
