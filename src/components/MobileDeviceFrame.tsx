import React, { useState } from 'react';
import { Smartphone, Wifi, Battery, Play, Shield, Maximize2, Minimize2 } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-4 relative select-none overflow-x-hidden">
      {/* Floating Toggle Controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <button
          onClick={onToggleMobileShell}
          className="px-3 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/40 text-amber-400 text-xs font-mono flex items-center gap-1.5 shadow-xl hover:bg-zinc-800 transition"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Mobile Shell</span>
        </button>
      </div>

      {/* Flagship Mobile Chassis Frame */}
      <div className="relative w-full max-w-[440px] h-[92vh] max-h-[920px] bg-zinc-900 border-[6px] border-zinc-800 rounded-[42px] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-1 ring-amber-500/20">
        {/* Top Phone Notch / Dynamic Island */}
        <div className="w-full bg-zinc-950 px-6 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none border-b border-zinc-800/50 z-30">
          <span>09:41</span>
          {/* Camera Notch */}
          <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-zinc-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-zinc-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Play Store Certification Banner */}
        <div className="bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-emerald-900/40 border-b border-emerald-500/30 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-emerald-400 z-20">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Google Play Verified • 60 FPS HD</span>
          </div>
          <span className="text-zinc-500">v2.5.0</span>
        </div>

        {/* Inner App Canvas Content */}
        <div className="flex-1 w-full h-full overflow-y-auto bg-zinc-950 relative flex flex-col items-center justify-start p-1">
          {children}
        </div>

        {/* Bottom Phone Gestures Home Bar */}
        <div className="w-full bg-zinc-950 py-2 flex justify-center items-center z-30">
          <div className="w-32 h-1 bg-zinc-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
