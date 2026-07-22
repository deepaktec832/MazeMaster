import React from 'react';

interface MazeMasterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const MazeMasterLogo: React.FC<MazeMasterLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0 group`}>
        {/* Glow backdrop */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 rounded-lg blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>

        {/* Isometric 3D Maze Emblem */}
        <svg
          viewBox="0 0 100 100"
          className="relative w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rounded Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="18"
            fill="url(#darkBg)"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
          />

          {/* Isometric Labyrinth Pattern */}
          <path
            d="M 22 22 H 78 V 78 H 22 Z"
            stroke="url(#goldGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />

          <path
            d="M 34 34 H 66 V 66 H 34 Z"
            stroke="url(#goldGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />

          {/* Maze Corridors */}
          <path
            d="M 34 22 V 34 M 66 34 V 46 M 50 66 V 78 M 22 50 H 34 M 66 66 H 78"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Center Glowing Core Orb */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#goldGradient)"
            filter="url(#neonGlow)"
          />

          {/* Pulse center highlight */}
          <circle cx="48" cy="48" r="3" fill="#ffffff" opacity="0.8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-serif font-bold text-amber-500 tracking-widest uppercase leading-none text-xl sm:text-2xl drop-shadow">
            MazeMaster
          </span>
          <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
            3D Labyrinth
          </span>
        </div>
      )}
    </div>
  );
};
