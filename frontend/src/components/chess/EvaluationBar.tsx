import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const topBgClass = isFlipped ? 'bg-gradient-to-b from-stone-100 via-amber-50 to-white' : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900';
  const bottomBgClass = isFlipped ? 'bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-t from-stone-100 via-amber-50 to-white';

  const isMate = scoreType === 'mate';
  const isHighAdvantage = Math.abs(scoreValue) > 300 || isMate;

  return (
    <div
      className={`relative w-6 sm:w-7 h-[380px] sm:h-[440px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-200/90 shadow-xl flex-shrink-0 select-none transition-shadow duration-500 ${
        isMate
          ? 'shadow-rose-500/20 border-rose-400'
          : isHighAdvantage
          ? 'shadow-amber-500/20 border-amber-400'
          : 'shadow-slate-400/20'
      }`}
    >
      {/* Bottom Layer */}
      <div className={`absolute inset-0 ${bottomBgClass}`} />

      {/* Top Animated Layer with Spring Physics */}
      <motion.div
        className={`absolute top-0 inset-x-0 ${topBgClass} border-b-2 border-amber-500/80 shadow-md`}
        initial={false}
        animate={{ height: `${topHeight}%` }}
        transition={{ type: 'spring', stiffness: 75, damping: 16, mass: 0.8 }}
      >
        {/* Glow boundary wave */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400/80 blur-[1px]" />
      </motion.div>

      {/* Eval Label Pill - Dynamic Animated Floating Badge */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none z-10">
        <AnimatePresence mode="wait">
          <motion.span
            key={text}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black tracking-tight shadow-md border backdrop-blur-md ${
              isMate
                ? 'bg-rose-900 text-rose-100 border-rose-400 animate-urgent'
                : isHighAdvantage
                ? 'bg-amber-900 text-amber-100 border-amber-500'
                : 'bg-white/95 text-slate-900 border-slate-300 shadow-sm'
            }`}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};




