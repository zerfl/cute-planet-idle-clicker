import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  INITIAL_ANIMALS,
  calculateCost,
  formatCompactNumber,
  getPrestigeRequirement,
} from "./data";

describe("calculateCost", () => {
  it("returns baseCost when count is 0", () => {
    expect(calculateCost(100, 0, 1.15)).toBe(100);
  });

  it("applies multiplier correctly for count = 1", () => {
    expect(calculateCost(100, 1, 1.15)).toBe(Math.floor(100 * 1.15));
  });

  it("floors the result", () => {
    // 100 * 1.15^3 = 152.08... → 152
    expect(calculateCost(100, 3, 1.15)).toBe(Math.floor(100 * Math.pow(1.15, 3)));
  });

  it("handles multiplier of 1.0 (no scaling)", () => {
    expect(calculateCost(500, 10, 1.0)).toBe(500);
  });
});

describe("formatCompactNumber", () => {
  it("formats zero", () => {
    expect(formatCompactNumber(0)).toBe("0");
  });

  it("returns integer strings below 1000", () => {
    expect(formatCompactNumber(42)).toBe("42");
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("formats decimals below 1000 with 1 decimal place", () => {
    expect(formatCompactNumber(3.7)).toBe("3.7");
    expect(formatCompactNumber(99.5)).toBe("99.5");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCompactNumber(1000)).toBe("1K");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(999999)).toBe("1000K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCompactNumber(1_000_000)).toBe("1M");
    expect(formatCompactNumber(2_500_000)).toBe("2.5M");
  });

  it("formats billions", () => {
    expect(formatCompactNumber(1_000_000_000)).toBe("1B");
  });

  it("handles NaN gracefully", () => {
    expect(formatCompactNumber(NaN)).toBe("0");
  });

  it("strips trivial trailing zeros (e.g. 1.20 → 1.2)", () => {
    // 1_200_000 / 1e6 = 1.20 → should be "1.2M" not "1.20M"
    expect(formatCompactNumber(1_200_000)).toBe("1.2M");
  });
});

describe("getPrestigeRequirement", () => {
  it("returns base requirement for first prestige (count = 0)", () => {
    expect(getPrestigeRequirement(0)).toBe(500_000_000);
  });

  it("scales by 2.5x per prestige", () => {
    expect(getPrestigeRequirement(1)).toBeCloseTo(500_000_000 * 2.5);
    expect(getPrestigeRequirement(2)).toBeCloseTo(500_000_000 * Math.pow(2.5, 2));
  });

  it("is monotonically increasing", () => {
    for (let i = 0; i < 5; i++) {
      expect(getPrestigeRequirement(i + 1)).toBeGreaterThan(getPrestigeRequirement(i));
    }
  });
});

describe("animal sprite metadata", () => {
  it("assigns animated gegehe spritesheets to every animal image", () => {
    const imageAnimals = INITIAL_ANIMALS.filter((animal) => animal.image);

    expect(imageAnimals).toHaveLength(50);

    imageAnimals.forEach((animal) => {
      expect(animal.sheetSrc).toBe(`/assets/animals/animated/${animal.id}.webp`);
      expect(animal.frameWidth).toBe(160);
      expect(animal.frameHeight).toBe(160);
      expect(animal.columns).toBe(6);
      expect(animal.walkFrames).toBe(6);
      expect(animal.liftFrames).toBe(6);

      const assetPath = path.resolve(
        process.cwd(),
        "public",
        "assets",
        "animals",
        "animated",
        `${animal.id}.webp`,
      );
      expect(fs.existsSync(assetPath)).toBe(true);
    });
  });
});
