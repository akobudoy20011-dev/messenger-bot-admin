import { Bot, Play, Square, Zap } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface BotStatusCardProps {
  state: BotState;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function BotStatusCard({
  state,
  busy,
  onStart,
  onStop,
}: BotStatusCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-coquette animate-slide-up transition-all duration-300 hover:shadow-coquette-lg hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 to-coquette-500 text-white shadow-glow-pink">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-coquette-800">
              Bot Status
            </h3>
            <p className="text-xs text-coquette-400">Message handler runtime</p>
          </div>
        </div>
        <StatusBadge
          active={state.bot_running}
          activeLabel="Running"
          inactiveLabel="Stopped"
        />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-coquette-50 to-lilac-50 px-4 py-3">
        <Zap
          size={18}
          className={state.bot_running ? 'text-amber-500' : 'text-coquette-300'}
        />
        <p className="text-sm text-coquette-700">
          {state.bot_running
            ? 'Bot is live and processing incoming messages.'
            : 'Bot is offline. Start it to handle messages.'}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStart}
          disabled={busy || state.bot_running}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Play size={16} />
          Start Bot
        </button>
        <button
          onClick={onStop}
          disabled={busy || !state.bot_running}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white/60 px-4 py-3 text-sm font-semibold text-rose-500 transition-all duration-300 hover:bg-rose-50 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Square size={16} />
          Stop Bot
        </button>
      </div>
    </div>
  );
}
