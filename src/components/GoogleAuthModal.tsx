import React, { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle2, Cloud, Sparkles, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logoutUser } from '../utils/firebase';
import { sound } from '../utils/sound';

interface GoogleAuthModalProps {
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  onClose: () => void;
  totalCoins: number;
  totalStars: number;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  currentUser,
  onUserChanged,
  onClose,
  totalCoins,
  totalStars,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      sound.playButtonClick();
      const user = await signInWithGoogle();
      if (user) {
        sound.playWin();
        onUserChanged(user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      sound.playButtonClick();
      await logoutUser();
      onUserChanged(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative text-zinc-100 overflow-hidden">
        {/* Glow Header Background */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-bold tracking-wider text-amber-400 uppercase">
              Google Cloud Save & Play
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          /* Signed In State */
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5 p-4 bg-zinc-950 rounded-xl border border-amber-500/30">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  className="w-12 h-12 rounded-full border-2 border-amber-400 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-zinc-100 text-sm truncate">
                    {currentUser.displayName || 'Maze Master Player'}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-zinc-400 truncate font-mono">{currentUser.email}</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Cloud Sync Active</span>
                </div>
              </div>
            </div>

            {/* Sync Perks */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Achievements & Rewards</span>
              </div>
              <p className="text-zinc-300 font-sans leading-relaxed">
                Your level completions, total stars (⭐ {totalStars}), fragments (✧ {totalCoins}), and 3D skin unlocks are automatically synced to Google Cloud!
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Google</span>
            </button>
          </div>
        ) : (
          /* Signed Out State */
          <div className="flex flex-col gap-4 text-center">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner my-1">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-bold text-zinc-100 text-sm uppercase tracking-wide">
                Connect Google Account
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs">
                Sign in with Google to backup your level progress, unlock Google achievements, and earn a <span className="text-amber-400 font-bold">+250 Fragment bonus</span>!
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg text-left">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition transform active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
