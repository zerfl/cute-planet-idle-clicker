/**
 * GameStateContext — live game scalars consumed by open modals.
 *
 * Routing these through context instead of props means
 * GameModalsContainer's React.memo holds between ticks, so the closed-modal
 * tree never reconciles. Only the single open modal (which calls
 * useGameState()) re-renders on each tick / discrete event.
 */

import { createContext, useContext } from "react";

export interface GameStateValue {
  // Tick-changing values (update ~4×/sec from game worker)
  life: number;
  totalLifeEarned: number;
  secondsPlayed: number;
  planetExp: number;

  // Level/prestige (rare, but tick-adjacent)
  planetLevel: number;
  prestigeCount: number;

  // Player-action scalars (change on buys / events)
  glitterDust: number;
  starsCount: number;
  moonsCount: number;
  shootingStarsCount: number;
  clicksCount: number;
  starClicksTriggered: number;

  // Derived from worker calculations (change on buys/upgrades)
  totalLps: number;
  totalStarsLps: number;
  totalAnimalsLps: number;
  starPowerPerStar: number;
  totalAnimalsCount: number;
  unlockedAchievementsCount: number;

  // useMemo-derived in App (change when their deps change)
  starCost: number;
  maxMoons: number;
}

const GameStateContext = createContext<GameStateValue | null>(null);

export const GameStateProvider = GameStateContext.Provider;

export function useGameState(): GameStateValue {
  const ctx = useContext(GameStateContext);
  if (ctx === null) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return ctx;
}
