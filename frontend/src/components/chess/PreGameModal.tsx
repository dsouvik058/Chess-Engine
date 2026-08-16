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

  // Custom Mode Specific Sliders
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrementSecs, setCustomIncrementSecs] = useState<number>(5);

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
      <div className="space-y-5 text-slate-900">
        <div className="flex items-center gap-3 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-800 flex-shrink-0 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-serif-classic">Bubble Bot (Stockfish 18)</h4>
            <p className="text-xs text-slate-600">Set ELO difficulty rating & time controls</p>
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
          <label className="block text-xs font-semibold text-slate-700 mb-2">Time Control Category</label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect('rapid')}
              className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                category === 'rapid'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20 scale-[1.02]'
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
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20 scale-[1.02]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Blitz</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('bullet')}
              className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                category === 'bullet'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20 scale-[1.02]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Bullet</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('custom')}
              className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                category === 'custom'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20 scale-[1.02]'
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
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
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
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
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
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {mins} Minute{mins > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        )}

        {category === 'custom' && (
          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4">
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
                  ? 'bg-white text-slate-900 border-amber-500 shadow-md scale-[1.02] ring-1 ring-amber-400'
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
                  ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md scale-[1.02]'
                  : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-slate-900 border border-slate-400 shadow-sm" />
              <span>Random</span>
            </button>
          </div>
        </div>

        <Button variant="classic" className="w-full py-3.5 font-extrabold rounded-2xl text-base shadow-xl" onClick={handleStart}>
          <Play className="w-5 h-5 fill-current" /> Start Battle
        </Button>
      </div>
    </Modal>
  );
};

