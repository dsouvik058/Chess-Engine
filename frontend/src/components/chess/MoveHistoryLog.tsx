import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MoveLogItem } from '../../types/chess';
import { Badge } from '../ui/Badge';
import { History } from 'lucide-react';

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
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [moves]);

  return (
    <div className="flex flex-col h-64 sm:h-72 glass-card rounded-2xl border border-slate-800 p-3.5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Move Notation Log</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-cyan-400 border border-slate-800">
          {moves.length} Turns
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 pb-1.5 px-2">
        <span className="col-span-2">#</span>
        <span className="col-span-5">White</span>
        <span className="col-span-5">Black</span>
      </div>

      {/* Move Rows */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs scroll-smooth">
        {moves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs space-y-1">
            <span>No moves recorded yet</span>
            <span className="text-[10px] text-slate-600">Make a move on the board to start log</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {moves.map((item) => (
              <motion.div
                key={item.moveNumber}
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <span className="col-span-2 text-slate-500 font-bold">{item.moveNumber}.</span>

                {/* White Move */}
                <motion.button
                  whileHover={{ scale: 1.04, x: 2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => item.whiteFen && onSelectMove?.(item.whiteFen)}
                  className="col-span-5 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                >
                  <span>{item.white || ''}</span>
                  {item.whiteBadge && <Badge type={item.whiteBadge}>{item.whiteBadge}</Badge>}
                </motion.button>

                {/* Black Move */}
                <motion.button
                  whileHover={{ scale: 1.04, x: 2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => item.blackFen && onSelectMove?.(item.blackFen)}
                  className="col-span-5 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                >
                  <span>{item.black || ''}</span>
                  {item.blackBadge && <Badge type={item.blackBadge}>{item.blackBadge}</Badge>}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};


