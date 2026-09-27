import { Bot, Sparkles } from 'lucide-react';

interface HeaderProps {
  botRunning: boolean;
  fbConnected: boolean;
}

export default function Header({ botRunning, fbConnected }: HeaderProps) {
  const allGood = botRunning && fbConnected;

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-coquette-400 via-blush-400 to-lilac-500 text-white shadow-coquette-lg">
          <Bot size={28} />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
            <Sparkles size={12} className="text-coquette-500" />
          </span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-coquette-800 sm:text-3xl">
            Messenger Bot Admin
          </h1>
          <p className="text-sm text-coquette-400">
            Private control panel · Node.js bot runtime
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-4 py-2 shadow-coquette">
        <span className="relative flex h-2.5 w-2.5">
          {allGood && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              allGood ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </span>
        <span className="text-sm font-medium text-coquette-700">
          {allGood ? 'All systems operational' : 'Attention required'}
        </span>
      </div>
    </header>
  );
}
