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
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-xl border transition-all duration-300 w-full',
        isActive
          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-900/40 border-slate-800/80'
      )}
    >
      {/* Left side: Avatar + Name + Captured Pieces in Left Corner */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm shadow-sm flex-shrink-0',
            color === 'white'
              ? 'bg-slate-100 text-slate-950 border-slate-300'
              : 'bg-slate-950 text-slate-100 border-slate-800'
          )}
        >
          {isAi ? <Cpu className="w-5 h-5 text-cyan-400" /> : <User className="w-5 h-5" />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-100">{name}</span>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
          {/* Captured Pieces shown in left corner below name */}
          {capturedPieces.length > 0 ? (
            <div className="text-xs text-amber-300 font-mono tracking-widest flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-slate-500 font-sans">Captured:</span>
              <span>{capturedPieces.join('')}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 italic">No captures</span>
          )}
        </div>
      </div>

      {/* Right side: Timer */}
      {timeFormatted && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-sm font-bold border transition-colors flex-shrink-0',
            isActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-950/60 text-slate-400 border-slate-800'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>{timeFormatted}</span>
        </div>
      )}
    </div>
  );
};
