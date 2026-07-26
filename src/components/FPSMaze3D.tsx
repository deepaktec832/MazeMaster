import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Cell, Difficulty, GameMode, PlayerFPSState, WeaponId, Enemy3D, EnemyType, WeaponConfig } from '../types/maze';
import { WEAPONS } from '../utils/shopAndAchievements';
import { sound } from '../utils/sound';
import { MiniMapRadar } from './MiniMapRadar';
import {
  Zap,
  Shield,
  Crosshair,
  Sun,
  Moon,
  Key,
  Skull,
  Target,
  RefreshCw,
  LogOut,
  MapPin,
  Settings,
  RotateCcw,
  Flame,
  ShoppingBag,
  Lock,
  CheckCircle,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';

/**
 * Check Line of Sight between enemy and player through 2D grid walls
 */
const checkLineOfSight = (
  ex: number,
  ez: number,
  px: number,
  pz: number,
  grid: Cell[][],
  rows: number,
  cols: number,
  tileSize = 3.0
): boolean => {
  const dist = Math.hypot(px - ex, pz - ez);
  if (dist < 0.2) return true;

  const steps = Math.max(3, Math.ceil(dist / 0.25));
  const dx = (px - ex) / steps;
  const dz = (pz - ez) / steps;

  let currX = ex;
  let currZ = ez;

  for (let i = 0; i < steps; i++) {
    const nextX = currX + dx;
    const nextZ = currZ + dz;

    const currR = Math.floor(currZ / tileSize);
    const currC = Math.floor(currX / tileSize);
    const nextR = Math.floor(nextZ / tileSize);
    const nextC = Math.floor(nextX / tileSize);

    if (currR < 0 || currR >= rows || currC < 0 || currC >= cols) return false;
    if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) return false;

    if (currR !== nextR || currC !== nextC) {
      if (nextR < currR && grid[currR][currC].walls.top) return false;
      if (nextR > currR && grid[currR][currC].walls.bottom) return false;
      if (nextC < currC && grid[currR][currC].walls.left) return false;
      if (nextC > currC && grid[currR][currC].walls.right) return false;
    }

    currX = nextX;
    currZ = nextZ;
  }
  return true;
};

/**
 * Moves enemy toward target with sliding wall collision
 */
const moveEnemyWithCollision = (
  enemy: Enemy3D,
  targetX: number,
  targetZ: number,
  speed: number,
  delta: number,
  grid: Cell[][],
  rows: number,
  cols: number,
  tileSize = 3.0
) => {
  const dx = targetX - enemy.x;
  const dz = targetZ - enemy.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.1) return;

  const dirX = dx / dist;
  const dirZ = dz / dist;

  const stepX = dirX * speed * delta;
  const stepZ = dirZ * speed * delta;

  // Try X
  const nextX = enemy.x + stepX;
  const currC = Math.floor(enemy.x / tileSize);
  const currR = Math.floor(enemy.z / tileSize);
  const nextC = Math.floor(nextX / tileSize);

  let canX = true;
  if (currC !== nextC) {
    if (nextC < 0 || nextC >= cols || currR < 0 || currR >= rows) canX = false;
    else if (nextC < currC && grid[currR][currC].walls.left) canX = false;
    else if (nextC > currC && grid[currR][currC].walls.right) canX = false;
  }
  if (canX) enemy.x = nextX;

  // Try Z
  const nextZ = enemy.z + stepZ;
  const nextR = Math.floor(nextZ / tileSize);

  let canZ = true;
  if (currR !== nextR) {
    if (nextR < 0 || nextR >= rows || currC < 0 || currC >= cols) canZ = false;
    else if (nextR < currR && grid[currR][currC].walls.top) canZ = false;
    else if (nextR > currR && grid[currR][currC].walls.bottom) canZ = false;
  }
  if (canZ) enemy.z = nextZ;
};

interface ExplosiveProjectile {
  mesh: THREE.Group;
  type: 'grenade' | 'rocket';
  dir: THREE.Vector3;
  velocity: number;
  timeToLive: number;
  damage: number;
  radius: number;
  posX: number;
  posY: number;
  posZ: number;
}

interface FPSMaze3DProps {
  grid: Cell[][];
  rows: number;
  cols: number;
  difficulty: Difficulty;
  gameMode: GameMode;
  onWin: (timeInSeconds: number, coinsEarned: number, stars: number) => void;
  onLose: () => void;
  onBackToMenu: () => void;
  onOpenSettings?: () => void;
  powerUps: { speedBoosts: number; ghostSteps: number; hintsAvailable: number };
  onUsePowerUp: (type: 'speed' | 'ghost' | 'hint') => boolean;
  activePowerUps: { speedBoostRemaining: number; ghostModeRemaining: number };
  onWatchAdClick?: () => void;
  onSkipLevelWithAds?: () => void;
  skipLevelAdCount?: number;
}

export const FPSMaze3D: React.FC<FPSMaze3DProps> = ({
  grid,
  rows,
  cols,
  difficulty,
  gameMode,
  onWin,
  onLose,
  onBackToMenu,
  onOpenSettings,
  powerUps = { speedBoosts: 0, ghostSteps: 0, hintsAvailable: 0 },
  onUsePowerUp = () => false,
  activePowerUps = { speedBoostRemaining: 0, ghostModeRemaining: 0 },
  onWatchAdClick,
  onSkipLevelWithAds,
  skipLevelAdCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Level Map Preview, Paused, Day/Night, and Armory Modal
  const [showLevelMapPreview, setShowLevelMapPreview] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState<boolean>(false);

  // Player Armory Coins & Unlocked Weapons
  const [playerCoins, setPlayerCoins] = useState<number>(() => {
    const saved = localStorage.getItem('mazemaster_player_stats_v2');
    if (saved) {
      try { return JSON.parse(saved).totalCoins || 300; } catch { return 300; }
    }
    return 300;
  });

  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponId[]>(['tactical_pistol']);

  // Player FPS State
  const [playerState, setPlayerState] = useState<PlayerFPSState>({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    currentWeapon: 'tactical_pistol',
    inventoryWeapons: ['tactical_pistol'],
    ammoInClip: WEAPONS['tactical_pistol'].maxClip,
    reserveAmmo: 120,
    isReloading: false,
    flashlightOn: true,
    flashlightBattery: 100,
    unlockedFlashlights: ['standard'],
    activeFlashlight: 'standard',
    killsCount: 0,
  });

  const [keysCollected, setKeysCollected] = useState<number>(0);
  const totalKeysRequired = React.useMemo(() => {
    let count = 0;
    grid.forEach((row) => row.forEach((cell) => { if (cell.item === 'key') count++; }));
    return Math.max(1, count);
  }, [grid]);

  const [hitMarker, setHitMarker] = useState<boolean>(false);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const [muzzleFlashScreen, setMuzzleFlashScreen] = useState<boolean>(false);
  const [isHoveringEnemy, setIsHoveringEnemy] = useState<boolean>(false);
  const [coinPopup, setCoinPopup] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // GTA Touch Joystick & Look Ref
  const moveJoystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookJoystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera & Keyboard look
  const cameraYawRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0);
  const lastYawRef = useRef<number>(0);
  const lastPitchRef = useRef<number>(0);
  const weaponSwayXRef = useRef<number>(0);
  const weaponSwayYRef = useRef<number>(0);
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Combat Screen Shake
  const shakeIntensityRef = useRef<number>(0);

  // 3D Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const weaponMeshRef = useRef<THREE.Group | null>(null);
  const itemMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const enemiesRef = useRef<Enemy3D[]>([]);
  const enemyMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const projectilesRef = useRef<ExplosiveProjectile[]>([]);

  // Lights & Flashlight
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const playerPointLightRef = useRef<THREE.PointLight | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);

  // Firing rate limiter ref
  const lastShotTimeRef = useRef<number>(0);
  const isShootingRef = useRef<boolean>(false);
  const playerStateRef = useRef<PlayerFPSState>(playerState);
  playerStateRef.current = playerState;
  const isGameOverRef = useRef<boolean>(false);

  // Generate High Quality Stone Brick Texture for Maze Walls
  const createStoneBrickWallTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base Slate Brick Background
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 512, 512);

    const brickH = 64;
    const brickW = 128;

    for (let y = 0; y < 512; y += brickH) {
      const isOdd = (y / brickH) % 2 === 1;
      const xOffset = isOdd ? brickW / 2 : 0;

      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        const bx = x + xOffset;
        const shade = Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${70 + shade}, ${85 + shade}, ${105 + shade})`;
        ctx.fillRect(bx + 2, y + 2, brickW - 4, brickH - 4);

        if (Math.random() < 0.15) {
          ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
          ctx.fillRect(bx + 3, y + 3, brickW - 6, brickH - 6);
        }

        ctx.strokeStyle = '#1a202c';
        ctx.lineWidth = 4;
        ctx.strokeRect(bx, y, brickW, brickH);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Generate Cobblestone Floor Texture
  const createCobblestoneFloorTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    const size = 32;
    for (let y = 0; y < 512; y += size) {
      for (let x = 0; x < 512; x += size) {
        const v = Math.floor(Math.random() * 25);
        ctx.fillStyle = `rgb(${45 + v}, ${55 + v}, ${70 + v})`;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, size, size);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Construct Custom 3D Viewmodel Guns
  const createWeaponViewModel = useCallback((weaponId: WeaponId): THREE.Group => {
    const group = new THREE.Group();

    if (weaponId === 'ak47_assault') {
      // AK-47 Assault Rifle
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.14, 0.65),
        new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.8 })
      );
      // Wooden stock
      const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.16, 0.35),
        new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 })
      );
      stock.position.set(0, -0.02, 0.45);
      // Wooden handguard
      const handguard = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.1, 0.25),
        new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.5 })
      );
      handguard.position.set(0, -0.02, -0.2);
      // Curved banana mag
      const mag = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.32, 0.12),
        new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.9 })
      );
      mag.position.set(0, -0.2, -0.05);
      mag.rotation.x = Math.PI / 8;
      // Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.5),
        new THREE.MeshStandardMaterial({ color: '#3f3f46', metalness: 0.95 })
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.5);

      group.add(body); group.add(stock); group.add(handguard); group.add(mag); group.add(barrel);
      group.position.set(0.24, -0.22, -0.55);
    } else if (weaponId === 'shotgun_enforcer') {
      // Shotgun Double Barrel
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.5),
        new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.9 })
      );
      const b1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.55),
        new THREE.MeshStandardMaterial({ color: '#52525b', metalness: 0.95 })
      );
      b1.rotation.x = Math.PI / 2;
      b1.position.set(-0.03, 0.04, -0.42);

      const b2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.55),
        new THREE.MeshStandardMaterial({ color: '#52525b', metalness: 0.95 })
      );
      b2.rotation.x = Math.PI / 2;
      b2.position.set(0.03, 0.04, -0.42);

      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.12, 0.22),
        new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.7 })
      );
      pump.position.set(0, -0.02, -0.25);

      group.add(frame); group.add(b1); group.add(b2); group.add(pump);
      group.position.set(0.25, -0.24, -0.5);
    } else if (weaponId === 'plasma_rifle') {
      // Plasma Energy Rifle
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.18, 0.6),
        new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.8 })
      );
      const coil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.9 })
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.02, -0.22);

      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.0 })
      );
      tip.rotation.x = -Math.PI / 2;
      tip.position.set(0, 0.02, -0.48);

      group.add(body); group.add(coil); group.add(tip);
      group.position.set(0.22, -0.2, -0.5);
    } else if (weaponId === 'grenade_launcher') {
      // M32 Revolver Drum Grenade Launcher
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.18, 0.45),
        new THREE.MeshStandardMaterial({ color: '#3f3f46', metalness: 0.9 })
      );
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: '#f97316', metalness: 0.8 })
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -0.04, -0.08);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.4),
        new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.95 })
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.38);

      group.add(frame); group.add(drum); group.add(barrel);
      group.position.set(0.24, -0.22, -0.52);
    } else if (weaponId === 'rocket_launcher') {
      // RPG-7 Rocket Launcher Tube
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: '#365314', roughness: 0.5 })
      );
      tube.rotation.x = Math.PI / 2;

      const rocketHead = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: '#dc2626', metalness: 0.8 })
      );
      rocketHead.rotation.x = -Math.PI / 2;
      rocketHead.position.set(0, 0, -0.52);

      const sight = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.1, 0.08),
        new THREE.MeshStandardMaterial({ color: '#18181b' })
      );
      sight.position.set(0, 0.1, -0.15);

      group.add(tube); group.add(rocketHead); group.add(sight);
      group.position.set(0.26, -0.18, -0.55);
    } else {
      // Tactical Cyber Pistol
      const gunBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.16, 0.45),
        new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.9 })
      );
      const gunBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.35),
        new THREE.MeshStandardMaterial({ color: '#52525b', metalness: 0.95 })
      );
      gunBarrel.rotation.x = Math.PI / 2;
      gunBarrel.position.set(0, 0.04, -0.28);

      const laserSight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.2),
        new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 })
      );
      laserSight.rotation.x = Math.PI / 2;
      laserSight.position.set(0, -0.04, -0.22);

      group.add(gunBody); group.add(gunBarrel); group.add(laserSight);
      group.position.set(0.22, -0.18, -0.45);
    }

    // Muzzle Flash Light & Flare Mesh
    let muzzleZ = -0.45;
    let muzzleY = 0.04;
    let flashColor = '#f59e0b';

    if (weaponId === 'ak47_assault') {
      muzzleZ = -0.72; muzzleY = 0.03; flashColor = '#f59e0b';
    } else if (weaponId === 'shotgun_enforcer') {
      muzzleZ = -0.68; muzzleY = 0.04; flashColor = '#f97316';
    } else if (weaponId === 'plasma_rifle') {
      muzzleZ = -0.58; muzzleY = 0.02; flashColor = '#06b6d4';
    } else if (weaponId === 'grenade_launcher') {
      muzzleZ = -0.58; muzzleY = 0.02; flashColor = '#f97316';
    } else if (weaponId === 'rocket_launcher') {
      muzzleZ = -0.65; muzzleY = 0; flashColor = '#dc2626';
    } else {
      muzzleZ = -0.45; muzzleY = 0.04; flashColor = '#f59e0b';
    }

    const muzzleLight = new THREE.PointLight(flashColor, 0, 8.0);
    muzzleLight.position.set(0, muzzleY, muzzleZ);
    group.add(muzzleLight);

    const flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: flashColor, transparent: true, opacity: 0.9 })
    );
    flashMesh.position.set(0, muzzleY, muzzleZ);
    flashMesh.visible = false;
    group.add(flashMesh);

    group.userData = {
      basePos: group.position.clone(),
      muzzleLight,
      flashMesh,
    };

    return group;
  }, []);

  // Create 3D Minotaur Mesh Group
  const createMinotaurMeshGroup = useCallback((color: string) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), mat);
    torso.position.y = 0.8;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), mat);
    head.position.set(0, 1.4, 0.1);
    group.add(head);

    // Golden Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8 });
    const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), hornMat);
    lHorn.position.set(-0.32, 1.6, 0.05);
    lHorn.rotation.z = Math.PI / 3;
    group.add(lHorn);

    const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), hornMat);
    rHorn.position.set(0.32, 1.6, 0.05);
    rHorn.rotation.z = -Math.PI / 3;
    group.add(rHorn);

    // Red Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
    lEye.position.set(-0.12, 1.45, 0.3);
    rEye.position.set(0.12, 1.45, 0.3);
    group.add(lEye); group.add(rEye);

    return group;
  }, []);

  // Initialize 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Reset game state and refs for new grid level
    isGameOverRef.current = false;
    itemMeshesRef.current.clear();
    enemyMeshesRef.current.clear();
    enemiesRef.current = [];
    projectilesRef.current = [];
    setKeysCollected(0);
    setTimeElapsed(0);
    setShowLevelMapPreview(true);
    setPlayerState((prev) => ({
      ...prev,
      hp: prev.maxHp,
      ammoInClip: WEAPONS[prev.currentWeapon]?.maxClip || 30,
      reserveAmmo: 120,
      killsCount: 0,
      isReloading: false,
    }));

    const width = Math.max(100, containerRef.current.clientWidth || window.innerWidth || 800);
    const height = Math.max(100, containerRef.current.clientHeight || window.innerHeight || 600);

    // 1. Scene setup
    const scene = new THREE.Scene();
    const bgColor = isNightMode ? '#0b1329' : '#1e293b';
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.015);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(1.5, 1.2, 1.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Bright High-Contrast Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', isNightMode ? 0.55 : 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight('#ffffff', isNightMode ? 0.7 : 1.3);
    sunLight.position.set(20, 40, 20);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Player Light
    const playerPointLight = new THREE.PointLight(0xfff1d6, 3.5, 16.0);
    playerPointLight.position.set(0, 0, 0);
    camera.add(playerPointLight);
    playerPointLightRef.current = playerPointLight;

    const flashlight = new THREE.SpotLight(0xfff5e6, 4.5, 22.0, Math.PI / 5.0, 0.4, 1.5);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);
    flashlightRef.current = flashlight;

    // 5. Maze Geometry
    const wallTex = createStoneBrickWallTexture();
    const floorTex = createCobblestoneFloorTexture();

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.1,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });

    const tileSize = 3.0;
    const wallHeight = 2.8;
    const mazeWidth = cols * tileSize;
    const mazeHeight = rows * tileSize;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(mazeWidth / 2, 0, mazeHeight / 2);
    scene.add(floorMesh);

    // Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });
    const ceilingMesh = new THREE.Mesh(floorGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(mazeWidth / 2, wallHeight, mazeHeight / 2);
    scene.add(ceilingMesh);

    // Wall blocks
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const cellX = c * tileSize + tileSize / 2;
        const cellZ = r * tileSize + tileSize / 2;

        if (cell.walls.top && r === 0) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(tileSize, wallHeight, 0.35), wallMat);
          w.position.set(cellX, wallHeight / 2, r * tileSize);
          scene.add(w);
        }
        if (cell.walls.bottom) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(tileSize, wallHeight, 0.35), wallMat);
          w.position.set(cellX, wallHeight / 2, (r + 1) * tileSize);
          scene.add(w);
        }
        if (cell.walls.left && c === 0) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.35, wallHeight, tileSize), wallMat);
          w.position.set(c * tileSize, wallHeight / 2, cellZ);
          scene.add(w);
        }
        if (cell.walls.right) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.35, wallHeight, tileSize), wallMat);
          w.position.set((c + 1) * tileSize, wallHeight / 2, cellZ);
          scene.add(w);
        }
      }
    }

    // 6. Items & Pickups
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = c * tileSize + tileSize / 2;
        const z = r * tileSize + tileSize / 2;

        if (cell.item === 'key') {
          const keyGroup = new THREE.Group();
          const keyMesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.25, 0.08, 8, 16),
            new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.1 })
          );
          const keyLight = new THREE.PointLight('#f59e0b', 1.5, 4);
          keyGroup.add(keyMesh); keyGroup.add(keyLight);
          keyGroup.position.set(x, 0.8, z);
          scene.add(keyGroup);
          itemMeshesRef.current.set(`key_${r}_${c}`, keyGroup);
        } else if (cell.item === 'coin') {
          const coinGroup = new THREE.Group();
          const coinMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
            new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.95, roughness: 0.1 })
          );
          coinMesh.rotation.x = Math.PI / 2;
          const coinLight = new THREE.PointLight('#eab308', 1.0, 3);
          coinGroup.add(coinMesh); coinGroup.add(coinLight);
          coinGroup.position.set(x, 0.6, z);
          scene.add(coinGroup);
          itemMeshesRef.current.set(`coin_${r}_${c}`, coinGroup);
        } else if (cell.item === 'door' || (r === rows - 1 && c === cols - 1)) {
          const exitGroup = new THREE.Group();
          const ringMesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.8, 0.12, 12, 24),
            new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.9 })
          );
          const exitLight = new THREE.PointLight('#06b6d4', 3.0, 8);
          exitGroup.add(ringMesh); exitGroup.add(exitLight);
          exitGroup.position.set(x, 1.2, z);
          scene.add(exitGroup);
          itemMeshesRef.current.set(`exit_${r}_${c}`, exitGroup);
        }
      });
    });

    // 7. Spawn Animated Monsters & Minotaurs
    const enemiesList: Enemy3D[] = [];
    const numEnemies = Math.min(10, Math.floor(rows * cols * 0.12));

    for (let i = 0; i < numEnemies; i++) {
      const randR = Math.floor(Math.random() * (rows - 2)) + 1;
      const randC = Math.floor(Math.random() * (cols - 2)) + 1;
      const x = randC * tileSize + tileSize / 2;
      const z = randR * tileSize + tileSize / 2;

      const eType: EnemyType = i % 2 === 0 ? 'minotaur_beast' : i % 3 === 0 ? 'cyber_sentinel' : 'wraith_ghost';

      const enemyData: Enemy3D = {
        id: `enemy_${i}`,
        type: eType,
        x,
        z,
        hp: eType === 'minotaur_beast' ? 160 : eType === 'cyber_sentinel' ? 100 : 70,
        maxHp: eType === 'minotaur_beast' ? 160 : eType === 'cyber_sentinel' ? 100 : 70,
        speed: eType === 'minotaur_beast' ? 2.2 : 1.8,
        damage: 20,
        aggroDistance: 12,
        state: 'idle',
        color: eType === 'minotaur_beast' ? '#f59e0b' : eType === 'cyber_sentinel' ? '#ef4444' : '#06b6d4',
        size: 0.7,
        height: 1.6,
        lastAttackMs: 0,
        isDying: false,
        deathAnimProgress: 0,
      };

      enemiesList.push(enemyData);

      let eGroup: THREE.Group;
      if (eType === 'minotaur_beast') {
        eGroup = createMinotaurMeshGroup(enemyData.color);
      } else {
        eGroup = new THREE.Group();
        const bodyMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 16, 16),
          new THREE.MeshStandardMaterial({
            color: enemyData.color,
            emissive: enemyData.color,
            emissiveIntensity: 0.8,
          })
        );
        eGroup.add(bodyMesh);

        const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        leftEye.position.set(-0.15, 0.1, 0.35);
        rightEye.position.set(0.15, 0.1, 0.35);
        eGroup.add(leftEye); eGroup.add(rightEye);
      }

      eGroup.position.set(x, 0, z);
      scene.add(eGroup);
      enemyMeshesRef.current.set(enemyData.id, eGroup);
    }
    enemiesRef.current = enemiesList;

    // 8. Attach Weapon Viewmodel to Camera
    const weaponGroup = createWeaponViewModel(playerStateRef.current.currentWeapon);
    camera.add(weaponGroup);
    weaponMeshRef.current = weaponGroup;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        try {
          rendererRef.current.dispose();
        } catch {}
      }
      itemMeshesRef.current.clear();
      enemyMeshesRef.current.clear();
      enemiesRef.current = [];
      projectilesRef.current = [];
    };
  }, [grid, rows, cols, isNightMode, createStoneBrickWallTexture, createCobblestoneFloorTexture, createMinotaurMeshGroup, createWeaponViewModel]);

  // Update Weapon Model on Weapon Change
  useEffect(() => {
    if (!cameraRef.current) return;
    if (weaponMeshRef.current) {
      cameraRef.current.remove(weaponMeshRef.current);
    }
    const newWeapon = createWeaponViewModel(playerState.currentWeapon);
    cameraRef.current.add(newWeapon);
    weaponMeshRef.current = newWeapon;
  }, [playerState.currentWeapon, createWeaponViewModel]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'r' || e.key === 'R') handleReloadWeapon();
      if (e.key === 'f' || e.key === 'F') setPlayerState((p) => ({ ...p, flashlightOn: !p.flashlightOn }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Reload Weapon
  const handleReloadWeapon = useCallback(() => {
    const curr = playerStateRef.current;
    if (curr.isReloading || curr.reserveAmmo <= 0) return;
    const wConfig = WEAPONS[curr.currentWeapon];
    if (curr.ammoInClip === wConfig.maxClip) return;

    sound.playReload();
    setPlayerState((prev) => ({ ...prev, isReloading: true }));

    setTimeout(() => {
      setPlayerState((prev) => {
        const needed = wConfig.maxClip - prev.ammoInClip;
        const addAmount = Math.min(needed, prev.reserveAmmo);
        return {
          ...prev,
          ammoInClip: prev.ammoInClip + addAmount,
          reserveAmmo: prev.reserveAmmo - addAmount,
          isReloading: false,
        };
      });
    }, wConfig.reloadTimeMs);
  }, []);

  // Fire Weapon Handler
  const handleShoot = useCallback(() => {
    const now = performance.now();
    const currState = playerStateRef.current;
    const wConfig = WEAPONS[currState.currentWeapon];

    if (currState.isReloading) return;
    if (currState.ammoInClip <= 0) {
      handleReloadWeapon();
      return;
    }
    if (now - lastShotTimeRef.current < wConfig.fireRateMs) return;
    lastShotTimeRef.current = now;

    sound.playGunshot(wConfig.soundType);

    // Screen Shake Recoil
    const recoilShake = wConfig.damage > 80 ? 0.35 : 0.15;
    shakeIntensityRef.current = Math.min(0.45, shakeIntensityRef.current + recoilShake);

    setPlayerState((prev) => ({ ...prev, ammoInClip: prev.ammoInClip - 1 }));

    // Weapon Recoil & Muzzle Flash Animation
    if (weaponMeshRef.current) {
      weaponMeshRef.current.position.z += 0.08;
      weaponMeshRef.current.rotation.x -= 0.12;

      const muzzleLight = weaponMeshRef.current.userData?.muzzleLight as THREE.PointLight | undefined;
      const flashMesh = weaponMeshRef.current.userData?.flashMesh as THREE.Mesh | undefined;

      if (muzzleLight) muzzleLight.intensity = 15.0;
      if (flashMesh) flashMesh.visible = true;
      setMuzzleFlashScreen(true);

      setTimeout(() => {
        if (weaponMeshRef.current) {
          weaponMeshRef.current.position.z -= 0.08;
          weaponMeshRef.current.rotation.x += 0.12;
        }
        if (muzzleLight) muzzleLight.intensity = 0;
        if (flashMesh) flashMesh.visible = false;
        setMuzzleFlashScreen(false);
      }, 60);
    }

    // Explosive Projectile Launch for Grenades / Rockets
    if (currState.currentWeapon === 'grenade_launcher' || currState.currentWeapon === 'rocket_launcher') {
      if (cameraRef.current && sceneRef.current) {
        const camera = cameraRef.current;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);

        const projGroup = new THREE.Group();
        const isRocket = currState.currentWeapon === 'rocket_launcher';

        const projMesh = new THREE.Mesh(
          isRocket ? new THREE.ConeGeometry(0.08, 0.25, 8) : new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({
            color: isRocket ? '#dc2626' : '#f97316',
            emissive: isRocket ? '#ef4444' : '#f97316',
            emissiveIntensity: 0.9,
          })
        );
        projGroup.add(projMesh);
        projGroup.position.copy(camera.position).add(dir.clone().multiplyScalar(0.6));
        sceneRef.current.add(projGroup);

        projectilesRef.current.push({
          mesh: projGroup,
          type: isRocket ? 'rocket' : 'grenade',
          dir,
          velocity: isRocket ? 14.0 : 9.0,
          timeToLive: 2.5,
          damage: wConfig.damage,
          radius: isRocket ? 4.5 : 3.5,
          posX: projGroup.position.x,
          posY: projGroup.position.y,
          posZ: projGroup.position.z,
        });
      }
      return;
    }

    // Standard Direct Raycast Bullet
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const hitEnemies: Enemy3D[] = [];
    enemiesRef.current.forEach((enemy) => {
      if (enemy.hp <= 0 || enemy.isDying) return;
      const dist = Math.hypot(camera.position.x - enemy.x, camera.position.z - enemy.z);
      if (dist > 25) return;

      const eVector = new THREE.Vector3(enemy.x, 0.8, enemy.z).sub(camera.position).normalize();
      const cVector = new THREE.Vector3();
      camera.getWorldDirection(cVector);

      const dot = cVector.dot(eVector);
      if (dot > 0.92) {
        hitEnemies.push(enemy);
      }
    });

    if (hitEnemies.length > 0) {
      hitEnemies.sort((a, b) => {
        const dA = Math.hypot(camera.position.x - a.x, camera.position.z - a.z);
        const dB = Math.hypot(camera.position.x - b.x, camera.position.z - b.z);
        return dA - dB;
      });

      const targetEnemy = hitEnemies[0];
      targetEnemy.hp -= wConfig.damage;
      sound.playMonsterHit();

      setHitMarker(true);
      setTimeout(() => setHitMarker(false), 120);

      const eMesh = enemyMeshesRef.current.get(targetEnemy.id);
      if (eMesh) {
        const originalY = eMesh.position.y;
        eMesh.position.y += 0.15;
        setTimeout(() => { if (eMesh) eMesh.position.y = originalY; }, 80);
      }

      if (targetEnemy.hp <= 0 && !targetEnemy.isDying) {
        targetEnemy.isDying = true;
        targetEnemy.state = 'dead';
        sound.playGhostScreech();

        setPlayerState((p) => ({ ...p, killsCount: p.killsCount + 1 }));

        // Award +25 Coins for enemy kill
        setPlayerCoins((c) => {
          const next = c + 25;
          const saved = localStorage.getItem('mazemaster_player_stats_v2');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.totalCoins = (parsed.totalCoins || 0) + 25;
              localStorage.setItem('mazemaster_player_stats_v2', JSON.stringify(parsed));
            } catch {}
          }
          return next;
        });

        setCoinPopup('+25 COINS!');
        setTimeout(() => setCoinPopup(null), 1200);

        if (eMesh) {
          eMesh.visible = false;
        }
      }
    }
  }, [handleReloadWeapon]);

  // Desktop Mouse Look & Pointer Lock Handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (showLevelMapPreview || isPaused || isArmoryOpen || isGameOverRef.current) return;
      if (e.button === 0) {
        isShootingRef.current = true;
        handleShoot();
        if (document.pointerLockElement !== container) {
          container.requestPointerLock?.();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isShootingRef.current = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        const sensitivity = 0.0022;
        cameraYawRef.current -= e.movementX * sensitivity;
        cameraPitchRef.current -= e.movementY * sensitivity;
        cameraPitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraPitchRef.current));
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showLevelMapPreview, isPaused, isArmoryOpen, handleShoot]);

  // Level Map Preview Drawing Effect
  useEffect(() => {
    if (!showLevelMapPreview) return;

    const drawPreviewMap = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const cellW = w / cols;
      const cellH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const x = c * cellW;
          const y = r * cellH;

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, cellW, cellH);

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          if (cell.walls.top) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellW, y); ctx.stroke();
          }
          if (cell.walls.bottom) {
            ctx.beginPath(); ctx.moveTo(x, y + cellH); ctx.lineTo(x + cellW, y + cellH); ctx.stroke();
          }
          if (cell.walls.left) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellH); ctx.stroke();
          }
          if (cell.walls.right) {
            ctx.beginPath(); ctx.moveTo(x + cellW, y); ctx.lineTo(x + cellW, y + cellH); ctx.stroke();
          }

          if (cell.item === 'key') {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) * 0.28, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell.item === 'door' || (r === rows - 1 && c === cols - 1)) {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(x + cellW * 0.2, y + cellH * 0.2, cellW * 0.6, cellH * 0.6);
          }
        }
      }

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cellW * 0.5, cellH * 0.5, Math.min(cellW, cellH) * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      enemiesRef.current.forEach((enemy) => {
        if (enemy.hp <= 0) return;
        const eCol = Math.floor((enemy.x / (cols * 3.0)) * cols);
        const eRow = Math.floor((enemy.z / (rows * 3.0)) * rows);
        const ex = eCol * cellW + cellW / 2;
        const ey = eRow * cellH + cellH / 2;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.min(cellW, cellH) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animId = requestAnimationFrame(drawPreviewMap);
    const timeoutId = setTimeout(drawPreviewMap, 50);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, [showLevelMapPreview, grid, rows, cols]);

  // Main 3D Game Loop
  useEffect(() => {
    let animId: number;
    let lastFrameTime = performance.now();

    const gameLoop = (time: number) => {
      const delta = Math.min((time - lastFrameTime) / 1000, 0.1);
      lastFrameTime = time;

      // Handle Automatic Continuous Shooting
      if (isShootingRef.current && WEAPONS[playerStateRef.current.currentWeapon].isAutomatic) {
        handleShoot();
      }

      if (!isPaused && !showLevelMapPreview && !isArmoryOpen && !isGameOverRef.current && cameraRef.current) {
        const camera = cameraRef.current;

        // 1. Camera Look Rotation & Screen Shake
        if (lookJoystickRef.current.x !== 0 || lookJoystickRef.current.y !== 0) {
          const lookSpeed = 2.0;
          cameraYawRef.current -= lookJoystickRef.current.x * lookSpeed * delta;
          cameraPitchRef.current -= lookJoystickRef.current.y * lookSpeed * delta;
          cameraPitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraPitchRef.current));
        }

        let shakeX = 0;
        let shakeY = 0;
        let shakeRoll = 0;
        if (shakeIntensityRef.current > 0.001) {
          const intensity = shakeIntensityRef.current;
          shakeX = (Math.random() - 0.5) * intensity * 0.14;
          shakeY = (Math.random() - 0.5) * intensity * 0.14;
          shakeRoll = (Math.random() - 0.5) * intensity * 0.08;
          shakeIntensityRef.current *= Math.exp(-14 * delta);
        }

        const euler = new THREE.Euler(
          cameraPitchRef.current + shakeY * 0.3,
          cameraYawRef.current + shakeX * 0.3,
          shakeRoll,
          'YXZ'
        );
        camera.quaternion.setFromEuler(euler);

        // 2. CS-Style Wall Path Movement & Collision
        let moveX = 0;
        let moveZ = 0;

        if (keysDownRef.current['w'] || keysDownRef.current['arrowup']) moveZ -= 1;
        if (keysDownRef.current['s'] || keysDownRef.current['arrowdown']) moveZ += 1;
        if (keysDownRef.current['a'] || keysDownRef.current['arrowleft']) moveX -= 1;
        if (keysDownRef.current['d'] || keysDownRef.current['arrowright']) moveX += 1;

        moveX += moveJoystickRef.current.x;
        moveZ += moveJoystickRef.current.y;

        if (moveX !== 0 || moveZ !== 0) {
          const isSprinting = keysDownRef.current['shift'];
          const moveSpeed = (isSprinting ? 4.2 : 2.8) * (activePowerUps.speedBoostRemaining > 0 ? 1.5 : 1.0);

          const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, cameraYawRef.current, 0));
          const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, cameraYawRef.current, 0));

          const moveVec = new THREE.Vector3()
            .addScaledVector(forward, -moveZ)
            .addScaledVector(right, moveX)
            .normalize()
            .multiplyScalar(moveSpeed * delta);

          const tileSize = 3.0;
          const isGhost = activePowerUps.ghostModeRemaining > 0;

          // Try X Step
          const nextX = camera.position.x + moveVec.x;
          const currC = Math.floor(camera.position.x / tileSize);
          const currR = Math.floor(camera.position.z / tileSize);
          const nextC = Math.floor(nextX / tileSize);

          let canX = true;
          if (!isGhost && currC !== nextC) {
            if (nextC < 0 || nextC >= cols || currR < 0 || currR >= rows) canX = false;
            else if (nextC < currC && grid[currR][currC].walls.left) canX = false;
            else if (nextC > currC && grid[currR][currC].walls.right) canX = false;
          }
          if (canX) camera.position.x = nextX;

          // Try Z Step
          const nextZ = camera.position.z + moveVec.z;
          const nextR = Math.floor(nextZ / tileSize);

          let canZ = true;
          if (!isGhost && currR !== nextR) {
            if (nextR < 0 || nextR >= rows || currC < 0 || currC >= cols) canZ = false;
            else if (nextR < currR && grid[currR][currC].walls.top) canZ = false;
            else if (nextR > currR && grid[currR][currC].walls.bottom) canZ = false;
          }
          if (canZ) camera.position.z = nextZ;

          // Responsive weapon sway and walk bob
          const yawDelta = cameraYawRef.current - lastYawRef.current;
          const pitchDelta = cameraPitchRef.current - lastPitchRef.current;
          lastYawRef.current = cameraYawRef.current;
          lastPitchRef.current = cameraPitchRef.current;

          const targetSwayX = -yawDelta * 0.8 - moveJoystickRef.current.x * 0.04;
          const targetSwayY = pitchDelta * 0.8 - moveJoystickRef.current.y * 0.04;

          weaponSwayXRef.current += (targetSwayX - weaponSwayXRef.current) * 0.18;
          weaponSwayYRef.current += (targetSwayY - weaponSwayYRef.current) * 0.18;

          if (weaponMeshRef.current) {
            const basePos = weaponMeshRef.current.userData?.basePos || { x: 0.22, y: -0.18, z: -0.5 };
            const isMoving = moveX !== 0 || moveZ !== 0 || Math.hypot(moveJoystickRef.current.x, moveJoystickRef.current.y) > 0.1;
            const bobY = isMoving ? Math.sin(time * 0.012) * 0.015 : 0;
            const bobX = isMoving ? Math.cos(time * 0.006) * 0.01 : 0;

            weaponMeshRef.current.position.x = basePos.x + weaponSwayXRef.current + bobX;
            weaponMeshRef.current.position.y = basePos.y + weaponSwayYRef.current + bobY;
            weaponMeshRef.current.rotation.z = -weaponSwayXRef.current * 1.5;
            weaponMeshRef.current.rotation.y = weaponSwayXRef.current * 0.8;
          }
        }

        // Raycast Enemy Hover Check for Tactical Crosshair
        if (cameraRef.current) {
          let hovering = false;
          const cameraDir = new THREE.Vector3();
          cameraRef.current.getWorldDirection(cameraDir);

          for (const enemy of enemiesRef.current) {
            if (enemy.hp <= 0 || enemy.isDying) continue;
            const dist = Math.hypot(cameraRef.current.position.x - enemy.x, cameraRef.current.position.z - enemy.z);
            if (dist > 22) continue;

            const eDir = new THREE.Vector3(enemy.x, 0.8, enemy.z).sub(cameraRef.current.position).normalize();
            if (cameraDir.dot(eDir) > 0.93) {
              hovering = true;
              break;
            }
          }
          setIsHoveringEnemy(hovering);
        }

        // 3. Item Pickups Check
        const pR = Math.floor(camera.position.z / 3.0);
        const pC = Math.floor(camera.position.x / 3.0);

        if (pR >= 0 && pR < rows && pC >= 0 && pC < cols) {
          const cell = grid[pR][pC];
          if (cell.item === 'key') {
            sound.playKey();
            cell.item = undefined;
            setKeysCollected((k) => k + 1);
            const mesh = itemMeshesRef.current.get(`key_${pR}_${pC}`);
            if (mesh) mesh.visible = false;
          } else if (cell.item === 'coin') {
            sound.playCoin();
            cell.item = undefined;
            setPlayerCoins((c) => c + 15);
            setCoinPopup('+15 COINS!');
            setTimeout(() => setCoinPopup(null), 1000);
            const mesh = itemMeshesRef.current.get(`coin_${pR}_${pC}`);
            if (mesh) mesh.visible = false;
          } else if (cell.item === 'door' || (pR === rows - 1 && pC === cols - 1)) {
            if (keysCollected >= totalKeysRequired && !isGameOverRef.current) {
              isGameOverRef.current = true;
              sound.playWin();
              const finalTime = timeElapsed;
              const finalBonus = keysCollected * 20;
              setTimeout(() => {
                onWin(finalTime, finalBonus, 3);
              }, 0);
            }
          }
        }

        // 4. Update Explosive Projectiles
        if (projectilesRef.current.length > 0 && sceneRef.current) {
          const nextProjs: ExplosiveProjectile[] = [];
          projectilesRef.current.forEach((p) => {
            p.timeToLive -= delta;
            p.mesh.position.addScaledVector(p.dir, p.velocity * delta);

            // Check projectile hit
            let exploded = false;
            const pC = Math.floor(p.mesh.position.x / 3.0);
            const pR = Math.floor(p.mesh.position.z / 3.0);

            if (pR < 0 || pR >= rows || pC < 0 || pC >= cols || p.timeToLive <= 0) {
              exploded = true;
            }

            if (exploded) {
              sound.playExplosion();
              shakeIntensityRef.current = 0.45;

              // Blast AOE Damage
              enemiesRef.current.forEach((enemy) => {
                if (enemy.hp <= 0) return;
                const dist = Math.hypot(p.mesh.position.x - enemy.x, p.mesh.position.z - enemy.z);
                if (dist <= p.radius) {
                  enemy.hp -= p.damage;
                  if (enemy.hp <= 0 && !enemy.isDying) {
                    enemy.isDying = true;
                    enemy.state = 'dead';
                    const eMesh = enemyMeshesRef.current.get(enemy.id);
                    if (eMesh) eMesh.visible = false;
                    setPlayerState((st) => ({ ...st, killsCount: st.killsCount + 1 }));
                    setPlayerCoins((c) => c + 35);
                  }
                }
              });

              sceneRef.current?.remove(p.mesh);
            } else {
              nextProjs.push(p);
            }
          });
          projectilesRef.current = nextProjs;
        }

        // 5. Enemy AI Chase & Walk Animations
        enemiesRef.current.forEach((enemy) => {
          if (enemy.hp <= 0) return;

          const eMesh = enemyMeshesRef.current.get(enemy.id);
          if (!eMesh) return;

          const dist = Math.hypot(camera.position.x - enemy.x, camera.position.z - enemy.z);

          if (dist < enemy.aggroDistance) {
            const hasLOS = checkLineOfSight(enemy.x, enemy.z, camera.position.x, camera.position.z, grid, rows, cols);
            if (hasLOS) {
              enemy.state = 'chasing';
              moveEnemyWithCollision(enemy, camera.position.x, camera.position.z, enemy.speed, delta, grid, rows, cols);
              eMesh.position.x = enemy.x;
              eMesh.position.z = enemy.z;
              eMesh.lookAt(camera.position.x, eMesh.position.y, camera.position.z);

              // Player Damage Collision
              if (dist < 0.95 && time - enemy.lastAttackMs > 1000) {
                enemy.lastAttackMs = time;
                sound.playPlayerDamage();
                shakeIntensityRef.current = 0.45;
                setDamageFlash(true);
                setTimeout(() => setDamageFlash(false), 200);

                const currentHp = playerStateRef.current.hp;
                const nextHp = Math.max(0, currentHp - enemy.damage);
                if (nextHp <= 0 && !isGameOverRef.current) {
                  isGameOverRef.current = true;
                  sound.playLose();
                  setTimeout(() => {
                    onLose();
                  }, 0);
                }
                setPlayerState((prev) => ({ ...prev, hp: nextHp }));
              }
            }
          }

          // Walk Bob
          const walkBob = Math.sin(time * 0.008 + parseInt(enemy.id.replace('enemy_', '') || '0')) * 0.08;
          eMesh.position.y = 0.1 + walkBob;
        });

        // 6. Flashlight & Point Lights
        const currentState = playerStateRef.current;
        if (currentState.flashlightOn && currentState.flashlightBattery > 0) {
          const drainedBattery = Math.max(0, currentState.flashlightBattery - delta * 0.8);
          if (Math.abs(drainedBattery - currentState.flashlightBattery) > 0.05) {
            setPlayerState((p) => ({ ...p, flashlightBattery: drainedBattery }));
          }
          if (playerPointLightRef.current) playerPointLightRef.current.visible = true;
          if (flashlightRef.current) flashlightRef.current.visible = true;
        } else {
          if (playerPointLightRef.current) playerPointLightRef.current.visible = false;
          if (flashlightRef.current) flashlightRef.current.visible = false;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, showLevelMapPreview, isArmoryOpen, handleShoot, keysCollected, totalKeysRequired, rows, cols, timeElapsed, onWin, onLose, activePowerUps, grid]);

  // Level Timer Tick
  useEffect(() => {
    if (isPaused || showLevelMapPreview || isArmoryOpen) return;
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused, showLevelMapPreview, isArmoryOpen]);

  // Restart Level
  const handleRestartLevel = () => {
    isGameOverRef.current = false;
    setPlayerState((p) => ({
      ...p,
      hp: 100,
      ammoInClip: WEAPONS[p.currentWeapon].maxClip,
      reserveAmmo: 120,
      flashlightBattery: 100,
    }));
    setKeysCollected(0);
    setTimeElapsed(0);
    setIsPaused(false);
    setShowLevelMapPreview(true);

    if (cameraRef.current) {
      cameraRef.current.position.set(1.5, 1.2, 1.5);
      cameraYawRef.current = 0;
      cameraPitchRef.current = 0;
    }
  };

  // Touch handlers for GTA Touch Analog Joystick
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickTouchIdRef.current = touch.identifier;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = 45;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy), maxRadius);

    const kX = Math.cos(angle) * dist;
    const kY = Math.sin(angle) * dist;

    setJoystickKnob({ x: kX, y: kY });
    moveJoystickRef.current = { x: kX / maxRadius, y: kY / maxRadius };
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxRadius);

        const kX = Math.cos(angle) * clampedDist;
        const kY = Math.sin(angle) * clampedDist;

        setJoystickKnob({ x: kX, y: kY });
        moveJoystickRef.current = { x: kX / maxRadius, y: kY / maxRadius };
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickKnob({ x: 0, y: 0 });
        moveJoystickRef.current = { x: 0, y: 0 };
      }
    }
  };

  // Touch handlers for Camera Look
  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookTouchRef.current.x;
        const dy = touch.clientY - lastLookTouchRef.current.y;
        lastLookTouchRef.current = { x: touch.clientX, y: touch.clientY };

        const sensitivity = 0.004;
        cameraYawRef.current -= dx * sensitivity;
        cameraPitchRef.current -= dy * sensitivity;
        cameraPitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraPitchRef.current));
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden select-none font-mono">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Right-Side Touch Swipe Surface for Camera Look */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        className="absolute inset-y-0 right-0 w-1/2 z-10 touch-none"
      />

      {/* Red Damage Flash */}
      {damageFlash && <div className="absolute inset-0 bg-red-600/30 pointer-events-none z-30" />}

      {/* Coin Earned Popup Notification */}
      {coinPopup && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-full font-extrabold text-sm tracking-widest shadow-2xl animate-bounce pointer-events-none">
          {coinPopup}
        </div>
      )}

      {/* Screen Muzzle Flash Flash Glow */}
      {muzzleFlashScreen && (
        <div className="absolute inset-0 bg-amber-500/10 mix-blend-screen pointer-events-none z-20 transition-opacity duration-75" />
      )}

      {/* TACTICAL CROSSHAIR & HITMARKER OVERLAY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className={`relative flex items-center justify-center transition-transform duration-75 ${
          muzzleFlashScreen ? 'scale-125' : 'scale-100'
        }`}>
          {/* Center Dot */}
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isHoveringEnemy ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
          }`} />

          {/* Reticle Ticks */}
          <div className={`absolute -top-3.5 w-0.5 h-2.5 transition-colors ${isHoveringEnemy ? 'bg-red-500' : 'bg-amber-400/80'}`} />
          <div className={`absolute -bottom-3.5 w-0.5 h-2.5 transition-colors ${isHoveringEnemy ? 'bg-red-500' : 'bg-amber-400/80'}`} />
          <div className={`absolute -left-3.5 h-0.5 w-2.5 transition-colors ${isHoveringEnemy ? 'bg-red-500' : 'bg-amber-400/80'}`} />
          <div className={`absolute -right-3.5 h-0.5 w-2.5 transition-colors ${isHoveringEnemy ? 'bg-red-500' : 'bg-amber-400/80'}`} />

          {/* Animated Hit Marker 'X' */}
          {hitMarker && (
            <div className="absolute inset-0 flex items-center justify-center animate-ping">
              <div className="w-8 h-8 text-red-500 font-extrabold text-sm flex items-center justify-center drop-shadow-[0_0_12px_#ef4444]">
                ✕
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOP LEFT HUD BAR: Health, Keys, Coins */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-2xl">
          <Shield className="w-4 h-4 text-red-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Health</span>
            <div className="w-20 sm:w-28 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300" style={{ width: `${playerState.hp}%` }} />
            </div>
          </div>
          <span className="text-xs font-bold text-red-400">{playerState.hp}</span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 font-bold">{keysCollected}/{totalKeysRequired}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md border border-amber-500/50 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 shadow-xl">
          <span className="text-sm">✧</span>
          <span>{playerCoins}</span>
        </div>
      </div>

      {/* TOP RIGHT CORNER: MINI-MAP & ACTIONS HEADER */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <MiniMapRadar
          grid={grid}
          rows={rows}
          cols={cols}
          isNightMode={isNightMode}
          cameraRef={cameraRef}
          cameraYawRef={cameraYawRef}
          itemMeshesRef={itemMeshesRef}
          enemiesRef={enemiesRef}
          size={120}
        />

        <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-xl">
          {onSkipLevelWithAds && (
            <button
              onClick={onSkipLevelWithAds}
              title="Watch 2 ads to skip current level"
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
              <span>{skipLevelAdCount === 1 ? 'Skip (1/2 Ads)' : 'Skip (2 Ads)'}</span>
            </button>
          )}

          {/* WEAPONS ARMORY STORE BUTTON */}
          <button
            onClick={() => setIsArmoryOpen(true)}
            title="Open Guns Armory Store"
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition shadow-lg shadow-amber-500/20"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ARMORY</span>
          </button>

          <button
            onClick={() => setIsNightMode((prev) => !prev)}
            title={isNightMode ? 'Switch to Day' : 'Switch to Night'}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-500/20 text-amber-300 border border-zinc-800 text-xs font-bold flex items-center gap-1 active:scale-95 transition"
          >
            {isNightMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={handleRestartLevel}
            title="Restart Level"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-amber-500/20 text-amber-400 border border-zinc-800 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Settings"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 active:scale-95 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onBackToMenu}
            title="Exit Game"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/50 text-red-400 border border-zinc-800 active:scale-95 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK WEAPON SELECTION WHEEL / BAR */}
      <div className="absolute top-16 left-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        {unlockedWeapons.map((wId) => {
          const isSelected = playerState.currentWeapon === wId;
          const config = WEAPONS[wId];
          return (
            <button
              key={wId}
              onClick={() => {
                sound.playClick();
                setPlayerState((p) => ({
                  ...p,
                  currentWeapon: wId,
                  ammoInClip: config.maxClip,
                }));
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{config.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* BOTTOM WEAPON & AMMO HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-auto">
        <div className="bg-zinc-950/90 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="text-2xl">{WEAPONS[playerState.currentWeapon].icon}</div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {WEAPONS[playerState.currentWeapon].name}
            </span>
            <div className="flex items-baseline gap-1 text-zinc-100 font-mono font-bold">
              <span className="text-lg text-amber-300">{playerState.ammoInClip}</span>
              <span className="text-xs text-zinc-500">/ {playerState.reserveAmmo} AMMO</span>
            </div>
          </div>
          <button
            onClick={handleReloadWeapon}
            disabled={playerState.isReloading}
            className="ml-2 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-cyan-400 border border-cyan-500/30 flex items-center gap-1 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${playerState.isReloading ? 'animate-spin' : ''}`} />
            <span>RELOAD</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Flashlight Battery */}
          <div className="bg-zinc-950/90 backdrop-blur-md border border-amber-500/40 px-3 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl">
            <Zap className={`w-4 h-4 ${playerState.flashlightBattery < 25 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 uppercase font-bold">
                <span>Battery</span>
                <span className={playerState.flashlightBattery < 25 ? 'text-red-400 font-bold animate-pulse' : 'text-amber-300'}>
                  {Math.round(playerState.flashlightBattery)}%
                </span>
              </div>
              <div className="w-16 sm:w-24 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    playerState.flashlightBattery < 25 ? 'bg-red-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(0, playerState.flashlightBattery)}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setPlayerState((p) => ({ ...p, flashlightOn: !p.flashlightOn }))}
            className={`p-3 rounded-2xl border backdrop-blur-md font-bold text-xs uppercase flex items-center gap-2 shadow-xl active:scale-95 transition ${
              playerState.flashlightOn ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
            }`}
          >
            <Flame className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* GTA-STYLE TOUCH CONTROLS (360 JOYSTICK + FIRE TARGET BUTTON) */}
      <div className="absolute inset-x-4 bottom-20 z-30 flex items-end justify-between pointer-events-auto">
        <div
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="w-28 h-28 sm:w-32 sm:h-32 bg-zinc-950/85 backdrop-blur-md rounded-full border-2 border-amber-500/50 relative flex items-center justify-center shadow-2xl touch-none"
        >
          <div className="text-[9px] text-amber-400/60 font-bold uppercase tracking-widest pointer-events-none">
            JOYSTICK
          </div>
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 border-2 border-amber-200 shadow-xl absolute transition-transform duration-75"
            style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }}
          />
        </div>

        <button
          onTouchStart={() => {
            isShootingRef.current = true;
            handleShoot();
          }}
          onTouchEnd={() => (isShootingRef.current = false)}
          onMouseDown={() => {
            isShootingRef.current = true;
            handleShoot();
          }}
          onMouseUp={() => (isShootingRef.current = false)}
          className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-amber-500 border-2 border-red-400 text-zinc-950 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
        >
          <Target className="w-8 h-8 stroke-[2.5]" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">FIRE</span>
        </button>
      </div>

      {/* WEAPONS ARMORY IN-GAME STORE MODAL */}
      {isArmoryOpen && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-zinc-900 border border-amber-500/60 rounded-xl max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl text-zinc-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-serif font-bold uppercase tracking-wider text-amber-400">
                  Tactical Weapons Armory
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="px-3 py-1 bg-zinc-950 border border-amber-500/40 rounded-lg text-amber-400 font-bold text-xs">
                  ✧ {playerCoins} Coins
                </div>

                <button
                  onClick={() => {
                    if (onWatchAdClick) {
                      onWatchAdClick();
                    } else {
                      sound.playWin();
                      setPlayerCoins((c) => c + 500);
                    }
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-bold text-xs uppercase rounded-lg shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1 cursor-pointer"
                  title="Watch short video ad for +500 coin boost"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+500 Ads Boost</span>
                </button>

                <button
                  onClick={() => setIsArmoryOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(WEAPONS).map((gun) => {
                const isUnlocked = unlockedWeapons.includes(gun.id);
                const isEquipped = playerState.currentWeapon === gun.id;

                return (
                  <div key={gun.id} className="p-3.5 rounded-xl border bg-zinc-950 border-zinc-800 flex flex-col justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                        {gun.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif text-xs uppercase font-bold text-amber-300">{gun.name}</h3>
                          {gun.isAutomatic && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">AUTO</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{gun.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800">
                      <div>DMG: <span className="text-red-400 font-bold">{gun.damage}</span></div>
                      <div>CLIP: <span className="text-amber-400 font-bold">{gun.maxClip}</span></div>
                      <div>FIRE: <span className="text-cyan-400 font-bold">{gun.fireRateMs}ms</span></div>
                      <div>RELOAD: <span className="text-emerald-400 font-bold">{(gun.reloadTimeMs/1000).toFixed(1)}s</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {gun.price === 0 ? 'Free' : `✧ ${gun.price} Coins`}
                      </span>

                      {isEquipped ? (
                        <div className="px-3 py-1 text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Equipped</span>
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            sound.playClick();
                            setPlayerState((p) => ({
                              ...p,
                              currentWeapon: gun.id,
                              ammoInClip: gun.maxClip,
                            }));
                            setIsArmoryOpen(false);
                          }}
                          className="px-3 py-1 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-lg active:scale-95"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (playerCoins >= gun.price) {
                              sound.playWin();
                              setPlayerCoins((c) => c - gun.price);
                              setUnlockedWeapons((prev) => [...prev, gun.id]);
                              setPlayerState((p) => ({
                                ...p,
                                currentWeapon: gun.id,
                                ammoInClip: gun.maxClip,
                              }));
                            } else {
                              sound.playTrap();
                            }
                          }}
                          disabled={playerCoins < gun.price}
                          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition ${
                            playerCoins >= gun.price
                              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95'
                              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL MAP OVERVIEW SCREEN PREVIEW */}
      {showLevelMapPreview && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-2xl max-w-md w-full p-5 flex flex-col items-center text-center gap-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <MapPin className="w-6 h-6 animate-bounce" />
              <h2 className="text-lg font-serif font-bold uppercase tracking-wider">
                TACTICAL LEVEL OVERVIEW MAP
              </h2>
            </div>

            <div className="relative p-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-inner">
              <canvas ref={previewCanvasRef} width={260} height={260} className="rounded-lg bg-zinc-950" />
            </div>

            <div className="w-full text-left bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 font-sans">
              <div className="font-bold text-amber-400 font-mono text-[11px] uppercase tracking-wide">
                Mission Objectives:
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Navigate ancient stone brick maze corridors.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✧</span>
                <span>Collect all golden keys & defeat approaching monsters.</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playButtonClick();
                setShowLevelMapPreview(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition"
            >
              START BATTLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
