import React, { useState } from 'react';
import { X, Lock, Star, Play, Trophy, MapPin, ChevronLeft, ChevronRight, Zap, Target, Sparkles } from 'lucide-react';
import { Difficulty, GameMode } from '../types/maze';
import { sound } from '../utils/sound';

interface CampaignMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (levelIndex: number, mode: GameMode, difficulty: Difficulty) => void;
  completedLevels?: Record<number, { stars: number; bestTime: number }>;
  onSkipLevelWithAds?: () => void;
  skipLevelAdCount?: number;
}

// Base Realm Archetypes that loop across 100 Worlds (1000 Levels Total)
const REALM_ARCHETYPES = [
  { name: 'Obsidian Caverns', theme: 'obsidian', icon: '⛰️', color: 'from-amber-600 to-amber-950' },
  { name: 'Cyber Neon Grid', theme: 'neon', icon: '🌃', color: 'from-cyan-600 to-blue-950' },
  { name: 'Shadow Dungeon', theme: 'dungeon', icon: '🏰', color: 'from-stone-600 to-stone-950' },
  { name: 'Emerald Forest', theme: 'emerald', icon: '🌲', color: 'from-emerald-600 to-teal-950' },
  { name: 'Celestial Vault', theme: 'retro-arcade', icon: '🌌', color: 'from-purple-600 to-indigo-950' },
  { name: 'Molten Lava Core', theme: 'obsidian', icon: '🔥', color: 'from-red-600 to-orange-950' },
  { name: 'Frostbite Abyss', theme: 'neon', icon: '❄️', color: 'from-sky-500 to-blue-950' },
  { name: 'Aether Citadel', theme: 'dungeon', icon: '🏛️', color: 'from-yellow-600 to-amber-950' },
  { name: 'Void Nexus', theme: 'retro-arcade', icon: '🔮', color: 'from-violet-600 to-fuchsia-950' },
  { name: 'Titan Labyrinth', theme: 'emerald', icon: '⚡', color: 'from-yellow-400 to-red-950' },
];

export const CampaignMapModal: React.FC<CampaignMapModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  completedLevels = {},
  onSkipLevelWithAds,
  skipLevelAdCount = 0,
}) => {
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [jumpInput, setJumpInput] = useState<string>('');

  if (!isOpen) return null;

  // Highest cleared level overall
  const highestCleared = Object.keys(completedLevels).map(Number).reduce((max, lvl) => Math.max(max, lvl), 0);
  const unlockedMax = highestCleared + 1;
  const currentUnlockedWorld = Math.min(100, Math.ceil(unlockedMax / 10));

  // Determine difficulty based on level number
  const getLevelDifficulty = (lvl: number): Difficulty => {
    if (lvl <= 50) return 'easy';
    if (lvl <= 200) return 'medium';
    if (lvl <= 500) return 'hard';
    return 'extreme';
  };

  // Get current world details (1..100)
  const archetypeIdx = (selectedWorld - 1) % REALM_ARCHETYPES.length;
  const baseRealm = REALM_ARCHETYPES[archetypeIdx];
  const tier = Math.floor((selectedWorld - 1) / REALM_ARCHETYPES.length) + 1;
  const worldTitle = tier > 1 ? `${baseRealm.name} ${getRomanNumeral(tier)}` : baseRealm.name;
  const worldDifficulty = getLevelDifficulty((selectedWorld - 1) * 10 + 1);

  // Levels range for current world (10 levels per world)
  const startLevel = (selectedWorld - 1) * 10 + 1;
  const levels = Array.from({ length: 10 }, (_, i) => startLevel + i);

  // Quick jump to world
  const handleJumpToLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const lvl = parseInt(jumpInput, 10);
    if (!isNaN(lvl) && lvl >= 1 && lvl <= 1000) {
      const world = Math.ceil(lvl / 10);
      setSelectedWorld(world);
      setJumpInput('');
      sound.playButtonClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-400 tracking-wider uppercase">
                  Campaign Saga
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold uppercase font-mono">
                  1000 Levels
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">100 Mythic Realms • Level 1 to 1000</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Progress Banner & Jump Control */}
        <div className="my-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-300">
                Current Progress: <strong className="text-amber-400">Stage #{unlockedMax}</strong> / 1000
              </span>
            </div>

            {onSkipLevelWithAds && (
              <button
                onClick={() => {
                  sound.playButtonClick();
                  onSkipLevelWithAds();
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                title="Watch 2 ads to skip current hard stage"
              >
                <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                <span>
                  {skipLevelAdCount === 1 ? 'Skip Lvl (1/2 Ads)' : 'Skip Lvl (2 Ads)'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Continue playing button */}
            <button
              onClick={() => {
                sound.playButtonClick();
                setSelectedWorld(currentUnlockedWorld);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Jump to Current (W#{currentUnlockedWorld})</span>
            </button>

            {/* Jump to Level Form */}
            <form onSubmit={handleJumpToLevel} className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="Lvl #"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-amber-400 text-center font-bold focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold border border-zinc-700 active:scale-95 transition"
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* World Selector Bar with Pagination */}
        <div className="flex items-center justify-between gap-2 py-2 border-b border-zinc-800/80">
          <button
            onClick={() => {
              if (selectedWorld > 1) {
                sound.playButtonClick();
                setSelectedWorld((w) => w - 1);
              }
            }}
            disabled={selectedWorld <= 1}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((wId) => {
              const isSelected = wId === selectedWorld;
              const wStartLvl = (wId - 1) * 10 + 1;
              const isWorldUnlocked = wStartLvl <= unlockedMax;

              // Only render worlds within range of selectedWorld for smooth rendering
              if (Math.abs(wId - selectedWorld) > 6 && wId !== 1 && wId !== 100 && wId !== currentUnlockedWorld) {
                return null;
              }

              return (
                <button
                  key={wId}
                  onClick={() => {
                    sound.playButtonClick();
                    setSelectedWorld(wId);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : isWorldUnlocked
                      ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800'
                      : 'bg-zinc-950/50 text-zinc-600 border-zinc-900'
                  }`}
                >
                  <span>W#{wId}</span>
                  {!isWorldUnlocked && <Lock className="w-3 h-3 text-zinc-500" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (selectedWorld < 100) {
                sound.playButtonClick();
                setSelectedWorld((w) => w + 1);
              }
            }}
            disabled={selectedWorld >= 100}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Level Grid Area */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{baseRealm.icon}</span>
              <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                World #{selectedWorld}: {worldTitle}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 uppercase">
                {worldDifficulty}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Stages {startLevel} - {startLevel + 9}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {levels.map((lvl) => {
              const isUnlocked = lvl <= unlockedMax;
              const lvlData = completedLevels[lvl];
              const stars = lvlData?.stars || 0;
              const lvlDiff = getLevelDifficulty(lvl);

              return (
                <div
                  key={lvl}
                  onClick={() => {
                    if (isUnlocked) {
                      sound.playButtonClick();
                      onSelectLevel(lvl, 'classic', lvlDiff);
                      onClose();
                    }
                  }}
                  className={`relative p-3.5 rounded-2xl border flex flex-col items-center justify-between gap-2 transition-all duration-200 cursor-pointer ${
                    isUnlocked
                      ? 'bg-zinc-900/90 hover:bg-zinc-800/90 border-amber-500/30 hover:border-amber-400 hover:scale-105 shadow-lg'
                      : 'bg-zinc-950/40 border-zinc-800/40 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Level Badge */}
                  <div className="flex items-center justify-between w-full text-xs font-mono">
                    <span className="text-zinc-400">Lvl</span>
                    <span className="font-bold text-amber-400 text-sm">#{lvl}</span>
                  </div>

                  {/* Level Icon or Lock */}
                  <div className="my-1">
                    {isUnlocked ? (
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                        <Play className="w-5 h-5 fill-amber-400 translate-x-0.5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Star Rating display */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-3.5 h-3.5 ${
                          starIdx <= stars
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Target className="w-4 h-4" />
            <span>World #{selectedWorld} of 100 Realms</span>
          </div>
          <span>Complete stages to unlock all 1000 levels!</span>
        </div>
      </div>
    </div>
  );
};

// Helper function for Roman numerals
function getRomanNumeral(num: number): string {
  const lookup: [string, number][] = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];
  let roman = '';
  for (const [letter, value] of lookup) {
    while (num >= value) {
      roman += letter;
      num -= value;
    }
  }
  return roman;
}
