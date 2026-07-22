import React from 'react';
import { Play, Compass, Timer, EyeOff, Skull, Hammer, Trophy, ShoppingBag, Sparkles, MapPin, Gift, Smartphone, Crown, ShieldCheck } from 'lucide-react';
import { Difficulty, GameMode, PlayerStats } from '../types/maze';
import { MazeMasterLogo } from './MazeMasterLogo';
import { sound } from '../utils/sound';

interface MenuScreenProps {
  onStartGame: (mode: GameMode, difficulty: Difficulty) => void;
  onOpenCampaign: () => void;
  onOpenDailyReward: () => void;
  onOpenLeaderboard: () => void;
  onToggleMobileShell: () => void;
  isMobileShellActive: boolean;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onWatchAdClick: () => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  stats: PlayerStats;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onOpenCampaign,
  onOpenDailyReward,
  onOpenLeaderboard,
  onToggleMobileShell,
  isMobileShellActive,
  onOpenEditor,
  onOpenSettings,
  onOpenShop,
  onOpenAchievements,
  onWatchAdClick,
  selectedDifficulty,
  setSelectedDifficulty,
  stats,
}) => {
  const modes: { id: GameMode; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'classic',
      title: 'Classic Labyrinth',
      desc: 'Explore procedurally generated corridors with soul fragments, keys & locked vaults.',
      icon: <Compass className="w-6 h-6 text-amber-500" />,
      color: 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/60',
    },
    {
      id: 'time-attack',
      title: 'Chronos Vault',
      desc: 'Race against time through shifting obsidian chambers.',
      icon: <Timer className="w-6 h-6 text-amber-400" />,
      color: 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/60',
    },
    {
      id: 'fog-of-war',
      title: 'Shadow Domain',
      desc: 'Traverse pitch black darkness guided only by your lantern spotlight.',
      icon: <EyeOff className="w-6 h-6 text-amber-300" />,
      color: 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/60',
    },
    {
      id: 'monster-chase',
      title: 'Minotaur Pursuit',
      desc: 'An ancient obsidian guardian stalks your steps through the maze.',
      icon: <Skull className="w-6 h-6 text-red-500" />,
      color: 'bg-zinc-900/90 border-zinc-800 hover:border-red-500/60',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-4xl px-3 sm:px-6 py-6 text-zinc-200 select-none">
      {/* Hero Header & Logo */}
      <div className="flex flex-col items-center text-center gap-2 mb-6">
        <div className="my-2">
          <MazeMasterLogo size="xl" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-extrabold tracking-wider text-amber-500 uppercase drop-shadow-[0_4px_15px_rgba(245,158,11,0.25)]">
          MazeMaster 3D
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 uppercase tracking-widest max-w-md font-sans">
          The Obsidian Labyrinth Saga
        </p>

        {/* Currency & Quick Rewards Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 rounded-full border border-amber-500/30 text-amber-400 font-mono text-xs font-bold shadow-md">
            <span className="text-sm">✧</span>
            <span>{stats.totalCoins} Fragments</span>
          </div>

          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenDailyReward();
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/50 rounded-full text-xs font-mono font-bold uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-lg animate-pulse"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Daily Wheel</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onWatchAdClick();
            }}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 rounded-full text-xs font-mono font-bold uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bonus (+150)</span>
          </button>
        </div>
      </div>

      {/* Primary Hero Campaign Banner */}
      <div className="w-full max-w-3xl mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border border-amber-500/50 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 shadow-inner">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <span>Featured Saga Mode</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px]">
                50 STAGES
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 uppercase mt-0.5">
              Campaign Labyrinth Saga
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mt-1">
              Traverse 5 Mythic Realms from Obsidian Caverns to Celestial Vaults. Earn 3-star ratings!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playButtonClick();
            onOpenCampaign();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition transform active:scale-95 shrink-0"
        >
          <Play className="w-5 h-5 fill-zinc-950" />
          <span>Play Campaign</span>
        </button>
      </div>

      {/* Difficulty Tabs */}
      <div className="w-full max-w-xl bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 mb-6 flex items-center justify-between gap-1 shadow-xl">
        {[
          { id: 'easy', label: 'Easy (9x9)' },
          { id: 'medium', label: 'Medium (15x15)' },
          { id: 'hard', label: 'Hard (21x21)' },
          { id: 'extreme', label: 'Extreme (29x29)' },
        ].map((diff) => (
          <button
            key={diff.id}
            onClick={() => {
              sound.playButtonClick();
              setSelectedDifficulty(diff.id as Difficulty);
            }}
            className={`flex-1 py-2 px-1 text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all duration-150 ${
              selectedDifficulty === diff.id
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {diff.label}
          </button>
        ))}
      </div>

      {/* Quick Game Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mb-6">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              sound.playButtonClick();
              onStartGame(mode.id, selectedDifficulty);
            }}
            className={`group text-left p-5 rounded-2xl ${mode.color} border transition-all duration-200 hover:-translate-y-1 shadow-2xl flex flex-col justify-between gap-4`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner">
                {mode.icon}
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-950 text-[10px] font-mono uppercase tracking-widest text-amber-400 border border-zinc-800 flex items-center gap-1.5 group-hover:border-amber-500">
                <span>Play Quick</span>
                <Play className="w-3 h-3 fill-amber-500 stroke-amber-500" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-amber-200 group-hover:text-amber-400 transition-colors uppercase tracking-wider">
                {mode.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">{mode.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl">
        <button
          onClick={() => {
            sound.playButtonClick();
            onOpenShop();
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>3D Skins Shop</span>
        </button>

        <button
          onClick={() => {
            sound.playButtonClick();
            onOpenLeaderboard();
          }}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 hover:border-amber-500/50 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => {
            sound.playButtonClick();
            onOpenAchievements();
          }}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-amber-500/50 font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Badges</span>
        </button>

        <button
          onClick={() => {
            sound.playButtonClick();
            onToggleMobileShell();
          }}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>{isMobileShellActive ? 'Exit Phone' : 'Mobile Shell'}</span>
        </button>

        <button
          onClick={() => {
            sound.playButtonClick();
            onOpenEditor();
          }}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-amber-500/50 font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Hammer className="w-4 h-4 text-amber-500" />
          <span>Studio</span>
        </button>
      </div>
    </div>
  );
};
