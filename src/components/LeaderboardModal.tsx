import React, { useState } from 'react';
import { Trophy, Medal, Star, Flame, ShieldCheck, X, UserCheck } from 'lucide-react';
import { PlayerStats } from '../types/maze';
import { sound } from '../utils/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Vortex_Runner', score: '2,850', stars: 142, skin: '👑', badge: 'PRO' },
  { rank: 2, name: 'Astraea_Seeker', score: '2,420', stars: 120, skin: '⭐', badge: 'ELITE' },
  { rank: 3, name: 'Shadow_Ninja', score: '2,110', stars: 105, skin: '🔥', badge: 'GOLD' },
  { rank: 4, name: 'Cyber_Phantom', score: '1,980', stars: 98, skin: '🧊', badge: 'SILVER' },
  { rank: 5, name: 'MazeMaster_Pro', score: '1,750', stars: 85, skin: '🔮', badge: 'BRONZE' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [tab, setTab] = useState<'global' | 'daily'>('global');

  if (!isOpen) return null;

  // Calculate XP level
  const playerXP = stats.gamesWon * 150 + stats.totalCoins;
  const playerLevel = Math.max(1, Math.floor(playerXP / 300) + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col text-zinc-100 max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-amber-400 tracking-wider uppercase">
                Play Store Leaderboards
              </h2>
              <p className="text-xs font-mono text-zinc-400">Global Champions & Play Pass XP</p>
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

        {/* Player Profile XP Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-lg shadow-lg shadow-amber-500/30">
              Lvl {playerLevel}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                <span>You (Labyrinth Adventurer)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                {stats.gamesWon} Wins • {stats.totalCoins} Soul Fragments
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-zinc-400">Rank</div>
            <div className="text-lg font-bold text-amber-400">#12</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-3 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              sound.playButtonClick();
              setTab('global');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              tab === 'global'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All-Time Global
          </button>
          <button
            onClick={() => {
              sound.playButtonClick();
              setTab('daily');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              tab === 'daily'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daily High Scores
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {MOCK_LEADERBOARD.map((item) => (
            <div
              key={item.rank}
              className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between hover:border-amber-500/30 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs font-mono ${
                    item.rank === 1
                      ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/30'
                      : item.rank === 2
                      ? 'bg-slate-300 text-zinc-950'
                      : item.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  #{item.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-200">
                    <span>{item.skin}</span>
                    <span>{item.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400" /> {item.stars} Stars
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono font-bold text-amber-400 text-sm">
                {item.score} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
