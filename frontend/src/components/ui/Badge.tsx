import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { MoveClassification } from '../../types/chess';

interface BadgeProps {
  type: MoveClassification | 'status' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, children, className }) => {
  const styles: Record<string, string> = {
    brilliant: 'bg-teal-100 text-teal-900 border-teal-400 font-black shadow-sm uppercase tracking-wide',
    great: 'bg-blue-100 text-blue-900 border-blue-400 font-bold shadow-sm uppercase tracking-wide',
    best: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-sm uppercase tracking-wide',
    excellent: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold uppercase tracking-wide',
    good: 'bg-green-50 text-green-800 border-green-300 font-medium',
    inaccuracy: 'bg-amber-100 text-amber-900 border-amber-400 font-medium',
    mistake: 'bg-orange-100 text-orange-900 border-orange-400 font-semibold',
    blunder: 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold shadow-sm uppercase animate-urgent',
    book: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold uppercase',
    miss: 'bg-purple-100 text-purple-900 border-purple-400 font-bold uppercase tracking-wide',
    status: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    info: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border font-bold transition-all duration-150',
        styles[type] || styles.info,
        className
      )}
    >
      {children}
    </motion.span>
  );
};


