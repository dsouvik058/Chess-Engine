import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Square,
  Key,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { voiceSynthesizer } from '../../utils/voiceSynthesizer';
import { api } from '../../services/api';
import type { CoachPersona, MoveClassification, AiCoachResponse } from '../../types/chess';

interface AiCoachPanelProps {
  currentMove: {
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
  autoSpeakDefault?: boolean;
}

const GROQ_STORAGE_KEY = 'chess_groq_api_key';

export const AiCoachPanel: React.FC<AiCoachPanelProps> = ({
  currentMove,
  autoSpeakDefault = false,
}) => {
  const [persona, setPersona] = useState<CoachPersona>('grandmaster');
  const [commentary, setCommentary] = useState<string>('');
  const [speechScript, setSpeechScript] = useState<string>('');
  const [tacticalSummary, setTacticalSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [provider, setProvider] = useState<'GROQ' | 'HEURISTIC'>('HEURISTIC');
  const [modelName, setModelName] = useState<string>('Groq AI');

  // Voice States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(autoSpeakDefault);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Custom API Key Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);

  // Cache for generated move insights
  const commentaryCache = useRef<Record<string, AiCoachResponse>>({});

  // Load custom key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(GROQ_STORAGE_KEY) || '';
    setCustomApiKey(savedKey);
  }, []);

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

  // Fetch AI commentary whenever the selected move changes
  useEffect(() => {
    if (!currentMove) {
      setCommentary('Select or navigate to any move in the game to receive live Grandmaster AI commentary.');
      setTacticalSummary('');
      setSpeechScript('');
      voiceSynthesizer.stop();
      return;
    }

    const cacheKey = `${currentMove.moveNumber}-${currentMove.color}-${currentMove.san}-${persona}`;

    if (commentaryCache.current[cacheKey]) {
      const cached = commentaryCache.current[cacheKey];
      setCommentary(cached.commentary);
      setSpeechScript(cached.speechScript || cached.commentary);
      setTacticalSummary(cached.tacticalSummary || '');
      setProvider(cached.provider);
      setModelName(cached.model || 'Groq AI');

      if (autoSpeak && !isMuted && cached.speechScript) {
        voiceSynthesizer.speak(cached.speechScript, { persona });
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api
      .getAiCoachCommentary({
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
        coachPersona: persona,
        customApiKey: customApiKey.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        commentaryCache.current[cacheKey] = res;
        setCommentary(res.commentary);
        setSpeechScript(res.speechScript || res.commentary);
        setTacticalSummary(res.tacticalSummary || '');
        setProvider(res.provider);
        setModelName(res.model || 'Groq AI');

        if (autoSpeak && !isMuted && (res.speechScript || res.commentary)) {
          voiceSynthesizer.speak(res.speechScript || res.commentary, { persona });
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
  }, [currentMove, persona, customApiKey, autoSpeak, isMuted]);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      voiceSynthesizer.stop();
    } else {
      const textToSpeak = speechScript || commentary;
      if (textToSpeak) {
        voiceSynthesizer.speak(textToSpeak, { persona });
      }
    }
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem(GROQ_STORAGE_KEY, customApiKey.trim());
    } else {
      localStorage.removeItem(GROQ_STORAGE_KEY);
    }
    setSavedKeySuccess(true);
    setTimeout(() => {
      setSavedKeySuccess(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  return (
    <div className="glass-card rounded-3xl border-2 border-indigo-200/80 bg-gradient-to-b from-indigo-50/70 via-white to-white p-4 sm:p-5 shadow-xl shadow-indigo-900/5 space-y-4 text-slate-900">
      
      {/* Header Bar: Title + Persona Selector + Config Key */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-900 text-white flex items-center justify-center shadow-md shadow-indigo-700/20 flex-shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-900 font-serif-classic">
                AI Grandmaster Coach
              </h3>
              <span
                className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300"
                title={`Model: ${modelName}`}
              >
                {provider === 'GROQ' ? `⚡ GROQ (${modelName})` : 'HEURISTIC'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Live Interactive Voice & Move Breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Key Settings Button */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            title="Configure Groq Cloud API Key"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-700 transition-all cursor-pointer shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {/* Persona Selector Pill */}
          <div className="relative inline-block text-left">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as CoachPersona)}
              className="appearance-none bg-white border border-slate-300 hover:border-indigo-500 rounded-xl px-2.5 py-1.5 pr-7 text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="grandmaster">🎓 GM Magnus</option>
              <option value="enthusiastic">⚡ Coach Hikaru</option>
              <option value="tactical">⚔️ Tactical Master</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Voice Control & Equalizer Soundwave Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 shadow-sm">
        {/* Left: Speak / Stop Button & Audio Waveform */}
        <div className="flex items-center gap-3">
          <Button
            variant="accent"
            size="sm"
            onClick={handleToggleSpeak}
            disabled={!commentary || isLoading}
            className={`gap-1.5 text-xs font-extrabold rounded-xl px-3 shadow-md ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
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
          </Button>

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
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
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

      {/* Commentary Box Content */}
      <div className="relative min-h-[90px] rounded-2xl bg-white border border-indigo-100 p-4 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2 text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-mono font-bold animate-pulse text-indigo-900">
              Generating Groq AI Grandmaster Commentary...
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

                {tacticalSummary && (
                  <span className="text-[10px] font-mono text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {tacticalSummary}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {commentary}
            </p>

            {currentMove?.bestMoveSan && currentMove.bestMoveSan !== currentMove.san && (
              <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-100 text-emerald-800 font-bold">
                <span>Top Engine Line: <strong>{currentMove.bestMoveSan}</strong></span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Evaluation: {(currentMove.evalCp / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Groq Cloud API Key Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Configure Groq Cloud API Key"
      >
        <div className="space-y-4 text-slate-900 py-2">
          <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-indigo-950 font-serif-classic">Groq Ultra-Fast LLM Support</p>
            <p className="text-[11px] text-slate-600">
              Provide your own free Groq API key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-indigo-700 font-bold underline">console.groq.com</a> to enable instant live Grandmaster commentary powered by Llama 3.3.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Groq API Key (gsk_...)</label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsKeyModalOpen(false)}
              className="w-1/3 text-xs font-bold"
            >
              Cancel
            </Button>

            <Button
              variant="accent"
              onClick={handleSaveApiKey}
              className="w-2/3 font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              {savedKeySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Key Saved!</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
