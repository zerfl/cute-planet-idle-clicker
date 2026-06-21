import { INITIAL_ANIMALS } from "../data";
import { expForLevel } from "./engine";

/**
 * Pure, side-effect-free helper to compute LPS, click power,
 * multipliers, and progress values based on any WorkerState / GameState.
 */
export function getLpsAndStats(state: any) {
  const purchasedUpgrades = state.purchasedUpgrades || [];
  // O(1) membership for the many upgrade checks below (js-set-map-lookups).
  const upgradeSet = new Set<string>(purchasedUpgrades);
  const purchasedAnimals = state.purchasedAnimals || {};
  const starsCount = state.starsCount || 0;
  const isNight = state.isNight !== false;
  const activeEvent = state.activeEvent;

  // 🧩 SETBONI CHECK (Kosmischer Set-Harmonisierer)
  const hasSetBonusSet = upgradeSet.has("upg-glitter-set");
  let sakuraSetComplete = false;
  let cyberSetComplete = false;
  let goldSetComplete = false;
  let ghostSetComplete = false;
  let butterflySetComplete = false;

  if (hasSetBonusSet && state.unlockedCosmetics) {
    const list = state.unlockedCosmetics || [];
    sakuraSetComplete = ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) =>
      list.includes(id),
    );
    cyberSetComplete = ["star_cyber", "acc_space_glasses", "moon_cyber"].every((id) =>
      list.includes(id),
    );
    goldSetComplete = ["star_gold", "acc_star_crown", "moon_gold"].every((id) => list.includes(id));
    ghostSetComplete = ["star_ghostly", "frame_ghost", "moon_ghost"].every((id) =>
      list.includes(id),
    );
    butterflySetComplete = [
      "star_butterfly",
      "acc_butterfly_wings",
      "frame_butterfly",
      "moon_butterfly",
    ].every((id) => list.includes(id));
  }

  // Upgrades specifications check
  const upgradesSpecs = {
    bunnyBoost: upgradeSet.has("upg-bunny-1"),
    chickBoost: upgradeSet.has("upg-chick-1"),
    catBoost: upgradeSet.has("upg-cat-1"),
    frogBoost: upgradeSet.has("upg-frog-1"),
    koalaBoost: upgradeSet.has("upg-koala-1"),
    pandaBoost: upgradeSet.has("upg-panda-1"),
    unicornBoost: upgradeSet.has("upg-unicorn-1"),
    globalAnimalsBoost: upgradeSet.has("upg-global-1"),

    starGlow: upgradeSet.has("upg-star-glow"),
    starPulse: upgradeSet.has("upg-star-pulse"),
    starSupercharger: upgradeSet.has("upg-star-supercharger"),
  };

  // Click power calculation (raw click power for upgrades synergy)
  let rawClickPower = 1;
  if (upgradeSet.has("upg-click-1")) rawClickPower += 1;
  if (upgradeSet.has("upg-click-2")) rawClickPower += 5;
  if (upgradeSet.has("upg-click-3")) rawClickPower += 25;
  if (upgradeSet.has("upg-click-4")) rawClickPower += 150;
  if (upgradeSet.has("upg-click-5")) rawClickPower += 1000;
  if (upgradeSet.has("upg-click-multiplier")) rawClickPower *= 2;

  // Click power with DAYTIME BONUS: own clicks are 1.5x stronger during day (isNight === false)
  let clickPower = rawClickPower;
  if (!isNight) {
    clickPower = Math.floor(clickPower * 1.5);
  } else if (ghostSetComplete) {
    // Ghost set gives 2.5x click power during night periods
    clickPower = Math.floor(clickPower * 2.5);
  }

  // Fuchs zodiac flat increase (+40% click power)
  if (state.zodiac === "fuchs") {
    const lvl = state.zodiacLevels?.fuchs || 1;
    const fuchsMultiplier = 1.4 + (lvl - 1) * 0.15;
    clickPower = Math.ceil(clickPower * fuchsMultiplier);
  }

  // XP multiplier calculation based on Research upgrades
  let xpMultiplier = 1.0;
  if (upgradeSet.has("upg-xp-1")) xpMultiplier += 0.5;
  if (upgradeSet.has("upg-xp-2")) xpMultiplier += 0.5;
  if (upgradeSet.has("upg-xp-3")) xpMultiplier += 0.5;
  if (upgradeSet.has("upg-xp-4")) xpMultiplier += 0.5;
  if (upgradeSet.has("upg-xp-5")) xpMultiplier += 1.0;
  if (upgradeSet.has("upg-star-magnetic")) xpMultiplier += 1.0;
  if (upgradeSet.has("upg-cosmic-eternity")) xpMultiplier *= 3.0;

  // Schmetterling Set complete (+25% XP-Multiplikator)
  if (butterflySetComplete) {
    xpMultiplier += 0.25;
  }

  // Constellation Level Helpers
  const constellKuschelLevel = state.constellations?.kuschel || 0;
  const constellMondhasenLevel = state.constellations?.mondhasen || 0;
  const constellSupernovaLevel = state.constellations?.supernova || 0;
  const constellSternenstaubLevel = state.constellations?.stardust_rain || 0;
  const constellHarmonieLevel = state.constellations?.cosmic_harmony || 0;

  // Sternenstaub bonus to XP (+15% more EXP earned per level)
  xpMultiplier += constellSternenstaubLevel * 0.15;

  // 🌌 EVENT DECISIONS ADJUSTMENTS
  const decision = state.activeEventDecision;

  // Event multipliers computations
  let clickMultiplierForEvents = 1.0;
  let starMultiplierForEvents = 1.0;
  let animalMultiplierForEvents = 1.0;
  let lpsMultiplierForEvents = 1.0;
  let xpEventMultiplier = 1.0;

  if (activeEvent && activeEvent !== "black_hole" && state.activeEventDetails && decision) {
    if (decision === "ignorieren") {
      // Ignorieren grants a small global passive contribution to acknowledge the patience (+20% LPS)
      lpsMultiplierForEvents *= 1.2;
    } else {
      const selectedOpt = state.activeEventDetails.options.find((o: any) => o.id === decision);
      if (selectedOpt) {
        const eff = selectedOpt.effectType;
        if (eff === "lps_boost_4x") {
          lpsMultiplierForEvents *= 4.0;
        } else if (eff === "lps_boost_5x") {
          lpsMultiplierForEvents *= 5.0;
        } else if (eff === "lps_boost_6x") {
          lpsMultiplierForEvents *= 6.0;
        } else if (eff === "lps_boost_2x") {
          lpsMultiplierForEvents *= 2.0;
        } else if (eff === "lps_boost_4.5x") {
          lpsMultiplierForEvents *= 4.5;
        } else if (eff === "lps_boost_5.5x") {
          lpsMultiplierForEvents *= 5.5;
        } else if (eff === "click_boost_5x") {
          clickMultiplierForEvents *= 5.0;
        } else if (eff === "click_boost_6x") {
          clickMultiplierForEvents *= 6.0;
        } else if (eff === "click_boost_8x") {
          clickMultiplierForEvents *= 8.0;
        } else if (eff === "click_boost_4.5x") {
          clickMultiplierForEvents *= 4.5;
        } else if (eff === "click_boost_4x") {
          clickMultiplierForEvents *= 4.0;
        } else if (eff === "click_boost_5.5x") {
          clickMultiplierForEvents *= 5.5;
        } else if (eff === "click_boost_7x") {
          clickMultiplierForEvents *= 7.0;
        } else if (eff === "star_boost_4.5x") {
          starMultiplierForEvents *= 4.5;
        } else if (eff === "star_boost_6x") {
          starMultiplierForEvents *= 6.0;
        } else if (eff === "star_boost_5x") {
          starMultiplierForEvents *= 5.0;
        } else if (eff === "star_boost_4x") {
          starMultiplierForEvents *= 4.0;
        } else if (eff === "star_boost_5.5x") {
          starMultiplierForEvents *= 5.5;
        } else if (eff === "animal_boost_5x") {
          animalMultiplierForEvents *= 5.0;
        } else if (eff === "animal_boost_4.5x") {
          animalMultiplierForEvents *= 4.5;
        } else if (eff === "animal_boost_5.5x") {
          animalMultiplierForEvents *= 5.5;
        } else if (eff === "collision_combo") {
          lpsMultiplierForEvents *= 5.0;
          clickMultiplierForEvents *= 3.0;
        }
      }
    }

    // Apply upgrade modifiers if applicable (rewarding previous research upgrades!)
    if (upgradeSet.has("upg-event-meteor") && clickMultiplierForEvents > 1.0) {
      clickMultiplierForEvents *= 1.5;
    }
    if (upgradeSet.has("upg-event-aurora") && starMultiplierForEvents > 1.0) {
      starMultiplierForEvents *= 1.5;
    }
    if (upgradeSet.has("upg-animal-synergy-1") && animalMultiplierForEvents > 1.0) {
      animalMultiplierForEvents *= 1.5;
    }
    if (upgradeSet.has("upg-event-supernova") && lpsMultiplierForEvents > 1.0) {
      lpsMultiplierForEvents *= 1.5;
    }
  } else if (activeEvent === "black_hole") {
    if (decision === "ignorieren") {
      lpsMultiplierForEvents *= 1.1;
    }
  }

  // Constellation Supernova Power Boosts (+20% per level)
  const supernovaBoost = 1.0 + constellSupernovaLevel * 0.2;
  if (activeEvent) {
    clickMultiplierForEvents *= supernovaBoost;
    starMultiplierForEvents *= supernovaBoost;
    animalMultiplierForEvents *= supernovaBoost;
    xpEventMultiplier *= supernovaBoost;
  }

  // Drache zodiac event boost (+40% to event multipliers)
  if (activeEvent && state.zodiac === "drache") {
    const lvl = state.zodiacLevels?.drache || 1;
    const multiplier = 1.4 + (lvl - 1) * 0.15;
    clickMultiplierForEvents = 1.0 + (clickMultiplierForEvents - 1.0) * multiplier;
    starMultiplierForEvents = 1.0 + (starMultiplierForEvents - 1.0) * multiplier;
    animalMultiplierForEvents = 1.0 + (animalMultiplierForEvents - 1.0) * multiplier;
    xpEventMultiplier = 1.0 + (xpEventMultiplier - 1.0) * multiplier;
  }

  // Calculate Star Autoclick Power
  let starPowerPerStar = 1.0;
  if (upgradesSpecs.starGlow) starPowerPerStar += 1.0;
  if (upgradesSpecs.starPulse) starPowerPerStar += 5.0;
  const clickBonus = (rawClickPower - 1) * 0.2;
  starPowerPerStar += clickBonus;
  if (upgradesSpecs.starSupercharger) starPowerPerStar *= 2.0;
  if (isNight) {
    // Ghost Set boosts the night star reward from 1.5x to 4.0x
    starPowerPerStar = starPowerPerStar * (ghostSetComplete ? 4.0 : 1.5);
  }

  // Prestige Multiplier (10% bonus per Prestige level)
  const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.1;

  // Apply prestige bonus to star power and manual click power
  starPowerPerStar *= prestigeMultiplier;
  clickPower = Math.ceil(clickPower * prestigeMultiplier);

  // Apply Cosmic Harmony bonus to clicks and stars (+8% per level)
  const harmonieMulti = 1.0 + constellHarmonieLevel * 0.08;
  clickPower = Math.ceil(clickPower * harmonieMulti);
  starPowerPerStar *= harmonieMulti;

  // Cyber Set gives +15% Sterne power
  let finalStarPowerPos = starPowerPerStar;
  if (cyberSetComplete) {
    finalStarPowerPos *= 1.15;
  }

  // Eule zodiac star boost (+30% stars LPS)
  if (state.zodiac === "eule") {
    const lvl = state.zodiacLevels?.eule || 1;
    finalStarPowerPos *= 1.3 + (lvl - 1) * 0.15;
  }

  const totalStarsLps = starsCount * finalStarPowerPos;

  // Calculate Animal LPS
  let totalAnimalsLps = 0;
  const animalLpsMap: Record<string, number> = {};

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

    const quantity = purchasedAnimals[def.id] || 0;
    let lps = quantity * def.baseLps * multiplier;
    // Apply prestige bonus to the animal LPS
    lps *= prestigeMultiplier;
    // Apply Kuschel-Sternbild Animal LPS bonus (+10% per level)
    lps *= 1.0 + constellKuschelLevel * 0.1;

    // Biene zodiac animal boost (+35% animal production)
    if (state.zodiac === "biene") {
      const lvl = state.zodiacLevels?.biene || 1;
      lps *= 1.35 + (lvl - 1) * 0.15;
    }

    animalLpsMap[def.id] = lps;
    totalAnimalsLps += lps;
  });

  // Calculate Moons bonuses (Flat + Global Multiplier)
  const flatMoonLps = (state.moonsCount || 0) * 15000 * prestigeMultiplier;

  // Aggregate Life Per Second (LPS)
  let totalLps =
    (totalAnimalsLps * animalMultiplierForEvents +
      totalStarsLps * starMultiplierForEvents +
      flatMoonLps) *
    lpsMultiplierForEvents;

  // Cosmic Catalyst global booster (+15% passive LPS per level)
  const catalystLvl = state.catalystLevel || 0;
  totalLps *= 1.0 + catalystLvl * 0.15;

  if (upgradeSet.has("upg-nexus-core")) {
    totalLps *= 1.4;
  }

  // Gold Set complete (+5% alles!)
  if (goldSetComplete) {
    totalLps *= 1.05;
  }

  // Schmetterling Set complete (+15% Alles-Generierung!)
  if (butterflySetComplete) {
    totalLps *= 1.15;
  }

  // ✨ RARITY UPGRADE BONUS CHECK
  let rarityUpgradeMultiplier = 1.0;
  if (upgradeSet.has("upg-glitter-rarity") && state.cosmeticRarityLevels) {
    Object.keys(state.cosmeticRarityLevels).forEach((id) => {
      const level = state.cosmeticRarityLevels[id];
      if (level === "rare") rarityUpgradeMultiplier += 0.02;
      else if (level === "epic") rarityUpgradeMultiplier += 0.05;
      else if (level === "legendary") rarityUpgradeMultiplier += 0.12;
    });
  }
  totalLps *= rarityUpgradeMultiplier;

  // Apply Moon global multiplier (+150% total LPS per Moon, or +225% if Mond zodiac)
  if (state.moonsCount && state.moonsCount > 0) {
    const lvl = state.zodiacLevels?.mond || 1;
    const moonMultiplier = state.zodiac === "mond" ? 2.25 + (lvl - 1) * 0.25 : 1.5;
    totalLps *= 1.0 + state.moonsCount * moonMultiplier;
  }

  // Schildkröte zodiac total passive boost (+20% total passive LPS)
  if (state.zodiac === "schildkroete") {
    const lvl = state.zodiacLevels?.schildkroete || 1;
    totalLps *= 1.2 + (lvl - 1) * 0.1;
  }

  if (state.inGlitchGalaxy) {
    totalLps *= 7.77;
    clickPower = Math.ceil(clickPower * 7.77);
  }

  // Aggregate quantities
  const totalAnimalsCount = Object.values(purchasedAnimals).reduce(
    (sum: number, qty: any) => sum + qty,
    0,
  );
  const researchedUpgradesCount = purchasedUpgrades.length;

  // EXP needed to level up the planet based on current level and prestigeCount
  const nextIdx = state.planetLevel;
  const planetExpNeeded = expForLevel(nextIdx, state.prestigeCount || 0);

  return {
    upgradesSpecs,
    clickPower,
    rawClickPower,
    xpMultiplier,
    clickMultiplierForEvents,
    starMultiplierForEvents,
    animalMultiplierForEvents,
    xpEventMultiplier,
    starPowerPerStar,
    totalStarsLps,
    totalAnimalsLps,
    flatMoonLps,
    totalLps,
    totalAnimalsCount,
    researchedUpgradesCount,
    planetExpNeeded,
    prestigeCount: state.prestigeCount || 0,
    prestigeMultiplier,
    moonsCount: state.moonsCount || 0,
    zodiac: state.zodiac,
  };
}
