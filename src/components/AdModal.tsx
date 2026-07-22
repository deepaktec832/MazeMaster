import React, { useState, useEffect } from 'react';
import { X, Play, Volume2, VolumeX, Sparkles, DollarSign, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface AdModalProps {
  rewardType: 'coins' | 'hint' | 'speed';
  onRewardGranted: (rewardType: 'coins' | 'hint' | 'speed', coinsAmount?: number) => void;
  onClose: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({ rewardType, onRewardGranted, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(6);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isPlaying || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          sound.playWin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isCompleted]);

  const handleClaimReward = () => {
    onRewardGranted(rewardType, rewardType === 'coins' ? 150 : 0);
    onClose();
  };

  const progressPercent = Math.min(100, Math.max(0, ((6 - timeLeft) / 6) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-sm p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden text-zinc-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase rounded-xs">
              SPONSORED AD
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {isCompleted ? 'Reward Ready!' : `Ad ends in ${timeLeft}s`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            {isCompleted && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Screen Simulation */}
        <div className="w-full aspect-video bg-zinc-950 rounded-sm border border-zinc-800 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
          {/* Animated 3D Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-20 animate-pulse" />

          {!isCompleted ? (
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-amber-500/10 animate-bounce">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-serif uppercase tracking-wider text-amber-300">
                  Obsidian Realm Odyssey
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mt-1 font-sans">
                  Unlock mythical skin artifacts, speed boosts, and infinite labyrinth maps in MazeMaster 3D!
                </p>
              </div>

              {/* Countdown overlay */}
              <div className="mt-2 text-xs font-mono text-amber-400 bg-zinc-900/90 px-3 py-1 rounded-sm border border-zinc-800">
                Playing Sponsored Commercial...
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-3 animate-scale-up">
              <div className="w-14 h-14 border-2 border-amber-500 rotate-45 flex items-center justify-center bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <CheckCircle2 className="w-8 h-8 -rotate-45" />
              </div>
              <h3 className="text-xl font-serif uppercase tracking-widest text-amber-400">
                Ad Complete!
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                {rewardType === 'coins' ? 'Claim +150 Soul Fragments!' : 'Claim Free Power-up!'}
              </p>
            </div>
          )}

          {/* Video Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Ad Monetization & Creator Revenue Note */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
          <div className="flex items-center gap-1 text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Developer Ad Impression Value: +$0.05 USD</span>
          </div>
          <span className="text-zinc-600">Simulated Ad Engine v2.0</span>
        </div>

        {/* Claim Action */}
        <button
          onClick={handleClaimReward}
          disabled={!isCompleted}
          className={`w-full py-3 text-xs font-mono font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 ${
            isCompleted
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-95'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isCompleted ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Claim Reward Now</span>
            </>
          ) : (
            <span>Please wait for ad to finish...</span>
          )}
        </button>
      </div>
    </div>
  );
};
