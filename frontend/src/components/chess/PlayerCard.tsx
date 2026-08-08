import React from 'react';
import { User, Cpu, Clock } from 'lucide-react';
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
  const isLowTime = timeFormatted ? timeFormatted.startsWith('00:') && parseInt(timeFormatted.split(':')[1] || '99', 10) < 30 : false;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 w-full glass-card',
        isActive
          ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900/80 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/60'
      )}
    >
      {/* Left side: Avatar + Name + Captured Pieces */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shadow-md flex-shrink-0 transition-transform',
              color === 'white'
                ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-950 border-white shadow-slate-100/10'
                : 'bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 border-slate-700 shadow-black/40',
              isActive && 'scale-105'
            )}
          >
            {isAi ? <Cpu className="w-5 h-5 text-cyan-400" /> : <User className="w-5 h-5" />}
          </div>
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

          {/* Captured Pieces shown in left corner below name */}
          {capturedPieces.length > 0 ? (
            <div className="text-xs text-amber-300 font-mono tracking-widest flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-sans">Captured:</span>
              <span className="bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">{capturedPieces.join('')}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 italic mt-0.5">No captures</span>
          )}
        </div>
      </div>

      {/* Right side: Timer */}
      {timeFormatted && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-extrabold border transition-all flex-shrink-0 shadow-sm',
            isLowTime
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              : isActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10'
              : 'bg-slate-950/70 text-slate-400 border-slate-800'
          )}
        >
          <Clock className={cn('w-4 h-4', isLowTime ? 'text-rose-400' : isActive ? 'text-cyan-400' : 'text-slate-400')} />
          <span>{timeFormatted}</span>
        </div>
      )}
    </div>
  );
};

