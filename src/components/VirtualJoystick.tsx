import React, { useRef, useState, useEffect } from 'react';
import { sound } from '../utils/sound';

interface VirtualJoystickProps {
  onMove: (direction: 'top' | 'right' | 'bottom' | 'left') => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastTriggerRef = useRef<number>(0);

  const radius = 40; // Max drag radius in px

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let finalX = dx;
    let finalY = dy;

    if (dist > radius) {
      const angle = Math.atan2(dy, dx);
      finalX = Math.cos(angle) * radius;
      finalY = Math.sin(angle) * radius;
    }

    setKnobPos({ x: finalX, y: finalY });

    // Direction detection threshold
    if (dist > 14) {
      const now = Date.now();
      // Throttle movement triggers every 140ms
      if (now - lastTriggerRef.current > 140) {
        lastTriggerRef.current = now;
        if (Math.abs(finalX) > Math.abs(finalY)) {
          if (finalX > 0) onMove('right');
          else onMove('left');
        } else {
          if (finalY > 0) onMove('bottom');
          else onMove('top');
        }

        // Haptic feedback if available on mobile
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-28 h-28 rounded-full bg-zinc-950/80 border-2 border-amber-500/40 shadow-2xl flex items-center justify-center touch-none select-none active:border-amber-400 ${className}`}
    >
      {/* Direction Guide Ring */}
      <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />

      {/* Crosshair accents */}
      <div className="absolute w-full h-[1px] bg-zinc-800/40 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-zinc-800/40 pointer-events-none" />

      {/* Floating Thumbstick Knob */}
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center justify-center text-zinc-950 font-bold transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-yellow-100 shadow-inner" />
      </div>
    </div>
  );
};
