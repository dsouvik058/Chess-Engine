import React, { useState } from 'react';
import type { BoardTheme } from '../../types/chess';
import type { User } from '../../types/auth';
import {
  Palette,
  ShieldCheck,
  Hammer,
  LogOut,
  Volume2,
  VolumeX,
  Menu,
  X,
  Award,
  UserCheck,
  Info
} from 'lucide-react';

import { UserAvatar } from '../ui/UserAvatar';

interface NavbarProps {
  theme: BoardTheme;
  onThemeChange: (theme: BoardTheme) => void;
  isEngineRunning: boolean;
  onGoHome?: () => void;
  user?: User | null;
  onLogout?: () => void;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onThemeChange,
  isEngineRunning,
  onGoHome,
  user,
  onLogout,
  isSoundEnabled = true,
  onToggleSound,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-navbar px-4 sm:px-6 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: 3-line Hamburger Menu Button + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
              title="Open Navigation Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={onGoHome}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all duration-300">
                <Hammer className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  GRANDMASTER'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">FORGE</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>STOCKFISH 18 AI</span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Section: Engine Status + User DP Only */}
          <div className="flex items-center gap-3">
            {/* Engine Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <ShieldCheck className={`w-4 h-4 ${isEngineRunning ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-slate-300">
                {isEngineRunning ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* User Profile Picture (DP Only in Top Right Corner) */}
            {user && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="relative focus:outline-none group cursor-pointer"
                title="Click to view profile details"
              >
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  className="w-10 h-10 rounded-2xl border-2 border-cyan-400/60 object-cover shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:border-cyan-300 transition-all"
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-slate-950 rounded-full p-0.5 shadow-md">
                  {user.provider === 'GOOGLE' ? (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] text-white font-black">
                      G
                    </span>
                  ) : (
                    <span className="block h-3.5 w-3.5 rounded-full bg-emerald-500 border border-slate-950" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hamburger Side Menu Drawer / Dropdown */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          
          <div className="relative w-80 max-w-[85vw] bg-slate-900/95 border-r border-slate-800/90 p-5 shadow-2xl flex flex-col justify-between z-10 glass-card animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-black text-white">Menu Options</h3>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section 1: Board Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Board Theme</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'cyber', label: 'Cyberpunk' },
                    { id: 'wood', label: 'Wood' },
                    { id: 'emerald', label: 'Emerald' },
                    { id: 'classic', label: 'Classic' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id as BoardTheme)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        theme === t.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Sound Options Toggle Bar */}
              {onToggleSound && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                    {isSoundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    <span>Sound Options</span>
                  </label>
                  <button
                    onClick={onToggleSound}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                      isSoundEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950/70 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>Sound FX</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {isSoundEnabled ? 'ENABLED' : 'MUTED'}
                    </span>
                  </button>
                </div>
              )}

              {/* Section 3: About Us Section (Blank / Placeholder) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>About Us</span>
                </label>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 min-h-[90px] flex items-center justify-center text-center">
                  <p className="text-xs text-slate-500 italic">
                    {/* Blank section as requested */}
                    Grandmaster's Forge Chess Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center pt-4 border-t border-slate-800/60">
              Grandmaster's Forge v1.0 • Stockfish 18
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal Overlay (Triggered by DP click in Top Right Corner) */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border border-slate-800 p-6 shadow-2xl text-slate-100 glass-card z-10 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">User Profile</h3>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  className="w-20 h-20 rounded-3xl border-2 border-cyan-400/80 object-cover shadow-xl shadow-cyan-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-1 shadow-md">
                  {user.provider === 'GOOGLE' ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-black">
                      G
                    </span>
                  ) : (
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-black text-white">{user.name}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{user.username}</p>
                <p className="text-xs text-slate-500 font-mono">{user.email}</p>
              </div>

              <div className="w-full flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 mt-2">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Rating</span>
                    <span className="text-sm font-black text-amber-300 font-mono">{user.eloRating || 1500} ELO</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {user.provider === 'GOOGLE' ? 'Google Auth' : 'Grandmaster'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};


