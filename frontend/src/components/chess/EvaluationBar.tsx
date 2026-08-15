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
      whitePercent = 97;
      text = `M${scoreValue}`;
    } else if (scoreValue < 0) {
      whitePercent = 3;
      text = `-M${Math.abs(scoreValue)}`;
    } else {
      whitePercent = 50;
      text = 'M0';
    }
  } else {
    // Non-linear logistic curve for natural visual representation of advantage
    const winPct = 50.0 + 50.0 * (2.0 / (1.0 + Math.exp(-0.00368208 * scoreValue)) - 1.0);
    whitePercent = Math.max(4, Math.min(96, winPct));
    const evalPawns = scoreValue / 100.0;
    text = `${scoreValue > 0 ? '+' : ''}${evalPawns.toFixed(1)}`;
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
        className={`absolute top-0 inset-x-0 ${topBgClass} transition-all duration-300 ease-out border-b border-slate-700/60 shadow-md`}
        style={{ height: `${topHeight}%` }}
      />

      {/* Eval Label Pill - Fixed at bottom of the evaluation bar */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none z-10">
        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black tracking-tight shadow-md border bg-slate-950/90 text-cyan-300 border-cyan-500/40 backdrop-blur-sm">
          {text}
        </span>
      </div>
    </div>
  );
};


