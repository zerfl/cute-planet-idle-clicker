import { describe, expect, it } from "vitest";

import { getMaxMoons } from "./maxMoons";

describe("getMaxMoons", () => {
  it("returns the base limit without research or moon zodiac", () => {
    expect(getMaxMoons({ purchasedUpgrades: [], zodiac: "katze" })).toBe(3);
  });

  it("adds one limit per moon research upgrade", () => {
    expect(
      getMaxMoons({
        purchasedUpgrades: [
          "upg-moon-limit-1",
          "upg-moon-limit-2",
          "upg-moon-limit-3",
          "upg-moon-limit-4",
          "upg-moon-limit-5",
          "upg-moon-limit-6",
          "upg-moon-limit-7",
        ],
        zodiac: "katze",
      }),
    ).toBe(10);
  });

  it("stacks the active moon zodiac on top of full moon research", () => {
    expect(
      getMaxMoons({
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
      }),
    ).toBe(11);
  });

  it("ignores zodiac levels and only keys off the active moon zodiac", () => {
    expect(getMaxMoons({ purchasedUpgrades: ["upg-moon-limit-1"], zodiac: "phoenix" })).toBe(4);
  });
});
