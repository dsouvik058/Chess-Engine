import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  RotateCcw,
  History,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EvaluationBar } from './EvaluationBar';
import { AiCoachPanel } from './AiCoachPanel';
import { api } from '../../services/api';
import type { MoveClassification } from '../../types/chess';
import { isBookMove } from '../../utils/openingBook';
import { soundFx } from '../../utils/sound';

interface AnalyzedMove {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  piece: string;
  from: Square;
  to: Square;
  fenBefore: string;
  fenAfter: string;
  evalCpBefore: number;
  evalCpAfter: number;
  winPercentageBefore: number;
  winPercentageAfter: number;
  winDrop: number;
  classification: MoveClassification;
  bestMoveSan?: string;
  bestMoveFrom?: Square;
  bestMoveTo?: Square;
  pv?: string;
}

interface AnalyzeGameSectionProps {
  initialPgn?: string;
  onBackToWelcome: () => void;
}

const SAMPLE_PGN = `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`;

export function calculateWinPercentage(centipawns: number): number {
  const winPct = 50.0 + 50.0 * (2.0 / (1.0 + Math.exp(-0.00368208 * centipawns)) - 1.0);
  return Math.max(0.0, Math.min(100.0, winPct));
}

export function calculateAccuracy(avgWinDrop: number): number {
  const acc = 103.1668 * Math.exp(-0.04354 * avgWinDrop) - 3.1669;
  return Math.max(0.0, Math.min(100.0, Math.round(acc * 10) / 10));
}

const getSquarePercent = (square: Square, isFlipped: boolean) => {
  const file = square[0];
  const rank = parseInt(square[1], 10);

  let col = 'abcdefgh'.indexOf(file);
  let row = 8 - rank;

  if (isFlipped) {
    col = 7 - col;
    row = 7 - row;
  }

  return {
    leftPercent: col * 12.5,
    topPercent: row * 12.5,
  };
};

const getClassificationBadge = (classification: MoveClassification) => {
  switch (classification) {
    case 'brilliant':
      return { symbol: '!!', className: 'bg-teal-500 text-white font-black shadow-md shadow-teal-500/40 ring-2 ring-teal-200', label: 'Brilliant Move' };
    case 'great':
      return { symbol: '!', className: 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/40', label: 'Great Move' };
    case 'best':
      return { symbol: '★', className: 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/40', label: 'Best Move' };
    case 'excellent':
      return { symbol: '✓', className: 'bg-emerald-500 text-white font-bold shadow-sm', label: 'Excellent Move' };
    case 'good':
      return { symbol: '👍', className: 'bg-green-600 text-white shadow-sm', label: 'Good Move' };
    case 'inaccuracy':
      return { symbol: '?!', className: 'bg-amber-500 text-slate-950 font-black shadow-sm', label: 'Inaccuracy' };
    case 'mistake':
      return { symbol: '?', className: 'bg-orange-500 text-white font-black shadow-sm', label: 'Mistake' };
    case 'blunder':
      return { symbol: '??', className: 'bg-rose-600 text-white font-black shadow-md animate-bounce', label: 'Blunder' };
    case 'miss':
      return { symbol: '❌', className: 'bg-purple-700 text-white font-bold shadow-sm', label: 'Missed Win' };
    case 'book':
      return { symbol: '📖', className: 'bg-amber-700 text-white shadow-sm', label: 'Book Move' };
    default:
      return { symbol: '✓', className: 'bg-slate-600 text-white', label: 'Move' };
  }
};

export const AnalyzeGameSection: React.FC<AnalyzeGameSectionProps> = ({
  initialPgn = '',
  onBackToWelcome,
}) => {
  const [pgnText, setPgnText] = useState<string>(initialPgn || SAMPLE_PGN);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!initialPgn);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);

  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Summary stats
  const [whiteAccuracy, setWhiteAccuracy] = useState<number>(0);
  const [blackAccuracy, setBlackAccuracy] = useState<number>(0);

  const runAnalysis = useCallback(async (pgnStrToAnalyze: string) => {
    if (!pgnStrToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setIsPlaying(false);

    try {
      const tempGame = new Chess();
      let pgnValid = false;

      try {
        tempGame.loadPgn(pgnStrToAnalyze.trim());
        pgnValid = true;
      } catch {
        const cleaned = pgnStrToAnalyze.replace(/\[.*?\]/g, '').replace(/\d+\./g, '').trim();
        const moveTokens = cleaned.split(/\s+/).filter((t) => t && !t.includes('-'));
        const fallbackGame = new Chess();
        for (const tok of moveTokens) {
          try {
            fallbackGame.move(tok);
          } catch {
            break;
          }
        }
        tempGame.load(fallbackGame.fen());
        pgnValid = fallbackGame.history().length > 0;
      }

      if (!pgnValid) {
        setIsAnalyzing(false);
        return;
      }

      const historyMoves = tempGame.history({ verbose: true });
      const fenList: string[] = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];

      const stepGame = new Chess();
      const uciMoves: string[] = [];
      const sanMoves: string[] = [];

      historyMoves.forEach((m) => {
        const uci = `${m.from}${m.to}${m.promotion || ''}`;
        uciMoves.push(uci);
        sanMoves.push(m.san);
        stepGame.move(m.san);
        fenList.push(stepGame.fen());
      });

      setAnalysisProgress({ current: 0, total: historyMoves.length });

      // Fast single batch API call to the backend Stockfish pipeline
      const analysisRes = await api.analyzeGame(uciMoves, {
        sanMoves,
        movetime: 120,
        elo: 3200,
      });

      const moveResults: AnalyzedMove[] = [];
      const evaluations = analysisRes?.evaluations || [];

      for (let i = 0; i < historyMoves.length; i++) {
        setAnalysisProgress({ current: i + 1, total: historyMoves.length });

        const m = historyMoves[i];
        const moveNum = Math.floor(i / 2) + 1;
        const color = m.color;
        const fenBeforePos = fenList[i];
        const fenAfterPos = fenList[i + 1];
        const evalItem = evaluations[i];

        let bestSan: string | undefined = undefined;
        let bestFrom: Square | undefined = undefined;
        let bestTo: Square | undefined = undefined;

        if (evalItem?.bestMove && evalItem.bestMove.length >= 4) {
          const bUci = evalItem.bestMove;
          bestFrom = bUci.substring(0, 2) as Square;
          bestTo = bUci.substring(2, 4) as Square;

          try {
            const prevGamePos = new Chess(fenBeforePos);
            const res = prevGamePos.move({ from: bestFrom, to: bestTo, promotion: (bUci[4] || 'q') });
            if (res) bestSan = res.san;
          } catch {
            bestSan = evalItem.bestMove;
          }
        }

        if (!bestFrom || !bestTo) {
          bestFrom = m.from as Square;
          bestTo = m.to as Square;
        }

        const classification: MoveClassification =
          (evalItem?.classification as MoveClassification) ||
          (isBookMove(sanMoves.slice(0, i + 1)) ? 'book' : 'good');

        moveResults.push({
          moveNumber: moveNum,
          color,
          san: m.san,
          piece: m.piece,
          from: m.from as Square,
          to: m.to as Square,
          fenBefore: fenBeforePos,
          fenAfter: fenAfterPos,
          evalCpBefore: evalItem?.evalCpBefore ?? 0,
          evalCpAfter: evalItem?.evalCpAfter ?? 0,
          winPercentageBefore: evalItem?.winPercentageBefore ?? 50.0,
          winPercentageAfter: evalItem?.winPercentageAfter ?? 50.0,
          winDrop: evalItem?.winDrop ?? 0.0,
          classification,
          bestMoveSan: bestSan,
          bestMoveFrom: bestFrom,
          bestMoveTo: bestTo,
          pv: evalItem?.pv,
        });
      }

      setAnalyzedMoves(moveResults);
      setCurrentMoveIndex(moveResults.length);
      setWhiteAccuracy(analysisRes?.whiteAccuracy ?? 100.0);
      setBlackAccuracy(analysisRes?.blackAccuracy ?? 100.0);
      setIsModalOpen(false);

    } catch (err) {
      console.error('Error analyzing game PGN:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Auto-run if initialPgn passed
  useEffect(() => {
    if (initialPgn) {
      runAnalysis(initialPgn);
    }
  }, [initialPgn, runAnalysis]);

  const activePositionFen = useMemo(() => {
    if (analyzedMoves.length === 0 || currentMoveIndex === 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    const idx = Math.min(currentMoveIndex - 1, analyzedMoves.length - 1);
    return analyzedMoves[idx].fenAfter;
  }, [analyzedMoves, currentMoveIndex]);

  const activeMove = useMemo(() => {
    if (currentMoveIndex === 0 || analyzedMoves.length === 0) return null;
    return analyzedMoves[currentMoveIndex - 1] || null;
  }, [analyzedMoves, currentMoveIndex]);

  const activeScoreType = useMemo<'cp' | 'mate'>(() => {
    if (!activeMove) return 'cp';
    const whiteCp = activeMove.evalCpAfter;
    if (Math.abs(whiteCp) >= 15000) return 'mate';
    return 'cp';
  }, [activeMove]);

  const activeScoreValue = useMemo<number>(() => {
    if (!activeMove) return 0;
    const whiteCp = activeMove.evalCpAfter;
    if (Math.abs(whiteCp) >= 15000) {
      const mateCount = Math.round((30000 - Math.abs(whiteCp)) / 100);
      return whiteCp > 0 ? Math.max(1, mateCount) : -Math.max(1, mateCount);
    }
    return whiteCp;
  }, [activeMove]);

  const boardSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!activeMove) return styles;

    // Played move highlight (Warm Amber)
    styles[activeMove.from] = { backgroundColor: 'rgba(217, 119, 6, 0.4)' };
    styles[activeMove.to] = { backgroundColor: 'rgba(217, 119, 6, 0.6)' };

    // Highlight best move (Green)
    const bestFrom = activeMove.bestMoveFrom || activeMove.from;
    const bestTo = activeMove.bestMoveTo || activeMove.to;

    if (bestFrom && bestTo && (bestFrom !== activeMove.from || bestTo !== activeMove.to)) {
      styles[bestFrom] = { backgroundColor: 'rgba(16, 185, 129, 0.4)', borderRadius: '50%' };
      styles[bestTo] = { backgroundColor: 'rgba(16, 185, 129, 0.55)', border: '2px dashed #059669' };
    }

    return styles;
  }, [activeMove]);

  // Show Green Arrow for Stockfish Best Move
  const boardArrows = useMemo(() => {
    if (!activeMove) return [];
    const bestFrom = activeMove.bestMoveFrom || activeMove.from;
    const bestTo = activeMove.bestMoveTo || activeMove.to;

    if (bestFrom && bestTo) {
      return [{ startSquare: bestFrom, endSquare: bestTo, color: '#059669' }];
    }
    return [];
  }, [activeMove]);

  // Structured Move Log Rows
  const moveLogRows = useMemo(() => {
    const rows: Array<{
      moveNumber: number;
      whiteIndex?: number;
      whiteSan?: string;
      whiteBadge?: MoveClassification;
      blackIndex?: number;
      blackSan?: string;
      blackBadge?: MoveClassification;
    }> = [];

    for (let i = 0; i < analyzedMoves.length; i += 2) {
      const wMove = analyzedMoves[i];
      const bMove = analyzedMoves[i + 1];
      rows.push({
        moveNumber: Math.floor(i / 2) + 1,
        whiteIndex: i + 1,
        whiteSan: wMove?.san,
        whiteBadge: wMove?.classification,
        blackIndex: bMove ? i + 2 : undefined,
        blackSan: bMove?.san,
        blackBadge: bMove?.classification,
      });
    }
    return rows;
  }, [analyzedMoves]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= analyzedMoves.length) {
            setIsPlaying(false);
            return prev;
          }
          soundFx.playMove();
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, analyzedMoves.length]);

  useEffect(() => {
    if (scrollRef.current && currentMoveIndex > 0) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        const container = scrollRef.current;
        const elTop = activeEl.offsetTop;
        const elHeight = activeEl.offsetHeight;
        const containerHeight = container.clientHeight;

        // Smoothly scroll only within the move log container without shifting the window/page
        container.scrollTo({
          top: Math.max(0, elTop - containerHeight / 2 + elHeight / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [currentMoveIndex]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300 text-slate-900">

      {/* PGN Input Modal Dialog Box */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Analyze Game with Stockfish Engine"
        className="max-w-xl"
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-600">
            Paste your PGN below to analyze game accuracy, move quality, best engine moves, and interactive move history.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-emerald-600" />
                PGN Game Notation
              </label>

              <button
                type="button"
                onClick={() => setPgnText(SAMPLE_PGN)}
                className="text-[11px] text-amber-700 hover:underline font-mono font-bold"
              >
                Load Sample Match
              </button>
            </div>

            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="Paste PGN string here (e.g. 1. e4 e5 2. Nf3 Nc6...)"
              rows={5}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 transition-all resize-y select-all shadow-sm font-semibold"
            />
          </div>

          {/* Real-Time Analysis Progress */}
          {isAnalyzing && analysisProgress && (
            <div className="space-y-2 py-3 border-t border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-amber-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  Evaluating move {analysisProgress.current} of {analysisProgress.total} with Stockfish...
                </span>
                <span className="text-emerald-700">
                  {Math.round((analysisProgress.current / (analysisProgress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                <div
                  className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${(analysisProgress.current / (analysisProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onBackToWelcome}
              className="w-1/3 text-xs font-bold"
            >
              Cancel
            </Button>

            <Button
              variant="classic"
              onClick={() => runAnalysis(pgnText)}
              disabled={isAnalyzing || !pgnText.trim()}
              className="w-2/3 font-bold flex items-center justify-center gap-2 shadow-lg py-3"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Match...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Game Analysis</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Analysis Session Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Interactive Chessboard (Sticky on viewport) */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4 lg:sticky lg:top-20 self-start">
          <div className="relative rounded-3xl p-3.5 glass-card border-2 border-amber-200/90 shadow-2xl shadow-amber-900/10 w-full max-w-[530px] flex items-center gap-3 bg-gradient-to-b from-amber-50/80 to-white">
            {/* Real-time Vertical Evaluation Bar */}
            <EvaluationBar
              scoreType={activeScoreType}
              scoreValue={activeScoreValue}
              isFlipped={isFlipped}
            />

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-amber-900/25 flex-1">
              <Chessboard
                options={{
                  position: activePositionFen,
                  boardOrientation: isFlipped ? 'black' : 'white',
                  darkSquareStyle: { backgroundColor: '#b58863' },
                  lightSquareStyle: { backgroundColor: '#f0d9b5' },
                  squareStyles: boardSquareStyles,
                  arrows: boardArrows,
                  allowDragging: false,
                }}
              />

              {/* Piece Quality Badge Mark Overlay */}
              {activeMove && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {(() => {
                    const { leftPercent, topPercent } = getSquarePercent(activeMove.to, isFlipped);
                    const badgeInfo = getClassificationBadge(activeMove.classification);

                    return (
                      <div
                        style={{
                          left: `${leftPercent}%`,
                          top: `${topPercent}%`,
                          width: '12.5%',
                          height: '12.5%',
                        }}
                        className="absolute flex items-start justify-end p-0.5"
                      >
                        <div
                          className={`flex items-center justify-center font-mono font-black text-[11px] min-w-[22px] h-[22px] px-1 rounded-full border-2 border-white shadow-md animate-in zoom-in-50 duration-200 ${badgeInfo.className}`}
                          title={`${badgeInfo.label} (${activeMove.san})`}
                        >
                          {badgeInfo.symbol}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between w-full max-w-[500px]">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToWelcome}
              className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-2 font-bold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lobby</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs flex items-center gap-1.5 text-amber-800 border-amber-300 font-bold rounded-xl bg-amber-50 hover:bg-amber-100"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Analyze New PGN</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Accuracy Cards, Navigation & Move Logs */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Accuracy Summary Header Cards */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="glass-card border border-slate-200 rounded-2xl p-4 shadow-md bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  White Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-amber-700">
                  {whiteAccuracy}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-mono font-bold text-amber-900 text-sm">
                ♔
              </div>
            </div>

            <div className="glass-card border border-slate-200 rounded-2xl p-4 shadow-md bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Black Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-indigo-700">
                  {blackAccuracy}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center font-mono font-bold text-indigo-900 text-sm">
                ♚
              </div>
            </div>
          </div>

          {/* Move Navigation Controls */}
          <div className="flex items-center justify-between w-full bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMoveIndex(0)}
                disabled={currentMoveIndex === 0}
                title="First Move"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMoveIndex((p) => Math.max(0, p - 1))}
                disabled={currentMoveIndex === 0}
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying((p) => !p)}
                title={isPlaying ? 'Pause' : 'Play Auto Step'}
                className={isPlaying ? 'text-amber-700 border-amber-400 bg-amber-50' : ''}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMoveIndex((p) => Math.min(analyzedMoves.length, p + 1))}
                disabled={currentMoveIndex >= analyzedMoves.length}
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMoveIndex(analyzedMoves.length)}
                disabled={currentMoveIndex === analyzedMoves.length}
                title="Last Move"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700">
                {currentMoveIndex} / {analyzedMoves.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFlipped((p) => !p)}
                title="Flip Board View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Interactive AI Grandmaster Coach with Voice Narration */}
          <AiCoachPanel
            currentMove={
              activeMove
                ? {
                    moveNumber: activeMove.moveNumber,
                    color: activeMove.color,
                    san: activeMove.san,
                    classification: activeMove.classification,
                    evalCp: activeMove.evalCpAfter,
                    winPercentage: activeMove.winPercentageAfter,
                    winDrop: activeMove.winDrop,
                    bestMoveSan: activeMove.bestMoveSan,
                    pv: activeMove.pv,
                    fen: activeMove.fenAfter,
                  }
                : null
            }
          />

          {/* Move History Log */}
          <div className="glass-card rounded-2xl border border-slate-200 p-4 shadow-xl shadow-slate-200/50 bg-white flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 text-xs font-bold text-slate-800 font-serif-classic">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700" />
                <span>Move History Log</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-mono font-bold text-amber-900 border border-amber-300">
                {analyzedMoves.length} Moves
              </span>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 pb-2 px-2 border-b border-slate-200">
              <span className="col-span-2">#</span>
              <span className="col-span-5">White</span>
              <span className="col-span-5">Black</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pt-2 pr-1 font-mono text-xs">
              {moveLogRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-xs space-y-1">
                  <span>No analyzed moves</span>
                  <span className="text-[10px] text-slate-400">Load a PGN to analyze match history</span>
                </div>
              ) : (
                moveLogRows.map((row) => (
                  <div
                    key={row.moveNumber}
                    className="grid grid-cols-12 gap-2 items-center py-1 px-2 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    <span className="col-span-2 text-slate-500 font-bold">{row.moveNumber}.</span>

                    {/* White Move Button */}
                    {row.whiteSan ? (
                      <button
                        onClick={() => row.whiteIndex && setCurrentMoveIndex(row.whiteIndex)}
                        data-active={currentMoveIndex === row.whiteIndex}
                        className={`col-span-5 flex items-center justify-between px-2 py-1 rounded-lg text-left font-bold transition-all cursor-pointer ${
                          currentMoveIndex === row.whiteIndex
                            ? 'bg-amber-100 text-amber-950 border border-amber-400 shadow-sm font-black'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{row.whiteSan}</span>
                        {row.whiteBadge && <Badge type={row.whiteBadge}>{getClassificationBadge(row.whiteBadge).symbol}</Badge>}
                      </button>
                    ) : (
                      <span className="col-span-5" />
                    )}

                    {/* Black Move Button */}
                    {row.blackSan ? (
                      <button
                        onClick={() => row.blackIndex && setCurrentMoveIndex(row.blackIndex)}
                        data-active={currentMoveIndex === row.blackIndex}
                        className={`col-span-5 flex items-center justify-between px-2 py-1 rounded-lg text-left font-bold transition-all cursor-pointer ${
                          currentMoveIndex === row.blackIndex
                            ? 'bg-indigo-100 text-indigo-950 border border-indigo-400 shadow-sm font-black'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{row.blackSan}</span>
                        {row.blackBadge && <Badge type={row.blackBadge}>{getClassificationBadge(row.blackBadge).symbol}</Badge>}
                      </button>
                    ) : (
                      <span className="col-span-5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


