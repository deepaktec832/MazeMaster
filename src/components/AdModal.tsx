import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Sparkles, CheckCircle2, ShieldCheck, Play } from 'lucide-react';
import { sound } from '../utils/sound';
import { showAdMobRewarded, ADMOB_TEST_UNITS } from '../utils/admobService';

interface AdModalProps {
  rewardType: 'coins' | 'hint' | 'speed' | 'skip_level';
  onRewardGranted: (rewardType: 'coins' | 'hint' | 'speed' | 'skip_level', coinsAmount?: number) => void;
  onClose: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({ rewardType, onRewardGranted, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(6);
  const [isPlaying] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isNativeAdMobTriggered, setIsNativeAdMobTriggered] = useState(false);

  useEffect(() => {
    // Attempt native Capacitor AdMob Rewarded Video
    showAdMobRewarded(() => {
      setIsCompleted(true);
      sound.playWin();
    }).then((success) => {
      if (success) {
        setIsNativeAdMobTriggered(true);
      }
    });
  }, []);

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
    onRewardGranted(rewardType, rewardType === 'coins' ? 500 : 0);
    onClose();
  };

  const progressPercent = Math.min(100, Math.max(0, ((6 - timeLeft) / 6) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden text-zinc-100">
        {/* AdMob Plugin Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-zinc-950 uppercase rounded-md shadow-sm">
              Google AdMob
            </span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {isCompleted ? 'Reward Ready!' : `Capacitor Rewarded Ad (${timeLeft}s)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            {isCompleted && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video / AdMob Screen Container */}
        <div className="w-full aspect-video bg-zinc-950 rounded-xl border border-zinc-800 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 animate-pulse" />

          {!isCompleted ? (
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-amber-500/10 animate-bounce">
                <Play className="w-7 h-7 text-amber-400 fill-amber-400 translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-lg font-serif uppercase tracking-wider text-amber-300">
                  Google AdMob Rewarded Video
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mt-1 font-sans">
                  Powered by @capacitor-community/admob plugin. Watch to unlock free rewards!
                </p>
              </div>

              <div className="mt-1 px-3 py-1 bg-zinc-900/90 rounded-lg border border-amber-500/30 text-[10px] font-mono text-zinc-400">
                Unit ID: <span className="text-amber-400 font-bold">{ADMOB_TEST_UNITS.REWARDED}</span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-3 animate-scale-up">
              <div className="w-14 h-14 border-2 border-amber-500 rotate-45 flex items-center justify-center bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <CheckCircle2 className="w-8 h-8 -rotate-45" />
              </div>
              <h3 className="text-xl font-serif uppercase tracking-widest text-amber-400">
                Rewarded Ad Complete!
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                {rewardType === 'coins'
                  ? 'Claim +500 Soul Fragments Boost!'
                  : rewardType === 'skip_level'
                  ? 'Claim Level Skip Progress!'
                  : 'Claim Free Power-up!'}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Plugin Status Badge */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Plugin: @capacitor-community/admob v7.0</span>
          </div>
          <span className="text-zinc-500 font-semibold">
            {isNativeAdMobTriggered ? 'Capacitor Native SDK' : 'Plugin Test Unit'}
          </span>
        </div>

        {/* Claim Action Button */}
        <button
          onClick={handleClaimReward}
          disabled={!isCompleted}
          className={`w-full py-3.5 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            isCompleted
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isCompleted ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {rewardType === 'coins'
                  ? 'Claim +500 Fragments'
                  : rewardType === 'skip_level'
                  ? 'Claim Level Skip Progress'
                  : 'Claim Free Reward'}
              </span>
            </>
          ) : (
            <span>Watching Rewarded Video ({timeLeft}s)...</span>
          )}
        </button>
      </div>
    </div>
  );
};
