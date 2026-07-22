import React from 'react';
import { X, Trophy, CheckCircle, Sparkles } from 'lucide-react';
import { Achievement } from '../types/maze';
import { sound } from '../utils/sound';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClaimReward: (achievementId: string) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  onClaimReward,
  onClose,
}) => {
  const handleClaim = (ach: Achievement) => {
    if (ach.completed && !ach.claimed) {
      onClaimReward(ach.id);
      sound.playWin();
    }
  };

  const completedCount = achievements.filter((a) => a.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-sm p-6 shadow-2xl flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 rotate-45 flex items-center justify-center bg-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Trophy className="w-4 h-4 text-amber-500 -rotate-45" />
            </div>
            <div>
              <h2 className="text-xl font-serif tracking-widest text-amber-500 uppercase">
                Vault Achievements
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Unlocked {completedCount} of {achievements.length} Milestones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Achievements */}
        <div className="flex flex-col gap-3">
          {achievements.map((ach) => {
            const progressPercent = Math.min(100, Math.floor((ach.progress / ach.target) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  ach.claimed
                    ? 'bg-zinc-950/50 border-zinc-800/60 opacity-80'
                    : ach.completed
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-10 h-10 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {ach.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-sm uppercase text-amber-200 tracking-wider">
                        {ach.title}
                      </h3>
                      {ach.completed && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 bg-amber-500/20 rounded-xs uppercase">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-sans mt-0.5">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-900 h-1.5 rounded-xs mt-2 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      Progress: {ach.progress} / {ach.target}
                    </div>
                  </div>
                </div>

                {/* Claim Button / Status */}
                <div className="shrink-0 w-full sm:w-auto flex items-center justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                  <span className="text-xs font-mono font-bold text-amber-400 sm:hidden">
                    Reward: ✧ {ach.rewardCoins}
                  </span>

                  {ach.claimed ? (
                    <div className="flex items-center gap-1 text-xs font-mono text-zinc-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Claimed</span>
                    </div>
                  ) : ach.completed ? (
                    <button
                      onClick={() => handleClaim(ach)}
                      className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim +{ach.rewardCoins}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-sm border border-zinc-800">
                      +✧ {ach.rewardCoins}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
