import React, { useState } from 'react';
import { Shield, Sparkles, Award, Zap, Trophy, ArrowRight, Check } from 'lucide-react';
import type { User } from '../../types/auth';
import { UserAvatar } from '../ui/UserAvatar';

interface SkillOption {
  id: string;
  name: string;
  elo: number;
  badge: string;
  description: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
}

const SKILL_OPTIONS: SkillOption[] = [
  {
    id: 'newbie',
    name: 'Newbie / Beginner',
    elo: 400,
    badge: 'ENTRY LEVEL',
    description: 'Just starting out. Learning piece movements, basic rules, and board coordinates.',
    icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
    borderColor: 'border-emerald-500 shadow-emerald-500/10',
    bgColor: 'bg-emerald-50/70',
  },
  {
    id: 'casual',
    name: 'Casual Player',
    elo: 800,
    badge: 'CASUAL',
    description: 'Play for fun. Know basic checkmates, simple captures, and standard opening moves.',
    icon: <Shield className="w-6 h-6 text-amber-600" />,
    borderColor: 'border-amber-500 shadow-amber-500/10',
    bgColor: 'bg-amber-50/70',
  },
  {
    id: 'advanced_beginner',
    name: 'Advanced Beginner',
    elo: 1200,
    badge: 'ADVANCED',
    description: 'Recognize tactical patterns like forks, pins, skewers, and middle-game concepts.',
    icon: <Zap className="w-6 h-6 text-indigo-600" />,
    borderColor: 'border-indigo-500 shadow-indigo-500/10',
    bgColor: 'bg-indigo-50/70',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    elo: 1600,
    badge: 'COMPETITIVE',
    description: 'Solid online or rated player with structured opening repertoire and endgame knowledge.',
    icon: <Award className="w-6 h-6 text-purple-600" />,
    borderColor: 'border-purple-500 shadow-purple-500/10',
    bgColor: 'bg-purple-50/70',
  },
  {
    id: 'club_tournament',
    name: 'Club Level / Tournament Player',
    elo: 2000,
    badge: 'MASTER CLASS',
    description: 'Experienced tournament competitor or rated club player looking for serious Stockfish challenges.',
    icon: <Trophy className="w-6 h-6 text-amber-700" />,
    borderColor: 'border-amber-600 shadow-amber-600/10',
    bgColor: 'bg-amber-100/70',
  },
];

interface SkillSelectionPageProps {
  user: User;
  onConfirmSkill: (eloRating: number, skillLevelName: string) => void;
  isLoading?: boolean;
}

export const SkillSelectionPage: React.FC<SkillSelectionPageProps> = ({
  user,
  onConfirmSkill,
  isLoading = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<SkillOption>(SKILL_OPTIONS[1]); // Default to Casual 800

  const handleConfirm = () => {
    onConfirmSkill(selectedOption.elo, selectedOption.name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-stone-50 text-slate-900 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-400/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Top Header Card */}
        <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user.avatarUrl}
              name={user.name}
              className="w-16 h-16 rounded-2xl border-2 border-amber-400 shadow-md object-cover"
            />
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-serif-classic">Welcome, {user.name}! 👋</h1>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                To personalize your chess engine experience, please select your skill level below.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-300 text-center shrink-0">
            <div className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">SELECTED LEVEL</div>
            <div className="text-lg font-black text-slate-900 font-mono">{selectedOption.elo} ELO</div>
          </div>
        </div>

        {/* 5 Skill Level Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-1.5">
          {SKILL_OPTIONS.map((opt) => {
            const isSelected = selectedOption.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`relative flex flex-col justify-between p-5 rounded-2xl text-left transition-all duration-300 border cursor-pointer ${
                  isSelected
                    ? `${opt.borderColor} ${opt.bgColor} shadow-lg scale-[1.03] ring-2 ring-amber-500/50`
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="mb-4">{opt.icon}</div>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase block mb-1">
                    {opt.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1 font-serif-classic">{opt.name}</h3>
                  <div className="text-xl font-black text-amber-800 font-mono mb-3">{opt.elo} ELO</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                    {isSelected ? 'Selected' : 'Select Level'}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 text-amber-700' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Confirm Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xl">
          <div>
            <div className="text-sm font-bold text-slate-900">
              Starting Rating: <span className="text-amber-800 font-mono font-black">{selectedOption.elo} ELO</span> ({selectedOption.name})
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Stockfish AI and your profile stats will automatically calibrate to this level. You can adjust this anytime in game options.
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-800/20 transition-all flex items-center justify-center gap-2.5 active:scale-95 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? 'Saving Level...' : 'Confirm Level & Enter Arena'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

