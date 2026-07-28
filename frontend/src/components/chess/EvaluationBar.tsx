import React from 'react';

interface EvaluationBarProps {
  scoreType?: 'cp' | 'mate';
  scoreValue?: number;
  isFlipped?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  scoreType = 'cp',
  scoreValue = 30,
  isFlipped = false,
}) => {
  let whitePercent = 50;
  let text = '0.0';

  if (scoreType === 'mate') {
    if (scoreValue > 0) {
      whitePercent = 100;
      text = `#M${scoreValue}`;
    } else {
      whitePercent = 0;
      text = `#M-${Math.abs(scoreValue)}`;
    }
  } else {
    // Centipawn calculation
    const clampedCp = Math.max(-1000, Math.min(1000, scoreValue));
    const evalPawns = clampedCp / 100.0;
    // Logistic curve for smooth evaluation bar
    whitePercent = 50 + (evalPawns / 10.0) * 45.0;
    whitePercent = Math.max(5, Math.min(95, whitePercent));
    text = `${scoreValue >= 0 ? '+' : ''}${evalPawns.toFixed(1)}`;
  }

  const topPercent = isFlipped ? whitePercent : 100 - whitePercent;

  return (
    <div className="relative w-7 h-[480px] rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner flex flex-col justify-between select-none">
      {/* Top Bar (Black side when normal, White side when flipped) */}
      <div
        className="w-full bg-slate-950 transition-all duration-500 ease-out"
        style={{ height: `${topPercent}%` }}
      />
      {/* Bottom Bar (White side when normal, Black side when flipped) */}
      <div
        className="w-full bg-slate-100 transition-all duration-500 ease-out flex-1"
      />

      {/* Eval Label Pill */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
        <span className="bg-slate-950/90 text-cyan-300 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-cyan-500/40 shadow-lg">
          {text}
        </span>
      </div>
    </div>
  );
};
