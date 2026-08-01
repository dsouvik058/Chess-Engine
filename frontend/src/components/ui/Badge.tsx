import React from 'react';
import { cn } from '../../utils/cn';
import type { MoveClassification } from '../../types/chess';

interface BadgeProps {
  type: MoveClassification | 'status' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, children, className }) => {
  const styles: Record<string, string> = {
    brilliant: 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold shadow-sm shadow-cyan-500/30',
    great: 'bg-emerald-500/25 text-emerald-300 border-emerald-400 font-bold',
    best: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    good: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    bad: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    inaccuracy: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    mistake: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    blunder: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    book: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    status: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border transition-all duration-150',
        styles[type] || styles.info,
        className
      )}
    >
      {children}
    </span>
  );
};
