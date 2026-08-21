import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import confetti from 'canvas-confetti';
import type {
  BoardTheme,
  PlayerColor,
  GameStatusDTO,
  MoveLogItem,
} from './types/chess';
import type { ChatMessage, MultiplayerMove, GameRoom } from './types/multiplayer';
import { api } from './services/api';
import { wsService } from './services/websocket';
import { soundFx } from './utils/sound';
import { useChessClock } from './hooks/useChessClock';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WelcomePage } from './components/layout/WelcomePage';
import { PreGameModal } from './components/chess/PreGameModal';
import type { TimeControlConfig } from './components/chess/PreGameModal';
import { PreGame1v1Modal } from './components/chess/PreGame1v1Modal';
import { PlayMultiplayerOnlineModal } from './components/chess/PlayMultiplayerOnlineModal';
import { ChessBoardContainer } from './components/chess/ChessBoardContainer';
import { EvaluationBar } from './components/chess/EvaluationBar';
import { MoveHistoryLog } from './components/chess/MoveHistoryLog';
import { EngineStatsPanel } from './components/chess/EngineStatsPanel';
import { PlayerCard } from './components/chess/PlayerCard';
import { GameControls } from './components/chess/GameControls';
import { ChatPanel } from './components/chat/ChatPanel';
import { AnalyzeGameSection } from './components/chess/AnalyzeGameSection';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Home, BarChart2, Copy, RotateCcw, Check } from 'lucide-react';

import type { User } from './types/auth';
import { authApi } from './services/authApi';
import { AuthPage } from './components/auth/AuthPage';
import { SkillSelectionPage } from './components/auth/SkillSelectionPage';

type ViewMode = 'WELCOME' | 'GAME' | 'ANALYZE';
type GameMode = 'BUBBLE_BOT' | 'LOCAL_1V1' | 'ONLINE_1V1';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isSavingSkill, setIsSavingSkill] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<ViewMode>('WELCOME');
  const [gameMode, setGameMode] = useState<GameMode>('BUBBLE_BOT');
  const [analysisPgn, setAnalysisPgn] = useState<string>('');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    soundFx.setEnabled(next);
  };

  const [game, setGame] = useState(new Chess());
  const [theme, setTheme] = useState<BoardTheme>('wood');
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('white');
  const [userColor, setUserColor] = useState<PlayerColor>('white');
  const [elo, setElo] = useState<number>(1500);
  const [showLegalMoves, setShowLegalMoves] = useState<boolean>(true);

  // Time control settings
  const [gameMinutes, setGameMinutes] = useState<number>(10);

  // Multiplayer Online State
  const [roomId, setRoomId] = useState<string>('');
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const myPlayerIdRef = useRef<string>('');
  const [myName, setMyName] = useState<string>('You');
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [urlRoomId, setUrlRoomId] = useState<string>('');

  // Keep myPlayerIdRef synced
  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  // Window unload listener to signal departure to opponent
  useEffect(() => {
    if (gameMode === 'ONLINE_1V1' && roomId && myPlayerId) {
      const handleUnload = () => {
        wsService.sendLeaveRoom(roomId, myPlayerId);
        api.leaveRoom(roomId, myPlayerId);
      };
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('pagehide', handleUnload);
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('pagehide', handleUnload);
      };
    }
  }, [gameMode, roomId, myPlayerId]);

  // Engine & Captured Pieces state
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(true);
  const [isEngineThinking, setIsEngineThinking] = useState<boolean>(false);
  const [engineStats, setEngineStats] = useState<GameStatusDTO | null>(null);

  const [whiteCaptured, setWhiteCaptured] = useState<string[]>([]);
  const [blackCaptured, setBlackCaptured] = useState<string[]>([]);

  // Move history
  const [moveHistory, setMoveHistory] = useState<MoveLogItem[]>([]);
  const movesSanRef = useRef<string[]>([]);
  const fenListRef = useRef<string[]>([new Chess().fen()]);

  // Modals state
  const [isPreGameBotOpen, setIsPreGameBotOpen] = useState<boolean>(false);
  const [isPreGame1v1Open, setIsPreGame1v1Open] = useState<boolean>(false);
  const [isPlayMultiplayerOnlineOpen, setIsPlayMultiplayerOnlineOpen] = useState<boolean>(false);

  const [gameOverTitle, setGameOverTitle] = useState<string | null>(null);
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [pgnCopied, setPgnCopied] = useState<boolean>(false);

  const [isPgnOpen, setIsPgnOpen] = useState<boolean>(false);
  const [pgnInput, setPgnInput] = useState<string>('');

  // Verify stored auth session on mount
  useEffect(() => {
    authApi
      .getCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          setMyName(user.name);
          if (user.eloRating && user.eloRating > 0) {
            setElo(user.eloRating);
          }
        }
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, []);

  const handleConfirmSkill = async (eloRating: number, skillLevelName: string) => {
    setIsSavingSkill(true);
    const res = await authApi.setSkillLevel(eloRating, skillLevelName);
    setIsSavingSkill(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setElo(eloRating);
      setViewMode('WELCOME');
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setViewMode('WELCOME');
  };

  // Check URL query parameters for ?room=ROOM_ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setUrlRoomId(roomParam);
      setIsPreGame1v1Open(true);
    }
  }, []);

  // Check Engine status on mount
  useEffect(() => {
    api.getEngineStatus()
      .then((st) => setIsEngineRunning(st.running))
      .catch(() => setIsEngineRunning(false));
  }, []);

  // Update engine config on ELO change
  useEffect(() => {
    if (gameMode === 'BUBBLE_BOT') {
      api.configureEngine({ elo }).catch(() => {});
    }
  }, [elo, gameMode]);

  // Increments
  const [incrementSeconds, setIncrementSeconds] = useState<number>(0);

  // Turn Clocks
  const currentTurn: PlayerColor = game.turn() === 'w' ? 'white' : 'black';
  const isGameOver = game.isGameOver() || !!gameOverTitle;

  const handleTimeOut = useCallback((loserColor: PlayerColor) => {
    const winner = loserColor === 'white' ? 'Black' : 'White';
    setGameOverTitle('Time Out!');
    setGameOverMessage(`${winner} won on Time (${loserColor.toUpperCase()} ran out of time).`);
    soundFx.playGameOver();
  }, []);

  const { formattedWhiteTime, formattedBlackTime, resetClock, addIncrement } = useChessClock({
    initialMinutes: gameMinutes,
    activeColor: (viewMode === 'GAME' && !isGameOver) ? currentTurn : null,
    isGameOver,
    onTimeOut: handleTimeOut,
  });

  // Generate real standard PGN string from played moves
  const generateRealPgn = () => {
    if (movesSanRef.current.length === 0) return '1. e4';
    let pgnStr = '';
    for (let i = 0; i < movesSanRef.current.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = movesSanRef.current[i];
      const blackMove = movesSanRef.current[i + 1] ? ` ${movesSanRef.current[i + 1]}` : '';
      pgnStr += `${moveNum}. ${whiteMove}${blackMove} `;
    }
    return pgnStr.trim();
  };

  // Calculate captured pieces
  const calculateCapturedPieces = (g: Chess) => {
    const currentPieces: Record<string, number> = {
      p: 0, r: 0, n: 0, b: 0, q: 0,
      P: 0, R: 0, N: 0, B: 0, Q: 0
    };
    const board = g.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
          currentPieces[char] = (currentPieces[char] || 0) + 1;
        }
      }
    }

    const pieceSymbols: Record<string, string> = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛',
      P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕'
    };

    const initialCounts: Record<string, number> = {
      P: 8, R: 2, N: 2, B: 2, Q: 1,
      p: 8, r: 2, n: 2, b: 2, q: 1
    };

    const whiteCaps: string[] = [];
    const blackCaps: string[] = [];

    for (const [p, count] of Object.entries(initialCounts)) {
      const remaining = currentPieces[p] || 0;
      const capturedCount = Math.max(0, count - remaining);
      for (let i = 0; i < capturedCount; i++) {
        if (p === p.toUpperCase()) {
          blackCaps.push(pieceSymbols[p]);
        } else {
          whiteCaps.push(pieceSymbols[p]);
        }
      }
    }

    setWhiteCaptured(whiteCaps);
    setBlackCaptured(blackCaps);
  };

  // Helper to persist rating update and win count to PostgreSQL database
  const recordMatchEnd = useCallback((isWin: boolean, isDraw: boolean = false) => {
    if (!currentUser) return;
    const currentRating = currentUser.eloRating || elo || 1500;
    let delta = 0;
    if (!isDraw) {
      delta = isWin ? 15 : -15;
    }
    const newRating = Math.max(100, currentRating + delta);

    authApi.updateGameStats(newRating, isWin).then((res) => {
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setElo(res.user.eloRating || newRating);
      }
    }).catch(() => {});
  }, [currentUser, elo]);

  // Check Game Over conditions after every move
  const checkGameOverState = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      setGameOverTitle('Checkmate!');
      setGameOverMessage(`${winner} won by Checkmate!`);
      soundFx.playGameOver();

      const isWin = (g.turn() === 'w' && userColor === 'black') || (g.turn() === 'b' && userColor === 'white');
      recordMatchEnd(isWin, false);

      // Dual-cannon celebratory fireworks
      try {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };
        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, { spread: 26, startVelocity: 55, colors: ['#06b6d4', '#6366f1', '#a855f7'] });
        fire(0.2, { spread: 60, colors: ['#10b981', '#38bdf8', '#fbbf24'] });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else if (g.isDraw()) {
      let reason = 'Draw';
      if (g.isStalemate()) reason = 'Draw by Stalemate';
      else if (g.isThreefoldRepetition()) reason = 'Draw by Threefold Repetition';
      else if (g.isInsufficientMaterial()) reason = 'Draw by Insufficient Material';

      setGameOverTitle('Draw!');
      setGameOverMessage(reason);
      soundFx.playGameOver();
      recordMatchEnd(false, true);
    }
  }, [userColor, recordMatchEnd]);

  // Fetch Stockfish evaluation for current FEN to update Eval Bar dynamically (Bubble Bot mode only)
  const updateEvaluation = useCallback(async (currentFen: string) => {
    if (gameMode !== 'BUBBLE_BOT') return;
    try {
      const resp = await api.getBestMove({ fen: currentFen, elo });
      setEngineStats(resp);
    } catch (e) {
      console.error('Eval update failed:', e);
    }
  }, [elo, gameMode]);

  // Trigger Stockfish AI move
  const requestAiMove = useCallback(async (currentFen: string) => {
    if (isEngineThinking || game.isGameOver()) return;
    setIsEngineThinking(true);

    try {
      const resp = await api.getBestMove({
        fen: currentFen,
        elo: elo,
      });

      setEngineStats(resp);

      if (resp.bestMove) {
        setTimeout(() => {
          setGame((prevGame) => {
            const nextGame = new Chess(prevGame.fen());
            try {
              const moveRes = nextGame.move(resp.bestMove);
              if (moveRes) {
                if (moveRes.captured) soundFx.playCapture();
                else if (nextGame.inCheck()) soundFx.playCheck();
                else soundFx.playMove();

                movesSanRef.current.push(moveRes.san);
                fenListRef.current.push(nextGame.fen());

                // Apply increment if configured
                if (incrementSeconds > 0) {
                  addIncrement(moveRes.color === 'w' ? 'white' : 'black', incrementSeconds);
                }

                // Update move log
                setMoveHistory((prevHistory) => {
                  const newHist = [...prevHistory];
                  if (moveRes.color === 'w') {
                    newHist.push({
                      moveNumber: newHist.length + 1,
                      white: moveRes.san,
                      whiteFen: nextGame.fen(),
                    });
                  } else {
                    if (newHist.length > 0) {
                      newHist[newHist.length - 1].black = moveRes.san;
                      newHist[newHist.length - 1].blackFen = nextGame.fen();
                    }
                  }
                  return newHist;
                });

                calculateCapturedPieces(nextGame);
                checkGameOverState(nextGame);
              }
            } catch (err) {
              console.error('Error applying AI move:', err);
            }
            return nextGame;
          });
          setIsEngineThinking(false);
        }, 300);
      }
    } catch (e) {
      console.error('Stockfish API error:', e);
      setIsEngineThinking(false);
    }
  }, [elo, isEngineThinking, game, checkGameOverState, incrementSeconds, addIncrement]);

  // Handle Player move
  const handleMakeMove = (
    sourceSquare: Square,
    targetSquare: Square,
    promotionPiece: string = 'q'
  ): boolean => {
    if (isGameOver || isEngineThinking) return false;

    if (gameMode !== 'LOCAL_1V1' && currentTurn !== userColor) {
      return false;
    }

    const nextGame = new Chess(game.fen());
    try {
      const moveRes = nextGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotionPiece,
      });

      if (!moveRes) return false;

      // Play Sound
      if (moveRes.captured) soundFx.playCapture();
      else if (nextGame.inCheck()) soundFx.playCheck();
      else soundFx.playMove();

      setGame(nextGame);
      movesSanRef.current.push(moveRes.san);
      fenListRef.current.push(nextGame.fen());

      // Apply increment to player who just moved
      if (incrementSeconds > 0) {
        addIncrement(moveRes.color === 'w' ? 'white' : 'black', incrementSeconds);
      }

      // Update Move Log
      setMoveHistory((prevHistory) => {
        const newHist = [...prevHistory];
        if (moveRes.color === 'w') {
          newHist.push({
            moveNumber: newHist.length + 1,
            white: moveRes.san,
            whiteFen: nextGame.fen(),
          });
        } else {
          if (newHist.length > 0) {
            newHist[newHist.length - 1].black = moveRes.san;
            newHist[newHist.length - 1].blackFen = nextGame.fen();
          }
        }
        return newHist;
      });

      calculateCapturedPieces(nextGame);
      checkGameOverState(nextGame);

      // In Local 1v1 mode, flip board to active player's turn for seamless pass and play
      if (gameMode === 'LOCAL_1V1') {
        const nextTurn = nextGame.turn() === 'w' ? 'white' : 'black';
        setBoardOrientation(nextTurn);
      }

      // If Online 1v1, publish move over WebSocket
      if (gameMode === 'ONLINE_1V1' && roomId) {
        wsService.sendMove({
          roomId,
          playerId: myPlayerId,
          from: sourceSquare,
          to: targetSquare,
          san: moveRes.san,
          fen: nextGame.fen(),
        });
      }

      // If Bubble Bot mode, trigger AI response
      if (gameMode === 'BUBBLE_BOT' && !nextGame.isGameOver()) {
        requestAiMove(nextGame.fen());
      }

      return true;
    } catch {
      return false;
    }
  };

  // Start match vs Bubble Bot
  const handleStartBubbleBotMatch = (
    selectedElo: number,
    selectedColor: PlayerColor,
    timeConfig: TimeControlConfig
  ) => {
    const freshGame = new Chess();
    setGame(freshGame);
    setGameMode('BUBBLE_BOT');
    setElo(selectedElo);
    setUserColor(selectedColor);
    setBoardOrientation(selectedColor);
    setGameMinutes(timeConfig.initialMinutes);
    setIncrementSeconds(timeConfig.incrementSeconds || 0);

    setMoveHistory([]);
    movesSanRef.current = [];
    fenListRef.current = [freshGame.fen()];
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setGameOverTitle(null);
    setGameOverMessage(null);
    setEngineStats(null);
    resetClock(timeConfig.initialMinutes);
    setViewMode('GAME');

    // Initial evaluation
    updateEvaluation(freshGame.fen());

    // If user is Black, Bubble Bot (White) moves first
    if (selectedColor === 'black') {
      setTimeout(() => {
        requestAiMove(freshGame.fen());
      }, 400);
    }
  };


  // Start Local 1v1 (Pass & Play)
  const handleStartLocal1v1 = (selectedColor: PlayerColor, timeMinutes: number = 10) => {
    const freshGame = new Chess();
    setGame(freshGame);
    setGameMode('LOCAL_1V1');
    setUserColor(selectedColor);
    setBoardOrientation(selectedColor);
    setGameMinutes(timeMinutes);

    setMoveHistory([]);
    movesSanRef.current = [];
    fenListRef.current = [freshGame.fen()];
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setGameOverTitle(null);
    setGameOverMessage(null);
    setEngineStats(null);
    resetClock(timeMinutes);
    setViewMode('GAME');
  };

  // Internal helper to perform actual board rewind (Bubble Bot mode only)
  const handlePerformUndo = useCallback(() => {
    if (movesSanRef.current.length === 0 || gameMode !== 'BUBBLE_BOT') return;

    const newSanList = [...movesSanRef.current];
    if (newSanList.length >= 2 && currentTurn === userColor) {
      newSanList.pop();
      newSanList.pop();
    } else if (newSanList.length > 0) {
      newSanList.pop();
    }

    const nextGame = new Chess();
    const newMoveHistory: MoveLogItem[] = [];
    const newFenList: string[] = [nextGame.fen()];

    newSanList.forEach((san) => {
      const moveRes = nextGame.move(san);
      if (moveRes) {
        newFenList.push(nextGame.fen());
        if (moveRes.color === 'w') {
          newMoveHistory.push({
            moveNumber: newMoveHistory.length + 1,
            white: moveRes.san,
            whiteFen: nextGame.fen(),
          });
        } else {
          if (newMoveHistory.length > 0) {
            newMoveHistory[newMoveHistory.length - 1].black = moveRes.san;
            newMoveHistory[newMoveHistory.length - 1].blackFen = nextGame.fen();
          }
        }
      }
    });

    setGame(nextGame);
    movesSanRef.current = newSanList;
    fenListRef.current = newFenList;
    setMoveHistory(newMoveHistory);
    calculateCapturedPieces(nextGame);
    setGameOverTitle(null);
    setGameOverMessage(null);
    updateEvaluation(nextGame.fen());
  }, [currentTurn, gameMode, userColor, updateEvaluation]);

  // Start Online 1v1
  const handleStartOnline1v1 = (
    rId: string,
    pId: string,
    myColor: PlayerColor,
    name: string,
    timeMinutes: number = 10
  ) => {
    const freshGame = new Chess();
    setGame(freshGame);
    setGameMode('ONLINE_1V1');
    setRoomId(rId);
    setMyPlayerId(pId);
    myPlayerIdRef.current = pId;
    setMyName(name);
    setUserColor(myColor);
    setBoardOrientation(myColor);
    setGameMinutes(timeMinutes);
    setChatMessages([]);

    setMoveHistory([]);
    movesSanRef.current = [];
    fenListRef.current = [freshGame.fen()];
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setGameOverTitle(null);
    setGameOverMessage(null);
    setEngineStats(null);
    resetClock(timeMinutes);
    setViewMode('GAME');

    // Connect WebSockets
    wsService.connect().then(() => {
      // Register session for server-side SessionDisconnectEvent tracking
      wsService.registerPlayerSession(rId, pId);

      // Subscribe to room updates / moves & resignation / departure events
      wsService.subscribeToRoom(rId, (data: any) => {
        const currentPId = myPlayerIdRef.current || pId;

        if (data.type === 'PLAYER_LEFT') {
          if (data.leavingPlayerId !== currentPId) {
            setGameOverTitle('GAME ABORTED');
            setGameOverMessage('Opponent left the website');
            soundFx.playGameOver();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        } else if (data.type === 'RESIGNATION') {
          const isMeResigning = data.resigningPlayerId === currentPId;
          const winner = isMeResigning ? 'Opponent' : 'You';
          const loser = isMeResigning ? 'You' : 'Opponent';

          setGameOverTitle('Resignation');
          setGameOverMessage(`${winner} won by Resignation (${loser} resigned).`);
          soundFx.playGameOver();
          if (!isMeResigning) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        } else if ('san' in data && data.san) {
          const moveData = data as MultiplayerMove;
          if (moveData.playerId !== currentPId) {
            setGame((prevGame) => {
              const nextGame = new Chess(prevGame.fen());
              try {
                const moveRes = nextGame.move(moveData.san as string);
                if (moveRes) {
                  if (moveRes.captured) soundFx.playCapture();
                  else if (nextGame.inCheck()) soundFx.playCheck();
                  else soundFx.playMove();

                  movesSanRef.current.push(moveRes.san);
                  fenListRef.current.push(nextGame.fen());

                  setMoveHistory((prevHistory) => {
                    const newHist = [...prevHistory];
                    if (moveRes.color === 'w') {
                      newHist.push({
                        moveNumber: newHist.length + 1,
                        white: moveRes.san,
                        whiteFen: nextGame.fen(),
                      });
                    } else {
                      if (newHist.length > 0) {
                        newHist[newHist.length - 1].black = moveRes.san;
                        newHist[newHist.length - 1].blackFen = nextGame.fen();
                      }
                    }
                    return newHist;
                  });

                  calculateCapturedPieces(nextGame);
                  checkGameOverState(nextGame);
                }
              } catch (e) {
                console.error('Error handling WebSocket move:', e);
              }
              return nextGame;
            });
          }
        } else if ('whitePlayerId' in data) {
          const roomObj = data as GameRoom;
          if (currentPId === roomObj.whitePlayerId && roomObj.blackPlayerName) {
            setOpponentName(roomObj.blackPlayerName);
          } else if (currentPId === roomObj.blackPlayerId && roomObj.whitePlayerName) {
            setOpponentName(roomObj.whitePlayerName);
          }
        }
      });

      // Subscribe to live room chat
      wsService.subscribeToChat(rId, (chat) => {
        setChatMessages((prev) => [...prev, chat]);
      });
    });
  };

  // Send Live Chat Message
  const handleSendChatMessage = (text: string) => {
    if (!roomId) return;
    const msg: ChatMessage = {
      roomId,
      senderId: myPlayerIdRef.current || myPlayerId,
      senderName: myName,
      message: text,
      timestamp: String(Date.now()),
    };
    wsService.sendChat(msg);
  };

  // User clicks Takeback (Undo) Button (Bubble Bot mode only)
  const handleUndoClick = () => {
    if (gameMode !== 'BUBBLE_BOT') return;
    handlePerformUndo();
  };

  // Resign Match
  const handleResign = () => {
    if (gameMode === 'ONLINE_1V1' && roomId) {
      wsService.sendResign(roomId, myPlayerIdRef.current || myPlayerId);
    } else {
      const loser = userColor === 'white' ? 'White' : 'Black';
      const winner = userColor === 'white' ? 'Black' : 'White';
      setGameOverTitle('Resignation');
      setGameOverMessage(`${winner} won by Resignation (${loser} resigned).`);
      soundFx.playGameOver();
    }
  };

  // Redirect user to Analyze Game section view with match PGN
  const handleRedirectToAnalysis = (customPgn?: string) => {
    const pgnToUse = customPgn || generateRealPgn();
    setAnalysisPgn(pgnToUse);
    setGameOverTitle(null);
    setViewMode('ANALYZE');
  };

  // Run Game Analysis
  const handleAnalyze = async () => {
    handleRedirectToAnalysis();
  };

  // Copy PGN to Clipboard
  const handleCopyPgn = () => {
    const realPgn = generateRealPgn();
    navigator.clipboard.writeText(realPgn);
    setPgnCopied(true);
    setTimeout(() => setPgnCopied(false), 2500);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-xs font-mono tracking-widest uppercase animate-pulse font-bold">
          Authenticating Engine Session...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setMyName(user.name);
          if (user.eloRating && user.eloRating > 0) {
            setElo(user.eloRating);
            setViewMode('WELCOME');
          }
        }}
      />
    );
  }

  // If user has not chosen their skill level yet (e.g. newly signed up or Google OAuth user)
  if (!currentUser.skillLevelSelected || currentUser.eloRating === 0) {
    return (
      <SkillSelectionPage
        user={currentUser}
        onConfirmSkill={handleConfirmSkill}
        isLoading={isSavingSkill}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        theme={theme}
        onThemeChange={setTheme}
        isEngineRunning={isEngineRunning}
        onGoHome={() => setViewMode('WELCOME')}
        user={currentUser}
        onLogout={handleLogout}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main View Container */}
      {viewMode === 'WELCOME' ? (
        <WelcomePage
          onSelectBubbleBot={() => setIsPreGameBotOpen(true)}
          onSelectMultiplayerOnline={() => setIsPlayMultiplayerOnlineOpen(true)}
          onSelect1v1={() => setIsPreGame1v1Open(true)}
          onSelectAnalyze={() => {
            setAnalysisPgn('');
            setViewMode('ANALYZE');
          }}
          user={currentUser}
        />
      ) : viewMode === 'ANALYZE' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4">
          <AnalyzeGameSection
            initialPgn={analysisPgn}
            onBackToWelcome={() => setViewMode('WELCOME')}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Chessboard Container & Captured Pieces */}
          <section className="lg:col-span-7 flex flex-col items-center gap-4">
            {/* Top Opponent Player Card (Left Corner Captured Pieces) */}
            <PlayerCard
              name={
                gameMode === 'BUBBLE_BOT'
                  ? `Bubble Bot (${elo} ELO)`
                  : gameMode === 'ONLINE_1V1'
                  ? opponentName
                  : `Player 2 (${boardOrientation === 'white' ? 'Black' : 'White'})`
              }
              color={boardOrientation === 'white' ? 'black' : 'white'}
              isAi={gameMode === 'BUBBLE_BOT'}
              isActive={currentTurn === (boardOrientation === 'white' ? 'black' : 'white')}
              timeFormatted={boardOrientation === 'white' ? formattedBlackTime : formattedWhiteTime}
              capturedPieces={boardOrientation === 'white' ? blackCaptured : whiteCaptured}
            />

            {/* Board + (Eval Bar only in Bubble Bot mode) */}
            <div className="flex items-center gap-4">
              {gameMode === 'BUBBLE_BOT' && (
                <EvaluationBar
                  scoreType={engineStats?.scoreType ?? 'cp'}
                  scoreValue={engineStats?.scoreValue ?? 30}
                  isFlipped={boardOrientation === 'black'}
                />
              )}

              <ChessBoardContainer
                game={game}
                boardOrientation={boardOrientation}
                onMakeMove={handleMakeMove}
                theme={theme}
                isInteractive={!isGameOver && !isEngineThinking && (gameMode === 'LOCAL_1V1' || currentTurn === userColor)}
                showLegalMoves={showLegalMoves}
              />
            </div>

            {/* Bottom User Player Card (Left Corner Captured Pieces) */}
            <PlayerCard
              name={
                gameMode === 'ONLINE_1V1'
                  ? `${myName} (You)`
                  : gameMode === 'LOCAL_1V1'
                  ? `Player 1 (${userColor.toUpperCase()})`
                  : `You (${userColor.toUpperCase()})`
              }
              color={boardOrientation}
              isActive={currentTurn === boardOrientation}
              timeFormatted={boardOrientation === 'white' ? formattedWhiteTime : formattedBlackTime}
              capturedPieces={boardOrientation === 'white' ? whiteCaptured : blackCaptured}
            />
          </section>

          {/* RIGHT SIDE: Controls, Engine Stats / Chat Panel & Move Logs */}
          <aside className="lg:col-span-5 space-y-4">
            <GameControls
              onBackToWelcome={() => setViewMode('WELCOME')}
              onUndoMove={handleUndoClick}
              onFlipBoard={() => setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
              onResign={handleResign}
              onOpenAnalysis={handleAnalyze}
              onOpenPgnModal={() => setIsPgnOpen(true)}
              showLegalMoves={showLegalMoves}
              onToggleLegalMoves={() => setShowLegalMoves((prev) => !prev)}
              canUndo={gameMode === 'BUBBLE_BOT' && movesSanRef.current.length > 0 && !isEngineThinking}
            />

            {/* Engine Stats Panel in VS AI mode, or Live Chat Panel in Online 1v1 mode */}
            {gameMode === 'BUBBLE_BOT' ? (
              <EngineStatsPanel
                stats={engineStats}
                elo={elo}
                onEloChange={setElo}
                isEngineThinking={isEngineThinking}
              />
            ) : gameMode === 'ONLINE_1V1' ? (
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                myPlayerId={myPlayerIdRef.current || myPlayerId}
              />
            ) : null}

            <MoveHistoryLog moves={moveHistory} />
          </aside>
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Pre-Game Bubble Bot Modal */}
      <PreGameModal
        isOpen={isPreGameBotOpen}
        onClose={() => setIsPreGameBotOpen(false)}
        onStartGame={handleStartBubbleBotMatch}
        initialElo={elo}
      />

      {/* Pre-Game 1v1 Modal (Local PC & Online Multiple Devices) */}
      <PreGame1v1Modal
        isOpen={isPreGame1v1Open}
        onClose={() => setIsPreGame1v1Open(false)}
        onStartLocalGame={handleStartLocal1v1}
        onStartOnlineGame={handleStartOnline1v1}
        initialRoomId={urlRoomId}
      />

      {/* Play Multiplayer Online Modal (Global Matchmaking with 20s Bot Fallback) */}
      <PlayMultiplayerOnlineModal
        isOpen={isPlayMultiplayerOnlineOpen}
        onClose={() => setIsPlayMultiplayerOnlineOpen(false)}
        userElo={currentUser?.eloRating || elo || 1500}
        userName={currentUser?.name || myName || 'Grandmaster'}
        onStartOnlineGame={handleStartOnline1v1}
        onFallbackToBot={handleStartBubbleBotMatch}
      />

      {/* Game Over Victory Reason Modal with 4 Working Buttons */}
      <Modal
        isOpen={!!gameOverTitle}
        onClose={() => setGameOverTitle(null)}
        title={gameOverTitle || 'Game Over'}
        className="max-w-md"
        closeOnBackdropClick={false}
        hideCloseButton={true}
      >
        <div className="space-y-6 text-center py-2 text-slate-900">
          <p className="text-xl font-black text-amber-800 font-serif-classic">{gameOverMessage}</p>

          {/* 4 Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Button 1: Main Menu */}
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 font-bold"
              onClick={() => {
                setGameOverTitle(null);
                setViewMode('WELCOME');
              }}
            >
              <Home className="w-4 h-4 text-amber-700" />
              Main Menu
            </Button>

            {/* Button 2: Analyze Game */}
            <Button
              variant="accent"
              className="w-full flex items-center justify-center gap-2 font-bold"
              onClick={() => {
                setGameOverTitle(null);
                handleAnalyze();
              }}
            >
              <BarChart2 className="w-4 h-4" />
              Analyze Game
            </Button>

            {/* Button 3: Copy PGN */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 font-bold"
              onClick={handleCopyPgn}
            >
              {pgnCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
              {pgnCopied ? 'Copied!' : 'Copy PGN'}
            </Button>

            {/* Button 4: Play Again */}
            <Button
              variant="classic"
              className="w-full flex items-center justify-center gap-2 font-bold shadow-md"
              onClick={() => {
                setGameOverTitle(null);
                if (gameMode === 'BUBBLE_BOT') setIsPreGameBotOpen(true);
                else setIsPreGame1v1Open(true);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        </div>
      </Modal>

      {/* PGN / FEN Utility Modal */}
      <Modal isOpen={isPgnOpen} onClose={() => setIsPgnOpen(false)} title="PGN / FEN Utility">
        <div className="space-y-4 text-slate-900">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Match PGN</label>
            <textarea
              readOnly
              value={generateRealPgn()}
              rows={4}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900 select-all shadow-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Import FEN Position</label>
            <input
              type="text"
              placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 shadow-sm"
            />
          </div>

          <Button
            variant="classic"
            className="w-full font-bold shadow-md"
            onClick={() => {
              try {
                const fresh = new Chess(pgnInput.trim());
                setGame(fresh);
                setIsPgnOpen(false);
              } catch {
                alert('Invalid FEN position string');
              }
            }}
          >
            Load FEN Position
          </Button>
        </div>
      </Modal>
    </div>
  );
}

