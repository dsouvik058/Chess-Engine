import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { BoardTheme, PlayerColor } from '../../types/chess';
import { PromotionModal } from './PromotionModal';
import type { PromotionPieceOption } from './PromotionModal';

interface ChessBoardContainerProps {
  game: Chess;
  boardOrientation: PlayerColor;
  onMakeMove: (sourceSquare: Square, targetSquare: Square, promotionPiece?: string) => boolean;
  theme?: BoardTheme;
  isInteractive?: boolean;
  showLegalMoves?: boolean;
}

export const ChessBoardContainer: React.FC<ChessBoardContainerProps> = ({
  game,
  boardOrientation,
  onMakeMove,
  theme = 'wood',
  isInteractive = true,
  showLegalMoves = true,
}) => {
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: PlayerColor;
  } | null>(null);

  // Classic themes tailored for light/classic aesthetic
  const customBoardStyles: Record<BoardTheme, { dark: string; light: string }> = {
    wood: { dark: '#b58863', light: '#f0d9b5' },
    classic: { dark: '#769656', light: '#eeeed2' },
    emerald: { dark: '#2c6b4f', light: '#d8e8d8' },
    cyber: { dark: '#3b537d', light: '#d6e2f0' },
  };

  const isPromotionMove = (from: Square, to: Square): boolean => {
    const piece = game.get(from);
    if (!piece || piece.type !== 'p') return false;
    if (piece.color === 'w' && from[1] === '7' && to[1] === '8') return true;
    if (piece.color === 'b' && from[1] === '2' && to[1] === '1') return true;
    return false;
  };

  const getMoveOptions = (square: Square) => {
    if (!showLegalMoves) {
      setOptionSquares({});
      return true;
    }

    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.forEach((move) => {
      const isCapture = game.get(move.to as Square);
      newSquares[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(220,38,38,0.8) 36%, transparent 42%)'
          : 'radial-gradient(circle, rgba(217,119,6,0.75) 26%, transparent 32%)',
      };
    });
    newSquares[square] = {
      background: 'rgba(217,119,6,0.35)',
    };
    setOptionSquares(newSquares);
    return true;
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!isInteractive) return;
    const sq = square as Square;

    if (!moveFrom) {
      const hasMoves = getMoveOptions(sq);
      if (hasMoves) setMoveFrom(sq);
    } else {
      if (moveFrom === sq) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      if (isPromotionMove(moveFrom, sq)) {
        const piece = game.get(moveFrom);
        setPendingPromotion({
          from: moveFrom,
          to: sq,
          color: piece?.color === 'w' ? 'white' : 'black',
        });
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      const success = onMakeMove(moveFrom, sq);
      setMoveFrom(null);
      setOptionSquares({});
      if (!success) {
        const hasMoves = getMoveOptions(sq);
        if (hasMoves) setMoveFrom(sq);
      }
    }
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!isInteractive || !targetSquare) return false;
    const src = sourceSquare as Square;
    const tgt = targetSquare as Square;

    if (isPromotionMove(src, tgt)) {
      const piece = game.get(src);
      setPendingPromotion({
        from: src,
        to: tgt,
        color: piece?.color === 'w' ? 'white' : 'black',
      });
      setMoveFrom(null);
      setOptionSquares({});
      return true;
    }

    const success = onMakeMove(src, tgt);
    setMoveFrom(null);
    setOptionSquares({});
    return success;
  };

  const handlePromotionSelect = (piece: PromotionPieceOption) => {
    if (pendingPromotion) {
      onMakeMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  };

  const colors = customBoardStyles[theme] || customBoardStyles.wood;

  return (
    <div className="relative rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-amber-100/90 via-stone-100 to-amber-50/80 border-2 border-amber-200/90 shadow-2xl shadow-amber-900/10 backdrop-blur-xl transition-all duration-300 w-full max-w-[560px]">
      <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-xl shadow-slate-900/20 border-2 border-amber-900/25">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: handlePieceDrop,
            onSquareClick: handleSquareClick,
            boardOrientation: boardOrientation,
            darkSquareStyle: { backgroundColor: colors.dark },
            lightSquareStyle: { backgroundColor: colors.light },
            squareStyles: showLegalMoves ? optionSquares : {},
            boardStyle: {
              borderRadius: '16px',
            },
            allowDragging: isInteractive,
          }}
        />
      </div>

      {/* Promotion Selector Modal */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={pendingPromotion?.color || 'white'}
        onSelectPiece={handlePromotionSelect}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
};



