import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Globe, Users, BarChart2, ArrowRight, Sparkles, Swords } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { User } from '../../types/auth';

interface WelcomePageProps {
  onSelectBubbleBot: () => void;
  onSelectMultiplayerOnline: () => void;
  onSelect1v1: () => void;
  onSelectAnalyze: () => void;
  user?: User | null;
}

const PIECE_GLYPHS = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

const FloatingAmbientPieces: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden="true">
    {PIECE_GLYPHS.map((glyph, i) => (
      <motion.div
        key={i}
        className="absolute text-4xl font-serif text-amber-800/10 select-none"
        style={{
          left: `${(i * 8.3 + 3) % 94}%`,
          top: `${(i * 15 + 8) % 88}%`,
        }}
        animate={{
          y: [0, -18, 0],
          rotate: [0, i % 2 === 0 ? 12 : -12, 0],
          opacity: [0.08, 0.18, 0.08],
        }}
        transition={{
          duration: 5 + (i % 3),
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.3,
        }}
      >
        {glyph}
      </motion.div>
    ))}
  </div>
);

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectBubbleBot,
  onSelectMultiplayerOnline,
  onSelect1v1,
  onSelectAnalyze,
  user,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4 sm:p-6 max-w-7xl mx-auto space-y-8 sm:space-y-10">
      <FloatingAmbientPieces />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center space-y-3.5 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" />
          <span>GRANDMASTER'S FORGE • STOCKFISH 18 ENGINE</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight font-serif-classic">
          Welcome,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-indigo-800">
            {user?.name || 'Grandmaster'}
          </span>!
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-normal">
          Step onto the digital chessboard. Challenge Stockfish 18 AI, enter live online matchmaking with players of your rating level, play private 1v1 battles, or review match blunders.
        </p>
      </motion.div>

      {/* 4 Option Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full relative z-10">
        {/* Option 1: Play against Bubble Bot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className="relative overflow-hidden group hover:border-amber-500/70 transition-all duration-300 flex flex-col justify-between p-6 bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50 h-full shimmer-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/25 transition-all" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-50 mb-5 shadow-md shadow-amber-800/20 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[10px] font-mono font-bold text-amber-900 tracking-wider uppercase px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-full">
                  VS STOCKFISH AI
                </span>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-amber-800 transition-colors font-serif-classic">
                  Play Bubble Bot
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Challenge Stockfish 18 AI Engine. Customize ELO rating (800 - 3200), legal move hints, takebacks, and move logs.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="classic"
                className="w-full justify-between font-bold py-2.5 text-xs shadow-md"
                onClick={onSelectBubbleBot}
              >
                <span>Configure & Play</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Option 2: Play Multiplayer Online (NEW SECTION) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className="relative overflow-hidden group hover:border-indigo-500/80 transition-all duration-300 flex flex-col justify-between p-6 bg-white/90 border-indigo-200/90 shadow-xl shadow-indigo-500/10 h-full shimmer-card ring-1 ring-indigo-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center text-white mb-5 shadow-md shadow-indigo-800/25 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[10px] font-mono font-bold text-indigo-900 tracking-wider uppercase px-2 py-0.5 bg-indigo-100 border border-indigo-300 rounded-full">
                  LIVE RANKED
                </span>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-indigo-800 transition-colors font-serif-classic flex items-center gap-1.5">
                  <span>Play Multiplayer Online</span>
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Match against online players of your skill level with 1 click. Auto-connects or falls back to Bubble Bot after 20s.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="accent"
                className="w-full justify-between font-bold py-2.5 text-xs shadow-md bg-gradient-to-r from-indigo-600 to-indigo-800 text-white"
                onClick={onSelectMultiplayerOnline}
              >
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Play Online</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Option 3: Play 1 vs 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className="relative overflow-hidden group hover:border-rose-500/80 transition-all duration-300 flex flex-col justify-between p-6 bg-white/90 border-rose-200/90 shadow-xl shadow-rose-500/10 h-full shimmer-card ring-1 ring-rose-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 flex items-center justify-center text-white mb-5 shadow-md shadow-rose-800/25 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[10px] font-mono font-bold text-rose-900 tracking-wider uppercase px-2.5 py-0.5 bg-rose-100 border border-rose-300 rounded-full">
                  PASS & PLAY / CODE
                </span>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-rose-800 transition-colors font-serif-classic">
                  Play 1 vs 1
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Battle a friend locally on the same device or create private room codes to share directly.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="accent"
                className="w-full justify-between font-bold py-2.5 text-xs shadow-md bg-gradient-to-r from-rose-600 to-rose-800 text-white hover:from-rose-700 hover:to-rose-900"
                onClick={onSelect1v1}
              >
                <span>Custom Game</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Option 4: Analyze Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className="relative overflow-hidden group hover:border-emerald-500/70 transition-all duration-300 flex flex-col justify-between p-6 bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50 h-full shimmer-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white mb-5 shadow-md shadow-emerald-800/20 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[10px] font-mono font-bold text-emerald-900 tracking-wider uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded-full">
                  GAME ANALYSIS
                </span>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors font-serif-classic">
                  Analyze Game
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste PGN or load your finished match to analyze move accuracy, blunders, and Stockfish best lines.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                className="w-full justify-between bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-md"
                onClick={onSelectAnalyze}
              >
                <span>Open Analyzer</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
