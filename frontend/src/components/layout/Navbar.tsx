import React from 'react';
import type { BoardTheme } from '../../types/chess';
import { Palette, ShieldCheck, Hammer } from 'lucide-react';

interface NavbarProps {
  theme: BoardTheme;
  onThemeChange: (theme: BoardTheme) => void;
  isEngineRunning: boolean;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onThemeChange,
  isEngineRunning,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name: Grandmaster's Forge */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              GRANDMASTER'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">FORGE</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider">STOCKFISH 18 ENGINE</p>
          </div>
        </button>

        {/* Right Section: Theme Selector & Status */}
        <div className="flex items-center gap-3">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as BoardTheme)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="cyber" className="bg-slate-900">Cyberpunk</option>
              <option value="wood" className="bg-slate-900">Wood</option>
              <option value="emerald" className="bg-slate-900">Emerald</option>
              <option value="classic" className="bg-slate-900">Classic</option>
            </select>
          </div>

          {/* Engine Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <ShieldCheck className={`w-4 h-4 ${isEngineRunning ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-slate-300 hidden sm:inline">
              {isEngineRunning ? 'Engine Online' : 'Engine Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
