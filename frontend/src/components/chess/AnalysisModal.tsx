import React from 'react';
import type { GameAnalysisResponseDTO } from '../../types/chess';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Award, Zap, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GameAnalysisResponseDTO | null;
  isLoading: boolean;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stockfish 18 Game Analysis" className="max-w-2xl">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-cyan-400">Analyzing move quality with Stockfish 18...</p>
        </div>
      ) : !analysis ? (
        <div className="py-8 text-center text-slate-400">
          No analysis available. Play a few moves and click Analyze!
        </div>
      ) : (
        <div className="space-y-6">
          {/* Accuracy Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">White Accuracy</span>
              <span className="text-3xl font-black font-mono text-cyan-400">
                {analysis.whiteAccuracyPercent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Black Accuracy</span>
              <span className="text-3xl font-black font-mono text-indigo-400">
                {analysis.blackAccuracyPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Move Quality Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* White Stats */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">White Summary</div>
              <div className="flex justify-between items-center text-emerald-400">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Best Moves</span>
                <span className="font-bold font-mono">{analysis.whiteBestCount}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Inaccuracies</span>
                <span className="font-bold font-mono">{analysis.whiteInaccuracyCount}</span>
              </div>
              <div className="flex justify-between items-center text-orange-400">
                <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Mistakes</span>
                <span className="font-bold font-mono">{analysis.whiteMistakeCount}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blunders</span>
                <span className="font-bold font-mono">{analysis.whiteBlunderCount}</span>
              </div>
            </div>

            {/* Black Stats */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">Black Summary</div>
              <div className="flex justify-between items-center text-emerald-400">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Best Moves</span>
                <span className="font-bold font-mono">{analysis.blackBestCount}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Inaccuracies</span>
                <span className="font-bold font-mono">{analysis.blackInaccuracyCount}</span>
              </div>
              <div className="flex justify-between items-center text-orange-400">
                <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Mistakes</span>
                <span className="font-bold font-mono">{analysis.blackMistakeCount}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Blunders</span>
                <span className="font-bold font-mono">{analysis.blackBlunderCount}</span>
              </div>
            </div>
          </div>

          {/* Move Log Table */}
          <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950/80">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1 px-2">#</th>
                  <th className="py-1 px-2">Side</th>
                  <th className="py-1 px-2">Move</th>
                  <th className="py-1 px-2">Eval</th>
                  <th className="py-1 px-2">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {analysis.moves.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="py-1 px-2 text-slate-500">{m.moveNumber}</td>
                    <td className="py-1 px-2 text-slate-300 capitalize">{m.playerColor}</td>
                    <td className="py-1 px-2 font-bold text-slate-100">{m.san}</td>
                    <td className="py-1 px-2 text-slate-400">{(m.evalCpAfter / 100).toFixed(1)}</td>
                    <td className="py-1 px-2">
                      <Badge type={m.classification}>{m.classification}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};
