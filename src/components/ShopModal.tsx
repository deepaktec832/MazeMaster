import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, Zap, Ghost, Lightbulb, Play, CheckCircle, Lock, ShieldCheck, Ban } from 'lucide-react';
import { PlayerSkinId, PowerUpInventory, SkinConfig } from '../types/maze';
import { SKINS } from '../utils/shopAndAchievements';
import { sound } from '../utils/sound';

interface ShopModalProps {
  totalCoins: number;
  activeSkin: PlayerSkinId;
  unlockedSkins: PlayerSkinId[];
  inventory: PowerUpInventory;
  hasRemoveAds?: boolean;
  onBuySkin: (skinId: PlayerSkinId, cost: number) => void;
  onSelectSkin: (skinId: PlayerSkinId) => void;
  onBuyPowerUp: (type: 'speed' | 'ghost' | 'hint', cost: number) => void;
  onBuyRemoveAds: () => void;
  onWatchAdClick: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  activeSkin,
  unlockedSkins,
  inventory,
  hasRemoveAds = false,
  onBuySkin,
  onSelectSkin,
  onBuyPowerUp,
  onBuyRemoveAds,
  onWatchAdClick,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'powerups' | 'coins'>('skins');

  const handleSkinAction = (skin: SkinConfig) => {
    const isUnlocked = unlockedSkins.includes(skin.id);
    if (isUnlocked) {
      onSelectSkin(skin.id);
      sound.playClick();
    } else {
      if (totalCoins >= skin.price) {
        onBuySkin(skin.id, skin.price);
        sound.playWin();
      } else {
        sound.playTrap();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-sm p-6 shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 rotate-45 flex items-center justify-center bg-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShoppingBag className="w-4 h-4 text-amber-500 -rotate-45" />
            </div>
            <div>
              <h2 className="text-xl font-serif tracking-widest text-amber-500 uppercase">
                Vault Emporium & Skins
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">Unlock 3D skins, artifacts, and power boosts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 rounded-sm border border-zinc-800 text-amber-400 font-mono font-bold text-xs shadow-inner">
              <span className="text-sm">✧</span>
              <span>{totalCoins} Fragments</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-sm bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('skins')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-sm transition-all ${
              activeTab === 'skins'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            3D Skins & Avatars
          </button>

          <button
            onClick={() => setActiveTab('powerups')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-sm transition-all ${
              activeTab === 'powerups'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Power-Ups
          </button>

          <button
            onClick={() => setActiveTab('coins')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-sm transition-all ${
              activeTab === 'coins'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Earn Coins / Ads
          </button>
        </div>

        {/* Tab 1: Skins Catalog */}
        {activeTab === 'skins' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(SKINS).map((skin) => {
              const isUnlocked = unlockedSkins.includes(skin.id);
              const isEquipped = activeSkin === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-sm border flex flex-col justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : isUnlocked
                      ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/60 border-zinc-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner">
                        {skin.icon}
                      </div>
                      <div>
                        <h3 className="font-serif text-sm uppercase text-amber-200 tracking-wider">
                          {skin.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-sans mt-0.5">{skin.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-1">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {skin.price === 0 ? (
                        <span className="text-emerald-400 uppercase">Default</span>
                      ) : isUnlocked ? (
                        <span className="text-zinc-500 uppercase">Unlocked</span>
                      ) : (
                        <span>✧ {skin.price} Fragments</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleSkinAction(skin)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
                        isEquipped
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500 cursor-default'
                          : isUnlocked
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 active:scale-95'
                          : totalCoins >= skin.price
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Equipped</span>
                        </>
                      ) : isUnlocked ? (
                        <span>Equip</span>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Buy Skin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Power-Ups */}
        {activeTab === 'powerups' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Speed Boost */}
            <div className="p-4 rounded-sm bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-sm uppercase text-amber-300">Speed Surge</h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Double movement velocity in maze</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Owned: {inventory.speedBoosts}</span>
                <button
                  onClick={() => onBuyPowerUp('speed', 50)}
                  disabled={totalCoins < 50}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-sm transition-all ${
                    totalCoins >= 50
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Buy (✧ 50)
                </button>
              </div>
            </div>

            {/* Ghost Step */}
            <div className="p-4 rounded-sm bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Ghost className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-sm uppercase text-amber-300">Ghost Pass</h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Phase directly through obsidian walls</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Owned: {inventory.ghostSteps}</span>
                <button
                  onClick={() => onBuyPowerUp('ghost', 75)}
                  disabled={totalCoins < 75}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-sm transition-all ${
                    totalCoins >= 75
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Buy (✧ 75)
                </button>
              </div>
            </div>

            {/* AI Compass Hint */}
            <div className="p-4 rounded-sm bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-sm uppercase text-amber-300">Compass Hint</h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Highlights direct path to vault exit</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Owned: {inventory.hintsAvailable}</span>
                <button
                  onClick={() => onBuyPowerUp('hint', 40)}
                  disabled={totalCoins < 40}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-sm transition-all ${
                    totalCoins >= 40
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Buy (✧ 40)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Monetization & Rewarded Video Ads & No Ads Pass */}
        {activeTab === 'coins' && (
          <div className="flex flex-col gap-4">
            {/* VIP No-Ads Pass Special Item */}
            <div className={`p-5 rounded-sm border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all ${
              hasRemoveAds
                ? 'bg-emerald-950/20 border-emerald-500/50'
                : 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border-amber-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-amber-500 rotate-45 flex items-center justify-center bg-zinc-950 text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <ShieldCheck className="w-6 h-6 -rotate-45 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base uppercase text-amber-300 tracking-wider">
                      Ad-Free VIP Pass
                    </h3>
                    {hasRemoveAds && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase rounded-xs">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 font-sans mt-0.5 max-w-sm">
                    Permanently disable all banner ads across the game for a 100% clean, distraction-free labyrinth experience!
                  </p>
                </div>
              </div>

              {hasRemoveAds ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase rounded-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>No Ads Enabled</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onBuyRemoveAds();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs uppercase font-bold tracking-widest rounded-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Remove Ads ($1.99 USD)</span>
                </button>
              )}
            </div>

            {/* Rewarded Video Ad Card */}
            <div className="p-5 rounded-sm bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-amber-500/60 rotate-45 flex items-center justify-center bg-zinc-950 text-amber-400 shrink-0">
                  <Play className="w-6 h-6 -rotate-45 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-serif text-base uppercase text-amber-300 tracking-wider">
                    Watch Sponsored Video Ad
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Watch a short 6-second video ad to receive +150 Soul Fragments instantly!
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onWatchAdClick();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs uppercase font-bold tracking-widest rounded-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Watch Ad (+150 Coins)</span>
              </button>
            </div>

            <div className="p-4 rounded-sm bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono leading-relaxed">
              <p className="text-amber-400 font-bold mb-1">💡 Creator Revenue Integration Notice:</p>
              In-game rewarded video ads generate simulated developer ad earnings ($0.05 per impression) while granting players free in-game currency without forcing paid microtransactions!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
