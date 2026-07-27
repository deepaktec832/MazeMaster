import React, { useEffect, useRef } from 'react';
import { Cell, Enemy3D } from '../types/maze';
import * as THREE from 'three';
import { Compass } from 'lucide-react';

interface MiniMapRadarProps {
  grid: Cell[][];
  rows: number;
  cols: number;
  isNightMode?: boolean;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  cameraYawRef: React.RefObject<number>;
  itemMeshesRef: React.RefObject<Map<string, THREE.Mesh | THREE.Group>>;
  enemiesRef: React.RefObject<Enemy3D[]>;
  size?: number;
}

export const MiniMapRadar: React.FC<MiniMapRadarProps> = ({
  grid,
  rows,
  cols,
  isNightMode = false,
  cameraRef,
  cameraYawRef,
  itemMeshesRef,
  enemiesRef,
  size = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Radar Backdrop
      ctx.fillStyle = isNightMode ? 'rgba(2, 4, 10, 0.95)' : 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, 0, w, h);

      const tileSize3D = 3.0;
      const playerX = cameraRef.current?.position.x ?? 1.5;
      const playerZ = cameraRef.current?.position.z ?? 1.5;

      const scale = w / (cols * tileSize3D);

      // Maze Wall Grid
      ctx.fillStyle = isNightMode ? '#334155' : '#475569';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const wx = c * tileSize3D * scale;
          const wz = r * tileSize3D * scale;
          const wSize = tileSize3D * scale;

          if (cell.walls.top && r === 0) ctx.fillRect(wx, wz, wSize, 2);
          if (cell.walls.bottom) ctx.fillRect(wx, wz + wSize - 2, wSize, 2);
          if (cell.walls.left && c === 0) ctx.fillRect(wx, wz, 2, wSize);
          if (cell.walls.right) ctx.fillRect(wx + wSize - 2, wz, 2, wSize);
        }
      }

      // Key Items & Goal Exit Portal
      if (itemMeshesRef.current) {
        itemMeshesRef.current.forEach((group, keyId) => {
          if (!group.visible) return;
          const ix = group.position.x * scale;
          const iz = group.position.z * scale;

          if (keyId.startsWith('key_')) {
            // Golden Key Icon
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(ix, iz, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (keyId === 'portal_exit' || keyId.startsWith('exit_')) {
            // Cyan Exit Portal / Goal
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 6;
            ctx.fillRect(ix - 4, iz - 4, 8, 8);
            ctx.shadowBlur = 0;
          }
        });
      }

      // Enemies (Minotaurs / Monsters / Stalkers)
      if (enemiesRef.current) {
        enemiesRef.current.forEach((enemy) => {
          if (enemy.hp <= 0 && !enemy.isDying) return;
          const ex = enemy.x * scale;
          const ez = enemy.z * scale;

          if (enemy.hasLineOfSight) {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = enemy.type === 'minotaur_beast' ? '#f59e0b' : '#38bdf8';
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.arc(ex, ez, enemy.hasLineOfSight ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Player Person Position & Vision Direction Cone
      const px = playerX * scale;
      const pz = playerZ * scale;

      const yaw = cameraYawRef.current ?? 0;
      const dirX = -Math.sin(yaw);
      const dirZ = -Math.cos(yaw);

      // Vision direction line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.lineTo(px + dirX * 14, pz + dirZ * 14);
      ctx.stroke();

      // Vision cone wedge
      const fovAngle = 0.45;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.arc(px, pz, 14, yaw - Math.PI / 2 - fovAngle, yaw - Math.PI / 2 + fovAngle);
      ctx.closePath();
      ctx.fill();

      // Player Person Dot
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(px, pz, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outer ring for player
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, pz, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [grid, rows, cols, isNightMode, cameraRef, cameraYawRef, itemMeshesRef, enemiesRef]);

  return (
    <div className="relative p-1 bg-zinc-950/90 border-2 border-amber-500/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg bg-zinc-950 block"
      />
      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 text-[9px] text-amber-400 font-bold uppercase rounded flex items-center gap-1 border border-amber-500/30">
        <Compass className="w-2.5 h-2.5 text-amber-400" />
        RADAR
      </div>
    </div>
  );
};
