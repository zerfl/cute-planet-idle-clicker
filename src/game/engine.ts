/**
 * Pure, side-effect-free game math functions shared between
 * the Web Worker (game.worker.ts) and server-side / offline calculations.
 *
 * Nothing here may import worker-only APIs or reference global `state`.
 */

// ---------------------------------------------------------------------------
// Planet level-up constants
// ---------------------------------------------------------------------------

/** EXP required to advance from level N to N+1 (index = current level). */
export const EXP_PER_LEVEL: readonly number[] = [
  0, 1500, 5000, 18000, 60000, 220000, 850000, 3200000, 12000000, 45000000, 160000000, 550000000,
  1800000000, 6000000000, 20000000000, 65000000000, 200000000000, 600000000000, 1800000000000,
  5000000000000,
];

/**
 * Returns the EXP threshold to advance from `level` to `level + 1`.
 * Handles levels beyond the static table with a linear formula.
 * Scaling: Slower leveling per Prestige level (requires more EXP).
 */
export function expForLevel(level: number, prestigeCount: number = 0): number {
  let baseExp = 0;
  if (level < EXP_PER_LEVEL.length) {
    baseExp = EXP_PER_LEVEL[level];
  } else {
    // Linear tail beyond the table (level 20+)
    baseExp = 5_000_000_000_000 + (level - 19) * 2_000_000_000_000;
  }
  // Slower leveling: require +50% extra EXP per Prestige level
  const scale = 1.0 + (prestigeCount || 0) * 0.5;
  return Math.round(baseExp * scale);
}

// ---------------------------------------------------------------------------
// Level-up computation
// ---------------------------------------------------------------------------

export interface LevelUpResult {
  /** New EXP value after absorbing all level-up thresholds. */
  newExp: number;
  /** New planet level. */
  newLevel: number;
  /** How many levels were gained (0 if none). */
  levelsGained: number;
}

/**
 * Pure version of `addPlanetExp` in game.worker.ts.
 *
 * Given a starting (planetLevel, planetExp) and an XP amount to add,
 * returns the resulting (newLevel, newExp, levelsGained) without any side
 * effects (no postMessage, no global state mutation).
 *
 * A single call handles arbitrarily large XP amounts in one pass — safe for
 * batched catch-up after a long tab absence.
 */
export function computeLevelUpResult(
  planetLevel: number,
  planetExp: number,
  xpAmount: number,
  prestigeCount: number = 0,
): LevelUpResult {
  let currentExp = planetExp + xpAmount;
  let currentLevel = planetLevel;
  const startLevel = planetLevel;

  while (true) {
    const threshold = expForLevel(currentLevel, prestigeCount);
    if (threshold <= 0) break; // level 0 edge case
    if (currentExp >= threshold) {
      currentExp -= threshold;
      currentLevel += 1;
    } else {
      break;
    }
  }

  return {
    newExp: currentExp,
    newLevel: currentLevel,
    levelsGained: currentLevel - startLevel,
  };
}
