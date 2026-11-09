export type GameShellState = 'title' | 'playing' | 'paused' | 'gameover';
export type GameOutcome = 'victory' | 'defeat' | null;
export type HazardArchetype = 'chaser_forklift' | 'kiter_drone' | 'charger_crane';

export interface HazardEntity {
  id: string;
  archetype: HazardArchetype;
  x: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
  radius: number;
  windupTimer: number;
  dashTimer: number;
  dashDirX: number;
  dashDirZ: number;
  hitFlashTimer: number;
}

export interface PalletPickup {
  id: string;
  sku: string;
  label: string;
  brand: 'industrial_latina' | 'induless';
  x: number;
  z: number;
  collected: boolean;
  colorHex: number;
}

export interface GameRunSnapshot {
  outcome: 'victory' | 'defeat';
  score: number;
  bestScore: number;
  palletsCollected: number;
  targetPallets: number;
  clearTimeSec: number;
  hpRemaining: number;
  maxHp: number;
  waveReached: number;
}

export interface GameSimulationState {
  shellState: GameShellState;
  outcome: GameOutcome;
  playerX: number;
  playerZ: number;
  playerVx: number;
  playerVz: number;
  playerYaw: number;
  hp: number;
  maxHp: number;
  score: number;
  bestScore: number;
  combo: number;
  comboTimer: number;
  palletsCollected: number;
  targetPallets: number;
  wave: number;
  elapsedSec: number;
  hitstopTimer: number;
  cameraTrauma: number;
  dashCooldown: number;
  invulnerableTimer: number;
}

export function clampSimulationDt(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function createInitialGameSimulationState(bestScore = 0, autostart = false): GameSimulationState {
  return {
    shellState: autostart ? 'playing' : 'title',
    outcome: null,
    playerX: 0,
    playerZ: 18, // Spawn on open central corridor facing North (-Z)
    playerVx: 0,
    playerVz: 0,
    playerYaw: 0,
    hp: 5,
    maxHp: 5,
    score: 0,
    bestScore: Math.max(0, bestScore),
    combo: 1,
    comboTimer: 0,
    palletsCollected: 0,
    targetPallets: 8,
    wave: 1,
    elapsedSec: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    dashCooldown: 0,
    invulnerableTimer: 0,
  };
}

export function createInitialPallets(): PalletPickup[] {
  const spots: Array<{ sku: string; label: string; brand: 'industrial_latina' | 'induless'; x: number; z: number; colorHex: number }> = [
    { sku: 'LAT-DUR-01', label: 'Caneca Duralín Forte', brand: 'industrial_latina', x: -12, z: 8, colorHex: 0x1e4e8c },
    { sku: 'LAT-SAT-01', label: 'Pintura Satinada Tipo 1', brand: 'industrial_latina', x: 12, z: 8, colorHex: 0xffd100 },
    { sku: 'PRL18E', label: 'Lote Paneles LED 18W', brand: 'induless', x: -16, z: -4, colorHex: 0xd8235a },
    { sku: 'LAT-POR-2K', label: 'Porcelana Fragua 2K', brand: 'industrial_latina', x: 16, z: -4, colorHex: 0x0f766e },
    { sku: 'CF12NER', label: 'Bobinas Cable CONDEX #12', brand: 'induless', x: 0, z: -2, colorHex: 0xe3000f },
    { sku: 'LAT-ELA-01', label: 'Tanque Elastomérico Teja', brand: 'industrial_latina', x: -12, z: -15, colorHex: 0xb91c1c },
    { sku: 'TF15', label: 'Planchas Techoforte 5m', brand: 'induless', x: 12, z: -15, colorHex: 0x2563eb },
    { sku: 'LAT-EMP-EXT', label: 'Palet Empaste Exterior', brand: 'industrial_latina', x: 0, z: -20, colorHex: 0x10b981 },
  ];

  return spots.map((s, idx) => ({
    id: `pallet-${idx + 1}`,
    ...s,
    collected: false,
  }));
}

export function createInitialHazards(): HazardEntity[] {
  return [
    {
      id: 'haz-chaser-1',
      archetype: 'chaser_forklift',
      x: -18,
      z: -10,
      vx: 0,
      vz: 0,
      speed: 4.4,
      radius: 1.5,
      windupTimer: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirZ: 1,
      hitFlashTimer: 0,
    },
    {
      id: 'haz-kiter-2',
      archetype: 'kiter_drone',
      x: 18,
      z: -8,
      vx: 0,
      vz: 0,
      speed: 5.2,
      radius: 1.35,
      windupTimer: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirZ: 1,
      hitFlashTimer: 0,
    },
    {
      id: 'haz-charger-3',
      archetype: 'charger_crane',
      x: 0,
      z: -16,
      vx: 0,
      vz: 0,
      speed: 3.8,
      radius: 1.65,
      windupTimer: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirZ: 1,
      hitFlashTimer: 0,
    },
  ];
}

export function stepHazardBehavior(
  hazard: HazardEntity,
  playerX: number,
  playerZ: number,
  simDt: number,
  arenaHalfExtent = 24
): HazardEntity {
  if (simDt <= 0) return hazard;

  const dx = playerX - hazard.x;
  const dz = playerZ - hazard.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  const nx = dx / dist;
  const nz = dz / dist;

  let nextVx = hazard.vx;
  let nextVz = hazard.vz;
  let nextWindup = Math.max(0, hazard.windupTimer - simDt);
  let nextDash = Math.max(0, hazard.dashTimer - simDt);
  let nextDashDirX = hazard.dashDirX;
  let nextDashDirZ = hazard.dashDirZ;

  if (hazard.archetype === 'chaser_forklift') {
    // Policy 1: Direct pursuit with aisle alignment bias
    nextVx = nx * hazard.speed;
    nextVz = nz * hazard.speed;
  } else if (hazard.archetype === 'kiter_drone') {
    // Policy 2: Orbit / Kiter maintaining 9m..13m ring + tangential strafe
    const preferredDist = 10.5;
    const radialPush = Math.max(-1, Math.min(1, (dist - preferredDist) * 0.35));
    const tangentX = -nz;
    const tangentZ = nx;
    nextVx = (nx * radialPush + tangentX * 0.85) * hazard.speed;
    nextVz = (nz * radialPush + tangentZ * 0.85) * hazard.speed;
  } else {
    // Policy 3: Line-of-sight Charger with 0.45s telegraph windup then high-speed dash
    if (nextDash > 0) {
      nextVx = nextDashDirX * (hazard.speed * 2.4);
      nextVz = nextDashDirZ * (hazard.speed * 2.4);
    } else if (nextWindup > 0) {
      // Crouching / flashing telegraph before charge
      nextVx = 0;
      nextVz = 0;
      if (nextWindup - simDt <= 0) {
        nextDash = 0.65;
      }
    } else if (dist < 14) {
      nextWindup = 0.45;
      nextDashDirX = nx;
      nextDashDirZ = nz;
      nextVx = 0;
      nextVz = 0;
    } else {
      nextVx = nx * (hazard.speed * 0.75);
      nextVz = nz * (hazard.speed * 0.75);
    }
  }

  const nextX = Math.max(-arenaHalfExtent, Math.min(arenaHalfExtent, hazard.x + nextVx * simDt));
  const nextZ = Math.max(-arenaHalfExtent, Math.min(arenaHalfExtent, hazard.z + nextVz * simDt));

  return {
    ...hazard,
    x: nextX,
    z: nextZ,
    vx: nextVx,
    vz: nextVz,
    windupTimer: nextWindup,
    dashTimer: nextDash,
    dashDirX: nextDashDirX,
    dashDirZ: nextDashDirZ,
    hitFlashTimer: Math.max(0, hazard.hitFlashTimer - simDt),
  };
}

export function evaluatePalletPickup(
  state: GameSimulationState,
  pallet: PalletPickup,
  pickupRadius = 2.4
): { state: GameSimulationState; collectedNow: boolean } {
  if (pallet.collected || state.shellState !== 'playing') {
    return { state, collectedNow: false };
  }
  const dist = Math.hypot(state.playerX - pallet.x, state.playerZ - pallet.z);
  if (dist > pickupRadius) {
    return { state, collectedNow: false };
  }

  const nextCombo = state.comboTimer > 0 ? Math.min(5, state.combo + 1) : 1;
  const pointsAdded = Math.round(250 * nextCombo);
  const nextScore = state.score + pointsAdded;
  const nextPallets = state.palletsCollected + 1;
  const isVictory = nextPallets >= state.targetPallets;

  return {
    collectedNow: true,
    state: {
      ...state,
      score: nextScore,
      bestScore: Math.max(state.bestScore, nextScore),
      combo: nextCombo,
      comboTimer: 6.0,
      palletsCollected: nextPallets,
      wave: Math.min(3, 1 + Math.floor(nextPallets / 3)),
      hitstopTimer: isVictory ? 0.06 : 0.025,
      shellState: isVictory ? 'gameover' : state.shellState,
      outcome: isVictory ? 'victory' : state.outcome,
    },
  };
}

export function applyPlayerHazardImpact(state: GameSimulationState): GameSimulationState {
  if (state.shellState !== 'playing' || state.invulnerableTimer > 0) {
    return state;
  }
  const nextHp = Math.max(0, state.hp - 1);
  const isDefeat = nextHp <= 0;
  return {
    ...state,
    hp: nextHp,
    combo: 1,
    comboTimer: 0,
    hitstopTimer: 0.06,
    cameraTrauma: Math.min(1, state.cameraTrauma + 0.65),
    invulnerableTimer: 1.25,
    shellState: isDefeat ? 'gameover' : state.shellState,
    outcome: isDefeat ? 'defeat' : state.outcome,
  };
}

export function buildRunSnapshot(state: GameSimulationState): GameRunSnapshot {
  return {
    outcome: state.outcome === 'victory' ? 'victory' : 'defeat',
    score: Math.round(state.score),
    bestScore: Math.round(Math.max(state.bestScore, state.score)),
    palletsCollected: state.palletsCollected,
    targetPallets: state.targetPallets,
    clearTimeSec: Math.round(state.elapsedSec),
    hpRemaining: state.hp,
    maxHp: state.maxHp,
    waveReached: state.wave,
  };
}
