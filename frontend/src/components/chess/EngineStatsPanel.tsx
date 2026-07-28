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
    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isEngineThinking ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-200">Stockfish 18 Engine</h3>
            <span className="text-[10px] text-cyan-400 font-mono">
              {isEngineThinking ? 'Thinking...' : `Active (${elo} ELO)`}
            </span>
          </div>
        </div>

        {/* ELO Quick Switch */}
        <select
          value={elo}
          onChange={(e) => onEloChange(Number(e.target.value))}
          className="bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
        >
          <option value={800}>800 ELO</option>
          <option value={1200}>1200 ELO</option>
          <option value={1500}>1500 ELO</option>
          <option value={1850}>1850 ELO</option>
          <option value={2200}>2200 ELO</option>
          <option value={2600}>2600 ELO</option>
          <option value={3200}>3200 (MAX)</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Depth */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Depth</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-100 mt-1">
            {depth}
          </span>
        </div>

        {/* NPS */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>NPS</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-100 mt-1">
            {nps > 1000 ? `${(nps / 1000).toFixed(1)}k` : nps}
          </span>
        </div>

        {/* Nodes */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Nodes</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-100 mt-1">
            {nodes > 1000 ? `${(nodes / 1000).toFixed(1)}k` : nodes}
          </span>
        </div>

        {/* Compute Time */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Time</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-100 mt-1">
            {(timeMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  );
};
