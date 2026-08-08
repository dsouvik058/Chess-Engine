import React from 'react';

interface EvaluationBarProps {
  scoreType?: 'cp' | 'mate';
  scoreValue?: number;
  isFlipped?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  scoreType = 'cp',
  scoreValue = 0,
  isFlipped = false,
}) => {
  let whitePercent = 50;
  let text = '0.0';

  if (scoreType === 'mate') {
    if (scoreValue > 0) {
      whitePercent = 100;
      text = `#M${scoreValue}`;
    } else if (scoreValue < 0) {
      whitePercent = 0;
      text = `#M-${Math.abs(scoreValue)}`;
    } else {
      whitePercent = 50;
      text = '#M0';
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

  const blackPercent = 100 - whitePercent;

  // Determine top height and colors based on orientation
  const topHeight = isFlipped ? whitePercent : blackPercent;
  const topBgClass = isFlipped ? 'bg-gradient-to-b from-slate-100 to-slate-200' : 'bg-slate-950';
  const bottomBgClass = isFlipped ? 'bg-slate-950' : 'bg-gradient-to-t from-slate-100 to-slate-200';

  return (
    <div className="relative w-6 sm:w-7 h-[380px] sm:h-[440px] md:h-[480px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex-shrink-0 select-none">
      {/* Bottom Layer */}
      <div className={`absolute inset-0 ${bottomBgClass}`} />

      {/* Top Layer */}
      <div
        className={`absolute top-0 inset-x-0 ${topBgClass} transition-all duration-700 ease-out border-b border-slate-700/60 shadow-md`}
        style={{ height: `${topHeight}%` }}
      />

      {/* Eval Label Pill */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none z-10">
        <span className="bg-slate-950/90 text-cyan-300 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-black border border-cyan-500/40 shadow-xl tracking-tight">
          {text}
        </span>
      </div>
    </div>
  );
};


