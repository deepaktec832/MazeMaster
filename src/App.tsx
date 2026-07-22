import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cell,
  Difficulty,
  GameMode,
  GameStatus,
  PlayerStats,
  Position,
  PowerUpInventory,
  ActivePowerUps,
  ThemeId,
  PlayerSkinId,
  Achievement,
} from './types/maze';
import { generateMaze, getGridDimensions, findShortestPath } from './utils/mazeGenerator';
import { THEMES } from './utils/themes';
import { sound } from './utils/sound';
import { SKINS, INITIAL_ACHIEVEMENTS } from './utils/shopAndAchievements';
import { HeaderBar } from './components/HeaderBar';
import { MazeBoard } from './components/MazeBoard';
import { Controls } from './components/Controls';
import { MenuScreen } from './components/MenuScreen';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { MazeEditor } from './components/MazeEditor';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import { AdModal } from './components/AdModal';
import { BannerAdBar } from './components/BannerAdBar';
import { CampaignMapModal } from './components/CampaignMapModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';

const STATS_KEY = 'mazemaster_player_stats_v2';
const SKINS_KEY = 'mazemaster_unlocked_skins_v2';
const ACTIVE_SKIN_KEY = 'mazemaster_active_skin_v2';
const ACHIEVEMENTS_KEY = 'mazemaster_achievements_v2';
const COMPLETED_LEVELS_KEY = 'mazemaster_completed_levels_v2';

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalCoins: 250, // Initial welcome bonus fragments
  totalStars: 0,
  bestTimes: {},
  customMazesCount: 0,
  adsWatched: 0,
  estimatedAdEarnings: 0,
};

export default function App() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [themeId, setThemeId] = useState<ThemeId>('obsidian');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(null);

  // Mobile Shell Device View Mode (default true for authentic mobile game app look)
  const [isMobileShellActive, setIsMobileShellActive] = useState<boolean>(true);

  // Completed Levels & Stars State for Campaign Saga
  const [completedLevels, setCompletedLevels] = useState<Record<number, { stars: number; bestTime: number }>>(() => {
    const saved = localStorage.getItem(COMPLETED_LEVELS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Shop & Skins State
  const [activeSkin, setActiveSkin] = useState<PlayerSkinId>(() => {
    return (localStorage.getItem(ACTIVE_SKIN_KEY) as PlayerSkinId) || 'classic_orb';
  });

  const [unlockedSkins, setUnlockedSkins] = useState<PlayerSkinId[]>(() => {
    const saved = localStorage.getItem(SKINS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['classic_orb'];
      }
    }
    return ['classic_orb'];
  });

  // Achievements State
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ACHIEVEMENTS;
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  // Modals
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState<boolean>(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [adRewardType, setAdRewardType] = useState<'coins' | 'hint' | 'speed'>('coins');

  // Maze State
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [rows, setRows] = useState<number>(15);
  const [cols, setCols] = useState<number>(15);
  const [playerPos, setPlayerPos] = useState<Position>({ row: 0, col: 0 });
  const [goalPos, setGoalPos] = useState<Position>({ row: 14, col: 14 });
  const [monsterPos, setMonsterPos] = useState<Position | null>(null);

  // Gameplay Counters & Inventory
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [coinsCount, setCoinsCount] = useState<number>(0);
  const [keysCount, setKeysCount] = useState<number>(0);
  const [hintPath, setHintPath] = useState<Position[]>([]);

  const [inventory, setInventory] = useState<PowerUpInventory>({
    speedBoosts: 2,
    ghostSteps: 1,
    hintsAvailable: 3,
  });

  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUps>({
    speedBoostRemaining: 0,
    ghostModeRemaining: 0,
  });

  // Player Lifetime Stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_STATS;
      }
    }
    return DEFAULT_STATS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNewBestTime, setIsNewBestTime] = useState<boolean>(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const monsterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe Back Gesture Handler (Swipe Right to go Back to Main Menu)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const startX = touchStartRef.current.x;
    const duration = Date.now() - touchStartRef.current.time;

    // Swipe right gesture (from left edge or across screen)
    if (
      (startX < 120 || deltaX > 140) &&
      deltaX > 80 &&
      Math.abs(deltaY) < 70 &&
      duration < 600
    ) {
      if (isShopOpen) setIsShopOpen(false);
      else if (isAchievementsOpen) setIsAchievementsOpen(false);
      else if (isCampaignOpen) setIsCampaignOpen(false);
      else if (isDailyRewardOpen) setIsDailyRewardOpen(false);
      else if (isLeaderboardOpen) setIsLeaderboardOpen(false);
      else if (isSettingsOpen) setIsSettingsOpen(false);
      else if (isAdModalOpen) setIsAdModalOpen(false);
      else if (gameStatus !== 'menu') {
        sound.playButtonClick();
        setGameStatus('menu');
      }
    }
    touchStartRef.current = null;
  };

  // Persistence Helpers
  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  };

  const saveSkins = (skins: PlayerSkinId[], active: PlayerSkinId) => {
    setUnlockedSkins(skins);
    setActiveSkin(active);
    localStorage.setItem(SKINS_KEY, JSON.stringify(skins));
    localStorage.setItem(ACTIVE_SKIN_KEY, active);
  };

  const saveAchievements = (list: Achievement[]) => {
    setAchievements(list);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(list));
  };

  // Check Achievement Progress Helper
  const checkAchievements = useCallback(
    (currentStats: PlayerStats) => {
      setAchievements((prev) => {
        const updated = prev.map((ach) => {
          let progress = ach.progress;
          if (ach.id === 'first_win') progress = currentStats.gamesWon;
          if (ach.id === 'maze_master') progress = currentStats.gamesWon;
          if (ach.id === 'coin_collector') progress = currentStats.totalCoins;
          if (ach.id === 'ad_supporter') progress = currentStats.adsWatched;

          const completed = progress >= ach.target;
          return {
            ...ach,
            progress,
            completed: completed || ach.completed,
          };
        });
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // Start new game
  const handleStartGame = useCallback(
    (selectedMode: GameMode, selectedDiff: Difficulty, levelIdx: number | null = null) => {
      sound.playButtonClick();

      // Determine effective difficulty based on campaign level index (1..1000)
      let effectiveDiff = selectedDiff;
      if (levelIdx !== null) {
        if (levelIdx <= 50) effectiveDiff = 'easy';
        else if (levelIdx <= 200) effectiveDiff = 'medium';
        else if (levelIdx <= 500) effectiveDiff = 'hard';
        else effectiveDiff = 'extreme';
      }

      setMode(selectedMode);
      setDifficulty(effectiveDiff);
      setCurrentLevelIndex(levelIdx);

      const dims = getGridDimensions(effectiveDiff);
      setRows(dims.rows);
      setCols(dims.cols);

      const { grid: newGrid, startPos: newStart, goalPos: newGoal } = generateMaze(
        dims.rows,
        dims.cols,
        {
          braidProbability: selectedMode === 'time-attack' ? 0.3 : 0.15,
          addItems: true,
          mode: selectedMode,
        }
      );

      setGrid(newGrid);
      setPlayerPos(newStart);
      setGoalPos(newGoal);

      if (selectedMode === 'monster-chase') {
        setMonsterPos(newGoal);
      } else {
        setMonsterPos(null);
      }

      setTimeElapsed(0);
      setTimeLimit(selectedMode === 'time-attack' ? Math.floor(dims.rows * 2.5) : undefined);
      setMoveCount(0);
      setCoinsCount(0);
      setKeysCount(0);
      setHintPath([]);
      setIsNewBestTime(false);

      setInventory({
        speedBoosts: selectedDiff === 'easy' ? 3 : 2,
        ghostSteps: 1,
        hintsAvailable: selectedDiff === 'easy' ? 5 : 3,
      });

      setActivePowerUps({
        speedBoostRemaining: 0,
        ghostModeRemaining: 0,
      });

      setGameStatus('playing');

      const nextStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
      };
      saveStats(nextStats);
    },
    [stats]
  );

  // Timer Effect
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const nextTime = prev + 1;
          if (timeLimit && nextTime >= timeLimit) {
            sound.playLose();
            setGameStatus('lost');
          }
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, timeLimit]);

  // Monster Chase Effect
  useEffect(() => {
    if (gameStatus === 'playing' && mode === 'monster-chase' && monsterPos && grid.length > 0) {
      monsterTimerRef.current = setInterval(() => {
        setMonsterPos((prevMonster) => {
          if (!prevMonster) return null;
          const path = findShortestPath(grid, prevMonster, playerPos, rows, cols, true);
          if (path.length > 1) {
            const nextStep = path[1];
            if (nextStep.row === playerPos.row && nextStep.col === playerPos.col) {
              sound.playLose();
              setGameStatus('lost');
            }
            return nextStep;
          }
          return prevMonster;
        });
      }, difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 900 : 650);
    } else {
      if (monsterTimerRef.current) clearInterval(monsterTimerRef.current);
    }

    return () => {
      if (monsterTimerRef.current) clearInterval(monsterTimerRef.current);
    };
  }, [gameStatus, mode, monsterPos, grid, playerPos, rows, cols, difficulty]);

  // Movement Logic
  const handleMove = useCallback(
    (direction: 'top' | 'right' | 'bottom' | 'left') => {
      if (gameStatus !== 'playing') return;

      const currentCell = grid[playerPos.row]?.[playerPos.col];
      if (!currentCell) return;

      let targetRow = playerPos.row;
      let targetCol = playerPos.col;

      if (direction === 'top') targetRow--;
      if (direction === 'right') targetCol++;
      if (direction === 'bottom') targetRow++;
      if (direction === 'left') targetCol--;

      // Bounds check
      if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
        sound.playTrap();
        return;
      }

      const hasWall = currentCell.walls[direction];
      const isGhostActive = activePowerUps.ghostModeRemaining > 0;

      if (hasWall && !isGhostActive) {
        sound.playTrap();
        return;
      }

      const targetCell = grid[targetRow][targetCol];

      // Locked Door check
      if (targetCell.item === 'door') {
        if (keysCount > 0) {
          sound.playUnlock();
          setKeysCount((k) => k - 1);
          grid[targetRow][targetCol].item = undefined;
        } else {
          sound.playTrap();
          return;
        }
      }

      // Decrement ghost mode if passing wall
      if (hasWall && isGhostActive) {
        setActivePowerUps((prev) => ({
          ...prev,
          ghostModeRemaining: Math.max(0, prev.ghostModeRemaining - 1),
        }));
      }

      // Move player
      setPlayerPos({ row: targetRow, col: targetCol });
      setMoveCount((m) => m + 1);

      // Check item collection
      if (targetCell.item) {
        if (targetCell.item === 'coin') {
          sound.playCoin();
          setCoinsCount((c) => c + 1);
          targetCell.item = undefined;
        } else if (targetCell.item === 'key') {
          sound.playKey();
          setKeysCount((k) => k + 1);
          targetCell.item = undefined;
        } else if (targetCell.item === 'speed') {
          sound.playPowerUp();
          setInventory((inv) => ({ ...inv, speedBoosts: inv.speedBoosts + 1 }));
          targetCell.item = undefined;
        } else if (targetCell.item === 'ghost') {
          sound.playPowerUp();
          setInventory((inv) => ({ ...inv, ghostSteps: inv.ghostSteps + 1 }));
          targetCell.item = undefined;
        } else if (targetCell.item === 'portal' && targetCell.portalTarget) {
          sound.playPortal();
          setPlayerPos(targetCell.portalTarget);
        } else if (targetCell.item === 'trap') {
          sound.playTrap();
          setTimeElapsed((t) => t + 5);
          targetCell.item = undefined;
        }
      }

      if (hintPath.length > 0) {
        setHintPath([]);
      }

      // Check Win
      if (targetRow === goalPos.row && targetCol === goalPos.col) {
        sound.playWin();

        const timeKey = `${mode}_${difficulty}`;
        const prevBest = stats.bestTimes[timeKey] || 9999;
        const newBest = timeElapsed < prevBest;

        setIsNewBestTime(newBest);
        setGameStatus('won');

        // Calculate Campaign Stars (1-3)
        let levelStars = 1;
        if (timeElapsed <= 40 || moveCount <= 35) levelStars = 3;
        else if (timeElapsed <= 80 || moveCount <= 60) levelStars = 2;

        if (currentLevelIndex !== null) {
          const updatedLevels = {
            ...completedLevels,
            [currentLevelIndex]: {
              stars: Math.max(completedLevels[currentLevelIndex]?.stars || 0, levelStars),
              bestTime: Math.min(completedLevels[currentLevelIndex]?.bestTime || 999, timeElapsed),
            },
          };
          setCompletedLevels(updatedLevels);
          localStorage.setItem(COMPLETED_LEVELS_KEY, JSON.stringify(updatedLevels));
        }

        const updatedStats = {
          ...stats,
          gamesWon: stats.gamesWon + 1,
          totalCoins: stats.totalCoins + coinsCount + 15,
          totalStars: stats.totalStars + levelStars,
          bestTimes: {
            ...stats.bestTimes,
            [timeKey]: newBest ? timeElapsed : prevBest,
          },
        };
        saveStats(updatedStats);
        checkAchievements(updatedStats);

        // Speed daemon achievement check
        if (timeElapsed <= 35) {
          setAchievements((prev) =>
            prev.map((a) => (a.id === 'speed_daemon' ? { ...a, progress: 1, completed: true } : a))
          );
        }
      }
    },
    [
      gameStatus,
      grid,
      playerPos,
      rows,
      cols,
      activePowerUps,
      keysCount,
      goalPos,
      hintPath,
      mode,
      difficulty,
      timeElapsed,
      moveCount,
      coinsCount,
      currentLevelIndex,
      completedLevels,
      stats,
      checkAchievements,
    ]
  );

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('top');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('bottom');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('left');
          break;
        case '1':
        case 'z':
          e.preventDefault();
          useSpeedBoost();
          break;
        case '2':
        case 'x':
          e.preventDefault();
          useGhostMode();
          break;
        case '3':
        case 'c':
        case ' ':
          e.preventDefault();
          useAIHint();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleMove]);

  // Power-ups
  const useSpeedBoost = () => {
    if (inventory.speedBoosts > 0) {
      sound.playPowerUp();
      setInventory((inv) => ({ ...inv, speedBoosts: inv.speedBoosts - 1 }));
      setActivePowerUps((prev) => ({ ...prev, speedBoostRemaining: 5 }));
    }
  };

  const useGhostMode = () => {
    if (inventory.ghostSteps > 0) {
      sound.playPowerUp();
      setInventory((inv) => ({ ...inv, ghostSteps: inv.ghostSteps - 1 }));
      setActivePowerUps((prev) => ({ ...prev, ghostModeRemaining: 3 }));

      setAchievements((prev) =>
        prev.map((a) =>
          a.id === 'ghost_walker'
            ? { ...a, progress: a.progress + 1, completed: a.progress + 1 >= a.target }
            : a
        )
      );
    }
  };

  const useAIHint = () => {
    if (inventory.hintsAvailable > 0 && grid.length > 0) {
      sound.playPowerUp();
      setInventory((inv) => ({ ...inv, hintsAvailable: inv.hintsAvailable - 1 }));
      const path = findShortestPath(grid, playerPos, goalPos, rows, cols);
      setHintPath(path);
    }
  };

  // Shop Handlers
  const handleBuySkin = (skinId: PlayerSkinId, cost: number) => {
    if (stats.totalCoins >= cost && !unlockedSkins.includes(skinId)) {
      const nextCoins = stats.totalCoins - cost;
      const nextSkins = [...unlockedSkins, skinId];
      saveSkins(nextSkins, skinId);
      const nextStats = { ...stats, totalCoins: nextCoins };
      saveStats(nextStats);
    }
  };

  const handleSelectSkin = (skinId: PlayerSkinId) => {
    if (unlockedSkins.includes(skinId)) {
      setActiveSkin(skinId);
      localStorage.setItem(ACTIVE_SKIN_KEY, skinId);
    }
  };

  const handleBuyPowerUp = (type: 'speed' | 'ghost' | 'hint', cost: number) => {
    if (stats.totalCoins >= cost) {
      const nextCoins = stats.totalCoins - cost;
      const nextStats = { ...stats, totalCoins: nextCoins };
      saveStats(nextStats);

      if (type === 'speed') setInventory((inv) => ({ ...inv, speedBoosts: inv.speedBoosts + 1 }));
      if (type === 'ghost') setInventory((inv) => ({ ...inv, ghostSteps: inv.ghostSteps + 1 }));
      if (type === 'hint') setInventory((inv) => ({ ...inv, hintsAvailable: inv.hintsAvailable + 1 }));
      sound.playPowerUp();
    }
  };

  const handleBuyRemoveAds = (cost: number) => {
    if (stats.totalCoins >= cost && !stats.hasRemoveAds) {
      const nextCoins = stats.totalCoins - cost;
      const nextStats = { ...stats, totalCoins: nextCoins, hasRemoveAds: true };
      saveStats(nextStats);
      sound.playPowerUp();
    }
  };

  // Rewarded Ad Grant
  const handleAdRewardGranted = (type: 'coins' | 'hint' | 'speed', coinsAmount = 150) => {
    const nextAdsWatched = stats.adsWatched + 1;
    const nextCoins = stats.totalCoins + coinsAmount;
    const nextStats = {
      ...stats,
      totalCoins: nextCoins,
      adsWatched: nextAdsWatched,
      estimatedAdEarnings: Number((stats.estimatedAdEarnings + 0.05).toFixed(2)),
    };
    saveStats(nextStats);
    checkAchievements(nextStats);

    if (type === 'hint') setInventory((inv) => ({ ...inv, hintsAvailable: inv.hintsAvailable + 1 }));
    if (type === 'speed') setInventory((inv) => ({ ...inv, speedBoosts: inv.speedBoosts + 1 }));
  };

  // Claim Daily Wheel Reward
  const handleClaimDailyReward = (reward: { type: 'coins' | 'speed' | 'ghost' | 'hints'; amount: number }) => {
    if (reward.type === 'coins') {
      const nextStats = { ...stats, totalCoins: stats.totalCoins + reward.amount };
      saveStats(nextStats);
    } else if (reward.type === 'speed') {
      setInventory((inv) => ({ ...inv, speedBoosts: inv.speedBoosts + reward.amount }));
    } else if (reward.type === 'ghost') {
      setInventory((inv) => ({ ...inv, ghostSteps: inv.ghostSteps + reward.amount }));
    } else if (reward.type === 'hints') {
      setInventory((inv) => ({ ...inv, hintsAvailable: inv.hintsAvailable + reward.amount }));
    }
  };

  // Achievements Reward Claim
  const handleClaimAchievementReward = (achId: string) => {
    setAchievements((prev) => {
      const target = prev.find((a) => a.id === achId);
      if (!target || !target.completed || target.claimed) return prev;

      const nextCoins = stats.totalCoins + target.rewardCoins;
      saveStats({ ...stats, totalCoins: nextCoins });

      const updated = prev.map((a) => (a.id === achId ? { ...a, claimed: true } : a));
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handlePlayCustomMaze = (customGrid: Cell[][], customStart: Position, customGoal: Position) => {
    setGrid(customGrid);
    setRows(customGrid.length);
    setCols(customGrid[0].length);
    setPlayerPos(customStart);
    setGoalPos(customGoal);
    setMode('custom');
    setGameStatus('playing');
    setTimeElapsed(0);
    setMoveCount(0);
    setCoinsCount(0);
    setKeysCount(0);
  };

  const activeTheme = THEMES[themeId];

  return (
    <MobileDeviceFrame
      isMobileShellActive={isMobileShellActive}
      onToggleMobileShell={() => setIsMobileShellActive(!isMobileShellActive)}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen w-full flex flex-col items-center justify-between p-3 sm:p-6 transition-colors duration-300 font-sans select-none overflow-x-hidden relative"
        style={{ backgroundColor: activeTheme.bgColor }}
      >
        {/* MENU SCREEN */}
        {gameStatus === 'menu' && (
          <MenuScreen
            onStartGame={handleStartGame}
            onOpenCampaign={() => setIsCampaignOpen(true)}
            onOpenDailyReward={() => setIsDailyRewardOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onToggleMobileShell={() => setIsMobileShellActive(!isMobileShellActive)}
            isMobileShellActive={isMobileShellActive}
            onOpenEditor={() => setGameStatus('editor')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onWatchAdClick={() => {
              setAdRewardType('coins');
              setIsAdModalOpen(true);
            }}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            stats={stats}
          />
        )}

        {/* MAZE EDITOR */}
        {gameStatus === 'editor' && (
          <MazeEditor
            onPlayCustomMaze={handlePlayCustomMaze}
            onBackToMenu={() => setGameStatus('menu')}
          />
        )}

        {/* GAMEPLAY SCREEN */}
        {(gameStatus === 'playing' || gameStatus === 'paused' || gameStatus === 'won' || gameStatus === 'lost') && (
          <div className="flex flex-col items-center gap-3 w-full max-w-5xl my-auto">
            <HeaderBar
              mode={mode}
              difficulty={difficulty}
              timeElapsed={timeElapsed}
              timeLimit={timeLimit}
              moveCount={moveCount}
              coinsCount={coinsCount}
              keysCount={keysCount}
              isMuted={isMuted}
              isPaused={gameStatus === 'paused'}
              onToggleMute={() => setIsMuted(sound.toggleMute())}
              onTogglePause={() => setGameStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenShop={() => setIsShopOpen(true)}
              onOpenAchievements={() => setIsAchievementsOpen(true)}
              onBackToMenu={() => {
                sound.playButtonClick();
                setGameStatus('menu');
              }}
            />

            {/* MAIN MAZE BOARD WITH 3D PERSPECTIVE */}
            <div className="w-full h-[58vh] sm:h-[62vh] max-h-[680px]">
              <MazeBoard
                grid={grid}
                rows={rows}
                cols={cols}
                playerPos={playerPos}
                goalPos={goalPos}
                monsterPos={monsterPos}
                theme={activeTheme}
                gameMode={mode}
                hintPath={hintPath}
                unlockedKeys={keysCount}
                hasGhostMode={activePowerUps.ghostModeRemaining > 0}
                activeSkin={activeSkin}
                is3DView={is3DView}
                onToggle3D={() => setIs3DView(!is3DView)}
                onMove={handleMove}
                onTileClick={(r, c) => {
                  if (Math.abs(r - playerPos.row) + Math.abs(c - playerPos.col) === 1) {
                    if (r < playerPos.row) handleMove('top');
                    else if (r > playerPos.row) handleMove('bottom');
                    else if (c < playerPos.col) handleMove('left');
                    else if (c > playerPos.col) handleMove('right');
                  } else {
                    const dr = r - playerPos.row;
                    const dc = c - playerPos.col;
                    if (Math.abs(dr) >= Math.abs(dc)) {
                      if (dr < 0) handleMove('top');
                      else if (dr > 0) handleMove('bottom');
                    } else {
                      if (dc < 0) handleMove('left');
                      else if (dc > 0) handleMove('right');
                    }
                  }
                }}
              />
            </div>

            {/* CONTROLS BAR */}
            <Controls
              onMove={handleMove}
              onUseSpeed={useSpeedBoost}
              onUseGhost={useGhostMode}
              onUseHint={useAIHint}
              inventory={inventory}
              activePowerUps={activePowerUps}
              showingHint={hintPath.length > 0}
            />
          </div>
        )}

        {/* BANNER AD BAR AT BOTTOM (hidden if Ad-Free VIP Pass is owned) */}
        {!stats.hasRemoveAds && (
          <div className="mt-4 w-full flex justify-center">
            <BannerAdBar
              onWatchAdClick={() => {
                setAdRewardType('coins');
                setIsAdModalOpen(true);
              }}
            />
          </div>
        )}

        {/* GAME OVER MODAL */}
        {(gameStatus === 'won' || gameStatus === 'lost') && (
          <GameOverModal
            status={gameStatus}
            mode={mode}
            difficulty={difficulty}
            timeElapsed={timeElapsed}
            moveCount={moveCount}
            coinsCount={coinsCount}
            isNewBestTime={isNewBestTime}
            onRestart={() => handleStartGame(mode, difficulty, currentLevelIndex)}
            onNextLevel={() =>
              handleStartGame(mode, difficulty, currentLevelIndex !== null ? currentLevelIndex + 1 : null)
            }
            onBackToMenu={() => setGameStatus('menu')}
          />
        )}

        {/* CAMPAIGN MAP SAGA MODAL */}
        <CampaignMapModal
          isOpen={isCampaignOpen}
          onClose={() => setIsCampaignOpen(false)}
          onSelectLevel={(lvlIdx, selectedMode, selectedDiff) => {
            handleStartGame(selectedMode, selectedDiff, lvlIdx);
          }}
          completedLevels={completedLevels}
        />

        {/* DAILY LUCKY WHEEL MODAL */}
        <DailyRewardModal
          isOpen={isDailyRewardOpen}
          onClose={() => setIsDailyRewardOpen(false)}
          onClaimReward={handleClaimDailyReward}
        />

        {/* PLAY STORE LEADERBOARD MODAL */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          stats={stats}
        />

        {/* SHOP MODAL */}
        {isShopOpen && (
          <ShopModal
            totalCoins={stats.totalCoins}
            activeSkin={activeSkin}
            unlockedSkins={unlockedSkins}
            inventory={inventory}
            hasRemoveAds={stats.hasRemoveAds}
            onBuySkin={handleBuySkin}
            onSelectSkin={handleSelectSkin}
            onBuyPowerUp={handleBuyPowerUp}
            onBuyRemoveAds={handleBuyRemoveAds}
            onWatchAdClick={() => {
              setIsShopOpen(false);
              setAdRewardType('coins');
              setIsAdModalOpen(true);
            }}
            onClose={() => setIsShopOpen(false)}
          />
        )}

        {/* ACHIEVEMENTS MODAL */}
        {isAchievementsOpen && (
          <AchievementsModal
            achievements={achievements}
            onClaimReward={handleClaimAchievementReward}
            onClose={() => setIsAchievementsOpen(false)}
          />
        )}

        {/* REWARDED AD MODAL */}
        {isAdModalOpen && (
          <AdModal
            rewardType={adRewardType}
            onRewardGranted={handleAdRewardGranted}
            onClose={() => setIsAdModalOpen(false)}
          />
        )}

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
          <SettingsModal
            currentTheme={themeId}
            currentMode={mode}
            currentDifficulty={difficulty}
            stats={stats}
            isMuted={isMuted}
            onSelectTheme={(t) => setThemeId(t)}
            onSelectMode={(m) => setMode(m)}
            onSelectDifficulty={(d) => setDifficulty(d)}
            onToggleMute={() => setIsMuted(sound.toggleMute())}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </MobileDeviceFrame>
  );
}
