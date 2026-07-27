import React, { useState } from 'react';
import { X, Volume2, VolumeX, Palette, Trophy, Music, Sliders } from 'lucide-react';
import { Difficulty, GameMode, PlayerStats, ThemeId } from '../types/maze';
import { THEMES } from '../utils/themes';
import { sound } from '../utils/sound';

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
  const [sfxVol, setSfxVol] = useState(Math.round(sound.getSfxVolume() * 100));
  const [musicVol, setMusicVol] = useState(Math.round(sound.getMusicVolume() * 100));

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVol(val);
    sound.setSfxVolume(val / 100);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMusicVol(val);
    sound.setMusicVolume(val / 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-zinc-100 uppercase">Game Settings</h2>
              <p className="text-xs text-zinc-400">Audio, Graphics & Vault Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">Audio & Sound Effects</h3>
            </div>
            <button
              onClick={onToggleMute}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all ${
                !isMuted
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {!isMuted ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
              <span>{!isMuted ? 'Sound ON' : 'Muted'}</span>
            </button>
          </div>

          {/* SFX Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> SFX Volume (Gunshots, Footsteps, Hits)
              </span>
              <span className="font-mono font-bold text-amber-400">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={handleSfxChange}
              disabled={isMuted}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-zinc-400" /> Background Music Volume
              </span>
              <span className="font-mono font-bold text-amber-400">{musicVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={handleMusicChange}
              disabled={isMuted}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Theme Picker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Visual Aesthetic Theme</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.values(THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                  currentTheme === theme.id
                    ? 'bg-zinc-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.wallColor }} />
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.playerColor }} />
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.goalColor }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Maze Grid Scale</h3>
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
                className={`p-2.5 rounded-xl border text-center transition-all ${
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
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Career Statistics</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              <div className="text-lg font-bold font-mono text-amber-400">{stats.gamesWon}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Cleared</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              <div className="text-lg font-bold font-mono text-amber-300">✧ {stats.totalCoins}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Coins</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              <div className="text-lg font-bold font-mono text-zinc-300">{stats.gamesPlayed}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Attempts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

