import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle2, Lock, Sparkles, Smartphone } from 'lucide-react';
import { sound } from '../utils/sound';

interface PaymentModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [method, setMethod] = useState<'card' | 'gpay' | 'applepay'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    sound.playPowerUp();

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      sound.playWin();

      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-zinc-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-400 uppercase tracking-wider">
                In-App Direct Payment
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">256-Bit SSL Encrypted Checkout</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Item Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              VIP Pass
            </span>
            <h4 className="text-sm font-serif font-bold text-zinc-100 uppercase mt-1">
              Ad-Free Lifetime Pass
            </h4>
            <p className="text-[11px] text-zinc-400 font-sans">No banner ads • 100% Clean Gameplay</p>
          </div>

          <div className="text-right">
            <span className="text-xl font-mono font-bold text-amber-400">$1.99</span>
            <span className="block text-[10px] text-zinc-500 font-mono">One-Time Fee</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-serif font-bold text-emerald-400 uppercase tracking-wider">
              Payment Successful!
            </h4>
            <p className="text-xs font-mono text-zinc-300">Ad-Free VIP Pass Activated Permanently.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition ${
                  method === 'card'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('gpay')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition ${
                  method === 'gpay'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('applepay')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition ${
                  method === 'applepay'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Apple Pay</span>
              </button>
            </div>

            {method === 'card' ? (
              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div>
                  <label className="text-zinc-400 block mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Expires (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-300">
                <span>Instant 1-Click Checkout with {method === 'gpay' ? 'Google Pay' : 'Apple Pay'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {isProcessing ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay $1.99 USD Now</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
