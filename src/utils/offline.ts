import { INITIAL_ANIMALS } from "../data";

export function calculateOfflineLps(savedState: any): number {
  if (!savedState) return 0;
  const purchasedAnimals = savedState.purchasedAnimals || {};
  const purchasedUpgrades = savedState.purchasedUpgrades || [];
  const starsCount = savedState.starsCount || 0;
  const prestigeCount = savedState.prestigeCount || 0;
  const isNight = savedState.isNight ?? true;

  const upgradesSpecs = {
    bunnyBoost: purchasedUpgrades.includes("upg-bunny-1"),
    chickBoost: purchasedUpgrades.includes("upg-chick-1"),
    catBoost: purchasedUpgrades.includes("upg-cat-1"),
    frogBoost: purchasedUpgrades.includes("upg-frog-1"),
    koalaBoost: purchasedUpgrades.includes("upg-koala-1"),
    pandaBoost: purchasedUpgrades.includes("upg-panda-1"),
    unicornBoost: purchasedUpgrades.includes("upg-unicorn-1"),
    globalAnimalsBoost: purchasedUpgrades.includes("upg-global-1"),

    starGlow: purchasedUpgrades.includes("upg-star-glow"),
    starPulse: purchasedUpgrades.includes("upg-star-pulse"),
    starSupercharger: purchasedUpgrades.includes("upg-star-supercharger"),
    starMagnetic: purchasedUpgrades.includes("upg-star-magnetic"),
    clickMultiplier: purchasedUpgrades.includes("upg-click-multiplier"),
    click1: purchasedUpgrades.includes("upg-click-1"),
    click2: purchasedUpgrades.includes("upg-click-2"),
    click3: purchasedUpgrades.includes("upg-click-3"),
    click4: purchasedUpgrades.includes("upg-click-4"),
    click5: purchasedUpgrades.includes("upg-click-5"),
  };

  // Calculate Star Autoclick Power
  let rawClickPower = 1;
  if (upgradesSpecs.click1) rawClickPower += 1;
  if (upgradesSpecs.click2) rawClickPower += 5;
  if (upgradesSpecs.click3) rawClickPower += 25;
  if (upgradesSpecs.click4) rawClickPower += 150;
  if (upgradesSpecs.click5) rawClickPower += 1000;
  if (upgradesSpecs.clickMultiplier) rawClickPower *= 2;

  let starPowerPerStar = 1.0;
  if (upgradesSpecs.starGlow) starPowerPerStar += 1.0;
  if (upgradesSpecs.starPulse) starPowerPerStar += 5.0;
  const clickBonus = (rawClickPower - 1) * 0.2;
  starPowerPerStar += clickBonus;
  if (upgradesSpecs.starSupercharger) starPowerPerStar *= 2.0;
  if (isNight) {
    starPowerPerStar = starPowerPerStar * 1.5;
  }

  const zodiac = savedState.zodiac || "";
  const zodiacLevels = savedState.zodiacLevels || {};

  if (zodiac === "eule") {
    const lvl = zodiacLevels.eule || 1;
    starPowerPerStar *= 1.3 + (lvl - 1) * 0.15;
  }

  const moonsCount = savedState.moonsCount || 0;

  // Prestige multiplier (10% bonus per Prestige level, ALWAYS active for all!)
  const prestigeMultiplier = 1 + prestigeCount * 0.1;

  // Apply prestige bonus to star power
  starPowerPerStar *= prestigeMultiplier;

  const totalStarsLps = starsCount * starPowerPerStar;

  // Calculate Animal LPS
  let totalAnimalsLps = 0;

  INITIAL_ANIMALS.forEach((def) => {
    let multiplier = 1.0;
    if (def.id === "bunny" && upgradesSpecs.bunnyBoost) multiplier *= 2.0;
    if (def.id === "chick" && upgradesSpecs.chickBoost) multiplier *= 2.0;
    if (def.id === "cat" && upgradesSpecs.catBoost) multiplier *= 2.0;
    if (def.id === "frog" && upgradesSpecs.frogBoost) multiplier *= 2.0;
    if (def.id === "koala" && upgradesSpecs.koalaBoost) multiplier *= 2.0;
    if (def.id === "panda" && upgradesSpecs.pandaBoost) multiplier *= 2.0;
    if (def.id === "unicorn" && upgradesSpecs.unicornBoost) multiplier *= 2.0;
    if (upgradesSpecs.globalAnimalsBoost) multiplier *= 1.5;

    if (zodiac === "biene") {
      const lvl = zodiacLevels.biene || 1;
      multiplier *= 1.35 + (lvl - 1) * 0.15;
    }

    const quantity = purchasedAnimals[def.id] || 0;
    totalAnimalsLps += quantity * def.baseLps * multiplier * prestigeMultiplier;
  });

  const flatMoonLps = moonsCount * 15000 * prestigeMultiplier;

  let totalLps = totalAnimalsLps + totalStarsLps + flatMoonLps;

  const catalystLevel = savedState.catalystLevel || 0;
  totalLps *= 1.0 + catalystLevel * 0.15;

  if (purchasedUpgrades.includes("upg-nexus-core")) {
    totalLps *= 1.4;
  }

  if (moonsCount > 0) {
    const lvl = zodiacLevels.mond || 1;
    const moonMultiplier = zodiac === "mond" ? 2.25 + (lvl - 1) * 0.25 : 1.5;
    totalLps *= 1.0 + moonsCount * moonMultiplier;
  }

  if (zodiac === "schildkroete") {
    const lvl = zodiacLevels.schildkroete || 1;
    totalLps *= 1.2 + (lvl - 1) * 0.1;
  }

  return totalLps;
}
