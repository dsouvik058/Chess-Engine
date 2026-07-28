import React from 'react';
import {
  RotateCcw,
  Repeat,
  Flag,
  BarChart2,
  FileText,
  Palette,
  Eye,
  EyeOff,
  Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { BoardTheme } from '../../types/chess';

interface GameControlsProps {
  onBackToWelcome: () => void;
  onUndoMove: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onOpenAnalysis: () => void;
  onOpenPgnModal: () => void;
  showLegalMoves: boolean;
  onToggleLegalMoves: () => void;
  theme: BoardTheme;
  onThemeChange: (theme: BoardTheme) => void;
  canUndo?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onBackToWelcome,
  onUndoMove,
  onFlipBoard,
  onResign,
  onOpenAnalysis,
  onOpenPgnModal,
  showLegalMoves,
  onToggleLegalMoves,
  theme,
  onThemeChange,
  canUndo = false,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full bg-slate-900/80 p-4 rounded-xl border border-slate-800">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <Button variant="ghost" size="sm" onClick={onBackToWelcome} title="Return to Welcome Screen">
          <Home className="w-4 h-4 text-cyan-400" />
          Welcome Page
        </Button>

        {/* Legal Moves Toggle Switch */}
        <button
          onClick={onToggleLegalMoves}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
            showLegalMoves
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-950/60 text-slate-500 border-slate-800'
          }`}
          title="Toggle legal move dots"
        >
          {showLegalMoves ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Legal Moves: {showLegalMoves ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Takeback / Undo Button - Rendered ONLY in single player Bubble Bot mode */}
        {canUndo && (
          <Button variant="secondary" size="sm" onClick={onUndoMove} title="Takeback / Undo move">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Takeback (Undo)
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={onFlipBoard} title="Flip board angle">
          <Repeat className="w-4 h-4 text-indigo-400" />
          Flip Board
        </Button>

        <Button variant="accent" size="sm" onClick={onOpenAnalysis} title="Analyze game performance">
          <BarChart2 className="w-4 h-4" />
          Analyze Game
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenPgnModal} title="PGN / FEN controls">
          <FileText className="w-4 h-4 text-blue-400" />
          PGN / FEN
        </Button>
      </div>

      {/* Bottom Row: Resign & Board Theme Selector in Down Right Hand Side */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
        <Button variant="danger" size="sm" onClick={onResign} className="flex-1">
          <Flag className="w-4 h-4" />
          Resign Match
        </Button>

        {/* Down Right Hand Side Board Theme Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
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
      </div>
    </div>
  );
};
