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
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          {label && <span>{label}</span>}
          {valueDisplay !== undefined && (
            <span className="text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold">
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
          background: `linear-gradient(to right, #d97706 0%, #d97706 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
        }}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
};

