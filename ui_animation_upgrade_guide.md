# 🎨 Chess Engine UI — Next-Level Live Animation & Motion Architecture Guide

> A comprehensive, production-ready guide specifically designed for your Chess Engine frontend (`frontend/src/`).
> This guide outlines how to transform your current UI into a **hyper-dynamic, living, interactive interface** packed with smooth micro-interactions, responsive physics-based motion, ambient glowing effects, and fluid live animations.

---

## 📑 Table of Contents
1. [Core Animation Architecture & Dependencies](#1-core-animation-architecture--dependencies)
2. [Global Ambient & Dynamic Canvas Backgrounds](#2-global-ambient--dynamic-canvas-backgrounds)
3. [Liquid-Physics Evaluation Bar (`EvaluationBar.tsx`)](#3-liquid-physics-evaluation-bar)
4. [Live Interactive Chessboard Motion & Piece Highlights](#4-live-interactive-chessboard-motion--piece-highlights)
5. [Pulsing Player Cards & Clock Urgency Animations (`PlayerCard.tsx`)](#5-pulsing-player-cards--clock-urgency-animations)
6. [Cyberpunk AI Neural Pulse & Rolling Counters (`EngineStatsPanel.tsx`)](#6-cyberpunk-ai-neural-pulse--rolling-counters)
7. [Smooth Streaming Move Notation Log (`MoveHistoryLog.tsx`)](#7-smooth-streaming-move-notation-log)
8. [Dynamic Interactive Win/Loss Probability Graph (`WinGraph.tsx`)](#8-dynamic-interactive-winloss-probability-graph)
9. [Game Over Sensory Feedback & Fireworks / Shockwaves](#9-game-over-sensory-feedback--fireworks--shockwaves)
10. [Step-by-Step Implementation Roadmap](#10-step-by-step-implementation-roadmap)

---

## 1. Core Animation Architecture & Dependencies

To achieve a top-tier "living UI", we leverage a combined stack of:
1. **Framer Motion (`framer-motion`)**: Spring physics, layout animations, exit/entry transitions, staggered lists.
2. **Canvas Confetti (`canvas-confetti`)**: Dynamic particle bursts for victories and critical moves.
3. **TailwindCSS Keyframes / Glassmorphism**: High-performance GPU-composited CSS transitions.

### Step 1: Install Animation Dependencies
Run this in the `frontend/` directory:
```bash
cd frontend
npm install framer-motion lucide-react canvas-confetti clsx tailwind-merge
npm install -D @types/canvas-confetti
```

---

## 2. Global Ambient & Dynamic Canvas Backgrounds

Inject dynamic ambient lighting, flowing aurora gradients, and keyframes into `frontend/src/index.css`.

### Update: `frontend/src/index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import "tailwindcss";

@layer base {
  body {
    background-color: #030712;
    background-image: 
      radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
      radial-gradient(at 50% 100%, rgba(168, 85, 247, 0.08) 0px, transparent 50%);
    background-attachment: fixed;
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
  }
}

/* --- Live Keyframe Animations --- */
@keyframes aurora-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
}

@keyframes urgent-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.85; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
}

@keyframes radar-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(1000%); }
}

@keyframes float-gentle {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
}

@keyframes shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.animate-aurora {
  background-size: 300% 300%;
  animation: aurora-flow 8s ease infinite;
}

.animate-pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-urgent {
  animation: urgent-pulse 0.8s ease-in-out infinite;
}

.animate-float {
  animation: float-gentle 4s ease-in-out infinite;
}

.shimmer-card {
  position: relative;
  overflow: hidden;
}

.shimmer-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  animation: shimmer-sweep 3s infinite;
  pointer-events: none;
}
```

---

## 3. Liquid-Physics Evaluation Bar

### File: `frontend/src/components/chess/EvaluationBar.tsx`
Upgrade the standard CSS bar to a **spring-physics liquid bar** that bounces dynamically as the engine changes its evaluation, with glowing danger/advantage states and smooth number rolling.

```tsx
import React, { useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

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
  const { targetHeight, displayText, isWinningWhite, isWinningBlack, isMate } = useMemo(() => {
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
      const winPct = 50.0 + 50.0 * (2.0 / (1.0 + Math.exp(-0.00368208 * scoreValue)) - 1.0);
      whitePercent = Math.max(4, Math.min(96, winPct));
      const evalPawns = scoreValue / 100.0;
      text = `${scoreValue > 0 ? '+' : ''}${evalPawns.toFixed(1)}`;
    }

    const blackPercent = 100 - whitePercent;
    const height = isFlipped ? whitePercent : blackPercent;

    return {
      targetHeight: height,
      displayText: text,
      isWinningWhite: scoreValue > 250,
      isWinningBlack: scoreValue < -250,
      isMate: scoreType === 'mate',
    };
  }, [scoreType, scoreValue, isFlipped]);

  // Spring physics for natural liquid fluid motion
  const animatedHeight = useSpring(targetHeight, {
    stiffness: 70,
    damping: 15,
    mass: 0.8,
  });

  const heightPercent = useTransform(animatedHeight, (latest) => `${latest}%`);

  return (
    <div className="relative w-6 sm:w-7 h-[380px] sm:h-[440px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex-shrink-0 select-none">
      {/* Bottom Layer (White or Black depending on flip) */}
      <div className={`absolute inset-0 ${isFlipped ? 'bg-slate-950' : 'bg-gradient-to-t from-slate-100 via-slate-200 to-white'}`} />

      {/* Top Animated Layer */}
      <motion.div
        className={`absolute top-0 inset-x-0 ${
          isFlipped
            ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-white'
            : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
        } border-b-2 border-cyan-400/80 shadow-lg`}
        style={{ height: heightPercent }}
      >
        {/* Glow boundary wave */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400 blur-xs opacity-75" />
      </motion.div>

      {/* Dynamic Floating Eval Pill with spring scale animation */}
      <motion.div 
        layout
        className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none z-20"
      >
        <motion.span 
          key={displayText}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black tracking-tight shadow-xl border backdrop-blur-md ${
            isMate
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse'
              : isWinningWhite || isWinningBlack
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-cyan-500/20'
              : 'bg-slate-950/90 text-slate-300 border-slate-700/60'
          }`}
        >
          {displayText}
        </motion.span>
      </motion.div>
    </div>
  );
};
```

---

## 4. Live Interactive Chessboard Motion & Piece Highlights

### High-Impact Animations to Add:
1. **Pulsing Legal Move Target Rings**: Instead of flat dots, use expanding/pulsing glowing rings.
2. **Move Shockwaves**: When a capture or check occurs, trigger a radial wave on the destination square.
3. **Engine Evaluation Arrows**: Animated SVG arrows with dynamic head pulse pointing to the best move.

### Implementation:
In your `boardSquareStyles` computation in `ChessBoardContainer.tsx` or `App.tsx`:
```tsx
const customSquareStyles = useMemo(() => {
  const styles: Record<string, React.CSSProperties> = {};

  // Last Move highlight with glowing cyan trail
  if (lastMove) {
    styles[lastMove.from] = {
      backgroundColor: 'rgba(6, 182, 212, 0.25)',
      boxShadow: 'inset 0 0 12px rgba(6, 182, 212, 0.4)',
      transition: 'all 0.3s ease',
    };
    styles[lastMove.to] = {
      backgroundColor: 'rgba(6, 182, 212, 0.45)',
      boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.6), 0 0 10px rgba(6, 182, 212, 0.3)',
      transition: 'all 0.3s ease',
    };
  }

  // Legal move destination markers
  legalMoves.forEach((square) => {
    const isOccupied = game.get(square as any);
    styles[square] = {
      background: isOccupied
        ? 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 75%, transparent 80%)'
        : 'radial-gradient(circle, rgba(6, 182, 212, 0.6) 25%, transparent 30%)',
      borderRadius: isOccupied ? '25%' : '50%',
      cursor: 'pointer',
      transform: 'scale(1)',
      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  });

  // Check state danger marker
  if (game.inCheck()) {
    const turn = game.turn();
    const kingSquare = findKingSquare(turn); // utility to get king position
    if (kingSquare) {
      styles[kingSquare] = {
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.2) 70%, transparent 100%)',
        animation: 'urgent-pulse 0.8s ease-in-out infinite',
      };
    }
  }

  return styles;
}, [lastMove, legalMoves, game]);
```

---

## 5. Pulsing Player Cards & Clock Urgency Animations

### File: `frontend/src/components/chess/PlayerCard.tsx`
Enhance `PlayerCard.tsx` with turn-indicator light rings, glowing avatars, dynamic piece count pops, and low-time alarms.

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Cpu, Clock, Flame } from 'lucide-react';
import type { PlayerColor } from '../../types/chess';
import { cn } from '../../utils/cn';

interface PlayerCardProps {
  name: string;
  color: PlayerColor;
  isAi?: boolean;
  isActive: boolean;
  timeFormatted?: string;
  capturedPieces?: string[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  color,
  isAi = false,
  isActive,
  timeFormatted,
  capturedPieces = [],
}) => {
  const isLowTime = timeFormatted
    ? timeFormatted.startsWith('00:') && parseInt(timeFormatted.split(':')[1] || '99', 10) < 30
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: isActive ? '0 0 25px -5px rgba(6, 182, 212, 0.25)' : 'none'
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 w-full glass-card overflow-hidden',
        isActive
          ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900/80 border-cyan-500/70'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/60'
      )}
    >
      {/* Active turn ambient laser pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Left side: Avatar + Name + Captured Pieces */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm shadow-lg flex-shrink-0 transition-transform',
              color === 'white'
                ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-950 border-white'
                : 'bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 border-slate-700',
              isActive && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950'
            )}
          >
            {isAi ? <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" /> : <User className="w-5 h-5" />}
          </motion.div>

          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white tracking-tight">{name}</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase',
                color === 'white'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              )}
            >
              {color}
            </span>
          </div>

          {/* Captured Pieces with Staggered Pop Animation */}
          <div className="flex items-center gap-1 mt-1 min-h-[20px]">
            <AnimatePresence>
              {capturedPieces.length > 0 ? (
                <div className="flex items-center gap-0.5">
                  {capturedPieces.map((piece, i) => (
                    <motion.span
                      key={`${piece}-${i}`}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="text-xs text-amber-300 font-mono"
                    >
                      {piece}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">No captures</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right side: Animated Timer */}
      {timeFormatted && (
        <motion.div
          animate={
            isLowTime
              ? { scale: [1, 1.04, 1] }
              : {}
          }
          transition={
            isLowTime ? { duration: 0.6, repeat: Infinity } : {}
          }
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-extrabold border transition-all flex-shrink-0 shadow-sm relative z-10',
            isLowTime
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-500/20'
              : isActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10'
              : 'bg-slate-950/70 text-slate-400 border-slate-800'
          )}
        >
          {isLowTime ? (
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Clock className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
          )}
          <span>{timeFormatted}</span>
        </motion.div>
      )}
    </motion.div>
  );
};
```

---

## 6. Cyberpunk AI Neural Pulse & Rolling Counters

### File: `frontend/src/components/chess/EngineStatsPanel.tsx`
Give Stockfish engine telemetry a high-tech "neural engine" feel with live radar scans, number ticking animations, and dynamic computation load graphs.

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameStatusDTO } from '../../types/chess';
import { Cpu, Activity, Zap, Layers, Clock, Sparkles } from 'lucide-react';

interface EngineStatsPanelProps {
  stats: GameStatusDTO | null;
  elo: number;
  onEloChange: (newElo: number) => void;
  isEngineThinking?: boolean;
}

export const EngineStatsPanel: React.FC<EngineStatsPanelProps> = ({
  stats,
  elo,
  onEloChange,
  isEngineThinking = false,
}) => {
  const depth = stats?.depth ?? 0;
  const nodes = stats?.nodes ?? 0;
  const nps = stats?.nps ?? 0;
  const timeMs = stats?.timeMs ?? 0;

  return (
    <div className="relative glass-card p-4 rounded-2xl border border-slate-800 space-y-3.5 shadow-2xl overflow-hidden">
      {/* Laser Scanning Line when thinking */}
      {isEngineThinking && (
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-20 opacity-75"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Engine Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={
              isEngineThinking
                ? { rotate: 360, scale: [1, 1.1, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={
              isEngineThinking
                ? { rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 1, repeat: Infinity } }
                : {}
            }
            className={`p-2 rounded-xl border transition-all ${
              isEngineThinking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-950/80 text-cyan-400 border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </motion.div>
          <div>
            <h3 className="font-extrabold text-xs text-white tracking-tight flex items-center gap-1.5">
              Stockfish 18 AI
              {isEngineThinking && <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />}
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isEngineThinking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              {isEngineThinking ? 'Calculating optimal variation...' : `${elo} ELO Engine`}
            </span>
          </div>
        </div>

        {/* ELO Switcher */}
        <select
          value={elo}
          onChange={(e) => onEloChange(Number(e.target.value))}
          className="bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50 cursor-pointer shadow-inner hover:border-slate-700 transition-colors"
        >
          <option value={800}>800 ELO (Beginner)</option>
          <option value={1200}>1200 ELO (Intermediate)</option>
          <option value={1500}>1500 ELO (Advanced)</option>
          <option value={1850}>1850 ELO (Expert)</option>
          <option value={2200}>2200 ELO (Master)</option>
          <option value={2600}>2600 ELO (Grandmaster)</option>
          <option value={3200}>3200 (Stockfish MAX)</option>
        </select>
      </div>

      {/* Live Animated Telemetry Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Depth */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Depth</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={depth}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5"
            >
              {depth}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* NPS */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>NPS</span>
          </div>
          <motion.span
            key={nps}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5"
          >
            {nps > 1000 ? `${(nps / 1000).toFixed(1)}k` : nps}
          </motion.span>
        </motion.div>

        {/* Nodes */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Nodes</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {nodes > 1000 ? `${(nodes / 1000).toFixed(1)}k` : nodes}
          </span>
        </motion.div>

        {/* Time */}
        <motion.div whileHover={{ y: -2 }} className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Time</span>
          </div>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-white mt-0.5">
            {(timeMs / 1000).toFixed(2)}s
          </span>
        </motion.div>
      </div>
    </div>
  );
};
```

---

## 7. Smooth Streaming Move Notation Log

### File: `frontend/src/components/chess/MoveHistoryLog.tsx`
Use `framer-motion`'s `AnimatePresence` and list reordering to make newly added moves slide in smoothly with micro-highlight flashes.

```tsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MoveLogItem } from '../../types/chess';
import { Badge } from '../ui/Badge';
import { History } from 'lucide-react';

interface MoveHistoryLogProps {
  moves: MoveLogItem[];
  onSelectMove?: (fen: string) => void;
}

export const MoveHistoryLog: React.FC<MoveHistoryLogProps> = ({
  moves,
  onSelectMove,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [moves]);

  return (
    <div className="flex flex-col h-64 sm:h-72 glass-card rounded-2xl border border-slate-800 p-3.5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Move Notation Log</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-cyan-400 border border-slate-800">
          {moves.length} Turns
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 pb-1.5 px-2">
        <span className="col-span-2">#</span>
        <span className="col-span-5">White</span>
        <span className="col-span-5">Black</span>
      </div>

      {/* Move Rows */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs scroll-smooth">
        {moves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs space-y-1">
            <span>No moves recorded yet</span>
            <span className="text-[10px] text-slate-600">Make a move on the board to start log</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {moves.map((item) => (
              <motion.div
                key={item.moveNumber}
                initial={{ opacity: 0, x: -15, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <span className="col-span-2 text-slate-500 font-bold">{item.moveNumber}.</span>

                {/* White Move */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => item.whiteFen && onSelectMove?.(item.whiteFen)}
                  className="col-span-5 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                >
                  <span>{item.white || ''}</span>
                  {item.whiteBadge && <Badge type={item.whiteBadge}>{item.whiteBadge}</Badge>}
                </motion.button>

                {/* Black Move */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => item.blackFen && onSelectMove?.(item.blackFen)}
                  className="col-span-5 flex items-center gap-1 text-left text-slate-200 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                >
                  <span>{item.black || ''}</span>
                  {item.blackBadge && <Badge type={item.blackBadge}>{item.blackBadge}</Badge>}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
```

---

## 8. Dynamic Interactive Win/Loss Probability Graph

Create an animated, interactive canvas curve `frontend/src/components/chess/WinGraph.tsx` to visualize win probability swings in real time during analysis.

### New Component: `frontend/src/components/chess/WinGraph.tsx`
```tsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WinGraphProps {
  winPercentages: number[];
  currentIndex: number;
  onSeekTo?: (index: number) => void;
}

export const WinGraph: React.FC<WinGraphProps> = ({ winPercentages, currentIndex, onSeekTo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || winPercentages.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);

    const stepX = W / Math.max(1, winPercentages.length - 1);

    // Gradient fill area
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)');
    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)');

    // Midline (50% equality line)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill Curve
    ctx.beginPath();
    winPercentages.forEach((wp, i) => {
      const x = i * stepX;
      const y = H - (wp / 100) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo((winPercentages.length - 1) * stepX, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke Curve Line
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    winPercentages.forEach((wp, i) => {
      const x = i * stepX;
      const y = H - (wp / 100) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Active Cursor Indicator
    if (currentIndex > 0 && currentIndex <= winPercentages.length) {
      const px = (currentIndex - 1) * stepX;
      const py = H - (winPercentages[currentIndex - 1] / 100) * H;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [winPercentages, currentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-slate-800 p-4 shadow-xl"
    >
      <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-slate-400">
        <span className="text-cyan-400 font-bold">White Advantage</span>
        <span className="text-slate-500">50% Draw Line</span>
        <span className="text-indigo-400 font-bold">Black Advantage</span>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={90}
        className="w-full h-20 rounded-xl cursor-crosshair bg-slate-950/60"
        onClick={(e) => {
          if (!onSeekTo || winPercentages.length === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.round((x / rect.width) * (winPercentages.length - 1));
          onSeekTo(Math.max(0, Math.min(winPercentages.length - 1, idx)) + 1);
        }}
      />
    </motion.div>
  );
};
```

---

## 9. Game Over Sensory Feedback & Fireworks / Shockwaves

### Upgrade: Dual Cannon Confetti Explosion
In `frontend/src/App.tsx`, trigger full sensory celebratory fireworks when a player achieves checkmate:

```tsx
import confetti from 'canvas-confetti';

export const triggerVictoryEffects = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#06b6d4', '#6366f1', '#a855f7', '#10b981'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#06b6d4', '#6366f1', '#a855f7', '#10b981'],
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};
```

---

## 10. Step-by-Step Implementation Roadmap

| Step | Component / File | What Gets Upgraded | Impact Level |
|---|---|---|---|
| **1** | `index.css` | Install Keyframe utility suite (`aurora`, `radar-scan`, `urgent-pulse`) | 🌟 Core Foundation |
| **2** | `EvaluationBar.tsx` | Spring-physics liquid bar + advantage glow wave | 🔥 High Visual Polish |
| **3** | `PlayerCard.tsx` | Active player pulse-ring + urgent clock shake + pop-in captures | 🔥 Game Immersion |
| **4** | `EngineStatsPanel.tsx` | Stockfish neural scanning line + rotating AI badge + metric counters | ⚡ Cyberpunk Aesthetic |
| **5** | `MoveHistoryLog.tsx` | Staggered move entrance + click scale feedback | ⚡ Clean Feedback |
| **6** | `WinGraph.tsx` | Live interactive probability canvas seek graph | 💎 Analysis Feature |
| **7** | `App.tsx` | Dual-cannon particle confetti + screen shake on checkmate | 🏆 Victory WOW Factor |

---

*Generated for your Chess Engine Workspace (`frontend/src/`). All snippets are drop-in replacements for your current codebase.*
