import { describe, it, expect } from "vitest";
import { calculateOfflineLps } from "./offline";

describe("calculateOfflineLps", () => {
  it("returns 0 for null/undefined input", () => {
    expect(calculateOfflineLps(null)).toBe(0);
    expect(calculateOfflineLps(undefined)).toBe(0);
  });

  it("returns 0 for empty save", () => {
    expect(calculateOfflineLps({})).toBe(0);
  });

  it("computes base star LPS at night", () => {
    // 1 star, no upgrades, night → star power = 1.0 * 1.5 (night) = 1.5 lps
    const result = calculateOfflineLps({
      starsCount: 1,
      isNight: true,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(result).toBeCloseTo(1.5);
  });

  it("computes base star LPS during day (no night bonus)", () => {
    const result = calculateOfflineLps({
      starsCount: 1,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(result).toBeCloseTo(1.0);
  });

  it("applies prestige multiplier", () => {
    // 1 prestige = +10% → multiplier 1.1
    // 1 star at night = 1.5 * 1.1 = 1.65
    const result = calculateOfflineLps({
      starsCount: 1,
      isNight: true,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 1,
      moonsCount: 0,
    });
    expect(result).toBeCloseTo(1.5 * 1.1);
  });

  it("includes bunny animal LPS", () => {
    // 1 bunny, no upgrades. baseLps for bunny is 1.
    // Need to look it up from INITIAL_ANIMALS, so just check result > 0
    const result = calculateOfflineLps({
      starsCount: 0,
      isNight: true,
      purchasedUpgrades: [],
      purchasedAnimals: { bunny: 1 },
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(result).toBeGreaterThan(0);
  });

  it("applies bunny boost upgrade", () => {
    const withoutBoost = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: { bunny: 1 },
      prestigeCount: 0,
      moonsCount: 0,
    });
    const withBoost = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: ["upg-bunny-1"],
      purchasedAnimals: { bunny: 1 },
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(withBoost).toBeCloseTo(withoutBoost * 2);
  });

  it("applies global animals boost upgrade (+50%)", () => {
    const without = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: { bunny: 10 },
      prestigeCount: 0,
      moonsCount: 0,
    });
    const with_ = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: ["upg-global-1"],
      purchasedAnimals: { bunny: 10 },
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(with_).toBeCloseTo(without * 1.5);
  });

  it("adds flat moon LPS", () => {
    // 1 moon = 15000 * prestige(1.0)
    const result = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 1,
    });
    // flat moon LPS + moon multiplier: 15000 + 15000 * 1.5 = 37500
    expect(result).toBeCloseTo(15000 * (1 + 1.5));
  });

  it("applies nexus-core upgrade (+40%)", () => {
    const without = calculateOfflineLps({
      starsCount: 1,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 0,
    });
    const with_ = calculateOfflineLps({
      starsCount: 1,
      isNight: false,
      purchasedUpgrades: ["upg-nexus-core"],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 0,
    });
    expect(with_).toBeCloseTo(without * 1.4);
  });

  it("moon global multiplier stacks with flat moon LPS", () => {
    // 2 moons → flat = 2 * 15000 = 30000; then total *= (1 + 2*1.5) = 4.0
    const result = calculateOfflineLps({
      starsCount: 0,
      isNight: false,
      purchasedUpgrades: [],
      purchasedAnimals: {},
      prestigeCount: 0,
      moonsCount: 2,
    });
    const flatMoon = 2 * 15000;
    expect(result).toBeCloseTo(flatMoon * (1 + 2 * 1.5));
  });

  describe("Galaxy Shards Shop upgrades", () => {
    it("applies Catalyst level bonus correctly (+15% passive LPS per level)", () => {
      const stateWithout = {
        starsCount: 1,
        isNight: false,
        purchasedUpgrades: [],
        purchasedAnimals: {},
        prestigeCount: 0,
        moonsCount: 0,
        catalystLevel: 0,
      };

      const stateWithCatalystLvl2 = {
        ...stateWithout,
        catalystLevel: 2,
      };

      const withoutVal = calculateOfflineLps(stateWithout);
      const withVal = calculateOfflineLps(stateWithCatalystLvl2);

      // should be exactly 1 + 2 * 0.15 = 1.30 times higher
      expect(withVal).toBeCloseTo(withoutVal * 1.3);
    });

    it("applies Eule zodiac level boost correctly (+30% stars LPS, +15% per additional level)", () => {
      const stateLvl1 = {
        starsCount: 1,
        isNight: false,
        purchasedUpgrades: [],
        purchasedAnimals: {},
        prestigeCount: 0,
        moonsCount: 0,
        zodiac: "eule",
        zodiacLevels: { eule: 1 },
      };

      const stateLvl2 = {
        ...stateLvl1,
        zodiacLevels: { eule: 2 },
      };

      const valNoZodiac = calculateOfflineLps({ ...stateLvl1, zodiac: "" });
      const valLvl1 = calculateOfflineLps(stateLvl1);
      const valLvl2 = calculateOfflineLps(stateLvl2);

      // Level 1: +30% stars LPS → multiplier 1.30
      expect(valLvl1).toBeCloseTo(valNoZodiac * 1.3);
      // Level 2: +45% stars LPS → multiplier 1.45
      expect(valLvl2).toBeCloseTo(valNoZodiac * 1.45);
    });

    it("applies Biene zodiac level boost correctly (+35% animal production, +15% per additional level)", () => {
      const stateLvl1 = {
        starsCount: 0,
        isNight: false,
        purchasedUpgrades: [],
        purchasedAnimals: { bunny: 10 },
        prestigeCount: 0,
        moonsCount: 0,
        zodiac: "biene",
        zodiacLevels: { biene: 1 },
      };

      const stateLvl2 = {
        ...stateLvl1,
        zodiacLevels: { biene: 2 },
      };

      const valNoZodiac = calculateOfflineLps({ ...stateLvl1, zodiac: "" });
      const valLvl1 = calculateOfflineLps(stateLvl1);
      const valLvl2 = calculateOfflineLps(stateLvl2);

      // Level 1: +35% multiplier → 1.35
      expect(valLvl1).toBeCloseTo(valNoZodiac * 1.35);
      // Level 2: +50% multiplier → 1.50
      expect(valLvl2).toBeCloseTo(valNoZodiac * 1.5);
    });

    it("applies Mond zodiac level boost to Moon multiplier correctly (default 1.5, mond lvl1 2.25, mond lvl2 2.50)", () => {
      const stateNormalMond = {
        starsCount: 0,
        isNight: false,
        purchasedUpgrades: [],
        purchasedAnimals: {},
        prestigeCount: 0,
        moonsCount: 1,
        zodiac: "mond",
        zodiacLevels: { mond: 1 },
      };

      const stateLvl2Mond = {
        ...stateNormalMond,
        zodiacLevels: { mond: 2 },
      };

      const baseMoonVal = 15000; // flat moon output
      const valNormalMond = calculateOfflineLps(stateNormalMond);
      const valLvl2Mond = calculateOfflineLps(stateLvl2Mond);

      // Normal Mond zodiac level 1: moon multiplier is 2.25 → total = base * (1 + 2.25) = base * 3.25
      expect(valNormalMond).toBeCloseTo(baseMoonVal * (1.0 + 2.25));
      // Level 2 Mond zodiac: moon multiplier is 2.50 → total = base * (1 + 2.50) = base * 3.50
      expect(valLvl2Mond).toBeCloseTo(baseMoonVal * (1.0 + 2.5));
    });

    it("applies Schildkroete zodiac level boost correctly (+20% total passive LPS, +10% per additional level)", () => {
      const stateLvl1 = {
        starsCount: 1,
        isNight: false,
        purchasedUpgrades: [],
        purchasedAnimals: {},
        prestigeCount: 0,
        moonsCount: 0,
        zodiac: "schildkroete",
        zodiacLevels: { schildkroete: 1 },
      };

      const stateLvl2 = {
        ...stateLvl1,
        zodiacLevels: { schildkroete: 2 },
      };

      const valNoZodiac = calculateOfflineLps({ ...stateLvl1, zodiac: "" });
      const valLvl1 = calculateOfflineLps(stateLvl1);
      const valLvl2 = calculateOfflineLps(stateLvl2);

      // Level 1: 1.20x total LPS
      expect(valLvl1).toBeCloseTo(valNoZodiac * 1.2);
      // Level 2: 1.30x total LPS
      expect(valLvl2).toBeCloseTo(valNoZodiac * 1.3);
    });
  });
});
