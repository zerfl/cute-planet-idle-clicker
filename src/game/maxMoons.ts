const MOON_LIMIT_UPGRADES = [
  "upg-moon-limit-1",
  "upg-moon-limit-2",
  "upg-moon-limit-3",
  "upg-moon-limit-4",
  "upg-moon-limit-5",
  "upg-moon-limit-6",
  "upg-moon-limit-7",
] as const;

export interface MaxMoonsOptions {
  purchasedUpgrades?: string[];
  zodiac?: string;
}

export function getMaxMoons({ purchasedUpgrades = [], zodiac }: MaxMoonsOptions): number {
  let limit = 3;

  for (const upgradeId of MOON_LIMIT_UPGRADES) {
    if (purchasedUpgrades.includes(upgradeId)) {
      limit += 1;
    }
  }

  if (zodiac === "mond") {
    limit += 1;
  }

  return limit;
}
