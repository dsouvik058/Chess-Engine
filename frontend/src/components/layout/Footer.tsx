import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950/80 border-t border-slate-900 px-4 py-3 text-center text-xs text-slate-400 font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="font-semibold text-slate-300">Designed and Developed by Souvik Das</span>
        <span className="text-cyan-400 font-bold">Stockfish 18 UCI Platform</span>
      </div>
    </footer>
  );
};
