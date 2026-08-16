import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white/70 border-t border-slate-200/80 px-4 py-3.5 text-center text-xs text-slate-500 font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-semibold text-slate-700">Designed & Developed by Souvik Das</span>
        <span className="text-amber-800 font-bold tracking-wide">Stockfish 18 UCI Grandmaster Platform</span>
      </div>
    </footer>
  );
};

