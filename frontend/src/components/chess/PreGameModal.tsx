import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import type { PlayerColor } from '../../types/chess';
import { Bot, Play, Clock, Zap, Flame, Sliders } from 'lucide-react';

export type TimeControlCategory = 'rapid' | 'blitz' | 'bullet' | 'custom';

export interface TimeControlConfig {
  category: TimeControlCategory;
  initialMinutes: number;
  incrementSeconds: number;
}

interface PreGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (elo: number, userColor: PlayerColor, timeConfig: TimeControlConfig) => void;
  initialElo?: number;
}

export const PreGameModal: React.FC<PreGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  initialElo = 1500,
}) => {
  const [elo, setElo] = useState<number>(initialElo);
  const [chosenSide, setChosenSide] = useState<'white' | 'black' | 'random'>('white');

  // Time Control States
  const [category, setCategory] = useState<TimeControlCategory>('rapid');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);
  const [selectedIncrement, setSelectedIncrement] = useState<number>(0);

  // Custom Mode Specific Sliders (Max 1.5 mins = 90s)
  const [customMinutes, setCustomMinutes] = useState<number>(1.5); // max 1.5 min (90s)
  const [customIncrementSecs, setCustomIncrementSecs] = useState<number>(1); // max 90s (1.5 min)

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

  const handleStart = () => {
    let finalColor: PlayerColor = 'white';
    if (chosenSide === 'random') {
      finalColor = Math.random() < 0.5 ? 'white' : 'black';
    } else {
      finalColor = chosenSide;
    }

    let finalMinutes = selectedMinutes;
    let finalIncrement = selectedIncrement;

    if (category === 'custom') {
      finalMinutes = customMinutes;
      finalIncrement = customIncrementSecs;
    }

    onStartGame(elo, finalColor, {
      category,
      initialMinutes: finalMinutes,
      incrementSeconds: finalIncrement,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Bubble Bot Match">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white tracking-tight">Bubble Bot (Stockfish 18)</h4>
            <p className="text-xs text-slate-400">Set ELO difficulty rating & time controls</p>
          </div>
        </div>

        {/* ELO Slider */}
        <Slider
          label="Bot Difficulty Rating (ELO)"
          min={800}
          max={3200}
          step={50}
          value={elo}
          valueDisplay={`${elo} ELO`}
          onChange={(e) => setElo(Number(e.target.value))}
        />

        {/* Time Control Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Time Control Category</label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect('rapid')}
              className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                category === 'rapid'
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
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
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
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
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Bullet</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('custom')}
              className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                category === 'custom'
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
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
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
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
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
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
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {mins} Minute{mins > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        )}

        {category === 'custom' && (
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
            <Slider
              label="Time Per Side (Max 1.5 min)"
              min={0.25}
              max={1.5}
              step={0.25}
              value={customMinutes}
              valueDisplay={`${customMinutes} Min (${Math.round(customMinutes * 60)}s)`}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
            />

            <Slider
              label="Increment Per Move (Max 1.5 min / 90s)"
              min={0}
              max={90}
              step={1}
              value={customIncrementSecs}
              valueDisplay={`${customIncrementSecs} Seconds`}
              onChange={(e) => setCustomIncrementSecs(Number(e.target.value))}
            />
          </div>
        )}

        {/* Side Preference */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Your Side</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setChosenSide('white')}
              className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                chosenSide === 'white'
                  ? 'bg-slate-100 text-slate-950 border-white shadow-xl scale-[1.02]'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 shadow-sm" />
              <span>White</span>
            </button>

            <button
              type="button"
              onClick={() => setChosenSide('black')}
              className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                chosenSide === 'black'
                  ? 'bg-slate-950 text-white border-cyan-500 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700 shadow-sm" />
              <span>Black</span>
            </button>

            <button
              type="button"
              onClick={() => setChosenSide('random')}
              className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                chosenSide === 'random'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-r from-slate-100 to-slate-950 border border-slate-500 shadow-sm" />
              <span>Random</span>
            </button>
          </div>
        </div>

        <Button variant="accent" className="w-full py-3.5 font-extrabold rounded-2xl text-base shadow-xl" onClick={handleStart}>
          <Play className="w-5 h-5 fill-current" /> Start Battle
        </Button>
      </div>
    </Modal>
  );
};
