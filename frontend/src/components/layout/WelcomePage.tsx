import React from 'react';
import { Bot, Users, Lock, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface WelcomePageProps {
  onSelectBubbleBot: () => void;
  onSelect1v1: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectBubbleBot,
  onSelect1v1,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Battle Arena</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Select a mode below to start playing. Challenge Stockfish 18 AI or face another player in 1 vs 1 mode.
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

        {/* Option 3: Vacant Section */}
        <Card className="relative overflow-hidden flex flex-col justify-between p-6 bg-slate-950/40 border-slate-800/60 opacity-60">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-6">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 tracking-wider uppercase">OPTION 03 • VACANT</span>
              <h2 className="text-2xl font-bold text-slate-400">
                Coming Soon
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This section is currently reserved for future game modes or custom battle arenas.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/40">
            <Button variant="outline" className="w-full cursor-not-allowed opacity-50" disabled>
              <span>Reserved</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
