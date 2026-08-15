import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameStatusDTO } from '../../types/chess';
import { Cpu, Activity, Zap, Layers, Clock, Sparkles } from 'lucide-react';

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
    <div className="relative glass-card p-4 rounded-2xl border border-slate-800 space-y-3.5 shadow-2xl overflow-hidden">
      {/* Laser Scanning Line when Engine is actively computing */}
      {isEngineThinking && (
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-20 opacity-80"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Engine Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={
              isEngineThinking
                ? { rotate: 360, scale: [1, 1.08, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={
              isEngineThinking
                ? { rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.2, repeat: Infinity } }
                : { duration: 0.3 }
            }
            className={`p-2 rounded-xl border transition-all ${
              isEngineThinking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-950/80 text-cyan-400 border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </motion.div>
          <div>
            <h3 className="font-extrabold text-xs text-white tracking-tight flex items-center gap-1.5">
              Stockfish 18 AI
              {isEngineThinking && <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />}
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isEngineThinking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              {isEngineThinking ? 'Calculating optimal variation...' : `${elo} ELO Engine`}
            </span>
          </div>
        </div>

        {/* ELO Quick Switch */}
        <select
          value={elo}
          onChange={(e) => onEloChange(Number(e.target.value))}
          className="bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50 cursor-pointer shadow-inner hover:border-slate-700 transition-colors"
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

      {/* Stats Grid with Spring Animation on metric change */}
      <div className="grid grid-cols-4 gap-2">
        {/* Depth */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Depth</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={depth}
              initial={{ y: 4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -4, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5"
            >
              {depth}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* NPS */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>NPS</span>
          </div>
          <motion.span
            key={nps}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5"
          >
            {nps > 1000 ? `${(nps / 1000).toFixed(1)}k` : nps}
          </motion.span>
        </motion.div>

        {/* Nodes */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Nodes</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {nodes > 1000 ? `${(nodes / 1000).toFixed(1)}k` : nodes}
          </span>
        </motion.div>

        {/* Compute Time */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Time</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {(timeMs / 1000).toFixed(2)}s
          </span>
        </motion.div>
      </div>
    </div>
  );
};


