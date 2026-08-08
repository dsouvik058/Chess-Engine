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
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import type { MoveClassification, BoardTheme } from '../../types/chess';
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

// Formula 2: Win percentage = 50 + 50 * (2 / (1 + exp(-0.00368208 * centipawns)) - 1)
export function calculateWinPercentage(centipawns: number): number {
  const winPct = 50.0 + 50.0 * (2.0 / (1.0 + Math.exp(-0.00368208 * centipawns)) - 1.0);
  return Math.max(0.0, Math.min(100.0, winPct));
}

// Formula 5: Accuracy = 103.1668 * exp(-0.04354 * avgWinDrop) - 3.1669
export function calculateAccuracy(avgWinDrop: number): number {
  const acc = 103.1668 * Math.exp(-0.04354 * avgWinDrop) - 3.1669;
  return Math.max(0.0, Math.min(100.0, Math.round(acc * 10) / 10));
}

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
    wBook: 0, wBrilliant: 0, wGreat: 0, wBest: 0, wExcellent: 0, wGood: 0, wInacc: 0, wMistake: 0, wBlunder: 0, wMiss: 0,
    bBook: 0, bBrilliant: 0, bGreat: 0, bBest: 0, bExcellent: 0, bGood: 0, bInacc: 0, bMistake: 0, bBlunder: 0, bMiss: 0,
  });

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
      const whiteWinDrops: number[] = [];
      const blackWinDrops: number[] = [];

      let wBook = 0, wBrilliant = 0, wGreat = 0, wBest = 0, wExcellent = 0, wGood = 0, wInacc = 0, wMistake = 0, wBlunder = 0, wMiss = 0;
      let bBook = 0, bBrilliant = 0, bGreat = 0, bBest = 0, bExcellent = 0, bGood = 0, bInacc = 0, bMistake = 0, bBlunder = 0, bMiss = 0;

      let lastOpponentWinDrop = 0;
      const historySanList: string[] = [];

      for (let i = 0; i < historyMoves.length; i++) {
        setAnalysisProgress({ current: i + 1, total: historyMoves.length });

        const m = historyMoves[i];
        historySanList.push(m.san);

        const moveNum = Math.floor(i / 2) + 1;
        const color = m.color;
        const fenBeforePos = fenList[i];
        const fenAfterPos = fenList[i + 1];

        let bestSan: string | undefined = undefined;
        let bestFrom: Square | undefined = undefined;
        let bestTo: Square | undefined = undefined;
        let pvLine: string | undefined = undefined;

        let evalBeforePlayerCp = 0;
        let evalAfterOpponentCp = 0;

        // Query Stockfish BEFORE move (active player perspective)
        try {
          const evalResBefore = await api.getBestMove({ fen: fenBeforePos, elo: 3200 });
          if (evalResBefore) {
            pvLine = evalResBefore.pv;
            evalBeforePlayerCp = evalResBefore.scoreType === 'mate'
              ? (evalResBefore.scoreValue > 0 ? (10000 - Math.min(evalResBefore.scoreValue, 99) * 100) : (-10000 + Math.min(Math.abs(evalResBefore.scoreValue), 99) * 100))
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

        // Query Stockfish AFTER move (opponent perspective)
        try {
          const evalResAfter = await api.getBestMove({ fen: fenAfterPos, elo: 3200 });
          if (evalResAfter) {
            evalAfterOpponentCp = evalResAfter.scoreType === 'mate'
              ? (evalResAfter.scoreValue > 0 ? (10000 - Math.min(evalResAfter.scoreValue, 99) * 100) : (-10000 + Math.min(Math.abs(evalResAfter.scoreValue), 99) * 100))
              : (evalResAfter.scoreValue ?? 0);
          }
        } catch (err) {
          console.warn(`Position AFTER move ${i} eval warning:`, err);
        }

        const evalAfterPlayerCp = -evalAfterOpponentCp;

        // Formula 2: Win percentage before & after
        const winPctBefore = calculateWinPercentage(evalBeforePlayerCp);
        const winPctAfter = calculateWinPercentage(evalAfterPlayerCp);

        // Formula 3: Win drop = winPctBefore - winPctAfter
        let winDrop = Math.max(0.0, winPctBefore - winPctAfter);

        // Classification Rules
        let classification: MoveClassification = 'good';
        const inBook = isBookMove(historySanList);

        if (inBook) {
          classification = 'book';
          winDrop = 0.0;
        } else {
          const isMatchedBestMove = (m.from === bestFrom && m.to === bestTo) || (bestSan && m.san === bestSan);

          // Material sacrifice check
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

          if (isSacrifice && winDrop <= 2.0 && winPctBefore < 95.0) {
            classification = 'brilliant';
          } else if (isMatchedBestMove && winPctBefore < 95.0 && (winDrop === 0 || i < 6)) {
            classification = 'great';
          } else if (winDrop >= 10.0 && (winPctBefore >= 60.0 || lastOpponentWinDrop >= 15.0)) {
            classification = 'miss';
          } else if (winDrop <= 0.0001 || (isMatchedBestMove && winDrop <= 0.5)) {
            classification = 'best';
          } else if (winDrop <= 2.0) {
            classification = 'excellent';
          } else if (winDrop <= 5.0) {
            classification = 'good';
          } else if (winDrop <= 10.0) {
            classification = 'inaccuracy';
          } else if (winDrop <= 20.0) {
            classification = 'mistake';
          } else {
            classification = 'blunder';
          }
        }

        lastOpponentWinDrop = winDrop;

        if (color === 'w') {
          whiteWinDrops.push(winDrop);
          switch (classification) {
            case 'book': wBook++; break;
            case 'brilliant': wBrilliant++; break;
            case 'great': wGreat++; break;
            case 'best': wBest++; break;
            case 'excellent': wExcellent++; break;
            case 'good': wGood++; break;
            case 'inaccuracy': wInacc++; break;
            case 'mistake': wMistake++; break;
            case 'blunder': wBlunder++; break;
            case 'miss': wMiss++; break;
          }
        } else {
          blackWinDrops.push(winDrop);
          switch (classification) {
            case 'book': bBook++; break;
            case 'brilliant': bBrilliant++; break;
            case 'great': bGreat++; break;
            case 'best': bBest++; break;
            case 'excellent': bExcellent++; break;
            case 'good': bGood++; break;
            case 'inaccuracy': bInacc++; break;
            case 'mistake': bMistake++; break;
            case 'blunder': bBlunder++; break;
            case 'miss': bMiss++; break;
          }
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
          evalCpBefore: evalBeforePlayerCp,
          evalCpAfter: evalAfterPlayerCp,
          winPercentageBefore: Math.round(winPctBefore * 10) / 10,
          winPercentageAfter: Math.round(winPctAfter * 10) / 10,
          winDrop: Math.round(winDrop * 10) / 10,
          classification,
          bestMoveSan: bestSan,
          bestMoveFrom: bestFrom,
          bestMoveTo: bestTo,
          pv: pvLine,
        });
      }

      const avgWhiteWinDrop = whiteWinDrops.length > 0 ? whiteWinDrops.reduce((a, b) => a + b, 0) / whiteWinDrops.length : 0;
      const avgBlackWinDrop = blackWinDrops.length > 0 ? blackWinDrops.reduce((a, b) => a + b, 0) / blackWinDrops.length : 0;

      // Formula 5: Accuracy = 103.1668 * exp(-0.04354 * avgWinDrop) - 3.1669
      const calculatedWhiteAcc = calculateAccuracy(avgWhiteWinDrop);
      const calculatedBlackAcc = calculateAccuracy(avgBlackWinDrop);

      setAnalyzedMoves(moveResults);
      setCurrentMoveIndex(moveResults.length);
      setWhiteAccuracy(calculatedWhiteAcc);
      setBlackAccuracy(calculatedBlackAcc);
      setStats({
        wBook, wBrilliant, wGreat, wBest, wExcellent, wGood, wInacc, wMistake, wBlunder, wMiss,
        bBook, bBrilliant, bGreat, bBest, bExcellent, bGood, bInacc, bMistake, bBlunder, bMiss,
      });
      setIsModalOpen(false);

    } catch (err) {
      console.error('Error analyzing game PGN:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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

  const boardArrows = useMemo(() => {
    if (!activeMove) return [];
    if (activeMove.bestMoveFrom && activeMove.bestMoveTo) {
      return [{ startSquare: activeMove.bestMoveFrom, endSquare: activeMove.bestMoveTo, color: '#10b981' }];
    }
    return [];
  }, [activeMove]);

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
        title="Analyze Game with Stockfish & Win-Drop Model"
        className="max-w-xl"
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-400">
            Paste your PGN below to analyze game accuracy, Stockfish evaluation, Principal Variation (PV), Win Drop %, and 10-tier move quality classifications.
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
                  Evaluating move {analysisProgress.current} of {analysisProgress.total} with Stockfish...
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
                  <span>Analyzing Match...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Win-Drop Analysis</span>
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
              <span>Back to Lobby</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Analyze New PGN</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Accuracy Cards, Navigation, Metrics & Analysis Panel */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Accuracy Summary Cards (Formula 5) */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  White Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-cyan-400">
                  {whiteAccuracy}%
                </span>
              </div>
              <div className="text-right text-[11px] space-y-0.5 font-mono">
                <div className="text-cyan-300">📖 {stats.wBook} ‼️ {stats.wBrilliant} 🌟 {stats.wGreat}</div>
                <div className="text-emerald-300">✨ {stats.wBest} 👌 {stats.wExcellent} 👍 {stats.wGood}</div>
                <div className="text-rose-400">⚠️ {stats.wInacc} ⚡ {stats.wMistake} ❌ {stats.wBlunder}</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Black Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-indigo-400">
                  {blackAccuracy}%
                </span>
              </div>
              <div className="text-right text-[11px] space-y-0.5 font-mono">
                <div className="text-cyan-300">📖 {stats.bBook} ‼️ {stats.bBrilliant} 🌟 {stats.bGreat}</div>
                <div className="text-emerald-300">✨ {stats.bBest} 👌 {stats.bExcellent} 👍 {stats.bGood}</div>
                <div className="text-rose-400">⚠️ {stats.bInacc} ⚡ {stats.bMistake} ❌ {stats.bBlunder}</div>
              </div>
            </div>
          </div>

          {/* Move Navigation Controls */}
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

          {/* Active Move Detail Cards */}
          {activeMove ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {PIECE_SYMBOLS[activeMove.piece] || '♟'}
                  </span>
                  <div>
                    <h2 className="text-base font-black font-mono text-white flex items-center gap-2">
                      <span>Move {activeMove.moveNumber}: {activeMove.san}</span>
                      <Badge type={activeMove.classification}>{activeMove.classification}</Badge>
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">
                      Played by {activeMove.color === 'w' ? 'White' : 'Black'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Position Eval
                  </span>
                  <span className="text-base font-bold font-mono text-cyan-400">
                    {activeMove.evalCpAfter >= 0 ? `+${(activeMove.evalCpAfter / 100).toFixed(2)}` : (activeMove.evalCpAfter / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Win Drop & Win Percentage Grid (Formulas 2 & 3) */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Win % Before</span>
                  <span className="text-sm font-bold text-slate-200">{activeMove.winPercentageBefore}%</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Win % After</span>
                  <span className="text-sm font-bold text-slate-200">{activeMove.winPercentageAfter}%</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-rose-400 font-bold uppercase block flex items-center justify-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Win Drop
                  </span>
                  <span className={`text-sm font-black ${activeMove.winDrop > 10 ? 'text-rose-400' : activeMove.winDrop > 2 ? 'text-amber-300' : 'text-emerald-400'}`}>
                    {activeMove.winDrop}%
                  </span>
                </div>
              </div>

              {/* Engine Recommendation Card */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Stockfish Best Move Recommendation
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Green Arrow ({activeMove.bestMoveFrom} ➔ {activeMove.bestMoveTo})
                  </span>
                </div>

                <div className="text-lg font-black font-mono text-emerald-300">
                  {activeMove.bestMoveSan || activeMove.san}
                </div>

                {activeMove.pv && (
                  <div className="pt-2 border-t border-emerald-500/20 text-xs font-mono text-slate-300 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                      Principal Variation (PV Line):
                    </span>
                    <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 leading-relaxed font-mono">
                      {activeMove.pv}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 font-mono space-y-2">
              <Sparkles className="w-6 h-6 text-emerald-400 mx-auto" />
              <p>Step through moves to view Win Percentage, Win Drop %, Stockfish PV lines, and quality tags.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
