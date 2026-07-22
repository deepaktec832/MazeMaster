import React, { useState } from 'react';
import { Gift, Sparkles, X, RotateCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (reward: { type: 'coins' | 'speed' | 'ghost' | 'hints'; amount: number }) => void;
}

const REWARDS = [
  { id: 1, type: 'coins', amount: 150, label: '150 Fragments', icon: '✧', color: 'from-amber-500 to-yellow-300' },
  { id: 2, type: 'speed', amount: 2, label: '+2 Speed Boosts', icon: '⚡', color: 'from-blue-500 to-cyan-300' },
  { id: 3, type: 'coins', amount: 300, label: '300 Fragments', icon: '✧', color: 'from-amber-400 to-orange-500' },
  { id: 4, type: 'ghost', amount: 2, label: '+2 Ghost Modes', icon: '👻', color: 'from-purple-500 to-pink-400' },
  { id: 5, type: 'hints', amount: 3, label: '+3 AI Hints', icon: '💡', color: 'from-emerald-400 to-teal-300' },
  { id: 6, type: 'coins', amount: 500, label: 'JACKPOT: 500', icon: '👑', color: 'from-yellow-300 via-amber-500 to-red-500' },
];

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [claimedReward, setClaimedReward] = useState<typeof REWARDS[0] | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || claimedReward) return;
    sound.playButtonClick();
    setIsSpinning(true);

    // Pick random reward
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const selected = REWARDS[randomIndex];

    // Calculate rotation: 5 full spins + slice angle offset
    const sliceDegrees = 360 / REWARDS.length;
    const targetDegrees = 360 * 5 + (REWARDS.length - randomIndex) * sliceDegrees - sliceDegrees / 2;

    setRotation(targetDegrees);

    setTimeout(() => {
      setIsSpinning(false);
      setClaimedReward(selected);
      sound.playWin();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClaimReward({
        type: selected.type as 'coins' | 'speed' | 'ghost' | 'hints',
        amount: selected.amount,
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-zinc-100 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
          <h2 className="text-2xl font-serif font-bold text-amber-400 tracking-wider uppercase">
            Daily Lucky Wheel
          </h2>
        </div>
        <p className="text-xs font-mono text-zinc-400 text-center mb-6">
          Spin the obsidian wheel to claim your daily play rewards!
        </p>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 my-2 flex items-center justify-center">
          {/* Wheel Pointer */}
          <div className="absolute -top-3 z-20 text-amber-400 text-2xl drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]">
            ▼
          </div>

          {/* Animated Spinner Disc */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15,0.9,0.25,1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {REWARDS.map((item, idx) => {
              const angle = (360 / REWARDS.length) * idx;
              return (
                <div
                  key={item.id}
                  className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left flex items-center justify-center p-2 text-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                  }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${item.color} opacity-90 flex items-center justify-center`}
                  >
                    <span className="text-xl drop-shadow">{item.icon}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute w-16 h-16 rounded-full bg-zinc-950 border-2 border-amber-400 flex items-center justify-center z-10 shadow-lg">
            <Sparkles className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        {/* Result Message or Spin CTA */}
        {claimedReward ? (
          <div className="mt-6 flex flex-col items-center gap-2 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span>Claimed: {claimedReward.label}!</span>
            </div>
            <button
              onClick={() => {
                sound.playButtonClick();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold tracking-wider uppercase shadow-lg shadow-amber-500/30 transition transform active:scale-95"
            >
              Continue Play
            </button>
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`mt-6 px-8 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 text-zinc-950 shadow-xl transition-all ${
              isSpinning
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:scale-105 active:scale-95 shadow-amber-500/30'
            }`}
          >
            <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Spinning...' : 'Spin Daily Wheel'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
