import React from 'react';
import { Bot, Users, BarChart2, ArrowRight, LogOut, Award, ShieldCheck, UserCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { User } from '../../types/auth';
import { UserAvatar } from '../ui/UserAvatar';

interface WelcomePageProps {
  onSelectBubbleBot: () => void;
  onSelect1v1: () => void;
  onSelectAnalyze: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectBubbleBot,
  onSelect1v1,
  onSelectAnalyze,
  user,
  onLogout,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6 max-w-6xl mx-auto space-y-8">
      {/* User Welcome Header Badge */}
      {user && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="relative">
              <UserAvatar
                src={user.avatarUrl}
                name={user.name}
                className="w-14 h-14 rounded-2xl border-2 border-cyan-500/50 object-cover shadow-lg shadow-cyan-500/20"
              />
              <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5">
                {user.provider === 'GOOGLE' ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white font-bold" title="Google OAuth Verified">
                    G
                  </span>
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  {user.provider === 'GOOGLE' ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      Google Auth
                    </>
                  ) : (
                    'Grandmaster'
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">@{user.username} • {user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ELO Rating</div>
                <div className="text-sm font-black text-amber-300">{user.eloRating || 1500}</div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 rounded-xl text-xs font-bold transition-all"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Battle Arena</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Select a mode below to start playing. Challenge Stockfish 18 AI, face another player 1v1, or analyze games with Stockfish move quality insights.
        </p>
      </div>

      {/* 3 Option Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Option 1: Play against Bubble Bot */}
        <Card className="relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between p-6 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">OPTION 01 • ACTIVE</span>
              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Play against Bubble Bot
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Challenge Stockfish 18 AI Engine. Customize ELO difficulty, toggle legal move indicators, use takebacks, and inspect move logs.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between group-hover:shadow-cyan-500/25"
              onClick={onSelectBubbleBot}
            >
              <span>Configure & Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Option 2: Play 1 vs 1 */}
        <Card className="relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between p-6 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider uppercase">OPTION 02 • ACTIVE</span>
              <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Play 1 vs 1
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Battle another player in Local PC (Pass & Play) mode on the same device or Online with live room chat.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between group-hover:shadow-cyan-500/25"
              onClick={onSelect1v1}
            >
              <span>Choose Mode & Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Option 3: Analyze Game */}
        <Card className="relative overflow-hidden group hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between p-6 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">OPTION 03 • ACTIVE</span>
              <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Analyze Game
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste PGN string or load your finished match to analyze move quality, spot blunders & mistakes, and inspect Stockfish best moves.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between group-hover:shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={onSelectAnalyze}
            >
              <span>Open Analyzer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
