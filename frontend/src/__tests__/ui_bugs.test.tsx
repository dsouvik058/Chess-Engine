import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Components under test
import { PromotionModal } from '../components/modals/PromotionModal';
import { Modal } from '../components/ui/Modal';
import { GameControls } from '../components/chess/GameControls';
import { ChatPanel } from '../components/chat/ChatPanel';
import { useChessClock } from '../hooks/useChessClock';
import { Badge } from '../components/ui/Badge';
import { EngineStatsPanel } from '../components/chess/EngineStatsPanel';

describe('UI & DOM Interaction Tests for Bug Fixes', () => {
  // TC-01: Pawn Promotion Selection
  describe('TC-01: Pawn Promotion Dialog DOM Tests', () => {
    it('renders all 4 promotion piece options (Queen, Knight, Rook, Bishop) when open', () => {
      const handleSelect = vi.fn();
      const handleCancel = vi.fn();

      render(
        <PromotionModal
          isOpen={true}
          color="white"
          onSelectPiece={handleSelect}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText(/PAWN PROMOTION/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Promote Your Pawn/i })).toBeInTheDocument();

      // Check piece labels in DOM
      expect(screen.getByText('Queen')).toBeInTheDocument();
      expect(screen.getByText('Knight')).toBeInTheDocument();
      expect(screen.getByText('Rook')).toBeInTheDocument();
      expect(screen.getByText('Bishop')).toBeInTheDocument();

      // Click Knight
      fireEvent.click(screen.getByText('Knight'));
      expect(handleSelect).toHaveBeenCalledWith('n');
    });

    it('triggers onCancel when Cancel button is clicked', () => {
      const handleSelect = vi.fn();
      const handleCancel = vi.fn();

      render(
        <PromotionModal
          isOpen={true}
          color="black"
          onSelectPiece={handleSelect}
          onCancel={handleCancel}
        />
      );

      fireEvent.click(screen.getByText(/Cancel Move/i));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <PromotionModal
          isOpen={false}
          color="white"
          onSelectPiece={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  // TC-02 & TC-03: Clock Continuity and Time Increment
  describe('TC-02 & TC-03: Clock Continuity & Time Increment Tests', () => {
    function ClockTestWrapper({
      initialMinutes,
      incrementSecs,
    }: {
      initialMinutes: number;
      incrementSecs: number;
    }) {
      const [turn, setTurn] = useState<'white' | 'black'>('white');
      const clock = useChessClock({
        initialMinutes,
        activeColor: turn,
        isGameOver: false,
      });

      return (
        <div>
          <div data-testid="white-clock">{clock.formattedWhiteTime}</div>
          <div data-testid="black-clock">{clock.formattedBlackTime}</div>
          <button
            data-testid="make-move-white"
            onClick={() => {
              clock.addIncrement('white', incrementSecs);
              setTurn('black');
            }}
          >
            White Moves
          </button>
          <button
            data-testid="make-move-black"
            onClick={() => {
              clock.addIncrement('black', incrementSecs);
              setTurn('white');
            }}
          >
            Black Moves
          </button>
        </div>
      );
    }

    it('correctly initializes formatted time and applies increment on move', () => {
      vi.useFakeTimers();

      render(<ClockTestWrapper initialMinutes={5} incrementSecs={5} />);

      expect(screen.getByTestId('white-clock').textContent).toBe('05:00');
      expect(screen.getByTestId('black-clock').textContent).toBe('05:00');

      // Advance 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('white-clock').textContent).toBe('04:58');
      expect(screen.getByTestId('black-clock').textContent).toBe('05:00');

      // White completes move -> +5s increment added to White, turn shifts to Black
      fireEvent.click(screen.getByTestId('make-move-white'));
      expect(screen.getByTestId('white-clock').textContent).toBe('05:03');

      // Advance 3 seconds on Black's turn
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByTestId('white-clock').textContent).toBe('05:03');
      expect(screen.getByTestId('black-clock').textContent).toBe('04:57');

      vi.useRealTimers();
    });
  });

  // TC-05: Modal Backdrop Locking
  describe('TC-05: Modal Backdrop Lock Tests', () => {
    it('does not trigger onClose when backdrop is clicked if closeOnBackdropClick is false', () => {
      const handleClose = vi.fn();

      const { container } = render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Game Over"
          closeOnBackdropClick={false}
          hideCloseButton={true}
        >
          <div>Game Over Body</div>
        </Modal>
      );

      expect(screen.getByText('Game Over')).toBeInTheDocument();
      expect(screen.getByText('Game Over Body')).toBeInTheDocument();

      // Backdrop overlay
      const backdrop = container.querySelector('.bg-slate-900\\/40') || container.firstChild?.firstChild;
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // onClose must NOT have been called
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('triggers onClose when closeOnBackdropClick is true (default)', () => {
      const handleClose = vi.fn();

      const { container } = render(
        <Modal isOpen={true} onClose={handleClose} title="Normal Dialog">
          <div>Normal Body</div>
        </Modal>
      );

      const backdrop = container.querySelector('.absolute.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  // TC-06: Symmetric Game Controls 2x2 Grid
  describe('TC-06: Symmetric Game Controls Layout Tests', () => {
    it('always renders exactly 4 action buttons in the main grid when canUndo is false', () => {
      render(
        <GameControls
          onBackToWelcome={vi.fn()}
          onUndoMove={vi.fn()}
          onFlipBoard={vi.fn()}
          onResign={vi.fn()}
          onOpenAnalysis={vi.fn()}
          onOpenPgnModal={vi.fn()}
          showLegalMoves={true}
          onToggleLegalMoves={vi.fn()}
          canUndo={false}
        />
      );

      // Verify 4 main actions: Takeback (disabled), Flip Board, Analyze, PGN/FEN
      expect(screen.getByText('Takeback')).toBeInTheDocument();
      expect(screen.getByText('Flip Board')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('PGN / FEN')).toBeInTheDocument();

      // Takeback button is disabled when canUndo is false
      const takebackBtn = screen.getByText('Takeback').closest('button');
      expect(takebackBtn).toBeDisabled();
    });

    it('enables Takeback button when canUndo is true', () => {
      const handleUndo = vi.fn();

      render(
        <GameControls
          onBackToWelcome={vi.fn()}
          onUndoMove={handleUndo}
          onFlipBoard={vi.fn()}
          onResign={vi.fn()}
          onOpenAnalysis={vi.fn()}
          onOpenPgnModal={vi.fn()}
          showLegalMoves={true}
          onToggleLegalMoves={vi.fn()}
          canUndo={true}
        />
      );

      const takebackBtn = screen.getByText('Takeback').closest('button');
      expect(takebackBtn).not.toBeDisabled();
      fireEvent.click(takebackBtn!);
      expect(handleUndo).toHaveBeenCalledTimes(1);
    });
  });

  // TC-08: Chat Panel Whitespace Sanitization
  describe('TC-08: Chat Message Whitespace Sanitization Tests', () => {
    it('disables submit button and prevents sending whitespace-only messages', () => {
      const handleSend = vi.fn();

      render(
        <ChatPanel
          messages={[]}
          onSendMessage={handleSend}
          myPlayerId="player-1"
          opponentName="Grandmaster Opponent"
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const submitBtn = screen.getByRole('button', { name: '' });

      // Initially disabled when empty
      expect(submitBtn).toBeDisabled();

      // Type spaces
      fireEvent.change(input, { target: { value: '    ' } });
      expect(submitBtn).toBeDisabled();
      fireEvent.submit(input.closest('form')!);
      expect(handleSend).not.toHaveBeenCalled();

      // Type valid message
      fireEvent.change(input, { target: { value: '  Good luck!  ' } });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.submit(input.closest('form')!);
      expect(handleSend).toHaveBeenCalledWith('Good luck!');
    });
  });

  // TC-09: Stockfish ELO Panel
  describe('TC-09: Stockfish Engine ELO Selection Tests', () => {
    it('renders ELO selector and calls onEloChange on selection', () => {
      const handleEloChange = vi.fn();

      render(
        <EngineStatsPanel
          stats={{
            evaluation: '+0.45',
            depth: 18,
            nodes: 245000,
            nps: 1200000,
            timeMs: 450,
            bestMove: 'e2e4',
            scoreType: 'cp',
            scoreValue: 45,
          }}
          elo={1500}
          onEloChange={handleEloChange}
          isEngineThinking={false}
        />
      );

      expect(screen.getByText('Stockfish 18 AI')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument(); // depth

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1500');

      fireEvent.change(select, { target: { value: '2200' } });
      expect(handleEloChange).toHaveBeenCalledWith(2200);
    });
  });

  // TC-10: Move Badges
  describe('TC-10: Move Classification Badges Tests', () => {
    it('renders all move classification badges with proper styles and labels', () => {
      const { rerender } = render(<Badge type="brilliant">Brilliant</Badge>);
      expect(screen.getByText('Brilliant')).toBeInTheDocument();

      rerender(<Badge type="blunder">Blunder</Badge>);
      expect(screen.getByText('Blunder')).toBeInTheDocument();

      rerender(<Badge type="book">Book</Badge>);
      expect(screen.getByText('Book')).toBeInTheDocument();
    });
  });
});
