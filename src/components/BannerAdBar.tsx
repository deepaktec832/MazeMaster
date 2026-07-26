import React, { useEffect } from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import { showAdMobBanner, hideAdMobBanner, ADMOB_TEST_UNITS } from '../utils/admobService';

interface BannerAdBarProps {
  onWatchAdClick: () => void;
}

export const BannerAdBar: React.FC<BannerAdBarProps> = ({ onWatchAdClick }) => {
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        showAdMobBanner();
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      hideAdMobBanner();
    };
  }, []);

  return (
    <div className="w-full max-w-2xl bg-zinc-950/90 border border-amber-500/30 rounded-xl p-2.5 shadow-xl flex items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500 text-zinc-950 uppercase rounded-md shrink-0 flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3" />
          <span>AdMob Banner</span>
        </span>
        <span className="text-zinc-300 truncate">
          Unit: <strong className="text-amber-400">{ADMOB_TEST_UNITS.BANNER}</strong> • Watch rewarded ad for +150 Fragments!
        </span>
      </div>

      <button
        onClick={onWatchAdClick}
        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-wider rounded-lg shadow-md transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 fill-zinc-950" />
        <span>Watch (+150)</span>
      </button>
    </div>
  );
};
