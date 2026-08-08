import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, glass = true, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 p-5 transition-all duration-300',
        glass
          ? 'glass-card hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10'
          : 'bg-slate-900/90 shadow-xl border-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

