import { describe, it, expect } from "vitest";
import { DEFAULT_GLITCH_BENCHMARKS, hasReachedGlitchMilestone } from "./glitchGalaxy";

describe("hasReachedGlitchMilestone", () => {
  it("is not eligible when every resource is below the default targets", () => {
    expect(
      hasReachedGlitchMilestone({
        prestigeCount: 9,
        craftedItems: { mat_stardust: 149 },
        galaxyShards: 5,
        spentGalaxyShards: 4, // total 9 < 10
        purchasedAnimals: { phoenix: 4 },
        glitterDust: 149,
      }),
    ).toBe(false);
  });

  it("is eligible on ANY single milestone (OR), not all of them", () => {
    // Only prestige meets its target; everything else is far below.
    expect(hasReachedGlitchMilestone({ prestigeCount: 10 })).toBe(true);
    expect(hasReachedGlitchMilestone({ craftedItems: { mat_stardust: 150 } })).toBe(true);
    expect(hasReachedGlitchMilestone({ purchasedAnimals: { phoenix: 5 } })).toBe(true);
    expect(hasReachedGlitchMilestone({ glitterDust: 150 })).toBe(true);
  });

  it("counts spent galaxy shards toward the shard milestone", () => {
    // 7 in hand + 3 already spent in the shop = 10 total → reachable.
    expect(hasReachedGlitchMilestone({ galaxyShards: 7, spentGalaxyShards: 3 })).toBe(true);
    // 7 in hand alone is still below the default target of 10.
    expect(hasReachedGlitchMilestone({ galaxyShards: 7 })).toBe(false);
  });

  it("falls back to the default benchmarks when none are set", () => {
    expect(
      hasReachedGlitchMilestone({ galaxyShards: DEFAULT_GLITCH_BENCHMARKS.shardsTarget }),
    ).toBe(true);
  });

  it("respects escalated (post-repair) benchmarks", () => {
    const benchmarks = {
      prestigeTarget: 25,
      stardustTarget: 400,
      shardsTarget: 30,
      phoenixTarget: 12,
      glitterTarget: 500,
    };
    // Meets the OLD default shard target (10) but not the escalated one (30).
    expect(hasReachedGlitchMilestone({ galaxyShards: 12, glitchBenchmarks: benchmarks })).toBe(
      false,
    );
    // Now clears the escalated shard target.
    expect(hasReachedGlitchMilestone({ galaxyShards: 30, glitchBenchmarks: benchmarks })).toBe(
      true,
    );
  });
});
