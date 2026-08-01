import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import type { MoveClassification, BoardTheme } from '../../types/chess';
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
  evalCp: number;
  evalChange: number;
  classification: MoveClassification;
  bestMoveSan?: string;
  bestMoveFrom?: Square;
  bestMoveTo?: Square;
}

interface AnalyzeGameSectionProps {
  initialPgn?: string;
  onBackToWelcome: () => void;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const SAMPLE_PGN = `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`;

export const AnalyzeGameSection: React.FC<AnalyzeGameSectionProps> = ({
  initialPgn = '',
  onBackToWelcome,
}) => {
  const [pgnText, setPgnText] = useState<string>(initialPgn || SAMPLE_PGN);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);

  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [boardTheme] = useState<BoardTheme>('wood');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Summary stats
  const [whiteAccuracy, setWhiteAccuracy] = useState<number>(0);
  const [blackAccuracy, setBlackAccuracy] = useState<number>(0);
  const [stats, setStats] = useState({
    wBrilliant: 0, wGreat: 0, wBest: 0, wGood: 0, wBad: 0, wInacc: 0, wMistake: 0, wBlunder: 0,
    bBrilliant: 0, bGreat: 0, bBest: 0, bGood: 0, bBad: 0, bInacc: 0, bMistake: 0, bBlunder: 0,
  });

  // Execute Stockfish game analysis with Chess.com evaluation model & real-time progress update
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
      historyMoves.forEach((m) => {
        stepGame.move(m.san);
        fenList.push(stepGame.fen());
      });

      setAnalysisProgress({ current: 0, total: historyMoves.length });

      const moveResults: AnalyzedMove[] = [];
      let wBrilliant = 0, wGreat = 0, wBest = 0, wGood = 0, wBad = 0, wInacc = 0, wMistake = 0, wBlunder = 0;
      let bBrilliant = 0, bGreat = 0, bBest = 0, bGood = 0, bBad = 0, bInacc = 0, bMistake = 0, bBlunder = 0;

      let wScoreTotal = 0, wMoveCount = 0;
      let bScoreTotal = 0, bMoveCount = 0;

      for (let i = 0; i < historyMoves.length; i++) {
        setAnalysisProgress({ current: i + 1, total: historyMoves.length });

        const m = historyMoves[i];
        const moveNum = Math.floor(i / 2) + 1;
        const color = m.color;
        const fenBeforePos = fenList[i];
        const fenAfterPos = fenList[i + 1];

        let bestSan: string | undefined = undefined;
        let bestFrom: Square | undefined = undefined;
        let bestTo: Square | undefined = undefined;

        let evalBeforePlayer = 0;
        let evalAfterOpponent = 0;

        // Query engine for position BEFORE move i (active player perspective)
        try {
          const evalResBefore = await api.getBestMove({ fen: fenBeforePos, elo: 3200 });
          if (evalResBefore) {
            evalBeforePlayer = evalResBefore.scoreType === 'mate'
              ? (evalResBefore.scoreValue > 0 ? 1000 : -1000)
              : (evalResBefore.scoreValue ?? 0);

            if (evalResBefore.bestMove && evalResBefore.bestMove.length >= 4) {
              const bUci = evalResBefore.bestMove;
              bestFrom = bUci.substring(0, 2) as Square;
              bestTo = bUci.substring(2, 4) as Square;

              try {
                const prevGamePos = new Chess(fenBeforePos);
                const res = prevGamePos.move({ from: bestFrom, to: bestTo, promotion: 'q' });
                if (res) bestSan = res.san;
              } catch {
                bestSan = evalResBefore.bestMove;
              }
            }
          }
        } catch (err) {
          console.warn(`Position BEFORE move ${i} eval warning:`, err);
        }

        // Query engine for position AFTER move i (opponent perspective)
        try {
          const evalResAfter = await api.getBestMove({ fen: fenAfterPos, elo: 3200 });
          if (evalResAfter) {
            evalAfterOpponent = evalResAfter.scoreType === 'mate'
              ? (evalResAfter.scoreValue > 0 ? 1000 : -1000)
              : (evalResAfter.scoreValue ?? 0);
          }
        } catch (err) {
          console.warn(`Position AFTER move ${i} eval warning:`, err);
        }

        // Player's eval after move is -evalAfterOpponent
        const playerEvalAfter = -evalAfterOpponent;
        const evalChange = playerEvalAfter - evalBeforePlayer;
        const evalLoss = Math.max(0, -evalChange);

        let classification: MoveClassification = 'good';

        const isMatchedBestMove = (m.from === bestFrom && m.to === bestTo) || (bestSan && m.san === bestSan);

        // Dynamic piece sacrifice detection (minor or major piece placed on attacked square or material sacrifice with winning position)
        let isSacrifice = false;
        if (['n', 'b', 'r', 'q'].includes(m.piece)) {
          try {
            const gAfter = new Chess(fenAfterPos);
            const oppMoves = gAfter.moves({ verbose: true });
            const isTargetAttacked = oppMoves.some((om) => om.to === m.to);
            const matDiff = (m.captured ? PIECE_VALUES[m.captured] || 1 : 0) - (PIECE_VALUES[m.piece] || 1);
            if (isTargetAttacked || matDiff <= -2) {
              isSacrifice = true;
            }
          } catch {
            isSacrifice = false;
          }
        }

        // Chess.com Classification Rules
        if (isSacrifice && evalLoss <= 25 && playerEvalAfter >= 80 && isMatchedBestMove) {
          classification = 'brilliant';
        } else if (isMatchedBestMove && (evalChange >= 40 || i < 6)) {
          classification = 'great';
        } else if (isMatchedBestMove || evalLoss <= 15) {
          classification = 'best';
        } else if (evalLoss <= 45) {
          classification = 'good';
        } else if (evalLoss <= 110) {
          classification = 'bad';
        } else if (evalLoss <= 220) {
          classification = 'inaccuracy';
        } else if (evalLoss <= 380) {
          classification = 'mistake';
        } else {
          classification = 'blunder';
        }

        if (color === 'w') {
          if (classification === 'brilliant') wBrilliant++;
          else if (classification === 'great') wGreat++;
          else if (classification === 'best') wBest++;
          else if (classification === 'good') wGood++;
          else if (classification === 'bad') wBad++;
          else if (classification === 'inaccuracy') wInacc++;
          else if (classification === 'mistake') wMistake++;
          else wBlunder++;
        } else {
          if (classification === 'brilliant') bBrilliant++;
          else if (classification === 'great') bGreat++;
          else if (classification === 'best') bBest++;
          else if (classification === 'good') bGood++;
          else if (classification === 'bad') bBad++;
          else if (classification === 'inaccuracy') bInacc++;
          else if (classification === 'mistake') bMistake++;
          else bBlunder++;
        }

        const moveAccScore = Math.max(0, 100 - evalLoss * 0.25);
        if (color === 'w') {
          wScoreTotal += moveAccScore;
          wMoveCount++;
        } else {
          bScoreTotal += moveAccScore;
          bMoveCount++;
        }

        moveResults.push({
          moveNumber: moveNum,
          color: m.color,
          san: m.san,
          piece: m.piece,
          from: m.from as Square,
          to: m.to as Square,
          fenBefore: fenBeforePos,
          fenAfter: fenAfterPos,
          evalCp: playerEvalAfter,
          evalChange,
          classification,
          bestMoveSan: bestSan,
          bestMoveFrom: bestFrom,
          bestMoveTo: bestTo,
        });
      }

      setAnalyzedMoves(moveResults);
      setCurrentMoveIndex(moveResults.length);
      setWhiteAccuracy(wMoveCount > 0 ? Math.round(wScoreTotal / wMoveCount) : 100);
      setBlackAccuracy(bMoveCount > 0 ? Math.round(bScoreTotal / bMoveCount) : 100);
      setStats({
        wBrilliant, wGreat, wBest, wGood, wBad, wInacc, wMistake, wBlunder,
        bBrilliant, bGreat, bBest, bGood, bBad, bInacc, bMistake, bBlunder,
      });
      setIsModalOpen(false);

    } catch (err) {
      console.error('Error analyzing PGN:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Compute active FEN for selected step
  const activePositionFen = useMemo(() => {
    if (analyzedMoves.length === 0 || currentMoveIndex === 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    const idx = Math.min(currentMoveIndex - 1, analyzedMoves.length - 1);
    return analyzedMoves[idx].fenAfter;
  }, [analyzedMoves, currentMoveIndex]);

  // Current active move object
  const activeMove = useMemo(() => {
    if (currentMoveIndex === 0 || analyzedMoves.length === 0) return null;
    return analyzedMoves[currentMoveIndex - 1] || null;
  }, [analyzedMoves, currentMoveIndex]);

  // Board square styling
  const boardSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!activeMove) return styles;

    styles[activeMove.from] = { backgroundColor: 'rgba(6, 182, 212, 0.4)' };
    styles[activeMove.to] = { backgroundColor: 'rgba(6, 182, 212, 0.6)' };

    if (activeMove.bestMoveFrom && activeMove.bestMoveTo) {
      styles[activeMove.bestMoveFrom] = { backgroundColor: 'rgba(16, 185, 129, 0.4)', borderRadius: '50%' };
      styles[activeMove.bestMoveTo] = { backgroundColor: 'rgba(16, 185, 129, 0.6)', border: '2px dashed #10b981' };
    }

    return styles;
  }, [activeMove]);

  // Arrow rendering for best moves: ALWAYS draw green arrow for best move recommendation
  const boardArrows = useMemo(() => {
    if (!activeMove) return [];
    if (activeMove.bestMoveFrom && activeMove.bestMoveTo) {
      return [{ startSquare: activeMove.bestMoveFrom, endSquare: activeMove.bestMoveTo, color: '#10b981' }];
    }
    return [];
  }, [activeMove]);

  // Autoplay handler
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">

      {/* PGN Input Modal Dialog Box with Live Analysis Progress Bar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Analyze Game with Stockfish"
        className="max-w-xl"
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-400">
            Paste your game PGN string below and click <strong className="text-emerald-400">Start Analysis with Souvik</strong> to begin Stockfish move evaluation.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                PGN Game Notation
              </label>

              <button
                type="button"
                onClick={() => setPgnText(SAMPLE_PGN)}
                className="text-[11px] text-cyan-400 hover:underline font-mono"
              >
                Load Sample Match
              </button>
            </div>

            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="Paste PGN string here (e.g. 1. e4 e5 2. Nf3 Nc6...)"
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 transition-all resize-y select-all"
            />
          </div>

          {/* Real-Time Analysis Progress Feedback */}
          {isAnalyzing && analysisProgress && (
            <div className="space-y-2 py-3 border-t border-slate-800/80 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Analyzing {analysisProgress.current} out of {analysisProgress.total} moves...
                </span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((analysisProgress.current / (analysisProgress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${(analysisProgress.current / (analysisProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onBackToWelcome}
              className="w-1/3 text-xs"
            >
              Cancel
            </Button>

            <Button
              variant="accent"
              onClick={() => runAnalysis(pgnText)}
              disabled={isAnalyzing || !pgnText.trim()}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 py-3"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Moves...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Analysis with Souvik</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Analysis Session Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Interactive Chessboard */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          <div className="relative rounded-2xl p-3 bg-slate-900/90 border border-slate-800 shadow-2xl shadow-emerald-500/10">
            <div className="w-[420px] sm:w-[460px] md:w-[480px] h-[420px] sm:h-[460px] md:h-[480px] rounded-xl overflow-hidden">
              <Chessboard
                options={{
                  position: activePositionFen,
                  boardOrientation: isFlipped ? 'black' : 'white',
                  darkSquareStyle: { backgroundColor: boardTheme === 'wood' ? '#b58863' : '#1e1b4b' },
                  lightSquareStyle: { backgroundColor: boardTheme === 'wood' ? '#f0d9b5' : '#312e81' },
                  squareStyles: boardSquareStyles,
                  arrows: boardArrows,
                  allowDragging: false,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-full max-w-[480px]">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToWelcome}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Battle Arena</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>New PGN Analysis</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Accuracy Cards, Navigation, Blunder Alerts & Best Move Analysis Panel */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Shifted Block 1: Accuracy Summary Cards */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  White Accuracy
                </span>
                <span className="text-2xl font-black font-mono text-cyan-400">
                  {whiteAccuracy}%
                </span>
              </div>
              <div className="text-right text-[11px] space-y-0.5 font-mono">
                <div className="text-cyan-300">‼️ {stats.wBrilliant} 🌟 {stats.wGreat} ✨ {stats.wBest}</div>
                <div className="text-amber-400">👎 Bad: {stats.wBad} ⚠️ Inacc: {stats.wInacc}</div>
                <div className="text-rose-400">⚡ Mistake: {stats.wMistake} ❌ Blunder: {stats.wBlunder}</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Black Accuracy
                </span>
                <span className="text-2xl font-black font-mono text-indigo-400">
                  {blackAccuracy}%
                </span>
              </div>
              <div className="text-right text-[11px] space-y-0.5 font-mono">
                <div className="text-cyan-300">‼️ {stats.bBrilliant} 🌟 {stats.bGreat} ✨ {stats.bBest}</div>
                <div className="text-amber-400">👎 Bad: {stats.bBad} ⚠️ Inacc: {stats.bInacc}</div>
                <div className="text-rose-400">⚡ Mistake: {stats.bMistake} ❌ Blunder: {stats.bBlunder}</div>
              </div>
            </div>
          </div>

          {/* Shifted Block 2: Move Navigation Controls */}
          <div className="flex items-center justify-between w-full bg-slate-900/90 border border-slate-800 p-2 rounded-xl shadow-lg">
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
                className={isPlaying ? 'text-amber-400 border-amber-500/50' : ''}
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
              <span className="text-xs font-mono font-bold text-slate-300">
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

          {/* Shifted Block 3: Blunder / Inaccuracy Alert Banner */}
          {activeMove && ['inaccuracy', 'mistake', 'blunder', 'bad'].includes(activeMove.classification) && (
            <div className="w-full bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>
                    {activeMove.classification === 'blunder'
                      ? 'BLUNDER DETECTED'
                      : activeMove.classification === 'mistake'
                      ? 'MISTAKE DETECTED'
                      : activeMove.classification === 'bad'
                      ? 'BAD MOVE DETECTED'
                      : 'INACCURACY DETECTED'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Move {activeMove.moveNumber} ({activeMove.color === 'w' ? 'White' : 'Black'})
                </span>
              </div>

              <div className="text-xs text-slate-200 space-y-1 font-mono">
                <div>
                  Played Move:{' '}
                  <span className="font-bold text-rose-300">
                    {PIECE_SYMBOLS[activeMove.piece] || ''} {activeMove.san}
                  </span>
                </div>

                {activeMove.bestMoveSan && (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Stockfish Best Move: <span className="underline decoration-emerald-500">{activeMove.bestMoveSan}</span>
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                Stockfish recommends playing {activeMove.bestMoveSan || 'the green arrow move'} to keep optimal position.
              </p>
            </div>
          )}

          {/* Stockfish Best Move & Position Analysis Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Stockfish Best Move & Position Analysis
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Stockfish 18 Active
              </span>
            </div>

            {activeMove ? (
              <div className="space-y-4">
                {/* Played Move Summary */}
                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Played Move (Move {activeMove.moveNumber} - {activeMove.color === 'w' ? 'White' : 'Black'})
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl text-amber-300">
                        {PIECE_SYMBOLS[activeMove.piece] || ''}
                      </span>
                      <span className="text-lg font-black font-mono text-white">
                        {activeMove.san}
                      </span>
                      <Badge type={activeMove.classification}>{activeMove.classification}</Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Position Eval
                    </span>
                    <span className="text-base font-bold font-mono text-cyan-400">
                      {activeMove.evalCp > 0 ? `+${(activeMove.evalCp / 100).toFixed(2)}` : (activeMove.evalCp / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Stockfish Recommended Best Move Card with Arrow Notice */}
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2 shadow-lg">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    🟢 Engine Recommended Best Move
                  </span>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-emerald-400">
                        {activeMove.bestMoveSan ? (PIECE_SYMBOLS[activeMove.bestMoveSan.charAt(0).toLowerCase()] || '♟') : '♟'}
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-300 tracking-wide">
                        {activeMove.bestMoveSan || activeMove.san}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Green Arrow on Board ({activeMove.bestMoveFrom} ➔ {activeMove.bestMoveTo})</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    Stockfish evaluates <strong className="text-emerald-400 font-mono">{activeMove.bestMoveSan || activeMove.san}</strong> as the optimal line for {activeMove.color === 'w' ? 'White' : 'Black'} from this position.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Use the move navigation controls to inspect Stockfish best moves and position arrows step-by-step.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
