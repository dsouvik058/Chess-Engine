import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { BoardTheme, PlayerColor } from '../../types/chess';

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
  theme = 'cyber',
  isInteractive = true,
  showLegalMoves = true,
}) => {
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);

  // Custom colors for themes
  const customBoardStyles: Record<BoardTheme, { dark: string; light: string }> = {
    cyber: { dark: '#1e1b4b', light: '#312e81' },
    wood: { dark: '#b58863', light: '#f0d9b5' },
    emerald: { dark: '#044e54', light: '#14b8a6' },
    classic: { dark: '#769656', light: '#eeeed2' },
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
          ? 'radial-gradient(circle, rgba(239,68,68,0.75) 35%, transparent 40%)'
          : 'radial-gradient(circle, rgba(6,182,212,0.7) 25%, transparent 30%)',
      };
    });
    newSquares[square] = {
      background: 'rgba(6,182,212,0.35)',
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
      const success = onMakeMove(moveFrom, sq, 'q');
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
    const success = onMakeMove(sourceSquare as Square, targetSquare as Square, 'q');
    setMoveFrom(null);
    setOptionSquares({});
    return success;
  };

  const colors = customBoardStyles[theme] || customBoardStyles.cyber;

  return (
    <div className="relative rounded-3xl p-2.5 sm:p-3.5 glass-card border border-slate-700/80 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl transition-all duration-300 w-full max-w-[560px]">
      <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-800">
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
              boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.6)',
            },
            allowDragging: isInteractive,
          }}
        />
      </div>
    </div>
  );
};

