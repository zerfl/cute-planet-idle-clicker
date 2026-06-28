import type { Animal, PlacedAnimal } from "../types";
import { formatPlaytime } from "./format";

/**
 * Curated, public-safe snapshot of a player, written to `profiles/{userId}` on cloud sync and
 * world-readable by signed-in users (the private `saves/{userId}` doc is owner-only). Holds only
 * progression + collection stats and the enclosure layout — no email or other sensitive data.
 *
 * Timestamps (`createdAt`/`updatedAt`) are intentionally NOT set here: the caller (the sync hook)
 * spreads them in with Firestore field-value sentinels, keeping this module pure and SDK-free.
 */
export interface PublicProfile {
  userId: string;
  userName: string;
  // progression
  planetLevel: number;
  prestigeCount: number;
  moonsCount: number;
  secondsPlayed: number;
  clicksCount: number;
  starClicksTriggered: number;
  starsCount: number;
  totalLifeEarned: number;
  // collection
  purchasedAnimals: Record<string, number>;
  purchasedUpgradesCount: number;
  unlockedCosmeticsCount: number;
  // enclosure layout (capped to match the in-game placement limit)
  placedAnimals: PlacedAnimal[];
}

export const MAX_PLACED_ANIMALS = 20;

const num = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizePurchasedAnimals = (source: unknown): Record<string, number> => {
  const result: Record<string, number> = {};
  if (source && typeof source === "object") {
    for (const [id, count] of Object.entries(source as Record<string, unknown>)) {
      const c = num(count);
      if (c > 0) result[id] = c;
    }
  }
  return result;
};

const sanitizePlacedAnimals = (source: unknown): PlacedAnimal[] => {
  if (!Array.isArray(source)) return [];
  return source
    .filter((pa): pa is Record<string, unknown> => Boolean(pa) && typeof pa === "object")
    .slice(0, MAX_PLACED_ANIMALS)
    .map((pa) => ({
      id: String(pa.id ?? ""),
      animalId: String(pa.animalId ?? ""),
      x: num(pa.x),
      y: num(pa.y),
    }));
};

/**
 * Build the curated public profile payload from a raw save (local mirror or cloud doc).
 * Mirrors the coercion style of `buildCloudPayload` in useFirebaseSync.
 */
export function buildPublicProfile(
  source: Record<string, unknown>,
  uid: string,
  userName: string,
): PublicProfile {
  const upgrades = source.purchasedUpgrades;
  const cosmetics = source.unlockedCosmetics;

  return {
    userId: uid,
    userName,
    planetLevel: num(source.planetLevel, 1),
    prestigeCount: num(source.prestigeCount),
    moonsCount: num(source.moonsCount),
    secondsPlayed: num(source.secondsPlayed),
    clicksCount: num(source.clicksCount),
    starClicksTriggered: num(source.starClicksTriggered),
    starsCount: num(source.starsCount),
    totalLifeEarned: num(source.totalLifeEarned),
    purchasedAnimals: sanitizePurchasedAnimals(source.purchasedAnimals),
    purchasedUpgradesCount: Array.isArray(upgrades) ? upgrades.length : 0,
    unlockedCosmeticsCount: Array.isArray(cosmetics) ? cosmetics.length : 0,
    placedAnimals: sanitizePlacedAnimals(source.placedAnimals),
  };
}

export interface ProfileFacts {
  /** Most-owned species, resolved against the animal definitions, or null if none owned. */
  favoriteAnimal: { animal: Animal; count: number } | null;
  /** Total animals owned across all species. */
  totalAnimals: number;
  /** Number of distinct species owned. */
  distinctSpecies: number;
  /** Pre-formatted playtime string (German units). */
  playtime: string;
}

/**
 * Derive display-ready "fun facts" from a public profile. Pure: takes the profile plus the animal
 * definitions and returns structured values for the profile UI to render.
 */
export function computeProfileFacts(profile: PublicProfile, animalDefs: Animal[]): ProfileFacts {
  const animalsById = new Map(animalDefs.map((a) => [a.id, a]));

  let favoriteAnimal: ProfileFacts["favoriteAnimal"] = null;
  let totalAnimals = 0;
  let distinctSpecies = 0;

  for (const [id, count] of Object.entries(profile.purchasedAnimals)) {
    if (count <= 0) continue;
    totalAnimals += count;
    distinctSpecies += 1;
    const animal = animalsById.get(id);
    if (animal && (!favoriteAnimal || count > favoriteAnimal.count)) {
      favoriteAnimal = { animal, count };
    }
  }

  return {
    favoriteAnimal,
    totalAnimals,
    distinctSpecies,
    playtime: formatPlaytime(profile.secondsPlayed),
  };
}
