import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, glass = true, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800/80 p-4 transition-all duration-200',
        glass
          ? 'bg-slate-900/60 backdrop-blur-md shadow-xl shadow-black/40 hover:border-slate-700/80'
          : 'bg-slate-900 shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
