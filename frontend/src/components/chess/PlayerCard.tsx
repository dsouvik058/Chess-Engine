import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Cpu, Clock, Flame } from 'lucide-react';
import type { PlayerColor } from '../../types/chess';
import { cn } from '../../utils/cn';

interface PlayerCardProps {
  name: string;
  color: PlayerColor;
  isAi?: boolean;
  isActive: boolean;
  timeFormatted?: string;
  capturedPieces?: string[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  color,
  isAi = false,
  isActive,
  timeFormatted,
  capturedPieces = [],
}) => {
  // Low time detection (< 30 sec or starts with 00:0 or 00:1 or 00:2)
  const isLowTime = timeFormatted
    ? timeFormatted.startsWith('00:') && parseInt(timeFormatted.split(':')[1] || '99', 10) < 30
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isActive
          ? '0 0 25px -5px rgba(6, 182, 212, 0.25), 0 8px 16px -4px rgba(0, 0, 0, 0.4)'
          : '0 4px 12px -2px rgba(0, 0, 0, 0.3)',
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300 w-full glass-card overflow-hidden',
        isActive
          ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900/80 border-cyan-500/70'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/60'
      )}
    >
      {/* Active turn ambient pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Left side: Avatar + Name + Captured Pieces */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.06 }}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shadow-md flex-shrink-0 transition-all',
              color === 'white'
                ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-950 border-white shadow-slate-100/10'
                : 'bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 border-slate-700 shadow-black/40',
              isActive && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105'
            )}
          >
            {isAi ? <Cpu className="w-5 h-5 text-cyan-400" /> : <User className="w-5 h-5" />}
          </motion.div>
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white tracking-tight">{name}</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase',
                color === 'white'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              )}
            >
              {color}
            </span>
          </div>

          {/* Captured Pieces shown in left corner below name with animated tokens */}
          <div className="flex items-center gap-1 mt-1 min-h-[20px]">
            <AnimatePresence>
              {capturedPieces.length > 0 ? (
                <div className="text-xs text-amber-300 font-mono tracking-widest flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-sans tracking-normal">Captured:</span>
                  <div className="flex items-center gap-0.5 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">
                    {capturedPieces.map((piece, idx) => (
                      <motion.span
                        key={`${piece}-${idx}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      >
                        {piece}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">No captures</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right side: Timer with Urgent Flame Animation */}
      {timeFormatted && (
        <motion.div
          animate={
            isLowTime
              ? { scale: [1, 1.04, 1] }
              : {}
          }
          transition={
            isLowTime ? { duration: 0.6, repeat: Infinity } : {}
          }
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-extrabold border transition-all flex-shrink-0 shadow-sm relative z-10',
            isLowTime
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-500/20'
              : isActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10'
              : 'bg-slate-950/70 text-slate-400 border-slate-800'
          )}
        >
          {isLowTime ? (
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Clock className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
          )}
          <span>{timeFormatted}</span>
        </motion.div>
      )}
    </motion.div>
  );
};


