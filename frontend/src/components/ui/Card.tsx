import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, glass = true, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 p-5 transition-all duration-300',
        glass
          ? 'glass-card hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/5'
          : 'bg-white shadow-lg border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};


