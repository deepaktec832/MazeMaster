import React, { useState } from 'react';
import { X, Lock, Star, Play, Trophy, Sparkles, MapPin, ShieldAlert } from 'lucide-react';
import { Difficulty, GameMode } from '../types/maze';
import { sound } from '../utils/sound';

interface CampaignMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (levelIndex: number, mode: GameMode, difficulty: Difficulty) => void;
  completedLevels?: Record<number, { stars: number; bestTime: number }>;
}

const WORLDS = [
  { id: 1, name: 'Obsidian Caverns', theme: 'obsidian', icon: '⛰️', difficulty: 'easy' as Difficulty, color: 'from-amber-600 to-amber-900' },
  { id: 2, name: 'Cyber Neon Grid', theme: 'neon', icon: '🌃', difficulty: 'medium' as Difficulty, color: 'from-cyan-600 to-blue-900' },
  { id: 3, name: 'Shadow Dungeon', theme: 'dungeon', icon: '🏰', difficulty: 'medium' as Difficulty, color: 'from-stone-600 to-stone-900' },
  { id: 4, name: 'Emerald Forest', theme: 'emerald', icon: '🌲', difficulty: 'hard' as Difficulty, color: 'from-emerald-600 to-teal-900' },
  { id: 5, name: 'Celestial Vault', theme: 'retro-arcade', icon: '🌌', difficulty: 'extreme' as Difficulty, color: 'from-purple-600 to-indigo-900' },
];

export const CampaignMapModal: React.FC<CampaignMapModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  completedLevels = {},
}) => {
  const [selectedWorld, setSelectedWorld] = useState<number>(1);

  if (!isOpen) return null;

  const currentWorld = WORLDS.find((w) => w.id === selectedWorld) || WORLDS[0];

  // Levels range for current world (e.g., World 1 has levels 1..10)
  const startLevel = (selectedWorld - 1) * 10 + 1;
  const levels = Array.from({ length: 10 }, (_, i) => startLevel + i);

  // Highest unlocked level overall
  const highestCleared = Object.keys(completedLevels).map(Number).reduce((max, lvl) => Math.max(max, lvl), 0);
  const unlockedMax = highestCleared + 1;

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
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-400 tracking-wider uppercase">
                Campaign Labyrinth Saga
              </h2>
              <p className="text-xs font-mono text-zinc-400">50 Stages across 5 Mythic Realms</p>
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

        {/* World Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-zinc-800/80">
          {WORLDS.map((world) => {
            const isSelected = world.id === selectedWorld;
            const worldStartLvl = (world.id - 1) * 10 + 1;
            const isWorldUnlocked = worldStartLvl <= unlockedMax;

            return (
              <button
                key={world.id}
                onClick={() => {
                  sound.playButtonClick();
                  setSelectedWorld(world.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : isWorldUnlocked
                    ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800'
                    : 'bg-zinc-950/50 text-zinc-600 border-zinc-900'
                }`}
              >
                <span>{world.icon}</span>
                <span>{world.name}</span>
                {!isWorldUnlocked && <Lock className="w-3 h-3 text-zinc-500" />}
              </button>
            );
          })}
        </div>

        {/* Level Grid Area */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80">
              {currentWorld.name} • Difficulty: {currentWorld.difficulty}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Stages {startLevel} - {startLevel + 9}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {levels.map((lvl) => {
              const isUnlocked = lvl <= unlockedMax;
              const lvlData = completedLevels[lvl];
              const stars = lvlData?.stars || 0;

              return (
                <div
                  key={lvl}
                  onClick={() => {
                    if (isUnlocked) {
                      sound.playButtonClick();
                      onSelectLevel(lvl, 'classic', currentWorld.difficulty);
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
            <Trophy className="w-4 h-4" />
            <span>Highest Level Unlocked: Stage #{unlockedMax}</span>
          </div>
          <span>Earn 3 Stars by solving fast!</span>
        </div>
      </div>
    </div>
  );
};
