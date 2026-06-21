import { describe, it, expect, vi } from "vitest";
import { handleWorkerAction, type WorkerActionHelpers } from "./workerActions";
import type { WorkerCommand, WorkerGameState, StatsResult } from "./protocol";

/** A complete, default worker state; override only the fields a test cares about. */
function makeState(overrides: Partial<WorkerGameState> = {}): WorkerGameState {
  return {
    life: 0,
    totalLifeEarned: 0,
    starsCount: 0,
    purchasedAnimals: {},
    purchasedUpgrades: [],
    planetLevel: 1,
    planetExp: 0,
    clicksCount: 0,
    starClicksTriggered: 0,
    secondsPlayed: 0,
    isNight: true,
    cycleProgress: 0,
    activeEvent: null,
    activeEventDecision: null,
    activeEventDetails: null,
    activeEventInstantClaimed: false,
    eventTimeRemaining: 120,
    prestigeCount: 0,
    moonsCount: 0,
    constellations: {},
    unlockedCosmetics: [],
    cosmeticRarityLevels: {},
    glitterDust: 0,
    shootingStarsCount: 0,
    blackHoleSize: 1,
    craftedItems: {},
    zodiac: "katze",
    galaxyShards: 0,
    zodiacLevels: {},
    slummerGlassLevel: 1,
    catalystLevel: 0,
    doubleStellarLevel: 0,
    ...overrides,
  };
}

function makeHelpers(): WorkerActionHelpers {
  return {
    getLpsAndStats: vi.fn(() => ({}) as unknown as StatsResult),
    addPlanetExp: vi.fn(),
    setupActiveEvent: vi.fn(),
    updateTaskProgress: vi.fn(),
    broadcastStateUpdate: vi.fn(),
    rollNewZodiac: vi.fn(() => "katze"),
    emit: vi.fn(),
    stopTimers: vi.fn(),
  };
}

function dispatch(command: WorkerCommand, state: WorkerGameState, helpers = makeHelpers()) {
  handleWorkerAction(command, state, helpers);
  return helpers;
}

describe("handleWorkerAction", () => {
  describe("BUY_ANIMAL", () => {
    it("debits life, increments the animal count, and broadcasts", () => {
      const state = makeState({ life: 100 });
      const helpers = dispatch(
        { type: "BUY_ANIMAL", animalId: "bunny", cost: 60, countToBuy: 2 },
        state,
      );

      expect(state.life).toBe(40);
      expect(state.purchasedAnimals.bunny).toBe(2);
      expect(helpers.broadcastStateUpdate).toHaveBeenCalled();
    });

    it("is a no-op when life is insufficient", () => {
      const state = makeState({ life: 10 });
      const helpers = dispatch({ type: "BUY_ANIMAL", animalId: "bunny", cost: 60 }, state);

      expect(state.life).toBe(10);
      expect(state.purchasedAnimals.bunny).toBeUndefined();
      expect(helpers.broadcastStateUpdate).not.toHaveBeenCalled();
    });
  });

  describe("BUY_UPGRADE", () => {
    it("debits life and records the upgrade once", () => {
      const state = makeState({ life: 100 });
      dispatch({ type: "BUY_UPGRADE", id: "upg-click-1", cost: 60 }, state);

      expect(state.life).toBe(40);
      expect(state.purchasedUpgrades).toEqual(["upg-click-1"]);
    });

    it("does not re-buy an already-owned upgrade", () => {
      const state = makeState({ life: 100, purchasedUpgrades: ["upg-click-1"] });
      const helpers = dispatch({ type: "BUY_UPGRADE", id: "upg-click-1", cost: 60 }, state);

      expect(state.life).toBe(100);
      expect(state.purchasedUpgrades).toEqual(["upg-click-1"]);
      expect(helpers.broadcastStateUpdate).not.toHaveBeenCalled();
    });
  });

  describe("BUY_STAR", () => {
    it("grants one star per purchase when the double-stellar perk is inactive", () => {
      const state = makeState({ life: 500, doubleStellarLevel: 0 });
      dispatch({ type: "BUY_STAR", cost: 100 }, state);

      expect(state.life).toBe(400);
      expect(state.starsCount).toBe(1);
    });
  });

  describe("SPEND_GLITTER_DUST", () => {
    it("spends when affordable", () => {
      const state = makeState({ glitterDust: 50 });
      dispatch({ type: "SPEND_GLITTER_DUST", amount: 20 }, state);
      expect(state.glitterDust).toBe(30);
    });

    it("is a no-op when the player cannot afford it", () => {
      const state = makeState({ glitterDust: 5 });
      const helpers = dispatch({ type: "SPEND_GLITTER_DUST", amount: 20 }, state);
      expect(state.glitterDust).toBe(5);
      expect(helpers.broadcastStateUpdate).not.toHaveBeenCalled();
    });
  });

  describe("glitch galaxy repair + cooldown", () => {
    it("REPAIR grants +2 shards, re-baselines benchmarks, and starts the cooldown", () => {
      const state = makeState({
        inGlitchGalaxy: true,
        glitchPending: false,
        planetLevel: 20,
        galaxyShards: 4,
        glitterDust: 100,
        prestigeCount: 3,
      });

      dispatch({ type: "REPAIR_GLITCH_GALAXY" }, state);

      expect(state.galaxyShards).toBe(6); // +2 splitters
      expect(state.glitterDust).toBe(177); // +77 dust
      expect(state.prestigeCount).toBe(4); // +1 prestige
      expect(state.inGlitchGalaxy).toBe(false);
      expect(state.glitchCooldown).toBe(true); // must do a normal voyage next
      expect(state.planetLevel).toBe(1); // full prestige-style reset
      // Benchmarks re-baselined to current totals + the default margins.
      expect(state.glitchBenchmarks).toEqual({
        prestigeTarget: 4 + 10,
        stardustTarget: 0 + 150,
        shardsTarget: 6 + 0 + 10,
        phoenixTarget: 0 + 5,
        glitterTarget: 177 + 150,
      });
    });

    it("a normal PRESTIGE clears the cooldown", () => {
      const state = makeState({ glitchCooldown: true, planetLevel: 20, prestigeCount: 4 });

      dispatch({ type: "PRESTIGE" }, state);

      expect(state.glitchCooldown).toBe(false);
      expect(state.prestigeCount).toBe(5);
    });

    it("ENTER clears the pending flag and flips into glitch mode", () => {
      const state = makeState({ glitchPending: true, planetLevel: 20 });

      dispatch({ type: "ENTER_GLITCH_GALAXY" }, state);

      expect(state.inGlitchGalaxy).toBe(true);
      expect(state.glitchPending).toBe(false);
      expect(state.unlockedGlitchGalaxy).toBe(true);
      expect(state.planetLevel).toBe(1);
    });
  });
});
