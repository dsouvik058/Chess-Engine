import React, { useRef, useEffect } from 'react';
import type { MoveLogItem } from '../../types/chess';
import { Badge } from '../ui/Badge';

interface MoveHistoryLogProps {
  moves: MoveLogItem[];
  onSelectMove?: (fen: string) => void;
}

export const MoveHistoryLog: React.FC<MoveHistoryLogProps> = ({
  moves,
  onSelectMove,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
        <span className="w-10">#</span>
        <span className="flex-1">White</span>
        <span className="flex-1">Black</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
        {moves.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">No moves played yet</div>
        ) : (
          moves.map((item) => (
            <div
              key={item.moveNumber}
              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/50 transition-colors"
            >
              <span className="w-10 text-slate-500 font-semibold">{item.moveNumber}.</span>

              {/* White Move */}
              <button
                onClick={() => item.whiteFen && onSelectMove?.(item.whiteFen)}
                className="flex-1 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <span>{item.white || ''}</span>
                {item.whiteBadge && <Badge type={item.whiteBadge}>{item.whiteBadge}</Badge>}
              </button>

              {/* Black Move */}
              <button
                onClick={() => item.blackFen && onSelectMove?.(item.blackFen)}
                className="flex-1 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <span>{item.black || ''}</span>
                {item.blackBadge && <Badge type={item.blackBadge}>{item.blackBadge}</Badge>}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
