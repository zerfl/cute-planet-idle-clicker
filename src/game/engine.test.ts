import { describe, it, expect } from "vitest";
import { computeLevelUpResult, expForLevel, EXP_PER_LEVEL } from "./engine";

describe("expForLevel", () => {
  it("returns 0 for level 0 (no XP needed to leave level 0)", () => {
    expect(expForLevel(0)).toBe(0);
  });

  it("returns correct static values from the table", () => {
    expect(expForLevel(1)).toBe(1500);
    expect(expForLevel(5)).toBe(220000);
    expect(expForLevel(19)).toBe(5_000_000_000_000);
  });

  it("extends linearly beyond the table (level 20+)", () => {
    // Level 20: 5_000_000_000_000 + (20-19)*2_000_000_000_000
    expect(expForLevel(20)).toBe(7_000_000_000_000);
    expect(expForLevel(21)).toBe(9_000_000_000_000);
    expect(expForLevel(50)).toBe(5_000_000_000_000 + 31 * 2_000_000_000_000);
  });

  it("table has 20 entries (indices 0-19)", () => {
    expect(EXP_PER_LEVEL.length).toBe(20);
  });
});

describe("computeLevelUpResult", () => {
  it("returns unchanged state when XP is insufficient", () => {
    const result = computeLevelUpResult(1, 0, 100);
    expect(result).toEqual({ newLevel: 1, newExp: 100, levelsGained: 0 });
  });

  it("advances exactly one level when XP hits the threshold", () => {
    // Need 1500 to go from level 1 to 2
    const result = computeLevelUpResult(1, 0, 1500);
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(0);
    expect(result.levelsGained).toBe(1);
  });

  it("carries over excess XP after levelling up", () => {
    const result = computeLevelUpResult(1, 0, 2000);
    // 1500 consumed for level 1→2, 500 left over
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(500);
    expect(result.levelsGained).toBe(1);
  });

  it("handles multiple level-ups in one call", () => {
    // Start at level 1. Need 1500 for lvl2 + 5000 for lvl3 + 18000 for lvl4 = 24500
    const result = computeLevelUpResult(1, 0, 24500);
    expect(result.newLevel).toBe(4);
    expect(result.newExp).toBe(0);
    expect(result.levelsGained).toBe(3);
  });

  it("handles an enormous XP batch without hang (stress test)", () => {
    // Simulates catching up after a long tab-out at high level
    const result = computeLevelUpResult(5, 0, 1e15);
    expect(result.newLevel).toBeGreaterThan(5);
    expect(result.newExp).toBeGreaterThanOrEqual(0);
  });

  it("partial XP at high level carries forward correctly", () => {
    // At level 19 need 5_000_000_000_000 to advance
    const result = computeLevelUpResult(19, 0, 3_000_000_000_000);
    expect(result.newLevel).toBe(19);
    expect(result.newExp).toBe(3_000_000_000_000);
    expect(result.levelsGained).toBe(0);
  });

  it("handles level-up from existing non-zero exp", () => {
    // Already at 1000 XP, need 1500 total → only 500 more to level up
    const result = computeLevelUpResult(1, 1000, 500);
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(0);
    expect(result.levelsGained).toBe(1);
  });

  it("returns levelsGained = 0 when no level-up occurs", () => {
    const result = computeLevelUpResult(3, 0, 1);
    expect(result.levelsGained).toBe(0);
  });

  describe("Prestige speed scaling", () => {
    it("increases EXP threshold for levels when prestigeCount > 0", () => {
      // Base: lvl 1 -> lvl 2 threshold: 1500
      expect(expForLevel(1, 0)).toBe(1500);
      // Prestige 1 (+50%): should require 2250 EXP
      expect(expForLevel(1, 1)).toBe(2250);
      // Prestige 2 (+100%): should require 3000 EXP
      expect(expForLevel(1, 2)).toBe(3000);
    });

    it("makes leveling slower in computeLevelUpResult", () => {
      // 1500 XP at Prestige 0 grants a level up
      const r0 = computeLevelUpResult(1, 0, 1500, 0);
      expect(r0.newLevel).toBe(2);

      // 1500 XP at Prestige 1 does NOT grant a level up (needs 2250)
      const r1 = computeLevelUpResult(1, 0, 1500, 1);
      expect(r1.newLevel).toBe(1);
      expect(r1.newExp).toBe(1500);
    });
  });
});
