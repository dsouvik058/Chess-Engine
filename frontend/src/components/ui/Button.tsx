import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'classic';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.98] cursor-pointer select-none';

    const variants = {
      primary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 border border-amber-500/40',
      secondary: 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 shadow-sm shadow-slate-200/50',
      outline: 'border border-slate-300 bg-white/80 hover:bg-slate-50 text-slate-700 hover:border-slate-400 shadow-sm',
      ghost: 'bg-transparent hover:bg-slate-200/60 text-slate-700 hover:text-slate-900',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 border border-rose-500',
      accent: 'bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30',
      classic: 'bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-50 shadow-md shadow-amber-900/20 border border-amber-600',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
      icon: 'p-2 w-9 h-9 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

