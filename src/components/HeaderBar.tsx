import React from 'react';
import { Volume2, VolumeX, Pause, Play, Trophy, Key, Timer, Footprints, Settings, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Difficulty, GameMode } from '../types/maze';
import { MazeMasterLogo } from './MazeMasterLogo';

interface HeaderBarProps {
  mode: GameMode;
  difficulty: Difficulty;
  timeElapsed: number;
  timeLimit?: number;
  moveCount: number;
  coinsCount: number;
  keysCount: number;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
  onOpenShop?: () => void;
  onOpenAchievements?: () => void;
  onBackToMenu?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  mode,
  difficulty,
  timeElapsed,
  timeLimit,
  moveCount,
  coinsCount,
  keysCount,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onOpenSettings,
  onOpenShop,
  onOpenAchievements,
  onBackToMenu,
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayTime = timeLimit ? Math.max(0, timeLimit - timeElapsed) : timeElapsed;

  return (
    <header className="w-full max-w-5xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-zinc-100">
      {/* Title & Mode */}
      <div className="flex items-center gap-3">
        {onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Back to Main Menu"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Menu</span>
          </button>
        )}
        <MazeMasterLogo size="sm" />
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-widest text-amber-500 uppercase">
            MazeMaster
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-zinc-950 text-amber-400 border border-zinc-800">
              {mode.replace('-', ' ')}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-zinc-950 text-zinc-400 border border-zinc-800">
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Game Live Stats */}
      <div className="flex items-center gap-4 sm:gap-6 bg-zinc-950/80 px-4 py-2 rounded-md border border-zinc-800 text-xs sm:text-sm">
        {/* Timer */}
        <div className="flex flex-col">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Time Elapsed</span>
          <div className="flex items-center gap-1.5 text-amber-200 font-mono font-bold">
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatTime(displayTime)}</span>
          </div>
        </div>

        {/* Moves */}
        <div className="flex flex-col border-l border-zinc-800 pl-4">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Steps</span>
          <div className="flex items-center gap-1.5 text-zinc-300 font-mono font-bold">
            <Footprints className="w-3.5 h-3.5 text-zinc-500" />
            <span>{moveCount}</span>
          </div>
        </div>

        {/* Coins */}
        <div className="flex flex-col border-l border-zinc-800 pl-4">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Fragments</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold">
            <span className="text-xs">✧</span>
            <span>{coinsCount}</span>
          </div>
        </div>

        {/* Keys */}
        {keysCount > 0 && (
          <div className="flex flex-col border-l border-zinc-800 pl-4">
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Keys</span>
            <div className="flex items-center gap-1 text-amber-500 font-mono font-bold animate-pulse">
              <Key className="w-3.5 h-3.5" />
              <span>{keysCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {onOpenShop && (
          <button
            onClick={onOpenShop}
            className="p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-amber-400 border border-zinc-800 transition-all duration-150 flex items-center gap-1 font-mono text-xs"
            title="Open Vault Shop"
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Shop</span>
          </button>
        )}

        {onOpenAchievements && (
          <button
            onClick={onOpenAchievements}
            className="p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-amber-400 border border-zinc-800 transition-all duration-150 flex items-center gap-1 font-mono text-xs"
            title="Open Achievements"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Badges</span>
          </button>
        )}

        <button
          onClick={onTogglePause}
          className="p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-zinc-300 border border-zinc-800 transition-all duration-150"
          title={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-zinc-300 border border-zinc-800 transition-all duration-150"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-zinc-300 border border-zinc-800 transition-all duration-150"
          title="Game Preferences"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
    </header>
  );
};

