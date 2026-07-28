import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  className,
  min = 0,
  max = 100,
  value = 50,
  onChange,
  ...props
}) => {
  const numVal = Number(value);
  const numMin = Number(min);
  const numMax = Number(max);
  const percentage = Math.max(0, Math.min(100, ((numVal - numMin) / (numMax - numMin)) * 100));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(label || valueDisplay) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
          {label && <span>{label}</span>}
          {valueDisplay !== undefined && (
            <span className="text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {valueDisplay}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        style={{
          background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`,
        }}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
};
