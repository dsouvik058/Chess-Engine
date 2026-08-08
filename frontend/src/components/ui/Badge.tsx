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
    brilliant: 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-extrabold shadow-sm shadow-cyan-500/30 uppercase tracking-wide',
    great: 'bg-blue-500/25 text-blue-300 border-blue-400 font-bold uppercase tracking-wide',
    best: 'bg-emerald-500/25 text-emerald-300 border-emerald-400 font-bold uppercase tracking-wide',
    excellent: 'bg-teal-500/25 text-teal-300 border-teal-400 font-semibold uppercase tracking-wide',
    good: 'bg-green-500/20 text-green-300 border-green-500/30 font-medium',
    inaccuracy: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium',
    mistake: 'bg-orange-500/25 text-orange-300 border-orange-400 font-semibold',
    blunder: 'bg-rose-500/30 text-rose-300 border-rose-500/50 font-extrabold shadow-sm shadow-rose-500/20 uppercase',
    book: 'bg-amber-700/30 text-amber-200 border-amber-600/40 font-semibold uppercase',
    miss: 'bg-purple-500/25 text-purple-300 border-purple-400 font-bold uppercase tracking-wide',
    status: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border transition-all duration-150',
        styles[type] || styles.info,
        className
      )}
    >
      {children}
    </span>
  );
};
