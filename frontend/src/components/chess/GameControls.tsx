import React from 'react';
import {
  RotateCcw,
  Repeat,
  Flag,
  BarChart2,
  FileText,
  Eye,
  EyeOff,
  Home
} from 'lucide-react';
import { Button } from '../ui/Button';

interface GameControlsProps {
  onBackToWelcome: () => void;
  onUndoMove: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onOpenAnalysis: () => void;
  onOpenPgnModal: () => void;
  showLegalMoves: boolean;
  onToggleLegalMoves: () => void;
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
  canUndo = false,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full glass-card p-4 rounded-2xl border border-slate-800 shadow-xl">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <Button variant="ghost" size="sm" onClick={onBackToWelcome} title="Return to Welcome Screen" className="font-bold">
          <Home className="w-4 h-4 text-cyan-400" />
          Welcome Page
        </Button>

        {/* Legal Moves Toggle Switch */}
        <button
          onClick={onToggleLegalMoves}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
            showLegalMoves
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-950/70 text-slate-500 border-slate-800'
          }`}
          title="Toggle legal move dots"
        >
          {showLegalMoves ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Hints: {showLegalMoves ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Takeback / Undo Button - Rendered ONLY in single player Bubble Bot mode */}
        {canUndo && (
          <Button variant="secondary" size="sm" onClick={onUndoMove} title="Takeback / Undo move" className="rounded-xl font-bold">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Takeback
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={onFlipBoard} title="Flip board angle" className="rounded-xl font-bold">
          <Repeat className="w-4 h-4 text-indigo-400" />
          Flip Board
        </Button>

        <Button variant="accent" size="sm" onClick={onOpenAnalysis} title="Analyze game performance" className="rounded-xl font-bold">
          <BarChart2 className="w-4 h-4" />
          Analyze
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenPgnModal} title="PGN / FEN controls" className="rounded-xl font-bold">
          <FileText className="w-4 h-4 text-blue-400" />
          PGN / FEN
        </Button>
      </div>

      {/* Bottom Row: Resign Match Action */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Button variant="danger" size="sm" onClick={onResign} className="w-full rounded-xl font-bold">
          <Flag className="w-4 h-4" />
          Resign Match
        </Button>
      </div>
    </div>
  );
};

