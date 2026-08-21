import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import {
  Globe,
  Swords,
  Clock,
  Flame,
  Zap,
  Sliders,
  Award,
  Bot,
  Loader2,
  XCircle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import { soundFx } from '../../utils/sound';
import type { PlayerColor } from '../../types/chess';
import type { TimeControlCategory, TimeControlConfig } from './PreGameModal';
import type { MatchmakingResponse } from '../../types/multiplayer';

interface PlayMultiplayerOnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  userElo: number;
  userName: string;
  onStartOnlineGame: (
    roomId: string,
    myPlayerId: string,
    myColor: PlayerColor,
    myName: string,
    timeMinutes: number
  ) => void;
  onFallbackToBot: (
    elo: number,
    userColor: PlayerColor,
    timeConfig: TimeControlConfig
  ) => void;
}

export const PlayMultiplayerOnlineModal: React.FC<PlayMultiplayerOnlineModalProps> = ({
  isOpen,
  onClose,
  userElo,
  userName,
  onStartOnlineGame,
  onFallbackToBot,
}) => {
  // Config states
  const [category, setCategory] = useState<TimeControlCategory>('rapid');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);
  const [selectedIncrement, setSelectedIncrement] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrementSecs, setCustomIncrementSecs] = useState<number>(5);
  const [chosenSide, setChosenSide] = useState<'white' | 'black' | 'random'>('random');

  // Matchmaking search states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(20);
  const [searchStatus, setSearchStatus] = useState<'searching' | 'matched' | 'bot_fallback'>('searching');
  const [matchedOpponent, setMatchedOpponent] = useState<{ name: string; elo: number } | null>(null);

  const countdownIntervalRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const playerIdRef = useRef<string>('');

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      cleanupSearch();
    } else {
      setIsSearching(false);
      setCountdown(20);
      setSearchStatus('searching');
      setMatchedOpponent(null);
    }
  }, [isOpen]);

  const cleanupSearch = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    wsService.unsubscribeFromMatchmaking();
    if (playerIdRef.current) {
      api.cancelMatchmaking(playerIdRef.current).catch(() => {});
    }
    setIsSearching(false);
  };

  const handleCategorySelect = (cat: TimeControlCategory) => {
    setCategory(cat);
    if (cat === 'rapid') {
      setSelectedMinutes(10);
      setSelectedIncrement(0);
    } else if (cat === 'blitz') {
      setSelectedMinutes(3);
      setSelectedIncrement(0);
    } else if (cat === 'bullet') {
      setSelectedMinutes(1);
      setSelectedIncrement(0);
    }
  };

  const getEffectiveMinutes = () => {
    return category === 'custom' ? customMinutes : selectedMinutes;
  };

  const getEffectiveIncrement = () => {
    return category === 'custom' ? customIncrementSecs : selectedIncrement;
  };

  const getEffectiveColor = (): PlayerColor => {
    if (chosenSide === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black';
    }
    return chosenSide;
  };

  const handleCancelSearch = () => {
    cleanupSearch();
    setCountdown(20);
    setSearchStatus('searching');
  };

  const handleStartPlayOnline = async () => {
    const effMinutes = getEffectiveMinutes();
    const effIncrement = getEffectiveIncrement();
    const generatedPlayerId = 'P-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    playerIdRef.current = generatedPlayerId;

    setIsSearching(true);
    setCountdown(20);
    setSearchStatus('searching');
    setMatchedOpponent(null);

    // 1. Connect WebSocket and subscribe to matchmaking personal topic
    try {
      await wsService.connect();
      wsService.subscribeToMatchmaking(generatedPlayerId, (data: MatchmakingResponse) => {
        if (data.status === 'MATCHED' && data.roomId) {
          handleMatchFound(data, effMinutes);
        }
      });
    } catch (e) {
      console.warn('WebSocket matchmaking connect error:', e);
    }

    // 2. Join matchmaking pool on backend
    try {
      const resp = await api.joinMatchmaking({
        playerId: generatedPlayerId,
        playerName: userName || 'Grandmaster',
        elo: userElo || 1500,
        timeControlMinutes: effMinutes,
        incrementSeconds: effIncrement,
        category,
        preferredColor: chosenSide,
      });

      if (resp.status === 'MATCHED' && resp.roomId) {
        handleMatchFound(resp, effMinutes);
        return;
      }
    } catch (e) {
      console.error('Matchmaking REST join error:', e);
    }

    // 3. Fallback polling check every 1.5s in case WebSocket notification had network lag
    pollingIntervalRef.current = window.setInterval(async () => {
      if (!playerIdRef.current) return;
      try {
        const st = await api.getMatchmakingStatus(playerIdRef.current);
        if (st.status === 'MATCHED' && st.roomId) {
          handleMatchFound(st, effMinutes);
        }
      } catch (e) {}
    }, 1500);

    // 4. Start 20-second countdown timer
    let remaining = 20;
    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        // 20s expired without human match -> Fallback to Bubble Bot at user's exact rating!
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Cancel matchmaking ticket on backend
        if (playerIdRef.current) {
          api.cancelMatchmaking(playerIdRef.current).catch(() => {});
        }

        setSearchStatus('bot_fallback');
        soundFx.playMove();

        setTimeout(() => {
          const finalColor = getEffectiveColor();
          const finalMinutes = getEffectiveMinutes();
          const finalIncrement = getEffectiveIncrement();

          onFallbackToBot(userElo || 1500, finalColor, {
            category,
            initialMinutes: finalMinutes,
            incrementSeconds: finalIncrement,
          });
          onClose();
        }, 1200);
      }
    }, 1000);
  };

  const handleMatchFound = (matchData: MatchmakingResponse, effMinutes: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setSearchStatus('matched');
    setMatchedOpponent({
      name: matchData.opponentName || 'Opponent',
      elo: matchData.opponentElo || userElo || 1500,
    });

    soundFx.playCheck();

    setTimeout(() => {
      onStartOnlineGame(
        matchData.roomId!,
        matchData.playerId || playerIdRef.current,
        (matchData.playerColor as PlayerColor) || 'white',
        userName || 'Grandmaster',
        matchData.timeControlMinutes || effMinutes
      );
      onClose();
    }, 1200);
  };

  const handleModalClose = () => {
    cleanupSearch();
    onClose();
  };

  const effMinutes = getEffectiveMinutes();

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Play Multiplayer Online">
      <div className="space-y-5 text-slate-900">
        {!isSearching ? (
          <>
            {/* Header Hero Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 via-amber-50/70 to-indigo-50 border border-indigo-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-600/20">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-serif-classic">
                      Global Live Matchmaking
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Find real chess players near your level</p>
                </div>
              </div>

              {/* User Rating Display */}
              <div className="text-right flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm">
                <Award className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Your Rating</span>
                  <span className="text-xs font-black text-indigo-900 font-mono">{userElo || 1500} ELO</span>
                </div>
              </div>
            </div>

            {/* Time Control Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Time Control Category</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('rapid')}
                  className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    category === 'rapid'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Rapid</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategorySelect('blitz')}
                  className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    category === 'blitz'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Blitz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategorySelect('bullet')}
                  className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    category === 'bullet'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Bullet</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategorySelect('custom')}
                  className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    category === 'custom'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Category Time Presets or Custom Sliders */}
            {category === 'rapid' && (
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      selectedMinutes === mins
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-400 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            )}

            {category === 'blitz' && (
              <div className="grid grid-cols-2 gap-2">
                {[3, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      selectedMinutes === mins
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-400 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            )}

            {category === 'bullet' && (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      selectedMinutes === mins
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-400 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Minute{mins > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            )}

            {category === 'custom' && (
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-4">
                <Slider
                  label="Time Per Side (Minutes)"
                  min={1}
                  max={60}
                  step={1}
                  value={customMinutes}
                  valueDisplay={`${customMinutes} Min`}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                />

                <Slider
                  label="Increment Per Move (Seconds)"
                  min={0}
                  max={60}
                  step={1}
                  value={customIncrementSecs}
                  valueDisplay={`${customIncrementSecs} Seconds`}
                  onChange={(e) => setCustomIncrementSecs(Number(e.target.value))}
                />
              </div>
            )}

            {/* Side Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Choose Your Side</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setChosenSide('white')}
                  className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    chosenSide === 'white'
                      ? 'bg-white text-slate-900 border-indigo-500 shadow-md scale-[1.02] ring-1 ring-indigo-400'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChosenSide('black')}
                  className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    chosenSide === 'black'
                      ? 'bg-slate-900 text-white border-slate-950 shadow-md scale-[1.02]'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 shadow-sm" />
                  <span>Black</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChosenSide('random')}
                  className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    chosenSide === 'random'
                      ? 'bg-indigo-100 text-indigo-950 border-indigo-400 shadow-md scale-[1.02]'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-slate-900 border border-slate-400 shadow-sm" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* ONLY ONE ACTION BUTTON: Play Online */}
            <div className="pt-2">
              <Button
                variant="accent"
                className="w-full py-3.5 font-black rounded-2xl text-base shadow-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleStartPlayOnline}
              >
                <Swords className="w-5 h-5 fill-current" />
                <span>Play Online</span>
              </Button>
              <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
                Auto-finds players near {userElo || 1500} ELO • 20s Bot fallback guarantee
              </p>
            </div>
          </>
        ) : (
          /* Matchmaking In-Progress Search Screen */
          <div className="py-6 px-4 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Status 1: Active Searching Radar */}
            {searchStatus === 'searching' && (
              <>
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  {/* Concentric pulsing radar rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping duration-1000" />
                  <div className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-indigo-50 border border-indigo-200/80" />

                  {/* Central Radar Core with Countdown */}
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black font-mono text-indigo-700 tracking-tight">
                      {countdown}s
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      Remaining
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 font-serif-classic">
                    Finding Opponents of Your Level...
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Searching the global matchmaking pool for a player near{' '}
                    <span className="font-bold text-indigo-900 font-mono">{userElo || 1500} ELO</span> (
                    {effMinutes} min {category}).
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-xs font-semibold text-indigo-950 w-fit mx-auto shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Connecting to online queue...</span>
                </div>

                {/* Cancel Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCancelSearch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Matchmaking</span>
                  </button>
                </div>
              </>
            )}

            {/* Status 2: Real Opponent Matched */}
            {searchStatus === 'matched' && (
              <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border border-emerald-300">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-900 font-serif-classic">
                    Opponent Found!
                  </h3>
                  <p className="text-xs text-slate-600">Connecting to live battle...</p>
                </div>

                {matchedOpponent && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-xs mx-auto flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5 text-left">
                      <UserCheck className="w-6 h-6 text-emerald-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{matchedOpponent.name}</span>
                        <span className="text-[10px] font-mono text-emerald-800 font-bold">{matchedOpponent.elo} ELO</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      MATCHED
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status 3: 20s Timeout -> Bubble Bot Fallback */}
            {searchStatus === 'bot_fallback' && (
              <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 border border-amber-300">
                  <Bot className="w-10 h-10 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-serif-classic">
                    Matching with Bubble Bot
                  </h3>
                  <p className="text-xs text-slate-600">
                    No live opponents available right now. Launching AI matched at your exact skill level!
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl max-w-xs mx-auto flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 text-left">
                    <Bot className="w-6 h-6 text-amber-700" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Bubble Bot</span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold">{userElo || 1500} ELO</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                    BALANCED
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
