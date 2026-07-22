import React, { useEffect, useRef, useState } from 'react';
import { Cell, GameMode, PlayerSkinId, Position, ThemeConfig } from '../types/maze';
import { SKINS } from '../utils/shopAndAchievements';
import { Box, Eye, Layers, Sparkles, Navigation } from 'lucide-react';

interface MazeBoardProps {
  grid: Cell[][];
  rows: number;
  cols: number;
  playerPos: Position;
  goalPos: Position;
  monsterPos?: Position | null;
  theme: ThemeConfig;
  gameMode: GameMode;
  hintPath: Position[];
  fogRadius?: number;
  unlockedKeys: number;
  hasGhostMode: boolean;
  activeSkin?: PlayerSkinId;
  is3DView?: boolean;
  onToggle3D?: () => void;
  onMove?: (direction: 'top' | 'right' | 'bottom' | 'left') => void;
  onTileClick?: (row: number, col: number) => void;
}

export const MazeBoard: React.FC<MazeBoardProps> = ({
  grid,
  rows,
  cols,
  playerPos,
  goalPos,
  monsterPos,
  theme,
  gameMode,
  hintPath,
  fogRadius = 3,
  unlockedKeys,
  hasGhostMode,
  activeSkin = 'classic_orb',
  is3DView = true,
  onToggle3D,
  onMove,
  onTileClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<'3d' | '2d' | 'chase'>('3d');

  // Touch Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid || grid.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size based on container
    const container = containerRef.current;
    const maxDim = container ? Math.min(container.clientWidth - 20, container.clientHeight - 20, 750) : 600;
    const tileSize = Math.max(12, Math.floor(maxDim / Math.max(rows, cols)));

    const canvasWidth = cols * tileSize;
    const canvasHeight = rows * tileSize;

    // Handle High DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx.scale(dpr, dpr);

    // Render background with subtle gradient
    const bgGrad = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      10,
      canvasWidth / 2,
      canvasHeight / 2,
      canvasWidth
    );
    bgGrad.addColorStop(0, theme.bgColor);
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Precalculate fog visibility matrix
    const visibleMatrix: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    if (gameMode === 'fog-of-war') {
      const radius = fogRadius + (hasGhostMode ? 1 : 0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dist = Math.hypot(r - playerPos.row, c - playerPos.col);
          if (dist <= radius) {
            visibleMatrix[r][c] = true;
          }
        }
      }
      visibleMatrix[goalPos.row][goalPos.col] = true;
    } else {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          visibleMatrix[r][c] = true;
        }
      }
    }

    // Draw floor paths & grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        if (!visibleMatrix[r][c]) {
          ctx.fillStyle = '#030712'; // Pitch black fog
          ctx.fillRect(x, y, tileSize, tileSize);
          continue;
        }

        // 3D Floor Tile Gradient & Bevel
        const gradient = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        gradient.addColorStop(0, theme.pathColor);
        gradient.addColorStop(1, adjustColor(theme.pathColor, -15));
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Draw subtle grid lines
        ctx.strokeStyle = theme.gridLineColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, tileSize, tileSize);

        const cell = grid[r][c];

        // Draw items if visible
        if (cell.item) {
          drawItem(ctx, cell.item, x, y, tileSize, unlockedKeys);
        }
      }
    }

    // Draw AI Hint Path if active
    if (hintPath && hintPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = Math.max(3, tileSize * 0.25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([tileSize * 0.2, tileSize * 0.15]);

      hintPath.forEach((pt, index) => {
        const px = pt.col * tileSize + tileSize / 2;
        const py = pt.row * tileSize + tileSize / 2;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]); // reset line dash
    }

    // Draw 3D Extruded Walls
    const wallThick = Math.max(2, Math.floor(tileSize * 0.14));
    const is3D = cameraMode === '3d';
    const depthOffset = is3D ? Math.max(3, Math.floor(tileSize * 0.18)) : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visibleMatrix[r][c]) continue;
        const cell = grid[r][c];
        const x = c * tileSize;
        const y = r * tileSize;

        // Draw 3D Wall Drop Shadows / Depth Extrusion
        if (is3D) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          if (cell.walls.top) ctx.fillRect(x, y + depthOffset, tileSize, wallThick);
          if (cell.walls.bottom) ctx.fillRect(x, y + tileSize + depthOffset, tileSize, wallThick);
          if (cell.walls.left) ctx.fillRect(x + depthOffset, y, wallThick, tileSize);
          if (cell.walls.right) ctx.fillRect(x + tileSize + depthOffset, y, wallThick, tileSize);
        }

        ctx.strokeStyle = theme.wallColor;
        ctx.lineWidth = wallThick;
        ctx.lineCap = 'round';

        if (theme.wallGlow) {
          ctx.shadowColor = theme.wallColor;
          ctx.shadowBlur = Math.min(10, tileSize * 0.35);
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (cell.walls.top) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + tileSize, y);
        }
        if (cell.walls.right) {
          ctx.moveTo(x + tileSize, y);
          ctx.lineTo(x + tileSize, y + tileSize);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(x, y + tileSize);
          ctx.lineTo(x + tileSize, y + tileSize);
        }
        if (cell.walls.left) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + tileSize);
        }
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0; // Reset glow

    // Draw Goal (Exit Vault / Trophy)
    if (visibleMatrix[goalPos.row][goalPos.col]) {
      const gx = goalPos.col * tileSize + tileSize / 2;
      const gy = goalPos.row * tileSize + tileSize / 2;
      const gRadius = tileSize * 0.35;

      ctx.save();
      ctx.shadowColor = theme.goalColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = theme.goalColor;

      ctx.beginPath();
      ctx.arc(gx, gy, gRadius, 0, Math.PI * 2);
      ctx.fill();

      // Goal Trophy icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(tileSize * 0.45)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆', gx, gy);
      ctx.restore();
    }

    // Draw Monster if present
    if (monsterPos && visibleMatrix[monsterPos.row][monsterPos.col]) {
      const mx = monsterPos.col * tileSize + tileSize / 2;
      const my = monsterPos.row * tileSize + tileSize / 2;

      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#dc2626';

      ctx.beginPath();
      ctx.arc(mx, my, tileSize * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(tileSize * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👾', mx, my);
      ctx.restore();
    }

    // Draw 3D Player Character & Active Skin
    const px = playerPos.col * tileSize + tileSize / 2;
    const py = playerPos.row * tileSize + tileSize / 2;

    drawSkinAvatar(ctx, activeSkin as PlayerSkinId, px, py, tileSize, theme, hasGhostMode);

  }, [
    grid,
    rows,
    cols,
    playerPos,
    goalPos,
    monsterPos,
    theme,
    gameMode,
    hintPath,
    fogRadius,
    unlockedKeys,
    hasGhostMode,
    activeSkin,
    cameraMode,
  ]);

  // Touch Swipe Gesture Controls
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !onMove || e.changedTouches.length === 0) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    const minDistance = 18;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minDistance) {
        onMove(dx > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(dy) > minDistance) {
        onMove(dy > 0 ? 'bottom' : 'top');
      }
    }
    touchStartRef.current = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTileClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileSize = rect.width / cols;
    const clickCol = Math.floor(x / tileSize);
    const clickRow = Math.floor(y / tileSize);

    if (clickRow >= 0 && clickRow < rows && clickCol >= 0 && clickCol < cols) {
      onTileClick(clickRow, clickCol);
    }
  };

  // Determine transform class based on camera mode
  const getCameraTransform = () => {
    switch (cameraMode) {
      case '3d':
        return '[transform:perspective(900px)_rotateX(30deg)_rotateZ(-6deg)] drop-shadow-[0_25px_30px_rgba(0,0,0,0.95)]';
      case 'chase':
        return '[transform:perspective(800px)_rotateX(42deg)_rotateZ(0deg)] scale-110 drop-shadow-[0_20px_25px_rgba(0,0,0,0.9)]';
      case '2d':
      default:
        return 'drop-shadow-2xl';
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full flex flex-col items-center justify-center p-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-2xl relative overflow-hidden select-none"
    >
      {/* 3D Perspective Control Overlay Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 shadow-xl">
        <button
          onClick={() => setCameraMode('3d')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 ${
            cameraMode === '3d'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Iso</span>
        </button>

        <button
          onClick={() => setCameraMode('chase')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 ${
            cameraMode === 'chase'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Chase</span>
        </button>

        <button
          onClick={() => setCameraMode('2d')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 ${
            cameraMode === '2d'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D Plan</span>
        </button>
      </div>

      {/* Canvas Viewport with Dynamic CSS Transform Camera View */}
      <div className={`transition-all duration-500 my-2 ${getCameraTransform()}`}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-pointer rounded-xl shadow-2xl touch-none border border-zinc-800/80"
        />
      </div>

      {/* Touch Swipe Indicator Hint */}
      <div className="mt-1 text-[10px] font-mono text-zinc-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Swipe screen or tap tiles to move player</span>
      </div>
    </div>
  );
};

// Helper to draw custom 3D player skins
function drawSkinAvatar(
  ctx: CanvasRenderingContext2D,
  skinId: PlayerSkinId,
  px: number,
  py: number,
  tileSize: number,
  theme: ThemeConfig,
  hasGhostMode: boolean
) {
  const radius = tileSize * 0.38;
  const skin = SKINS[skinId as PlayerSkinId] || SKINS.classic_orb;

  ctx.save();

  // Glow shadow
  ctx.shadowColor = hasGhostMode ? '#a855f7' : skin.trailColor || theme.playerColor;
  ctx.shadowBlur = 18;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(px, py + radius * 0.8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (skinId === 'cyber_cube') {
    // 3D Matrix Cube
    ctx.fillStyle = hasGhostMode ? '#a855f7' : '#06b6d4';
    ctx.fillRect(px - radius * 0.7, py - radius * 0.7, radius * 1.4, radius * 1.4);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - radius * 0.7, py - radius * 0.7, radius * 1.4, radius * 1.4);
  } else if (skinId === 'obsidian_golem') {
    // Magma Core Golem
    ctx.fillStyle = hasGhostMode ? '#a855f7' : '#ef4444';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Spherical base gradient
    const grad = ctx.createRadialGradient(
      px - radius * 0.3,
      py - radius * 0.3,
      radius * 0.1,
      px,
      py,
      radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, hasGhostMode ? '#a855f7' : theme.playerColor);
    grad.addColorStop(1, '#09090b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw skin emoji / icon emblem
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(tileSize * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hasGhostMode ? '👻' : skin.icon, px, py);

  ctx.restore();
}

function drawItem(
  ctx: CanvasRenderingContext2D,
  item: string,
  x: number,
  y: number,
  size: number,
  unlockedKeys: number
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const fontSize = Math.floor(size * 0.55);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontSize}px sans-serif`;

  switch (item) {
    case 'coin':
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillText('✧', cx, cy);
      break;
    case 'key':
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillText('🔑', cx, cy);
      break;
    case 'door':
      ctx.shadowColor = unlockedKeys > 0 ? '#22c55e' : '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fillText(unlockedKeys > 0 ? '🔓' : '🔒', cx, cy);
      break;
    case 'speed':
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
      ctx.fillText('⚡', cx, cy);
      break;
    case 'ghost':
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.fillText('👻', cx, cy);
      break;
    case 'portal':
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 14;
      ctx.fillText('🌀', cx, cy);
      break;
    case 'trap':
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.fillText('💥', cx, cy);
      break;
  }
  ctx.restore();
}

function adjustColor(hex: string, amount: number) {
  let usePound = false;
  if (hex[0] === '#') {
    hex = hex.slice(1);
    usePound = true;
  }
  const num = parseInt(hex, 16);
  let r = (num >> 16) + amount;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00ff) + amount;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000ff) + amount;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}
