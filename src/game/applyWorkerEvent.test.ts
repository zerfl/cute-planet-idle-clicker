import { describe, it, expect, vi } from "vitest";
import { applyWorkerEvent, type WorkerEventHandlers } from "./applyWorkerEvent";
import type { WorkerEvent, WorkerStatePayload } from "./protocol";

function makeHandlers() {
  const h = {} as Record<keyof WorkerEventHandlers, unknown>;
  const setterKeys: (keyof WorkerEventHandlers)[] = [
    "setLife",
    "setTotalLifeEarned",
    "setStarsCount",
    "setMoonsCount",
    "setPurchasedAnimals",
    "setPurchasedUpgrades",
    "setPlanetLevel",
    "setPlanetExp",
    "setPlanetTask",
    "setClicksCount",
    "setStarClicksTriggered",
    "setSecondsPlayed",
    "setIsNight",
    "setCycleProgress",
    "setActiveEvent",
    "setEventTimeRemaining",
    "setPrestigeCount",
    "setGalaxyShards",
    "setZodiacLevels",
    "setSlummerGlassLevel",
    "setCatalystLevel",
    "setDoubleStellarLevel",
    "setBlackHoleSize",
    "setInGlitchGalaxy",
    "setGlitchPending",
    "setUnlockedGlitchGalaxy",
    "setSpentGalaxyShards",
    "setGlitchBenchmarks",
    "setConstellations",
    "setCraftedItems",
    "setGlitterDust",
    "setCosmeticRarityLevels",
    "setActiveEventDecision",
    "setActiveEventDetails",
    "setUnlockedCosmetics",
    "setShootingStarsCount",
    "setActiveZodiacId",
    "setCalculations",
    "setAchievements",
    "setIsLoaded",
    "setOpeningResult",
    "setBlackHoleResult",
    "playTick",
    "playPop",
    "playLevelUp",
    "setFloatingTexts",
  ];
  for (const k of setterKeys) h[k] = vi.fn();
  h.nextParticleId = { current: 1 };
  return h as unknown as WorkerEventHandlers;
}

const payload: WorkerStatePayload = {
  life: 1234,
  totalLifeEarned: 9999,
  starsCount: 7,
  purchasedAnimals: { bunny: 3 },
  purchasedUpgrades: ["upg-click-1"],
  planetLevel: 5,
  planetExp: 42,
  clicksCount: 11,
  starClicksTriggered: 2,
  secondsPlayed: 100,
  isNight: true,
  cycleProgress: 50,
  activeEvent: null,
  activeEventDecision: null,
  activeEventDetails: null,
  activeEventInstantClaimed: false,
  eventTimeRemaining: 120,
  prestigeCount: 1,
  moonsCount: 0,
  constellations: {},
  unlockedCosmetics: [],
  cosmeticRarityLevels: {},
  glitterDust: 5,
  shootingStarsCount: 0,
  blackHoleSize: 1,
  craftedItems: {},
  zodiac: "katze",
  galaxyShards: 0,
  zodiacLevels: {},
  slummerGlassLevel: 1,
  catalystLevel: 0,
  doubleStellarLevel: 0,
  inGlitchGalaxy: false,
  glitchPending: false,
  unlockedGlitchGalaxy: false,
  spentGalaxyShards: 0,
};

describe("applyWorkerEvent", () => {
  it("STATE_UPDATE fans the payload into setters and marks loaded", () => {
    const h = makeHandlers();
    const event: WorkerEvent = {
      type: "STATE_UPDATE",
      state: payload,
      calculations: { totalLps: 1 } as never,
      achievements: [{ id: "a", isUnlocked: true }],
    };

    applyWorkerEvent(event, h);

    expect(h.setLife).toHaveBeenCalledWith(1234);
    expect(h.setStarsCount).toHaveBeenCalledWith(7);
    expect(h.setPlanetLevel).toHaveBeenCalledWith(5);
    expect(h.setPurchasedAnimals).toHaveBeenCalledTimes(1);
    expect(h.setCalculations).toHaveBeenCalledTimes(1);
    expect(h.setAchievements).toHaveBeenCalledTimes(1);
    expect(h.setIsLoaded).toHaveBeenCalledWith(true);
  });

  it("STAR_TRIGGER plays the tick sound and spawns a floating text", () => {
    const h = makeHandlers();
    applyWorkerEvent({ type: "STAR_TRIGGER", reward: 50, starsCount: 7 }, h);
    expect(h.playTick).toHaveBeenCalled();
    expect(h.setFloatingTexts).toHaveBeenCalledTimes(1);
  });

  it("LEVEL_UP plays the level-up sound and spawns a text", () => {
    const h = makeHandlers();
    applyWorkerEvent({ type: "LEVEL_UP", level: 6 }, h);
    expect(h.playLevelUp).toHaveBeenCalled();
    expect(h.setFloatingTexts).toHaveBeenCalledTimes(1);
  });

  it("BLACK_HOLE_GAMBLE_RESULT failure shows the error dialog", () => {
    const h = makeHandlers();
    applyWorkerEvent({ type: "BLACK_HOLE_GAMBLE_RESULT", success: false, error: "nope" }, h);
    expect(h.setBlackHoleResult).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, show: true }),
    );
  });

  it("ignores malformed events", () => {
    const h = makeHandlers();
    expect(() => applyWorkerEvent(undefined as never, h)).not.toThrow();
    expect(h.setLife).not.toHaveBeenCalled();
  });
});
