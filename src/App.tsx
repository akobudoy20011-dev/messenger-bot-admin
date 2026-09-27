import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { BotState, BotLog, LogLevel } from '@/types';
import Header from '@/components/Header';
import ConnectionCard from '@/components/ConnectionCard';
import SessionCard from '@/components/SessionCard';
import BotStatusCard from '@/components/BotStatusCard';
import LogsPanel from '@/components/LogsPanel';

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

async function addLog(level: LogLevel, message: string, source: string) {
  await supabase.from('bot_logs').insert({ level, message, source });
}

export default function App() {
  const [state, setState] = useState<BotState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connBusy, setConnBusy] = useState(false);
  const [botBusy, setBotBusy] = useState(false);

  const fetchState = useCallback(async () => {
    const { data, error } = await supabase
      .from('bot_state')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (!error && data) setState(data as BotState);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('bot_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setLogs(data as BotLog[]);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchState(), fetchLogs()]);
      setLoading(false);
    })();

    const stateChannel = supabase
      .channel('bot_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bot_state' },
        (payload) => {
          if (payload.new) setState(payload.new as BotState);
        },
      )
      .subscribe();

    const logsChannel = supabase
      .channel('bot_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bot_logs' },
        (payload) => {
          if (payload.new) {
            setLogs((prev) => [payload.new as BotLog, ...prev].slice(0, 200));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchState, fetchLogs]);

  const handleReconnect = async () => {
    setConnBusy(true);
    await addLog('info', 'Initiating Facebook reconnection…', 'facebook');
    const { error } = await supabase
      .from('bot_state')
      .update({
        facebook_connected: true,
        facebook_user_name: 'Demo Messenger Account',
        last_connected_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      await addLog('error', `Reconnect failed: ${error.message}`, 'facebook');
    } else {
      await addLog('success', 'Facebook connection established', 'facebook');
    }
    setConnBusy(false);
  };

  const handleDisconnect = async () => {
    setConnBusy(true);
    await addLog('warn', 'Disconnecting Facebook session…', 'facebook');
    const { error } = await supabase
      .from('bot_state')
      .update({
        facebook_connected: false,
        facebook_user_name: null,
        session_active: false,
        last_disconnected_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      await addLog('error', `Disconnect failed: ${error.message}`, 'facebook');
    } else {
      await addLog('info', 'Facebook connection closed', 'facebook');
    }
    setConnBusy(false);
  };

  const handleStartBot = async () => {
    setBotBusy(true);
    await addLog('info', 'Starting bot runtime…', 'bot');
    const { error } = await supabase
      .from('bot_state')
      .update({
        bot_running: true,
        session_active: true,
      })
      .eq('id', 1);
    if (error) {
      await addLog('error', `Bot start failed: ${error.message}`, 'bot');
    } else {
      await addLog('success', 'Bot is now running and listening for messages', 'bot');
    }
    setBotBusy(false);
  };

  const handleStopBot = async () => {
    setBotBusy(true);
    await addLog('warn', 'Stopping bot runtime…', 'bot');
    const { error } = await supabase
      .from('bot_state')
      .update({
        bot_running: false,
        session_active: false,
      })
      .eq('id', 1);
    if (error) {
      await addLog('error', `Bot stop failed: ${error.message}`, 'bot');
    } else {
      await addLog('info', 'Bot stopped', 'bot');
    }
    setBotBusy(false);
  };

  const handleClearLogs = async () => {
    const { error } = await supabase.from('bot_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) {
      setLogs([]);
      await addLog('info', 'Logs cleared by admin', 'system');
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
      <Header botRunning={state.bot_running} fbConnected={state.facebook_connected} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectionCard
          state={state}
          busy={connBusy}
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
