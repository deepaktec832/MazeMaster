import React, { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Lightbulb, Zap, Ghost, Gamepad2, Navigation } from 'lucide-react';
import { PowerUpInventory, ActivePowerUps } from '../types/maze';
import { VirtualJoystick } from './VirtualJoystick';
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
  const [controlType, setControlType] = useState<'dpad' | 'joystick'>('dpad');

  const handleMove = (dir: 'top' | 'right' | 'bottom' | 'left') => {
    sound.playMove();
    if (navigator.vibrate) {
      navigator.vibrate(8);
    }
    onMove(dir);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-3xl px-2 my-2">
      {/* Power-ups Bar with glowing neon counters */}
      <div className="flex flex-col items-center sm:items-start gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/90 p-2 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-md">
          {/* Speed Boost Button */}
          <button
            onClick={() => {
              sound.playPowerUp();
              onUseSpeed();
            }}
            disabled={inventory.speedBoosts <= 0 && activePowerUps.speedBoostRemaining <= 0}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 border ${
              activePowerUps.speedBoostRemaining > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                : inventory.speedBoosts > 0
                ? 'bg-zinc-950 text-amber-400 hover:bg-zinc-800 active:scale-95 border-zinc-800 shadow-md'
                : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            <span>Speed</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
              {inventory.speedBoosts}
            </span>
          </button>

          {/* Ghost Mode Button */}
          <button
            onClick={() => {
              sound.playPowerUp();
              onUseGhost();
            }}
            disabled={inventory.ghostSteps <= 0 && activePowerUps.ghostModeRemaining <= 0}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 border ${
              activePowerUps.ghostModeRemaining > 0
                ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                : inventory.ghostSteps > 0
                ? 'bg-zinc-950 text-purple-400 hover:bg-zinc-800 active:scale-95 border-zinc-800 shadow-md'
                : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
            }`}
          >
            <Ghost className="w-4 h-4 text-purple-400" />
            <span>Ghost</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-mono border border-purple-500/30">
              {inventory.ghostSteps}
            </span>
          </button>

          {/* AI Hint Button */}
          <button
            onClick={() => {
              sound.playPowerUp();
              onUseHint();
            }}
            disabled={inventory.hintsAvailable <= 0 && !showingHint}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 border ${
              showingHint
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : inventory.hintsAvailable > 0
                ? 'bg-zinc-950 text-emerald-400 hover:bg-zinc-800 active:scale-95 border-zinc-800 shadow-md'
                : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <span>Hint</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
              {inventory.hintsAvailable}
            </span>
          </button>
        </div>

        {/* Control Layout Switcher Pill */}
        <div className="flex items-center gap-1 bg-zinc-950/90 p-1 rounded-full border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <button
            onClick={() => setControlType('dpad')}
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition ${
              controlType === 'dpad' ? 'bg-amber-500 text-zinc-950 font-bold' : 'hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Tactile D-Pad</span>
          </button>
          <button
            onClick={() => setControlType('joystick')}
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition ${
              controlType === 'joystick' ? 'bg-amber-500 text-zinc-950 font-bold' : 'hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>360° Joystick</span>
          </button>
        </div>
      </div>

      {/* Touch Control Area */}
      {controlType === 'joystick' ? (
        <VirtualJoystick onMove={handleMove} />
      ) : (
        <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-md">
          <div />
          <button
            onClick={() => handleMove('top')}
            className="w-12 h-12 bg-zinc-950 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90"
            aria-label="Move Up"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div />

          <button
            onClick={() => handleMove('left')}
            className="w-12 h-12 bg-zinc-950 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="w-12 h-12 flex items-center justify-center text-zinc-600 text-[10px] font-mono font-bold select-none">
            SWIPE
          </div>

          <button
            onClick={() => handleMove('right')}
            className="w-12 h-12 bg-zinc-950 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div />
          <button
            onClick={() => handleMove('bottom')}
            className="w-12 h-12 bg-zinc-950 hover:bg-zinc-800 active:bg-amber-500 text-zinc-200 active:text-zinc-950 rounded-xl flex items-center justify-center transition-all duration-100 shadow-lg border border-zinc-800 active:scale-90"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div />
        </div>
      )}
    </div>
  );
};
