import { describe, expect, it, vi } from "vitest";

import { executeBlackHoleGamble } from "./blackHoleGamble";

describe("executeBlackHoleGamble", () => {
  it("grants a free moon when the active moon zodiac extends the cap", () => {
    const state = {
      life: 50000000,
      totalLifeEarned: 0,
      starsCount: 0,
      moonsCount: 10,
      glitterDust: 0,
      blackHoleSize: 1,
      purchasedUpgrades: [
        "upg-moon-limit-1",
        "upg-moon-limit-2",
        "upg-moon-limit-3",
        "upg-moon-limit-4",
        "upg-moon-limit-5",
        "upg-moon-limit-6",
        "upg-moon-limit-7",
      ],
      zodiac: "mond",
      unlockedCosmetics: [],
      shootingStarsCount: 0,
      prestigeCount: 0,
    };

    const randomSpy = vi.spyOn(Math, "random");
    randomSpy.mockReturnValueOnce(0.35);

    const result = executeBlackHoleGamble(state, "life", () => ({ totalStarsLps: 100 }), vi.fn());

    expect(result.success).toBe(true);
    expect(state.moonsCount).toBe(11);

    randomSpy.mockRestore();
  });
});
