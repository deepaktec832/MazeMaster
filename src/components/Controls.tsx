import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Lightbulb, Zap, Ghost, Touchpad } from 'lucide-react';
import { PowerUpInventory, ActivePowerUps } from '../types/maze';
import { sound } from '../utils/sound';

interface ControlsProps {
  onMove: (direction: 'top' | 'right' | 'bottom' | 'left') => void;
  onUseSpeed: () => void;
  onUseGhost: () => void;
  onUseHint: () => void;
  inventory: PowerUpInventory;
  activePowerUps: ActivePowerUps;
  showingHint: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onMove,
  onUseSpeed,
  onUseGhost,
  onUseHint,
  inventory,
  activePowerUps,
  showingHint,
}) => {
  const handleMove = (dir: 'top' | 'right' | 'bottom' | 'left') => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onMove(dir);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-3xl px-2 my-1 select-none">
      {/* Mobile Power-Up Action Pills */}
      <div className="flex items-center gap-2 bg-zinc-950/90 p-2 rounded-2xl border border-zinc-800/90 shadow-2xl backdrop-blur-md w-full sm:w-auto justify-center">
        {/* Speed Boost Button */}
        <button
          onClick={() => {
            sound.playPowerUp();
            if (navigator.vibrate) navigator.vibrate(15);
            onUseSpeed();
          }}
          disabled={inventory.speedBoosts <= 0 && activePowerUps.speedBoostRemaining <= 0}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-150 border active:scale-95 touch-manipulation ${
            activePowerUps.speedBoostRemaining > 0
              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
              : inventory.speedBoosts > 0
              ? 'bg-zinc-900 text-amber-400 hover:bg-zinc-800 border-zinc-800 shadow-md'
              : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
          }`}
          aria-label="Speed Boost"
        >
          <Zap className="w-4 h-4 fill-amber-400 stroke-amber-400" />
          <span className="hidden xs:inline">Speed</span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
            {inventory.speedBoosts}
          </span>
        </button>

        {/* Ghost Mode Button */}
        <button
          onClick={() => {
            sound.playPowerUp();
            if (navigator.vibrate) navigator.vibrate(15);
            onUseGhost();
          }}
          disabled={inventory.ghostSteps <= 0 && activePowerUps.ghostModeRemaining <= 0}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-150 border active:scale-95 touch-manipulation ${
            activePowerUps.ghostModeRemaining > 0
              ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
              : inventory.ghostSteps > 0
              ? 'bg-zinc-900 text-purple-400 hover:bg-zinc-800 border-zinc-800 shadow-md'
              : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
          }`}
          aria-label="Ghost Mode"
        >
          <Ghost className="w-4 h-4 text-purple-400" />
          <span className="hidden xs:inline">Ghost</span>
          <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-mono border border-purple-500/30">
            {inventory.ghostSteps}
          </span>
        </button>

        {/* AI Hint Button */}
        <button
          onClick={() => {
            sound.playPowerUp();
            if (navigator.vibrate) navigator.vibrate(15);
            onUseHint();
          }}
          disabled={inventory.hintsAvailable <= 0 && !showingHint}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-150 border active:scale-95 touch-manipulation ${
            showingHint
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : inventory.hintsAvailable > 0
              ? 'bg-zinc-900 text-emerald-400 hover:bg-zinc-800 border-zinc-800 shadow-md'
              : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
          }`}
          aria-label="AI Hint"
        >
          <Lightbulb className="w-4 h-4 text-emerald-400" />
          <span className="hidden xs:inline">Hint</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
            {inventory.hintsAvailable}
          </span>
        </button>
      </div>

      {/* Touch Control D-Pad Pad */}
      <div className="flex items-center gap-3">
        {/* Swipe & Tap Touch Pad Indicator */}
        <div className="hidden md:flex flex-col items-end text-right text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Touchpad className="w-3.5 h-3.5" />
            <span>Mobile Touch Active</span>
          </div>
          <span className="text-[10px] text-zinc-500">Swipe screen or tap tiles</span>
        </div>

        {/* Tactile Ergonomic Mobile Touch Pad */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 shadow-2xl backdrop-blur-md">
          <div />
          <button
            onClick={() => handleMove('top')}
            className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90 touch-manipulation"
            aria-label="Move Up"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div />

          <button
            onClick={() => handleMove('left')}
            className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90 touch-manipulation"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="w-11 h-11 flex items-center justify-center text-amber-500/60 text-[9px] font-mono font-bold select-none text-center leading-tight">
            TOUCH
          </div>

          <button
            onClick={() => handleMove('right')}
            className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90 touch-manipulation"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div />
          <button
            onClick={() => handleMove('bottom')}
            className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90 touch-manipulation"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
