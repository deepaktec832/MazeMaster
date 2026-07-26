import React from 'react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  isMobileShellActive?: boolean;
  onToggleMobileShell?: () => void;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  return <div className="w-full h-screen min-h-screen bg-zinc-950 overflow-hidden font-sans relative">{children}</div>;
};
