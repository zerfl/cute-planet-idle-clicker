import { describe, it, expect } from "vitest";
import {
  buildPublicProfile,
  computeProfileFacts,
  MAX_PLACED_ANIMALS,
  type PublicProfile,
} from "./publicProfile";
import type { Animal } from "../types";
import { formatPlaytime } from "./format";

const animal = (id: string, germanName: string, emoji: string): Animal =>
  ({ id, name: id, germanName, emoji }) as Animal;

const ANIMAL_DEFS: Animal[] = [
  animal("bunny", "Häschen", "🐰"),
  animal("cat", "Katze", "🐱"),
  animal("fox", "Fuchs", "🦊"),
];

describe("buildPublicProfile", () => {
  it("coerces numeric fields from strings and applies fallbacks", () => {
    const profile = buildPublicProfile(
      {
        totalLifeEarned: "1500",
        prestigeCount: "3",
        secondsPlayed: "90",
        // planetLevel missing -> defaults to 1
        clicksCount: undefined,
      },
      "user-1",
      "Nova",
    );

    expect(profile.userId).toBe("user-1");
    expect(profile.userName).toBe("Nova");
    expect(profile.totalLifeEarned).toBe(1500);
    expect(profile.prestigeCount).toBe(3);
    expect(profile.secondsPlayed).toBe(90);
    expect(profile.planetLevel).toBe(1);
    expect(profile.clicksCount).toBe(0);
  });

  it("derives upgrade and cosmetic counts from arrays", () => {
    const profile = buildPublicProfile(
      {
        purchasedUpgrades: ["a", "b", "c"],
        unlockedCosmetics: ["frame1"],
      },
      "u",
      "n",
    );

    expect(profile.purchasedUpgradesCount).toBe(3);
    expect(profile.unlockedCosmeticsCount).toBe(1);
  });

  it("sanitizes purchasedAnimals, dropping non-positive counts", () => {
    const profile = buildPublicProfile(
      { purchasedAnimals: { bunny: "5", cat: 0, fox: -2 } },
      "u",
      "n",
    );

    expect(profile.purchasedAnimals).toEqual({ bunny: 5 });
  });

  it("bounds placedAnimals to the placement cap and coerces coordinates", () => {
    const many = Array.from({ length: MAX_PLACED_ANIMALS + 5 }, (_, i) => ({
      id: `p${i}`,
      animalId: "bunny",
      x: "10",
      y: 20,
    }));

    const profile = buildPublicProfile({ placedAnimals: many }, "u", "n");

    expect(profile.placedAnimals).toHaveLength(MAX_PLACED_ANIMALS);
    expect(profile.placedAnimals[0]).toEqual({ id: "p0", animalId: "bunny", x: 10, y: 20 });
  });

  it("defaults placedAnimals to an empty array when absent or malformed", () => {
    expect(buildPublicProfile({}, "u", "n").placedAnimals).toEqual([]);
    expect(buildPublicProfile({ placedAnimals: "nope" }, "u", "n").placedAnimals).toEqual([]);
  });
});

describe("computeProfileFacts", () => {
  const baseProfile: PublicProfile = {
    userId: "u",
    userName: "n",
    planetLevel: 5,
    prestigeCount: 1,
    moonsCount: 0,
    secondsPlayed: 3 * 3600 + 25 * 60,
    clicksCount: 100,
    starClicksTriggered: 0,
    starsCount: 2,
    totalLifeEarned: 9999,
    purchasedAnimals: { bunny: 3, cat: 7, fox: 1 },
    purchasedUpgradesCount: 4,
    unlockedCosmeticsCount: 2,
    placedAnimals: [],
  };

  it("identifies the most-owned animal as the favorite", () => {
    const facts = computeProfileFacts(baseProfile, ANIMAL_DEFS);
    expect(facts.favoriteAnimal?.animal.id).toBe("cat");
    expect(facts.favoriteAnimal?.count).toBe(7);
  });

  it("totals animals and counts distinct species", () => {
    const facts = computeProfileFacts(baseProfile, ANIMAL_DEFS);
    expect(facts.totalAnimals).toBe(11);
    expect(facts.distinctSpecies).toBe(3);
  });

  it("formats playtime", () => {
    const facts = computeProfileFacts(baseProfile, ANIMAL_DEFS);
    expect(facts.playtime).toBe("3 Std 25 Min");
  });

  it("returns a null favorite when no animals are owned", () => {
    const facts = computeProfileFacts({ ...baseProfile, purchasedAnimals: {} }, ANIMAL_DEFS);
    expect(facts.favoriteAnimal).toBeNull();
    expect(facts.totalAnimals).toBe(0);
    expect(facts.distinctSpecies).toBe(0);
  });

  it("ignores owned species missing from the animal definitions for the favorite", () => {
    const facts = computeProfileFacts(
      { ...baseProfile, purchasedAnimals: { unknownSpecies: 99, bunny: 2 } },
      ANIMAL_DEFS,
    );
    // unknownSpecies still counts toward totals, but cannot be the favorite (no def to show).
    expect(facts.favoriteAnimal?.animal.id).toBe("bunny");
    expect(facts.totalAnimals).toBe(101);
    expect(facts.distinctSpecies).toBe(2);
  });
});

describe("formatPlaytime", () => {
  it("handles zero and invalid input", () => {
    expect(formatPlaytime(0)).toBe("0 Min");
    expect(formatPlaytime(NaN)).toBe("0 Min");
    expect(formatPlaytime(-10)).toBe("0 Min");
  });

  it("shows sub-minute as < 1 Min", () => {
    expect(formatPlaytime(30)).toBe("< 1 Min");
  });

  it("shows the two most significant units", () => {
    expect(formatPlaytime(45 * 60)).toBe("45 Min");
    expect(formatPlaytime(2 * 3600 + 15 * 60)).toBe("2 Std 15 Min");
    expect(formatPlaytime(86400 + 4 * 3600 + 30 * 60)).toBe("1 Tag 4 Std");
    expect(formatPlaytime(2 * 86400 + 3 * 3600)).toBe("2 Tage 3 Std");
  });
});
