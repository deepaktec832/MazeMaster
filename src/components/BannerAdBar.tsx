import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface BannerAdBarProps {
  onWatchAdClick: () => void;
}

export const BannerAdBar: React.FC<BannerAdBarProps> = ({ onWatchAdClick }) => {
  return (
    <div className="w-full max-w-2xl bg-zinc-950/90 border border-amber-500/30 rounded-sm p-2.5 shadow-xl flex items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase shrink-0">
          SPONSORED
        </span>
        <span className="text-zinc-300 truncate">
          Need extra coins or hints? Watch a 6s ad to receive +150 Soul Fragments!
        </span>
      </div>

      <button
        onClick={onWatchAdClick}
        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-wider rounded-sm shadow-md transition-all shrink-0 flex items-center gap-1 active:scale-95"
      >
        <Play className="w-3 h-3 fill-zinc-950" />
        <span>Watch (+150)</span>
      </button>
    </div>
  );
};
