import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Play, Star, Timer, Footprints, ArrowRight, Share2 } from 'lucide-react';
import { Difficulty, GameMode } from '../types/maze';

interface GameOverModalProps {
  status: 'won' | 'lost';
  mode: GameMode;
  difficulty: Difficulty;
  timeElapsed: number;
  moveCount: number;
  coinsCount: number;
  isNewBestTime: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  mode,
  difficulty,
  timeElapsed,
  moveCount,
  coinsCount,
  isNewBestTime,
  onRestart,
  onNextLevel,
  onBackToMenu,
}) => {
  const isWon = status === 'won';

  useEffect(() => {
    if (isWon) {
      // Fire victory confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#a855f7'],
      });
    }
  }, [isWon]);

  // Calculate star rating (1 to 3 stars based on speed/moves)
  const calculateStars = () => {
    if (!isWon) return 0;
    if (timeElapsed < 30) return 3;
    if (timeElapsed < 60) return 2;
    return 1;
  };

  const stars = calculateStars();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-sm p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden text-zinc-100">
        {/* Top Glow Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-amber-500`}
        />

        {/* Icon Header */}
        <div
          className={`w-16 h-16 border-2 border-amber-500 rotate-45 flex items-center justify-center my-4 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-zinc-950`}
        >
          {isWon ? <Trophy className="w-8 h-8 text-amber-500 -rotate-45" /> : <span className="text-2xl -rotate-45">💀</span>}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl font-serif uppercase tracking-widest mt-2 ${
            isWon ? 'text-amber-500' : 'text-red-400'
          }`}
        >
          {isWon ? 'Labyrinth Cleared' : 'Corridor Defeat'}
        </h2>

        <p className="text-xs text-zinc-400 mt-1 font-sans">
          {isWon
            ? 'Outstanding mastery of the obsidian corridors!'
            : mode === 'time-attack'
            ? 'Time ran out before reaching the exit vault!'
            : 'Fallen in the maze traps. Challenge again!'}
        </p>

        {/* Stars */}
        {isWon && (
          <div className="flex items-center gap-2 my-4">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-7 h-7 transition-all ${
                  star <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110'
                    : 'text-zinc-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Score Stats */}
        <div className="grid grid-cols-3 gap-3 w-full bg-zinc-950 p-4 rounded-sm border border-zinc-800 my-4 text-zinc-200 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Time</span>
            <div className="flex items-center gap-1 mt-1 text-sm font-bold text-amber-300">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
            {isNewBestTime && isWon && (
              <span className="text-[9px] font-bold text-amber-400 mt-0.5 animate-pulse">RECORD!</span>
            )}
          </div>

          <div className="flex flex-col items-center border-x border-zinc-800">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Steps</span>
            <div className="flex items-center gap-1 mt-1 text-sm font-bold text-zinc-300">
              <Footprints className="w-3.5 h-3.5 text-zinc-500" />
              <span>{moveCount}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Fragments</span>
            <div className="flex items-center gap-1 mt-1 text-sm font-bold text-amber-400">
              <span>✧</span>
              <span>{coinsCount}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full mt-2 font-mono uppercase text-xs">
          <button
            onClick={onBackToMenu}
            className="flex-1 py-3 font-bold rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95"
          >
            Menu
          </button>

          <button
            onClick={onRestart}
            className="flex-1 py-3 font-bold rounded-sm bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-zinc-800 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            Retry
          </button>

          {isWon && (
            <button
              onClick={onNextLevel}
              className="flex-1 py-3 font-bold rounded-sm bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
