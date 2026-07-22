import React, { useState } from 'react';
import { Cell, Position, ItemType } from '../types/maze';
import { createEmptyGrid } from '../utils/mazeGenerator';
import { Play, RotateCcw, Sparkles, Download, Upload, Check } from 'lucide-react';

interface MazeEditorProps {
  onPlayCustomMaze: (grid: Cell[][], start: Position, goal: Position) => void;
  onBackToMenu: () => void;
}

type ToolType = 'wall' | 'start' | 'goal' | 'key' | 'door' | 'portal' | 'coin';

export const MazeEditor: React.FC<MazeEditorProps> = ({ onPlayCustomMaze, onBackToMenu }) => {
  const [size, setSize] = useState<number>(11);
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(11, 11));
  const [startPos, setStartPos] = useState<Position>({ row: 0, col: 0 });
  const [goalPos, setGoalPos] = useState<Position>({ row: 10, col: 10 });
  const [activeTool, setActiveTool] = useState<ToolType>('wall');

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setGrid(createEmptyGrid(newSize, newSize));
    setStartPos({ row: 0, col: 0 });
    setGoalPos({ row: newSize - 1, col: newSize - 1 });
  };

  const handleCellClick = (r: number, c: number) => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell, walls: { ...cell.walls } })));
    const cell = newGrid[r][c];

    if (activeTool === 'start') {
      setStartPos({ row: r, col: c });
    } else if (activeTool === 'goal') {
      setGoalPos({ row: r, col: c });
    } else if (activeTool === 'wall') {
      // Toggle all 4 walls or make cell blocked
      const isBlocked = cell.walls.top && cell.walls.right && cell.walls.bottom && cell.walls.left;
      if (isBlocked) {
        cell.walls = { top: false, right: false, bottom: false, left: false };
      } else {
        cell.walls = { top: true, right: true, bottom: true, left: true };
      }
    } else {
      // Items
      cell.item = cell.item === activeTool ? undefined : (activeTool as ItemType);
    }

    setGrid(newGrid);
  };

  const handleClear = () => {
    setGrid(createEmptyGrid(size, size));
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl p-4 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl text-slate-100">
      <div className="flex items-center justify-between w-full border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Maze Creator & Studio
          </h2>
          <p className="text-xs text-slate-400">Design your own custom maze, place items & play!</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToMenu}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Exit Studio
          </button>
          <button
            onClick={() => onPlayCustomMaze(grid, startPos, goalPos)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Play Test
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
        {/* Grid Size selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">Size:</span>
          {[9, 11, 15, 19].map((s) => (
            <button
              key={s}
              onClick={() => handleSizeChange(s)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                size === s
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {s}x{s}
            </button>
          ))}
        </div>

        {/* Tools picker */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'wall', label: 'Wall / Block', icon: '🧱' },
            { id: 'start', label: 'Start Point', icon: '🚀' },
            { id: 'goal', label: 'Goal Flag', icon: '🏆' },
            { id: 'coin', label: 'Coin', icon: '🪙' },
            { id: 'key', label: 'Key', icon: '🔑' },
            { id: 'door', label: 'Lock Door', icon: '🔒' },
            { id: 'portal', label: 'Portal', icon: '🌀' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as ToolType)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 border transition-all ${
                activeTool === tool.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Grid
        </button>
      </div>

      {/* Editor Grid Canvas Area */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner overflow-auto max-w-full">
        <div
          className="grid gap-1 bg-slate-900 p-2 rounded-xl border border-slate-800"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isStart = startPos.row === r && startPos.col === c;
              const isGoal = goalPos.row === r && goalPos.col === c;
              const isBlocked = cell.walls.top && cell.walls.right && cell.walls.bottom && cell.walls.left;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${
                    isBlocked
                      ? 'bg-slate-800 border-slate-700 text-slate-600'
                      : isStart
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : isGoal
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-950 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  {isStart ? '🚀' : isGoal ? '🏆' : cell.item === 'coin' ? '🪙' : cell.item === 'key' ? '🔑' : cell.item === 'door' ? '🔒' : cell.item === 'portal' ? '🌀' : isBlocked ? '🧱' : ''}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
