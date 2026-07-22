import React from 'react';
import { Wifi, Battery, Shield, Minimize2, Smartphone } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  isMobileShellActive: boolean;
  onToggleMobileShell: () => void;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  isMobileShellActive,
  onToggleMobileShell,
}) => {
  if (!isMobileShellActive) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-0 sm:p-4 relative select-none overflow-x-hidden">
      {/* Floating Toggle Controls for Desktop view */}
      <div className="hidden sm:flex fixed top-3 right-3 z-50 items-center gap-2">
        <button
          onClick={onToggleMobileShell}
          className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/40 text-amber-400 text-xs font-mono flex items-center gap-1.5 shadow-xl hover:bg-zinc-800 transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Toggle Fullscreen</span>
        </button>
      </div>

      {/* Flagship Mobile Chassis Frame (Edge-to-edge on small phones, Phone Frame on Desktop) */}
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[92vh] sm:max-h-[920px] bg-zinc-950 sm:bg-zinc-900 border-0 sm:border-[6px] border-zinc-800 rounded-none sm:rounded-[44px] shadow-none sm:shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden ring-0 sm:ring-1 sm:ring-amber-500/30">
        {/* Top Phone Status Bar / Dynamic Island */}
        <div className="w-full bg-zinc-950 px-5 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none border-b border-zinc-800/60 z-30 shrink-0">
          <span className="font-bold text-amber-400">09:41</span>
          
          {/* Camera Notch / Island */}
          <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800/90 ring-1 ring-zinc-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/80" />
          </div>

          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-zinc-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Play Store Certification Mobile Header */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/60 border-b border-emerald-500/30 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-emerald-400 z-20 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold tracking-wide">Play Store Mobile • 60 FPS HD</span>
          </div>
          <span className="text-zinc-500 font-bold">v3.0.0</span>
        </div>

        {/* Inner App Canvas Content */}
        <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar bg-zinc-950 relative flex flex-col items-center justify-start p-1 sm:p-2">
          {children}
        </div>

        {/* Bottom Gestures Home Indicator */}
        <div className="w-full bg-zinc-950 py-2 flex justify-center items-center z-30 shrink-0 border-t border-zinc-900">
          <div className="w-32 h-1 bg-zinc-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
