export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export type GameMode = 'classic' | 'time-attack' | 'fog-of-war' | 'monster-chase' | 'custom';

export type ThemeId = 'obsidian' | 'neon' | 'dungeon' | 'cyberpunk' | 'emerald' | 'retro-arcade';

export type ItemType = 'coin' | 'key' | 'door' | 'speed' | 'ghost' | 'portal' | 'trap' | 'star';

export type ColorType = 'red' | 'blue' | 'gold';

export type WeaponId = 'tactical_pistol' | 'ak47_assault' | 'shotgun_enforcer' | 'plasma_rifle' | 'grenade_launcher' | 'rocket_launcher';

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  price: number;
  damage: number;
  fireRateMs: number;
  maxClip: number;
  reloadTimeMs: number;
  icon: string;
  description: string;
  bulletColor: string;
  soundType: 'pistol' | 'ak47' | 'shotgun' | 'plasma' | 'laser' | 'grenade' | 'rocket';
  isAutomatic?: boolean;
  category?: 'pistol' | 'rifle' | 'shotgun' | 'explosive';
}

export type EnemyType = 'wraith_ghost' | 'shadow_stalker' | 'cyber_sentinel' | 'boss_phantom' | 'minotaur_beast';

export interface Enemy3D {
  id: string;
  type: EnemyType;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  aggroDistance: number;
  state: 'idle' | 'chasing' | 'patrolling' | 'attacking' | 'dead';
  color: string;
  size: number;
  height: number;
  lastAttackMs: number;
  isDying?: boolean;
  deathAnimProgress?: number;
  deathStartTime?: number;
  patrolTarget?: { x: number; z: number };
  patrolTimer?: number;
  hasLineOfSight?: boolean;
}

export interface PlayerFPSState {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  currentWeapon: WeaponId;
  inventoryWeapons: WeaponId[];
  ammoInClip: number;
  reserveAmmo: number;
  isReloading: boolean;
  flashlightOn: boolean;
  flashlightBattery: number;
  unlockedFlashlights: string[];
  activeFlashlight: string;
  killsCount: number;
}

export type PlayerSkinId = 'classic_orb' | 'cyber_cube' | 'phantom_ghost' | 'obsidian_golem' | 'royal_crown' | 'celestial_star';

export interface SkinConfig {
  id: PlayerSkinId;
  name: string;
  price: number;
  icon: string;
  description: string;
  trailColor: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface Cell {
  row: number;
  col: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
  item?: ItemType;
  itemColor?: ColorType;
  portalTarget?: { row: number; col: number };
}

export interface Position {
  row: number;
  col: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'editor';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalCoins: number;
  totalStars: number;
  bestTimes: Record<string, number>; // key: `${mode}_${difficulty}` -> seconds
  customMazesCount: number;
  adsWatched: number;
  estimatedAdEarnings: number; // in USD e.g. 0.05 per ad
  hasRemoveAds?: boolean;
}

export interface PowerUpInventory {
  speedBoosts: number;
  ghostSteps: number;
  hintsAvailable: number;
}

export interface ActivePowerUps {
  speedBoostRemaining: number; // in steps or seconds
  ghostModeRemaining: number;  // in steps
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  wallColor: string;
  wallGlow?: string;
  pathColor: string;
  playerColor: string;
  playerGlow: string;
  goalColor: string;
  goalGlow: string;
  bgColor: string;
  accentColor: string;
  gridLineColor: string;
}

