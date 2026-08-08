import React from 'react';
import type { GameStatusDTO } from '../../types/chess';
import { Cpu, Activity, Zap, Layers, Clock } from 'lucide-react';

interface EngineStatsPanelProps {
  stats: GameStatusDTO | null;
  elo: number;
  onEloChange: (newElo: number) => void;
  isEngineThinking?: boolean;
}

export const EngineStatsPanel: React.FC<EngineStatsPanelProps> = ({
  stats,
  elo,
  onEloChange,
  isEngineThinking = false,
}) => {
  const depth = stats?.depth ?? 0;
  const nodes = stats?.nodes ?? 0;
  const nps = stats?.nps ?? 0;
  const timeMs = stats?.timeMs ?? 0;

  return (
    <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3.5 shadow-xl">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border transition-all ${
              isEngineThinking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/20 animate-pulse'
                : 'bg-slate-950/80 text-cyan-400 border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white tracking-tight">Stockfish 18 AI</h3>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isEngineThinking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              {isEngineThinking ? 'Evaluating calculation...' : `${elo} ELO Difficulty`}
            </span>
          </div>
        </div>

        {/* ELO Quick Switch */}
        <select
          value={elo}
          onChange={(e) => onEloChange(Number(e.target.value))}
          className="bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50 cursor-pointer shadow-inner"
        >
          <option value={800}>800 ELO (Beginner)</option>
          <option value={1200}>1200 ELO (Intermediate)</option>
          <option value={1500}>1500 ELO (Advanced)</option>
          <option value={1850}>1850 ELO (Expert)</option>
          <option value={2200}>2200 ELO (Master)</option>
          <option value={2600}>2600 ELO (Grandmaster)</option>
          <option value={3200}>3200 (Stockfish MAX)</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Depth */}
        <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Depth</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {depth}
          </span>
        </div>

        {/* NPS */}
        <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>NPS</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {nps > 1000 ? `${(nps / 1000).toFixed(1)}k` : nps}
          </span>
        </div>

        {/* Nodes */}
        <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Nodes</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {nodes > 1000 ? `${(nodes / 1000).toFixed(1)}k` : nodes}
          </span>
        </div>

        {/* Compute Time */}
        <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Time</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {(timeMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  );
};

