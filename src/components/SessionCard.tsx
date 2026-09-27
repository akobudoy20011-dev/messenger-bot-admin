import { MessageCircle, Clock, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BotState } from '@/types';

interface SessionCardProps {
  state: BotState;
}

export default function SessionCard({ state }: SessionCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-lilac animate-slide-up transition-all duration-300 hover:shadow-coquette-lg hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac-400 to-lilac-600 text-white shadow-glow-lilac">
            <MessageCircle size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-lilac-800">
              Session Status
            </h3>
            <p className="text-xs text-lilac-400">Active chat session</p>
          </div>
        </div>
        <StatusBadge
          active={state.session_active}
          activeLabel="Active"
          inactiveLabel="Idle"
          size="sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-lilac-50/60 px-4 py-3">
          <Activity
            size={18}
            className={state.session_active ? 'text-emerald-500' : 'text-lilac-300'}
          />
          <div className="flex-1">
            <p className="text-xs text-lilac-400">Session state</p>
            <p className="text-sm font-semibold text-lilac-800">
              {state.session_active
                ? 'Listening for messages'
                : 'No active conversation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-coquette-50/50 px-4 py-3">
          <Clock size={18} className="text-coquette-400" />
          <div className="flex-1">
            <p className="text-xs text-coquette-400">Last updated</p>
            <p className="text-sm font-semibold text-coquette-700">
              {new Date(state.updated_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
