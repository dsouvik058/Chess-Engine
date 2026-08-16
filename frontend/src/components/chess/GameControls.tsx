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
    <div className="flex flex-col gap-3 w-full glass-card p-4 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 bg-white/90">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <Button variant="ghost" size="sm" onClick={onBackToWelcome} title="Return to Welcome Screen" className="font-bold gap-1.5 text-slate-700">
          <Home className="w-4 h-4 text-amber-700" />
          Welcome Page
        </Button>

        {/* Legal Moves Toggle Switch */}
        <button
          onClick={onToggleLegalMoves}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
            showLegalMoves
              ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-sm'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60'
          }`}
          title="Toggle legal move hints"
        >
          {showLegalMoves ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Hints: {showLegalMoves ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Action Buttons Grid (2x2 Symmetric) */}
      <div className="grid grid-cols-2 gap-2.5">
        {canUndo ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onUndoMove}
            title="Takeback / Undo move"
            className="rounded-xl font-bold border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            Takeback
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Takeback available after making moves in VS AI mode"
            className="rounded-xl font-bold opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Takeback
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={onFlipBoard} title="Flip board angle" className="rounded-xl font-bold">
          <Repeat className="w-4 h-4 text-indigo-600" />
          Flip Board
        </Button>

        <Button variant="accent" size="sm" onClick={onOpenAnalysis} title="Analyze game performance" className="rounded-xl font-bold">
          <BarChart2 className="w-4 h-4" />
          Analyze
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenPgnModal} title="PGN / FEN controls" className="rounded-xl font-bold">
          <FileText className="w-4 h-4 text-slate-700" />
          PGN / FEN
        </Button>
      </div>

      {/* Bottom Row: Resign Match Action */}
      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
        <Button variant="danger" size="sm" onClick={onResign} className="w-full rounded-xl font-bold">
          <Flag className="w-4 h-4" />
          Resign Match
        </Button>
      </div>
    </div>
  );
};


