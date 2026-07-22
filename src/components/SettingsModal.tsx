import React from 'react';
import { X, Volume2, VolumeX, Palette, Trophy, Sparkles, Compass } from 'lucide-react';
import { Difficulty, GameMode, PlayerStats, ThemeId } from '../types/maze';
import { THEMES } from '../utils/themes';

interface SettingsModalProps {
  currentTheme: ThemeId;
  currentMode: GameMode;
  currentDifficulty: Difficulty;
  stats: PlayerStats;
  isMuted: boolean;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentTheme,
  currentMode,
  currentDifficulty,
  stats,
  isMuted,
  onSelectTheme,
  onSelectMode,
  onSelectDifficulty,
  onToggleMute,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-sm p-6 shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500 rotate-45 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 bg-amber-500"></div>
            </div>
            <h2 className="text-xl font-serif tracking-widest text-amber-500 uppercase">
              Vault Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-sm border border-zinc-800">
          <div>
            <h3 className="text-sm font-serif uppercase tracking-wider text-amber-200">Audio Synthesizer</h3>
            <p className="text-xs text-zinc-400 font-sans">Toggle Web Audio ambient frequencies</p>
          </div>
          <button
            onClick={onToggleMute}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm border flex items-center gap-2 transition-all ${
              !isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            {!isMuted ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            <span>{!isMuted ? 'Sound ON' : 'Muted'}</span>
          </button>
        </div>

        {/* Theme Picker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Visual Aesthetic</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.values(THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`p-3 rounded-sm border text-left flex flex-col gap-2 transition-all ${
                  currentTheme === theme.id
                    ? 'bg-zinc-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.wallColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.playerColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.goalColor }}
                  />
                </div>
                <span className="text-xs font-serif uppercase tracking-wider">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Grid Scale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'easy', label: 'Easy', grid: '9x9' },
              { id: 'medium', label: 'Medium', grid: '15x15' },
              { id: 'hard', label: 'Hard', grid: '21x21' },
              { id: 'extreme', label: 'Extreme', grid: '29x29' },
            ].map((diff) => (
              <button
                key={diff.id}
                onClick={() => onSelectDifficulty(diff.id as Difficulty)}
                className={`p-2.5 rounded-sm border text-center transition-all ${
                  currentDifficulty === diff.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60'
                }`}
              >
                <div className="text-xs font-mono uppercase tracking-wider">{diff.label}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{diff.grid}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Lifetime Career Stats */}
        <div className="bg-zinc-950 p-4 rounded-sm border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Vault History</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-900 p-3 rounded-sm border border-zinc-800">
              <div className="text-lg font-bold font-mono text-amber-400">{stats.gamesWon}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Cleared</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-sm border border-zinc-800">
              <div className="text-lg font-bold font-mono text-amber-300">✧ {stats.totalCoins}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Fragments</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-sm border border-zinc-800">
              <div className="text-lg font-bold font-mono text-zinc-300">{stats.gamesPlayed}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Attempted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
