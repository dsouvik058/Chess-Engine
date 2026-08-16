import React, { useState } from 'react';
import type { BoardTheme } from '../../types/chess';
import type { User } from '../../types/auth';
import {
  Palette,
  ShieldCheck,
  Crown,
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
      <header className="sticky top-0 z-40 w-full glass-navbar px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: 3-line Hamburger Menu Button + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-white/90 border border-slate-200 hover:border-amber-500/60 text-slate-700 hover:text-amber-700 transition-all cursor-pointer shadow-sm"
              title="Open Navigation Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={onGoHome}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-amber-50 shadow-md shadow-amber-700/20 group-hover:scale-105 transition-all duration-300">
                <Crown className="w-5 h-5 text-amber-50 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5 font-serif-classic">
                  GRANDMASTER'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-900">FORGE</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>STOCKFISH 18 AI</span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Section: Engine Status + User DP Only */}
          <div className="flex items-center gap-3">
            {/* Engine Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs font-mono font-semibold shadow-sm">
              <ShieldCheck className={`w-4 h-4 ${isEngineRunning ? 'text-emerald-600' : 'text-rose-500'}`} />
              <span className="text-slate-700">
                {isEngineRunning ? 'Engine Online' : 'Engine Offline'}
              </span>
            </div>

            {/* User Profile Picture */}
            {user && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="relative focus:outline-none group cursor-pointer"
                title="Click to view profile details"
              >
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  className="w-10 h-10 rounded-2xl border-2 border-amber-500/70 object-cover shadow-md shadow-amber-500/10 group-hover:scale-105 group-hover:border-amber-600 transition-all"
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-md">
                  {user.provider === 'GOOGLE' ? (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white font-black">
                      G
                    </span>
                  ) : (
                    <span className="block h-3.5 w-3.5 rounded-full bg-emerald-500 border border-white" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hamburger Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          
          <div className="relative w-80 max-w-[85vw] bg-white/95 border-r border-slate-200 p-5 shadow-2xl flex flex-col justify-between z-10 glass-card animate-in slide-in-from-left duration-200 text-slate-900">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-amber-700" />
                  <h3 className="text-base font-black text-slate-900 font-serif-classic">Menu Options</h3>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section 1: Board Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Palette className="w-4 h-4 text-amber-700" />
                  <span>Board Theme</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'wood', label: 'Classic Wood' },
                    { id: 'emerald', label: 'Tournament' },
                    { id: 'classic', label: 'Championship' },
                    { id: 'cyber', label: 'Royal Sapphire' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id as BoardTheme)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        theme === t.id
                          ? 'bg-amber-100 text-amber-950 border-amber-500 shadow-sm font-black'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Sound Options Toggle Bar */}
              {onToggleSound && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider font-mono">
                    {isSoundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Sound Options</span>
                  </label>
                  <button
                    onClick={onToggleSound}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                      isSoundEnabled
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sound FX</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded border font-bold ${
                      isSoundEnabled ? 'bg-amber-200/70 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isSoundEnabled ? 'ENABLED' : 'MUTED'}
                    </span>
                  </button>
                </div>
              )}

              {/* Section 3: About Us Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Platform Overview</span>
                </label>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-900 font-serif-classic">Grandmaster's Forge</p>
                  <p className="text-slate-600 text-[11px]">
                    Powered by Stockfish 18 NNUE. Experience high-accuracy evaluations, multi-level bot play, real-time multiplayer, and deep game analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 text-center pt-4 border-t border-slate-200 font-semibold">
              Grandmaster's Forge v1.0 • Stockfish 18
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal Overlay */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900 glass-card z-10 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900 font-serif-classic">User Profile</h3>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  className="w-20 h-20 rounded-3xl border-2 border-amber-600/80 object-cover shadow-lg shadow-amber-600/15"
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                  {user.provider === 'GOOGLE' ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-black">
                      G
                    </span>
                  ) : (
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 font-serif-classic">{user.name}</h2>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5 font-semibold">@{user.username}</p>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              </div>

              <div className="w-full flex items-center justify-between p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 mt-2">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-amber-700" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Rating</span>
                    <span className="text-sm font-black text-amber-900 font-mono">{user.eloRating || 1500} ELO</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
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
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
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



