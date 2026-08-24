import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerColor } from '../../types/chess';

export type PromotionPieceOption = 'q' | 'r' | 'b' | 'n';

interface PromotionModalProps {
  isOpen: boolean;
  color: PlayerColor;
  onSelectPiece: (piece: PromotionPieceOption) => void;
  onCancel: () => void;
}

interface PieceChoice {
  key: PromotionPieceOption;
  label: string;
  glyphWhite: string;
  glyphBlack: string;
}

const PIECE_CHOICES: PieceChoice[] = [
  { key: 'q', label: 'Queen', glyphWhite: '♕', glyphBlack: '♛' },
  { key: 'n', label: 'Knight', glyphWhite: '♘', glyphBlack: '♞' },
  { key: 'r', label: 'Rook', glyphWhite: '♖', glyphBlack: '♜' },
  { key: 'b', label: 'Bishop', glyphWhite: '♗', glyphBlack: '♝' },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelectPiece,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          className="relative bg-white/95 border-2 border-amber-300 rounded-3xl p-6 shadow-2xl shadow-amber-950/20 max-w-sm w-full text-center space-y-4 z-10"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest px-2.5 py-0.5 bg-amber-100 rounded-full border border-amber-300">
              PAWN PROMOTION
            </span>
            <h3 className="text-xl font-black text-slate-900 font-serif-classic">
              Promote Your Pawn
            </h3>
            <p className="text-xs text-slate-600">
              Choose the piece you wish to promote your pawn into:
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2.5 pt-2">
            {PIECE_CHOICES.map((choice) => {
              const glyph = color === 'white' ? choice.glyphWhite : choice.glyphBlack;
              return (
                <motion.button
                  key={choice.key}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onSelectPiece(choice.key)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-100/60 shadow-md transition-all cursor-pointer group"
                >
                  <span className="text-3xl font-serif text-slate-900 group-hover:scale-110 transition-transform">
                    {glyph}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 mt-1 font-mono">
                    {choice.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={onCancel}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel Move
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
