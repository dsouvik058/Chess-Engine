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
          ? '0 0 20px -2px rgba(217, 119, 6, 0.2), 0 8px 16px -4px rgba(15, 23, 42, 0.08)'
          : '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 w-full glass-card overflow-hidden',
        isActive
          ? 'bg-gradient-to-r from-amber-50/95 via-white/95 to-amber-50/70 border-amber-500/80 ring-1 ring-amber-400/50'
          : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
      )}
    >
      {/* Active turn ambient subtle warmth */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/8 via-transparent to-transparent pointer-events-none"
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
                ? 'bg-gradient-to-br from-white to-amber-100 text-slate-900 border-amber-300 shadow-amber-900/10'
                : 'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-slate-700 shadow-slate-900/30',
              isActive && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white scale-105'
            )}
          >
            {isAi ? <Cpu className="w-5 h-5 text-amber-700" /> : <User className="w-5 h-5" />}
          </motion.div>
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600" />
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight font-serif-classic">{name}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border',
                color === 'white'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
              )}
            >
              {color}
            </span>
          </div>

          {/* Captured Pieces shown in left corner below name with animated tokens */}
          <div className="flex items-center gap-1 mt-1 min-h-[20px]">
            <AnimatePresence>
              {capturedPieces.length > 0 ? (
                <div className="text-xs text-slate-800 font-mono tracking-widest flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-sans tracking-normal font-bold">Captured:</span>
                  <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-slate-900 text-sm">
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
                <span className="text-[10px] text-slate-400 italic">No captures</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right side: Timer */}
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
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-sm font-extrabold border transition-all flex-shrink-0 shadow-sm relative z-10',
            isLowTime
              ? 'bg-rose-100 text-rose-800 border-rose-400 shadow-md shadow-rose-500/10'
              : isActive
              ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md shadow-amber-500/10 font-black'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          )}
        >
          {isLowTime ? (
            <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
          ) : (
            <Clock className={cn('w-4 h-4', isActive ? 'text-amber-700' : 'text-slate-500')} />
          )}
          <span>{timeFormatted}</span>
        </motion.div>
      )}
    </motion.div>
  );
};



