import React from 'react';
import { Bot, Users, BarChart2, ArrowRight, ShieldCheck, Zap, Sparkles, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { User } from '../../types/auth';

interface WelcomePageProps {
  onSelectBubbleBot: () => void;
  onSelect1v1: () => void;
  onSelectAnalyze: () => void;
  user?: User | null;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectBubbleBot,
  onSelect1v1,
  onSelectAnalyze,
  user,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4 sm:p-6 max-w-6xl mx-auto space-y-8 sm:space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3.5 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>GRANDMASTER'S FORGE • STOCKFISH 18 ENGINE</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">{user?.name || 'Grandmaster'}</span>!
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-normal">
          Step onto the digital chessboard. Sharpen your tactical vision against Stockfish 18 AI, battle rivals in real-time 1v1 multiplayer, or analyze your move accuracy and blunders.
        </p>
      </div>

      {/* 3 Option Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Option 1: Play against Bubble Bot */}
        <Card className="relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between p-7 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/25 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2.5">
              <span className="inline-block text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                VS STOCKFISH AI
              </span>
              <h2 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                Play Bubble Bot
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Challenge Stockfish 18 AI Engine. Customize ELO rating (800 - 3000), toggle legal move highlights, use takebacks, and inspect move logs.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between group-hover:shadow-cyan-500/30 font-bold py-3"
              onClick={onSelectBubbleBot}
            >
              <span>Configure & Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Option 2: Play 1 vs 1 */}
        <Card className="relative overflow-hidden group hover:border-indigo-500/60 transition-all duration-300 flex flex-col justify-between p-7 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/25 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>

            <div className="space-y-2.5">
              <span className="inline-block text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
                MULTIPLAYER 1V1
              </span>
              <h2 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                Play 1 vs 1
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Battle another player in Local Pass & Play mode on the same device or invite a friend to an Online room with live chat.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 group-hover:shadow-indigo-500/30 font-bold py-3"
              onClick={onSelect1v1}
            >
              <span>Choose Mode & Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Option 3: Analyze Game */}
        <Card className="relative overflow-hidden group hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between p-7 bg-slate-900/80 border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-8 h-8" />
            </div>

            <div className="space-y-2.5">
              <span className="inline-block text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                GAME ANALYSIS
              </span>
              <h2 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                Analyze Game
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste PGN string or load your finished match to analyze move quality, spot blunders & mistakes, and inspect Stockfish recommendations.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <Button
              variant="accent"
              className="w-full justify-between group-hover:shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3"
              onClick={onSelectAnalyze}
            >
              <span>Open Analyzer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Action Badges */}
      <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Instant WebSocket Pairing</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time ELO Adjustments</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stockfish 18 Deep Evaluation</span>
        </div>
      </div>
    </div>
  );
};

