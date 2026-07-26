import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, Zap, Shield, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface PuzzleGamesModalProps {
  onClose: () => void;
  onAwardCoins: (amount: number) => void;
  onUnlockAchievement?: (id: string) => void;
}

type PuzzleTab = 'laser' | 'ice' | 'color';

// Laser mirror cell type
interface LaserCell {
  row: number;
  col: number;
  type: 'empty' | 'wall' | 'emitter' | 'target' | 'mirror_slash' | 'mirror_backslash';
  emitterDir?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  isLit?: boolean;
}

export const PuzzleGamesModal: React.FC<PuzzleGamesModalProps> = ({
  onClose,
  onAwardCoins,
  onUnlockAchievement,
}) => {
  const [activeTab, setActiveTab] = useState<PuzzleTab>('laser');
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);

  // --- LASER PUZZLE STATE ---
  const [laserGrid, setLaserGrid] = useState<LaserCell[][]>([]);
  const [laserPath, setLaserPath] = useState<{ row: number; col: number }[]>([]);

  // Sample Laser Level Layouts
  const LASER_LEVELS = [
    {
      size: 5,
      emitter: { row: 0, col: 0, dir: 'RIGHT' as const },
      target: { row: 4, col: 4 },
      walls: [{ row: 0, col: 3 }, { row: 2, col: 1 }],
      allowedMirrors: 2,
    },
    {
      size: 6,
      emitter: { row: 1, col: 0, dir: 'RIGHT' as const },
      target: { row: 5, col: 5 },
      walls: [{ row: 1, col: 3 }, { row: 3, col: 2 }, { row: 4, col: 4 }],
      allowedMirrors: 3,
    },
    {
      size: 6,
      emitter: { row: 0, col: 2, dir: 'DOWN' as const },
      target: { row: 5, col: 0 },
      walls: [{ row: 2, col: 2 }, { row: 4, col: 1 }],
      allowedMirrors: 4,
    },
  ];

  // Initialize Laser Level
  const initLaserLevel = (idx: number) => {
    const config = LASER_LEVELS[idx % LASER_LEVELS.length];
    const grid: LaserCell[][] = [];
    for (let r = 0; r < config.size; r++) {
      const row: LaserCell[] = [];
      for (let c = 0; c < config.size; c++) {
        row.push({ row: r, col: c, type: 'empty' });
      }
      grid.push(row);
    }

    // Set emitter and target
    grid[config.emitter.row][config.emitter.col] = {
      row: config.emitter.row,
      col: config.emitter.col,
      type: 'emitter',
      emitterDir: config.emitter.dir,
    };
    grid[config.target.row][config.target.col] = {
      row: config.target.row,
      col: config.target.col,
      type: 'target',
    };

    // Set walls
    config.walls.forEach((w) => {
      if (grid[w.row] && grid[w.row][w.col]) {
        grid[w.row][w.col].type = 'wall';
      }
    });

    setLaserGrid(grid);
    setSolved(false);
  };

  // Recalculate Laser Path
  useEffect(() => {
    if (activeTab !== 'laser' || laserGrid.length === 0) return;

    const config = LASER_LEVELS[levelIndex % LASER_LEVELS.length];
    let currR = config.emitter.row;
    let currC = config.emitter.col;
    let dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = config.emitter.dir;

    const path: { row: number; col: number }[] = [];
    let hitsTarget = false;
    let steps = 0;

    while (steps < 40) {
      path.push({ row: currR, col: currC });

      // Calculate next step
      let nextR = currR;
      let nextC = currC;
      if (dir === 'UP') nextR--;
      if (dir === 'DOWN') nextR++;
      if (dir === 'LEFT') nextC--;
      if (dir === 'RIGHT') nextC++;

      // Check bounds
      if (nextR < 0 || nextR >= laserGrid.length || nextC < 0 || nextC >= laserGrid[0].length) {
        break;
      }

      const cell = laserGrid[nextR][nextC];
      if (cell.type === 'wall') {
        break;
      } else if (cell.type === 'target') {
        path.push({ row: nextR, col: nextC });
        hitsTarget = true;
        break;
      } else if (cell.type === 'mirror_slash') {
        // '/' mirror
        if (dir === 'RIGHT') dir = 'UP';
        else if (dir === 'LEFT') dir = 'DOWN';
        else if (dir === 'UP') dir = 'RIGHT';
        else if (dir === 'DOWN') dir = 'LEFT';
      } else if (cell.type === 'mirror_backslash') {
        // '\' mirror
        if (dir === 'RIGHT') dir = 'DOWN';
        else if (dir === 'LEFT') dir = 'UP';
        else if (dir === 'UP') dir = 'LEFT';
        else if (dir === 'DOWN') dir = 'RIGHT';
      }

      currR = nextR;
      currC = nextC;
      steps++;
    }

    setLaserPath(path);

    if (hitsTarget && !solved) {
      setSolved(true);
      sound.playWin();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onAwardCoins(200);
      if (onUnlockAchievement) {
        onUnlockAchievement('laser_puzzle_solver');
      }
    }
  }, [laserGrid, activeTab, levelIndex]);

  const toggleLaserCell = (r: number, c: number) => {
    sound.playButtonClick();
    setLaserGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      const target = next[r][c];
      if (target.type === 'empty') {
        target.type = 'mirror_slash';
      } else if (target.type === 'mirror_slash') {
        target.type = 'mirror_backslash';
      } else if (target.type === 'mirror_backslash') {
        target.type = 'empty';
      }
      return next;
    });
  };

  // --- ICE SLIDER PUZZLE STATE ---
  const ICE_LEVELS = [
    {
      size: 6,
      start: { row: 0, col: 0 },
      exit: { row: 5, col: 5 },
      rocks: [{ row: 1, col: 2 }, { row: 3, col: 4 }, { row: 4, col: 1 }],
      keySwitch: { row: 2, col: 5 },
    },
    {
      size: 7,
      start: { row: 1, col: 1 },
      exit: { row: 6, col: 6 },
      rocks: [{ row: 1, col: 4 }, { row: 2, col: 2 }, { row: 5, col: 3 }],
      keySwitch: { row: 4, col: 6 },
    },
  ];

  const [icePos, setIcePos] = useState({ row: 0, col: 0 });
  const [iceKeyActivated, setIceKeyActivated] = useState(false);

  const initIceLevel = (idx: number) => {
    const config = ICE_LEVELS[idx % ICE_LEVELS.length];
    setIcePos(config.start);
    setIceKeyActivated(false);
    setSolved(false);
  };

  const handleIceMove = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (solved) return;
    sound.playMove();
    const config = ICE_LEVELS[levelIndex % ICE_LEVELS.length];

    let currR = icePos.row;
    let currC = icePos.col;

    while (true) {
      let nextR = currR;
      let nextC = currC;
      if (dir === 'UP') nextR--;
      if (dir === 'DOWN') nextR++;
      if (dir === 'LEFT') nextC--;
      if (dir === 'RIGHT') nextC++;

      // Check bounds & rocks
      if (
        nextR < 0 ||
        nextR >= config.size ||
        nextC < 0 ||
        nextC >= config.size ||
        config.rocks.some((r) => r.row === nextR && r.col === nextC)
      ) {
        break; // Stop sliding
      }

      currR = nextR;
      currC = nextC;
    }

    setIcePos({ row: currR, col: currC });

    // Check key activation
    if (currR === config.keySwitch.row && currC === config.keySwitch.col) {
      setIceKeyActivated(true);
      sound.playKey();
    }

    // Check Exit win condition
    if (currR === config.exit.row && currC === config.exit.col && (iceKeyActivated || currR === config.keySwitch.row && currC === config.keySwitch.col)) {
      setSolved(true);
      sound.playWin();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onAwardCoins(200);
      if (onUnlockAchievement) {
        onUnlockAchievement('ice_slide_master');
      }
    }
  };

  // Switch tab or level reset
  useEffect(() => {
    if (activeTab === 'laser') initLaserLevel(levelIndex);
    if (activeTab === 'ice') initIceLevel(levelIndex);
  }, [activeTab, levelIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-serif font-bold tracking-widest text-cyan-400 uppercase">
                Brain Labyrinth Puzzles
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                Solve logic challenges for +200 Fragments & Badges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('laser');
              sound.playButtonClick();
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'laser'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Laser Reflector</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ice');
              sound.playButtonClick();
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'ice'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Ice Friction Slide</span>
          </button>
        </div>

        {/* LASER REFLECTOR PUZZLE */}
        {activeTab === 'laser' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full text-xs font-mono text-zinc-400">
              <span>Stage {levelIndex + 1} of {LASER_LEVELS.length}</span>
              <span>Tap empty cells to place/rotate mirrors</span>
            </div>

            {/* Laser Grid */}
            <div
              className="grid gap-1 bg-zinc-950 p-3 rounded-xl border border-cyan-500/30 shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${laserGrid.length || 5}, minmax(0, 1fr))`,
              }}
            >
              {laserGrid.map((row, r) =>
                row.map((cell, c) => {
                  const isLaserInCell = laserPath.some((p) => p.row === r && p.col === c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => toggleLaserCell(r, c)}
                      disabled={cell.type === 'emitter' || cell.type === 'target' || cell.type === 'wall'}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center text-lg font-bold transition-all relative ${
                        cell.type === 'emitter'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : cell.type === 'target'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
                          : cell.type === 'wall'
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          : cell.type === 'mirror_slash' || cell.type === 'mirror_backslash'
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'bg-zinc-900 border-zinc-800 hover:border-cyan-500/50'
                      }`}
                    >
                      {cell.type === 'emitter' && '⚡'}
                      {cell.type === 'target' && '🔮'}
                      {cell.type === 'wall' && '🧱'}
                      {cell.type === 'mirror_slash' && '/'}
                      {cell.type === 'mirror_backslash' && '\\'}

                      {/* Laser Beam Glow Trail Overlay */}
                      {isLaserInCell && cell.type !== 'emitter' && cell.type !== 'target' && (
                        <div className="absolute inset-2 bg-cyan-400/40 rounded-full blur-xs animate-ping pointer-events-none" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Reset & Solved Bar */}
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => initLaserLevel(levelIndex)}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Stage</span>
              </button>

              {solved ? (
                <button
                  onClick={() => {
                    setLevelIndex((prev) => (prev + 1) % LASER_LEVELS.length);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-bounce"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Next Stage (+200 ✧)</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-cyan-400">Target Crystal Unlit</span>
              )}
            </div>
          </div>
        )}

        {/* ICE FRICTION SLIDER PUZZLE */}
        {activeTab === 'ice' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full text-xs font-mono text-zinc-400">
              <span>Stage {levelIndex + 1} of {ICE_LEVELS.length}</span>
              <span>Slide on ice to hit Key Switch 🔑 and reach Goal Portal 🌀</span>
            </div>

            {/* Ice Grid */}
            <div
              className="grid gap-1 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30 shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${ICE_LEVELS[levelIndex % ICE_LEVELS.length].size}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: ICE_LEVELS[levelIndex % ICE_LEVELS.length].size }).map((_, r) =>
                Array.from({ length: ICE_LEVELS[levelIndex % ICE_LEVELS.length].size }).map((_, c) => {
                  const config = ICE_LEVELS[levelIndex % ICE_LEVELS.length];
                  const isPlayer = icePos.row === r && icePos.col === c;
                  const isExit = config.exit.row === r && config.exit.col === c;
                  const isRock = config.rocks.some((rk) => rk.row === r && rk.col === c);
                  const isKey = config.keySwitch.row === r && config.keySwitch.col === c;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center text-base transition-all ${
                        isPlayer
                          ? 'bg-amber-400 text-zinc-950 border-amber-300 font-bold shadow-lg shadow-amber-400/30'
                          : isRock
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          : isExit
                          ? 'bg-purple-500/30 border-purple-400 text-purple-300 animate-pulse'
                          : isKey
                          ? iceKeyActivated
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                            : 'bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-bounce'
                          : 'bg-cyan-900/20 border-cyan-800/40'
                      }`}
                    >
                      {isPlayer && '🧊'}
                      {!isPlayer && isRock && '🪨'}
                      {!isPlayer && isExit && '🌀'}
                      {!isPlayer && isKey && (iceKeyActivated ? '✅' : '🔑')}
                    </div>
                  );
                })
              )}
            </div>

            {/* D-Pad Controls for Ice Slide */}
            <div className="flex flex-col items-center gap-1 my-1">
              <button
                onClick={() => handleIceMove('UP')}
                className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-cyan-600 text-cyan-200 border border-zinc-700 flex items-center justify-center active:scale-90 transition"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleIceMove('LEFT')}
                  className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-cyan-600 text-cyan-200 border border-zinc-700 flex items-center justify-center active:scale-90 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleIceMove('DOWN')}
                  className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-cyan-600 text-cyan-200 border border-zinc-700 flex items-center justify-center active:scale-90 transition"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleIceMove('RIGHT')}
                  className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-cyan-600 text-cyan-200 border border-zinc-700 flex items-center justify-center active:scale-90 transition"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reset / Solved Bar */}
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => initIceLevel(levelIndex)}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Slide</span>
              </button>

              {solved ? (
                <button
                  onClick={() => {
                    setLevelIndex((prev) => (prev + 1) % ICE_LEVELS.length);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Next Ice Puzzle (+200 ✧)</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-cyan-400">
                  {iceKeyActivated ? 'Portal Unlocked!' : 'Key Required'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
