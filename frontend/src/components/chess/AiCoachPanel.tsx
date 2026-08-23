import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Loader2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { voiceSynthesizer } from '../../utils/voiceSynthesizer';
import { api } from '../../services/api';
import type { CoachPersona, MoveClassification, AiCoachResponse } from '../../types/chess';

interface AiCoachPanelProps {
  currentMove: {
    moveIndex?: number;
    moveNumber: number;
    color: 'w' | 'b';
    san: string;
    classification: MoveClassification;
    evalCp: number;
    winPercentage: number;
    winDrop: number;
    bestMoveSan?: string;
    pv?: string;
    fen: string;
  } | null;
  allMoves?: Array<{
    moveNumber: number;
    color: 'w' | 'b';
    san: string;
    classification: MoveClassification;
    evalCpAfter: number;
    winPercentageAfter: number;
    winDrop: number;
    bestMoveSan?: string;
    pv?: string;
    fenAfter: string;
  }>;
  preloadedCommentaries?: AiCoachResponse[];
  isAiActive?: boolean;
  isAiLoading?: boolean;
  coachPersona?: CoachPersona;
  autoSpeakDefault?: boolean;
}

const OPENROUTER_STORAGE_KEY = 'chess_openrouter_api_key';
const GROQ_STORAGE_KEY = 'chess_groq_api_key';

export const AiCoachPanel: React.FC<AiCoachPanelProps> = ({
  currentMove,
  preloadedCommentaries,
  isAiActive = false,
  isAiLoading = false,
  coachPersona = 'grandmaster',
  autoSpeakDefault = true,
}) => {
  const [commentary, setCommentary] = useState<string>('');
  const [speechScript, setSpeechScript] = useState<string>('');
  const [tacticalSummary, setTacticalSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Voice States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(autoSpeakDefault);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Custom API Key
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Cache for generated move insights
  const commentaryCache = useRef<Record<string, AiCoachResponse>>({});

  // Load custom key from localStorage on mount
  useEffect(() => {
    localStorage.removeItem(GROQ_STORAGE_KEY);
    const savedKey = localStorage.getItem(OPENROUTER_STORAGE_KEY) || '';
    if (savedKey.startsWith('gsk_')) {
      localStorage.removeItem(OPENROUTER_STORAGE_KEY);
      setCustomApiKey('');
    } else {
      setCustomApiKey(savedKey);
    }
  }, []);

  // Store preloaded commentaries into cache
  useEffect(() => {
    if (!preloadedCommentaries || preloadedCommentaries.length === 0) return;
    preloadedCommentaries.forEach((item) => {
      if (item) {
        if (item.moveNumber && item.color && item.san) {
          const key = `${item.moveNumber}-${item.color}-${item.san}-${coachPersona}`;
          commentaryCache.current[key] = item;
        }
        if (item.moveIndex !== undefined && item.moveIndex !== null) {
          commentaryCache.current[`idx-${item.moveIndex}-${coachPersona}`] = item;
        }
      }
    });

    // If current move is in cache and AI is active, display immediately
    if (currentMove && isAiActive) {
      const activeKey = `${currentMove.moveNumber}-${currentMove.color}-${currentMove.san}-${coachPersona}`;
      const cached =
        commentaryCache.current[activeKey] ||
        (currentMove.moveIndex !== undefined
          ? commentaryCache.current[`idx-${currentMove.moveIndex}-${coachPersona}`]
          : null);
      if (cached) {
        setCommentary(cached.commentary);
        setSpeechScript(cached.speechScript || cached.commentary);
        setTacticalSummary(cached.tacticalSummary || '');
        setIsLoading(false);
      }
    }
  }, [preloadedCommentaries, coachPersona, currentMove, isAiActive]);

  // Subscribe to speech synthesizer state for visual equalizer
  useEffect(() => {
    const unsubscribe = voiceSynthesizer.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      voiceSynthesizer.stop();
    };
  }, []);

  // Fetch / Display AI commentary whenever the selected move changes
  useEffect(() => {
    if (!isAiActive || isAiLoading) {
      voiceSynthesizer.stop();
      return;
    }

    if (!currentMove) {
      setCommentary('Select or navigate to any move in the game to receive live Grandmaster AI commentary.');
      setTacticalSummary('');
      setSpeechScript('');
      voiceSynthesizer.stop();
      return;
    }

    const cacheKey = `${currentMove.moveNumber}-${currentMove.color}-${currentMove.san}-${coachPersona}`;
    const idxKey = currentMove.moveIndex !== undefined ? `idx-${currentMove.moveIndex}-${coachPersona}` : '';

    const cached = commentaryCache.current[cacheKey] || (idxKey ? commentaryCache.current[idxKey] : null);

    if (cached) {
      setCommentary(cached.commentary);
      setSpeechScript(cached.speechScript || cached.commentary);
      setTacticalSummary(cached.tacticalSummary || '');
      setIsLoading(false);

      if (autoSpeak && !isMuted && cached.speechScript) {
        voiceSynthesizer.speak(cached.speechScript, { persona: coachPersona });
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api
      .getAiCoachCommentary({
        moveIndex: currentMove.moveIndex,
        fen: currentMove.fen,
        san: currentMove.san,
        color: currentMove.color,
        moveNumber: currentMove.moveNumber,
        classification: currentMove.classification,
        evalCp: currentMove.evalCp,
        winPercentage: currentMove.winPercentage,
        winDrop: currentMove.winDrop,
        bestMoveSan: currentMove.bestMoveSan,
        pv: currentMove.pv,
        coachPersona: coachPersona,
        customApiKey: customApiKey.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        commentaryCache.current[cacheKey] = res;
        if (idxKey) commentaryCache.current[idxKey] = res;
        setCommentary(res.commentary);
        setSpeechScript(res.speechScript || res.commentary);
        setTacticalSummary(res.tacticalSummary || '');

        if (autoSpeak && !isMuted && (res.speechScript || res.commentary)) {
          voiceSynthesizer.speak(res.speechScript || res.commentary, { persona: coachPersona });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to get AI coach commentary:', err);
        setCommentary('Unable to generate AI commentary from Groq.');
        setSpeechScript('');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMove, coachPersona, customApiKey, autoSpeak, isMuted, isAiActive, isAiLoading]);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      voiceSynthesizer.stop();
    } else {
      const textToSpeak = speechScript || commentary;
      if (textToSpeak) {
        voiceSynthesizer.speak(textToSpeak, { persona: coachPersona });
      }
    }
  };

  return (
    <div className="space-y-3 text-slate-900 animate-in fade-in duration-200">
      {/* Voice Control & Equalizer Soundwave Bar (3rd Image Top Row) */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 shadow-sm">
        {/* Left: Speak / Stop Button & Audio Waveform */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSpeak}
            disabled={!commentary || isLoading || !isAiActive}
            className={`flex items-center gap-1.5 text-xs font-extrabold rounded-xl px-3.5 py-2 shadow-md transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : !isAiActive || !commentary
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Speak Move</span>
              </>
            )}
          </button>

          {/* Animated Audio Equalizer Bars */}
          <div className="flex items-center gap-0.5 h-5 px-2 bg-white/80 rounded-lg border border-indigo-200">
            {[40, 75, 100, 60, 90, 45, 80, 65].map((h, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? 'bg-indigo-600 animate-pulse'
                    : 'bg-slate-300'
                }`}
                style={{
                  height: isSpeaking ? `${Math.max(20, (h + (idx % 3) * 15) % 100)}%` : '20%',
                  animationDelay: `${idx * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Auto-speak toggle & Mute toggle */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span>Auto-Voice</span>
          </label>

          <button
            type="button"
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              voiceSynthesizer.setMuted(next);
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Commentary Box Content (3rd Image Bottom Card) */}
      <div className="relative min-h-[100px] rounded-2xl bg-white border border-indigo-100 p-4 shadow-sm">
        {isLoading || isAiLoading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-mono font-bold animate-pulse text-indigo-900">
              {isAiLoading ? 'Processing game moves with AI...' : 'Generating move commentary...'}
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentMove && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono text-slate-900">
                    Move {currentMove.moveNumber}: {currentMove.san}
                  </span>
                  <Badge type={currentMove.classification}>{currentMove.classification}</Badge>
                </div>

                <span className="text-[10px] font-mono text-indigo-800 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {tacticalSummary || (currentMove ? `${currentMove.classification.toUpperCase()} MOVE` : 'TACTICAL VISION')}
                </span>
              </div>
            )}

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {isAiActive
                ? commentary || 'Select or navigate to any move in the game to receive live Grandmaster commentary.'
                : 'Click "Analyze Game with Souvik\'s BOT" below the chessboard to generate spoken move-by-move commentary.'}
            </p>

            {isAiActive && currentMove?.bestMoveSan && currentMove.bestMoveSan !== currentMove.san && (
              <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-100 text-emerald-800 font-bold">
                <span>Top Engine Line: <strong>{currentMove.bestMoveSan}</strong></span>
                <span className="text-[10px] text-slate-500 font-sans">
                  ({currentMove.winDrop.toFixed(1)}% win expectation diff)
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
