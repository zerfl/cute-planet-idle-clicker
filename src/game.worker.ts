import { GameState, Animal, Upgrade } from "./types";
import { INITIAL_ANIMALS, calculateCost } from "./data";
import { COSMETIC_ITEMS } from "./data/cosmetics";
import { CRAFTING_RECIPES } from "./data/recipes";
import { ZODIACS } from "./data/zodiacs";

// Static level bounds matching App.tsx
const EXP_PER_LEVEL = [0, 1500, 5000, 18000, 60000, 220000, 850000, 3200000, 12000000, 45000000, 160000000, 550000000, 1800000000, 6000000000, 20000000000, 65000000000, 200000000000, 600000000000, 1800000000000, 5000000000000];

// ROMAN NUMERAL LIST for Achievements
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

interface WorkerState {
  life: number;
  totalLifeEarned: number;
  starsCount: number;
  purchasedAnimals: Record<string, number>;
  purchasedUpgrades: string[];
  planetLevel: number;
  planetExp: number;
  clicksCount: number;
  starClicksTriggered: number;
  secondsPlayed: number;
  isNight: boolean;
  cycleProgress: number;
  activeEvent: "meteors" | "aurora" | "shooting_stars" | "supernova" | "black_hole" | null;
  activeEventDecision: "sammeln" | "erforschen" | "zerlegen" | "ignorieren" | null;
  eventTimeRemaining: number;
  prestigeCount: number;
  moonsCount: number;
  constellations: Record<string, number>;
  unlockedCosmetics: string[];
  cosmeticRarityLevels: Record<string, string>;
  glitterDust: number;
  shootingStarsCount: number;
  blackHoleSize?: number;
  craftedItems?: Record<string, number>;
  zodiac?: string;
  galaxyShards: number;
}

// Default initial state
let state: WorkerState = {
  life: 0,
  totalLifeEarned: 0,
  starsCount: 0,
  purchasedAnimals: {},
  purchasedUpgrades: [],
  planetLevel: 1,
  planetExp: 0,
  clicksCount: 0,
  starClicksTriggered: 0,
  secondsPlayed: 0,
  isNight: true,
  cycleProgress: 0,
  activeEvent: null,
  activeEventDecision: null,
  eventTimeRemaining: 120,
  prestigeCount: 0,
  moonsCount: 0,
  constellations: {},
  unlockedCosmetics: [],
  cosmeticRarityLevels: {},
  glitterDust: 0,
  shootingStarsCount: 0,
  blackHoleSize: 1,
  craftedItems: {},
  zodiac: "katze",
  galaxyShards: 0,
};

// Timers refs
let gameTimerId: any = null;

// Roll helper to guarantee never calling the same zodiac twice in a row
function rollNewZodiac(currentId?: string): string {
  const eligible = currentId ? ZODIACS.filter(z => z.id !== currentId) : ZODIACS;
  if (eligible.length === 0) return ZODIACS[0].id;
  const picked = eligible[Math.floor(Math.random() * eligible.length)];
  return picked.id;
}
let secondaryTimerId: any = null;
let starTimerId: any = null;
let cycleTimerId: any = null;
let eventTimerId: any = null;

// Derived variables calculations
function getLpsAndStats() {
  const purchasedUpgrades = state.purchasedUpgrades;
  const purchasedAnimals = state.purchasedAnimals;
  const starsCount = state.starsCount;
  const isNight = state.isNight;
  const activeEvent = state.activeEvent;

  // 🧩 SETBONI CHECK (Kosmischer Set-Harmonisierer)
  const hasSetBonusSet = purchasedUpgrades.includes("upg-glitter-set");
  let sakuraSetComplete = false;
  let cyberSetComplete = false;
  let goldSetComplete = false;
  let ghostSetComplete = false;
  let butterflySetComplete = false;

  if (hasSetBonusSet && state.unlockedCosmetics) {
    const list = state.unlockedCosmetics || [];
    sakuraSetComplete = ["star_pink", "acc_flower_crown", "moon_sakura"].every(id => list.includes(id));
    cyberSetComplete = ["star_cyber", "acc_space_glasses", "moon_cyber"].every(id => list.includes(id));
    goldSetComplete = ["star_gold", "acc_star_crown", "moon_gold"].every(id => list.includes(id));
    ghostSetComplete = ["star_ghostly", "frame_ghost", "moon_ghost"].every(id => list.includes(id));
    butterflySetComplete = ["star_butterfly", "acc_butterfly_wings", "frame_butterfly", "moon_butterfly"].every(id => list.includes(id));
  }

  // Upgrades specifications check
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
  };

  // Click power calculation (raw click power for upgrades synergy)
  let rawClickPower = 1;
  if (purchasedUpgrades.includes("upg-click-1")) rawClickPower += 1;
  if (purchasedUpgrades.includes("upg-click-2")) rawClickPower += 5;
  if (purchasedUpgrades.includes("upg-click-3")) rawClickPower += 25;
  if (purchasedUpgrades.includes("upg-click-4")) rawClickPower += 150;
  if (purchasedUpgrades.includes("upg-click-5")) rawClickPower += 1000;
  if (purchasedUpgrades.includes("upg-click-multiplier")) rawClickPower *= 2;

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
    clickPower = Math.ceil(clickPower * 1.40);
  }

  // XP multiplier calculation based on Research upgrades
  let xpMultiplier = 1.0;
  if (purchasedUpgrades.includes("upg-xp-1")) xpMultiplier += 0.5;
  if (purchasedUpgrades.includes("upg-xp-2")) xpMultiplier += 0.5;
  if (purchasedUpgrades.includes("upg-xp-3")) xpMultiplier += 0.5;
  if (purchasedUpgrades.includes("upg-xp-4")) xpMultiplier += 0.5;
  if (purchasedUpgrades.includes("upg-xp-5")) xpMultiplier += 1.0;
  if (purchasedUpgrades.includes("upg-star-magnetic")) xpMultiplier += 1.0;
  if (purchasedUpgrades.includes("upg-cosmic-eternity")) xpMultiplier *= 3.0;

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
  if (activeEvent === "meteors") {
    let baseClickAdd = 4.0;
    if (decision === "sammeln") {
      baseClickAdd = 8.0; // Meteors Collect mode -> mehr Leben! (+800%)
    } else if (decision === "ignorieren") {
      baseClickAdd = 1.5; // Meteors Ignore mode -> smaller bonus
    }
    clickMultiplierForEvents += baseClickAdd;
    if (purchasedUpgrades.includes("upg-event-meteor")) {
      clickMultiplierForEvents += (decision === "sammeln" ? 8.0 : decision === "ignorieren" ? 2.0 : 5.0);
    }
  }

  let starMultiplierForEvents = 1.0;
  if (activeEvent === "aurora") {
    let baseStarAdd = 2.0;
    if (decision === "sammeln") {
      baseStarAdd = 5.5; // Star collect mode -> mehr Leben (Sterne)! (+550%)
    } else if (decision === "ignorieren") {
      baseStarAdd = 0.8; // Smaller bonus
    }
    starMultiplierForEvents += baseStarAdd;
    if (purchasedUpgrades.includes("upg-event-aurora")) {
      starMultiplierForEvents += (decision === "sammeln" ? 5.0 : decision === "ignorieren" ? 1.0 : 3.0);
    }
  }

  let animalMultiplierForEvents = 1.0;
  if (activeEvent === "shooting_stars") {
    let baseAnimalAdd = 2.0;
    if (decision === "sammeln") {
      baseAnimalAdd = 5.5; // Animal warm cuddle -> mehr Leben (Tiere)! (+550%)
    } else if (decision === "ignorieren") {
      baseAnimalAdd = 0.8;
    }
    animalMultiplierForEvents += baseAnimalAdd;
    if (purchasedUpgrades.includes("upg-animal-synergy-1")) {
      animalMultiplierForEvents += (decision === "sammeln" ? 2.0 : decision === "ignorieren" ? 0.4 : 1.0);
    }
  }

  let xpEventMultiplier = 1.0;
  if (activeEvent === "supernova") {
    let baseXpMult = 3.0;
    if (decision === "erforschen") {
      baseXpMult = 6.0; // Research mode -> mehr XP (+500% / 6x XP)
    } else if (decision === "ignorieren") {
      baseXpMult = 1.5;
    }
    xpEventMultiplier *= baseXpMult;
    if (purchasedUpgrades.includes("upg-event-supernova")) {
      xpEventMultiplier *= (decision === "erforschen" ? 3.0 : decision === "ignorieren" ? 1.2 : 2.0);
    }
  } else if (activeEvent === "meteors") {
    let baseXpMult = 2.0;
    if (decision === "erforschen") {
      baseXpMult = 4.5; // Research mode -> mehr XP!
    } else if (decision === "ignorieren") {
      baseXpMult = 1.2;
    }
    xpEventMultiplier *= baseXpMult;
  } else if (activeEvent === "aurora" && decision === "erforschen") {
    xpEventMultiplier *= 3.0; // Aurora photography -> more XP!
  } else if (activeEvent === "shooting_stars" && decision === "erforschen") {
    xpEventMultiplier *= 3.0; // Star drop logging -> more XP!
  }

  // Constellation Supernova Power Boosts (+20% per level)
  const supernovaBoost = 1.0 + constellSupernovaLevel * 0.20;
  if (activeEvent) {
    clickMultiplierForEvents *= supernovaBoost;
    starMultiplierForEvents *= supernovaBoost;
    animalMultiplierForEvents *= supernovaBoost;
    xpEventMultiplier *= supernovaBoost;
  }

  // Drache zodiac event boost (+40% to event multipliers)
  if (activeEvent && state.zodiac === "drache") {
    clickMultiplierForEvents = 1.0 + (clickMultiplierForEvents - 1.0) * 1.40;
    starMultiplierForEvents = 1.0 + (starMultiplierForEvents - 1.0) * 1.40;
    animalMultiplierForEvents = 1.0 + (animalMultiplierForEvents - 1.0) * 1.40;
    xpEventMultiplier = 1.0 + (xpEventMultiplier - 1.0) * 1.40;
  }

  // Calculate Star Autoclick Power
  let starPowerPerStar = 1.0;
  if (upgradesSpecs.starGlow) starPowerPerStar += 1.0;
  if (upgradesSpecs.starPulse) starPowerPerStar += 5.0;
  const clickBonus = (rawClickPower - 1) * 0.20;
  starPowerPerStar += clickBonus;
  if (upgradesSpecs.starSupercharger) starPowerPerStar *= 2.0;
  if (isNight) {
    // Ghost Set boosts the night star reward from 1.5x to 4.0x
    starPowerPerStar = starPowerPerStar * (ghostSetComplete ? 4.0 : 1.5);
  }

  // Prestige Multiplier (10% bonus per Prestige level)
  const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.10;

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
    finalStarPowerPos *= 1.30;
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
    lps *= (1.0 + constellKuschelLevel * 0.10);

    // Biene zodiac animal boost (+35% animal production)
    if (state.zodiac === "biene") {
      lps *= 1.35;
    }

    animalLpsMap[def.id] = lps;
    totalAnimalsLps += lps;
  });

  // Calculate Moons bonuses (Flat + Global Multiplier)
  const flatMoonLps = (state.moonsCount || 0) * 15000 * prestigeMultiplier;

  // Aggregate Life Per Second (LPS)
  let totalLps = (totalAnimalsLps * animalMultiplierForEvents) + (totalStarsLps * starMultiplierForEvents) + flatMoonLps;
  if (purchasedUpgrades.includes("upg-nexus-core")) {
    totalLps *= 1.40;
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
  if (purchasedUpgrades.includes("upg-glitter-rarity") && state.cosmeticRarityLevels) {
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
    const moonMultiplier = state.zodiac === "mond" ? 2.25 : 1.50;
    totalLps *= (1.0 + state.moonsCount * moonMultiplier);
  }

  // Schildkröte zodiac total passive boost (+20% total passive LPS)
  if (state.zodiac === "schildkroete") {
    totalLps *= 1.20;
  }

  // Aggregate quantities
  const totalAnimalsCount = Object.values(purchasedAnimals).reduce((sum, qty) => sum + qty, 0);
  const researchedUpgradesCount = purchasedUpgrades.length;

  // EXP needed to level up the planet based on current level
  const nextIdx = state.planetLevel;
  let planetExpNeeded = 45000000;
  if (nextIdx < EXP_PER_LEVEL.length) {
    planetExpNeeded = EXP_PER_LEVEL[nextIdx];
  } else {
    planetExpNeeded = 5000000000000 + (state.planetLevel - 19) * 2000000000000;
  }

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

// Calculations helper for formatting inside compact loops
function formatCompactNumber(num: number): string {
  if (num === null || isNaN(num)) return "0";
  if (num < 1000) {
    if (num === 0) return "0";
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  }
  const suffixes = [
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "Qa" },
    { value: 1e18, symbol: "Qi" },
    { value: 1e21, symbol: "Sx" },
    { value: 1e24, symbol: "Sp" },
    { value: 1e27, symbol: "Oc" },
    { value: 1e30, symbol: "No" },
    { value: 1e33, symbol: "Dc" },
    { value: 1e36, symbol: "Ud" },
    { value: 1e39, symbol: "Dd" },
    { value: 1e42, symbol: "Td" },
    { value: 1e45, symbol: "Qad" },
  ];
  for (let i = suffixes.length - 1; i >= 0; i--) {
    if (num >= suffixes[i].value) {
      const formatted = (num / suffixes[i].value).toFixed(2);
      return parseFloat(formatted) + suffixes[i].symbol;
    }
  }
  return num.toString();
}

// Achievements Generation (120 items total: recalculated in Worker thread)
function generateAchievements() {
  const stats = getLpsAndStats();
  const totalLifeEarned = state.totalLifeEarned;
  const clicksCount = state.clicksCount;
  const starsCount = state.starsCount;
  const starClicksTriggered = state.starClicksTriggered;
  const planetLevel = state.planetLevel;
  const totalAnimalsCount = stats.totalAnimalsCount;
  const researchedUpgradesCount = stats.researchedUpgradesCount;
  const secondsPlayed = state.secondsPlayed;

  const families = [
    {
      category: "life",
      emoji: "💖",
      titlePrefix: "Lebensmeister",
      desc: (target: number) => `Sammle insgesamt ${formatCompactNumber(target)} Leben`,
      currentValue: totalLifeEarned,
      targets: [100, 500, 2500, 10000, 50000, 250000, 1000000, 5000000, 25000000, 100000000, 500000000, 2500000000, 10000000000, 50000000000, 100000000000],
    },
    {
      category: "clicks",
      emoji: "⚡",
      titlePrefix: "Kosmischer Klicker",
      desc: (target: number) => `Klicke insgesamt ${target.toLocaleString()} Mal manuell auf den Planeten`,
      currentValue: clicksCount,
      targets: [5, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000, 50000, 100000, 250000, 500000],
    },
    {
      category: "stars",
      emoji: "⭐",
      titlePrefix: "Sternenrufer",
      desc: (target: number) => `Besitze insgesamt ${target} fliegende Sterne`,
      currentValue: starsCount,
      targets: [1, 2, 3, 4, 5, 8, 12, 16, 20, 25, 30, 35, 40, 45, 50],
    },
    {
      category: "star_clicks",
      emoji: "✧",
      titlePrefix: "Sternenstaub-Sammler",
      desc: (target: number) => `Sterne brüten und klicken ${target.toLocaleString()} Mal automatisch`,
      currentValue: starClicksTriggered,
      targets: [10, 50, 200, 1000, 5000, 20000, 100000, 500000, 2000000, 10000000, 50000000, 200000000, 1000000000, 5000000000, 10000000000],
    },
    {
      category: "planet_level",
      emoji: "🪐",
      titlePrefix: "Welten-Evolutionär",
      desc: (target: number) => `Entwickle deinen niedlichen Planeten bis auf Stufe ${target}`,
      currentValue: planetLevel,
      targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 20],
    },
    {
      category: "animals",
      emoji: "🐾",
      titlePrefix: "Tierfreund",
      desc: (target: number) => `Besitze insgesamt ${target} niedliche Tiere`,
      currentValue: totalAnimalsCount,
      targets: [1, 5, 10, 20, 35, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400],
    },
    {
      category: "upgrades",
      emoji: "🔬",
      titlePrefix: "Forschungs-Doktor",
      desc: (target: number) => `Erforsche insgesamt ${target} Technologien`,
      currentValue: researchedUpgradesCount,
      targets: [1, 2, 3, 4, 5, 7, 10, 12, 15, 18, 20, 22, 24, 26, 28],
    },
    {
      category: "time",
      emoji: "⏳",
      titlePrefix: "Zeit-Reisender",
      desc: (target: number) => `Spielzeit insgesamt im gemütlichen Kosmos: ${target >= 3600 ? Math.floor(target/3600) + ' Std.' : Math.floor(target/60) + ' Min.'}`,
      currentValue: secondsPlayed,
      targets: [10, 30, 60, 120, 300, 600, 1200, 2400, 3600, 7200, 14400, 28800, 57600, 86400, 172800],
    },
  ];

  const list: any[] = [];
  families.forEach((fam) => {
    fam.targets.forEach((target, idx) => {
      const roman = ROMAN_NUMERALS[idx] || (idx + 1).toString();
      const value = fam.currentValue;
      list.push({
        id: `ach-${fam.category}-${target}`,
        title: `${fam.titlePrefix} ${roman}`,
        description: fam.desc(target),
        category: fam.category,
        progress: Math.min(value, target),
        target: target,
        isUnlocked: value >= target,
        emoji: fam.emoji,
      });
    });
  });

  return list;
}

// Check and trigger planet level ups
function addPlanetExp(amount: number) {
  let currentExp = state.planetExp + amount;
  let currentLevel = state.planetLevel;
  let leveledUp = false;

  while (true) {
    const expBound = EXP_PER_LEVEL[currentLevel] || (5000000000000 + (currentLevel - 19) * 2000000000000);
    if (currentExp >= expBound) {
      currentExp -= expBound;
      currentLevel += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  state.planetExp = currentExp;
  if (leveledUp) {
    state.planetLevel = currentLevel;
    postMessage({
      type: "LEVEL_UP",
      level: currentLevel,
    });
  }
}

let cachedAchievementsObj: any[] = [];
let lastAchievementsCalcTime = 0;

// State Broadcaster
function broadcastStateUpdate(forceRecalculateAchievements = false) {
  const calculations = getLpsAndStats();
  
  // Throttle achievements calculation to once every 1250ms unless forced by a buy/click event
  const now = Date.now();
  if (forceRecalculateAchievements || cachedAchievementsObj.length === 0 || now - lastAchievementsCalcTime > 1250) {
    cachedAchievementsObj = generateAchievements();
    lastAchievementsCalcTime = now;
  }
  
  const achievements = cachedAchievementsObj;
  const unlockedAchievementsCount = achievements.filter((a: any) => a.isUnlocked).length;

  postMessage({
    type: "STATE_UPDATE",
    state: {
      life: state.life,
      totalLifeEarned: state.totalLifeEarned,
      starsCount: state.starsCount,
      purchasedAnimals: state.purchasedAnimals,
      purchasedUpgrades: state.purchasedUpgrades,
      planetLevel: state.planetLevel,
      planetExp: state.planetExp,
      clicksCount: state.clicksCount,
      starClicksTriggered: state.starClicksTriggered,
      secondsPlayed: state.secondsPlayed,
      isNight: state.isNight,
      cycleProgress: state.cycleProgress,
      activeEvent: state.activeEvent,
      activeEventDecision: state.activeEventDecision || null,
      eventTimeRemaining: state.eventTimeRemaining,
      prestigeCount: state.prestigeCount,
      moonsCount: state.moonsCount || 0,
      constellations: state.constellations || {},
      unlockedCosmetics: state.unlockedCosmetics || [],
      cosmeticRarityLevels: state.cosmeticRarityLevels || {},
      glitterDust: state.glitterDust || 0,
      shootingStarsCount: state.shootingStarsCount || 0,
      blackHoleSize: state.blackHoleSize || 1,
      craftedItems: state.craftedItems || {},
      zodiac: state.zodiac || "katze",
      galaxyShards: state.galaxyShards || 0,
    },
    calculations: {
      ...calculations,
      unlockedAchievementsCount,
    },
    achievements,
  });
}

// ---------------------------------------------------------------------------
// Worker Loop initializations
// ---------------------------------------------------------------------------
function startTimers() {
  stopTimers();

  // 1. Core Incremental game tick (every 250ms instead of 100ms for extreme mobile performance)
  gameTimerId = setInterval(() => {
    const stats = getLpsAndStats();
    const increment = stats.totalLps / 4;
    if (increment > 0) {
      state.life += increment;
      state.totalLifeEarned += increment;
    }
    broadcastStateUpdate();
  }, 250);

  // 2. Seconds played ticker (every 1000ms)
  secondaryTimerId = setInterval(() => {
    state.secondsPlayed += 1;
  }, 1000);

  // 3. Planet Cycle progress ticker (every 250ms)
  cycleTimerId = setInterval(() => {
    // Mondhasen-Sternbild bonus: Night lasts longer (slower cycleProgress during night)
    const constellMondhasenLvl = state.constellations?.mondhasen || 0;
    const progressModifier = state.isNight ? (1 / (1 + constellMondhasenLvl * 0.25)) : 1.0;
    
    const nextVal = state.cycleProgress + 0.4166667 * progressModifier;
    if (nextVal >= 100) {
      state.cycleProgress = 0;
      state.isNight = !state.isNight;
    } else {
      state.cycleProgress = nextVal;
    }
  }, 250);

  // 4. Star Auto-Clicks & Moon Pulsing sequence (every 1000ms)
  starTimerId = setInterval(() => {
    const stats = getLpsAndStats();
    let updated = false;

    if (state.starsCount > 0) {
      const reward = state.starsCount * stats.starPowerPerStar * stats.starMultiplierForEvents;
      state.starClicksTriggered += state.starsCount;

      postMessage({
        type: "STAR_TRIGGER",
        reward: reward,
        starsCount: state.starsCount,
      });

      addPlanetExp(state.starsCount * 1.0 * stats.xpMultiplier * stats.xpEventMultiplier);
      updated = true;
    }

    if (state.moonsCount && state.moonsCount > 0) {
      const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.10;
      const moonReward = state.moonsCount * 15000 * prestigeMultiplier;

      postMessage({
        type: "MOON_TRIGGER",
        reward: moonReward,
        moonsCount: state.moonsCount,
      });

      addPlanetExp(state.moonsCount * 15 * stats.xpMultiplier * stats.xpEventMultiplier);
      updated = true;
    }

    if (updated) {
      broadcastStateUpdate();
    }
  }, 1000);

  // 5. Cosmic Random Event Manager (every 1000ms)
  eventTimerId = setInterval(() => {
    state.eventTimeRemaining -= 1;
    if (state.eventTimeRemaining <= 0) {
      if (state.activeEvent === null) {
        // Start random event
        const eventPool: ("meteors" | "aurora" | "shooting_stars" | "supernova" | "black_hole")[] = ["meteors", "aurora", "shooting_stars", "supernova"];
        if ((state.prestigeCount || 0) >= 5) {
          eventPool.push("black_hole");
        }
        const chosen = eventPool[Math.floor(Math.random() * eventPool.length)];
        state.activeEvent = chosen;
        state.activeEventDecision = "ignorieren";

        let duration = 120;
        if (state.purchasedUpgrades.includes("upg-event-duration")) {
          duration += 60;
        }
        // Since it starts with "ignorieren", we automatically add the extra 60s
        duration += 60;
        state.eventTimeRemaining = duration;

        if (state.purchasedUpgrades.includes("upg-quantum-tapper")) {
          const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.10;
          const bonus = 1000 * prestigeMultiplier;
          state.life += bonus;
          state.totalLifeEarned += bonus;
        }

        postMessage({
          type: "EVENT_TRIGGER",
          event: chosen,
          active: true,
        });
      } else {
        // End current event
        state.activeEvent = null;
        state.activeEventDecision = null;

        let waitDuration = 120;
        if (state.purchasedUpgrades.includes("upg-event-frequency")) {
          waitDuration = 70;
        }
        
        // Ewiges Polarlicht reduces wait time by 15% per level
        const constellPolarlichtLvl = state.constellations?.ewiges_polarlicht || 0;
        waitDuration = Math.round(waitDuration * (1 - constellPolarlichtLvl * 0.15));
        
        state.eventTimeRemaining = waitDuration;

        postMessage({
          type: "EVENT_TRIGGER",
          event: null,
          active: false,
        });
      }
    }
  }, 1000);
}

function stopTimers() {
  if (gameTimerId) clearInterval(gameTimerId);
  if (secondaryTimerId) clearInterval(secondaryTimerId);
  if (cycleTimerId) clearInterval(cycleTimerId);
  if (starTimerId) clearInterval(starTimerId);
  if (eventTimerId) clearInterval(eventTimerId);
}

// Handle messages from UI
addEventListener("message", (e) => {
  const data = e.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case "INIT": {
      if (data.savedState) {
        state = {
          ...state,
          ...data.savedState,
        };
      }
      if (!state.zodiac) {
        state.zodiac = rollNewZodiac();
      }
      startTimers();
      broadcastStateUpdate();
      break;
    }
    case "CLICK": {
      state.clicksCount += 1;
      const stats = getLpsAndStats();

      const isKatze = state.zodiac === "katze";
      const critChance = isKatze ? 0.20 : 0.05;
      const isCrit = Math.random() < critChance;
      const critMult = isKatze ? 7 : 3;
      const clickVal = isCrit ? (stats.clickPower * critMult) : stats.clickPower;

      const actualClickLife = clickVal * stats.clickMultiplierForEvents;
      const actualClickXP = 1.0 * stats.xpMultiplier * stats.xpEventMultiplier;

      state.life += actualClickLife;
      state.totalLifeEarned += actualClickLife;

      // 🌌 EVENT DECISION: "zerlegen" (Dismantle/Scan) DROP CHANCE
      if (state.activeEvent && state.activeEventDecision === "zerlegen") {
        // Only rolls for Glitzerstaub! No lootboxes/shooting star drops.
        const dustRand = Math.random() * 100;
        const dustChance = state.activeEvent === "aurora" ? 15.0 : state.activeEvent === "supernova" ? 15.0 : 10.0;
        if (dustRand < dustChance) {
          const isPhoenix = state.zodiac === "phoenix";
          const baseAmount = state.activeEvent === "supernova" ? 5 : 2;
          const amount = Math.ceil(baseAmount * (isPhoenix ? 1.50 : 1.0));
          state.glitterDust = (state.glitterDust || 0) + amount;
          postMessage({
            type: "COSMETIC_FOUND",
            text: `+${amount} Glitzerstaub ✨ (Zerlegt)`,
          });
        }
      }

      postMessage({
        type: "CLICK_EFFECT",
        actualClickLife,
        x: data.x,
        y: data.y,
      });

      addPlanetExp(actualClickXP);
      broadcastStateUpdate();
      break;
    }
    case "BUY_ANIMAL": {
      const { animalId, cost, countToBuy } = data;
      const amount = countToBuy || 1;
      if (state.life >= cost) {
        state.life -= cost;
        state.purchasedAnimals[animalId] = (state.purchasedAnimals[animalId] || 0) + amount;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "BUY_UPGRADES_BATCH": {
      const { upgradesList } = data; // Array of { id: string, cost: number, isGlitter: boolean }
      let updated = false;
      for (const item of upgradesList) {
        if (item.isGlitter) {
          if (state.glitterDust >= item.cost && !state.purchasedUpgrades.includes(item.id)) {
            state.glitterDust -= item.cost;
            state.purchasedUpgrades.push(item.id);
            updated = true;
          }
        } else {
          if (state.life >= item.cost && !state.purchasedUpgrades.includes(item.id)) {
            state.life -= item.cost;
            state.purchasedUpgrades.push(item.id);
            updated = true;
          }
        }
      }
      if (updated) {
        broadcastStateUpdate(true);
      }
      break;
    }
    case "BUY_STAR": {
      const { cost } = data;
      if (state.life >= cost) {
        state.life -= cost;
        state.starsCount += 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "BUY_UPGRADE": {
      const { id, cost } = data;
      if (state.life >= cost && !state.purchasedUpgrades.includes(id)) {
        state.life -= cost;
        state.purchasedUpgrades.push(id);
        broadcastStateUpdate(true);
      }
      break;
    }
    case "CHIPS_CHEAT": {
      // Rewards matching manual 'uguu' keypress
      state.life += 1000000;
      state.totalLifeEarned += 1000000;
      state.starsCount += 2;
      state.purchasedAnimals.bunny = (state.purchasedAnimals.bunny || 0) + 1;
      state.purchasedAnimals.chick = (state.purchasedAnimals.chick || 0) + 1;
      state.purchasedAnimals.cat = (state.purchasedAnimals.cat || 0) + 1;
      state.purchasedAnimals.frog = (state.purchasedAnimals.frog || 0) + 1;
      state.prestigeCount = (state.prestigeCount || 0) + 5;
      
      // Grant exactly 1 whole planet level
      state.planetLevel += 1;
      postMessage({
        type: "LEVEL_UP",
        level: state.planetLevel,
      });

      broadcastStateUpdate(true);
      break;
    }
    case "FORCE_TRIGGER_EVENT": {
      const { event } = data;
      state.activeEvent = event;
      state.activeEventDecision = "ignorieren";
      let duration = 120;
      if (state.purchasedUpgrades.includes("upg-event-duration")) {
        duration += 60;
      }
      duration += 60;
      state.eventTimeRemaining = duration;
      broadcastStateUpdate(true);
      break;
    }
    case "CRAFT_ITEM": {
      const { recipeId, count: rawCount } = data;
      const count = Math.max(1, Number(rawCount || 1));
      const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
      if (!recipe) break;

      const { life: reqLife, stars: reqStars, moons: reqMoons, glitter: reqGlitter, lootboxes: reqLootboxes, items: reqItems } = recipe.ingredients;

      // Check affordability for specified quantity
      let canCraft = true;
      if (reqLife && state.life < reqLife * count) canCraft = false;
      if (reqStars && state.starsCount < reqStars * count) canCraft = false;
      if (reqMoons && state.moonsCount < reqMoons * count) canCraft = false;
      if (reqGlitter && state.glitterDust < reqGlitter * count) canCraft = false;
      if (reqLootboxes && state.shootingStarsCount < reqLootboxes * count) canCraft = false;

      if (reqItems) {
        if (!state.craftedItems) state.craftedItems = {};
        for (const [itemId, qty] of Object.entries(reqItems)) {
          const owned = state.craftedItems[itemId] || 0;
          if (owned < qty * count) {
            canCraft = false;
            break;
          }
        }
      }

      if (canCraft) {
        // Subtract resources
        if (reqLife) state.life -= reqLife * count;
        if (reqStars) state.starsCount -= reqStars * count;
        if (reqMoons) state.moonsCount -= reqMoons * count;
        if (reqGlitter) state.glitterDust -= reqGlitter * count;
        if (reqLootboxes) state.shootingStarsCount -= reqLootboxes * count;

        if (reqItems) {
          for (const [itemId, qty] of Object.entries(reqItems)) {
            state.craftedItems[itemId] = (state.craftedItems[itemId] || 0) - (qty * count);
          }
        }

        // Add crafted item
        if (!state.craftedItems) state.craftedItems = {};
        const resultId = recipe.result.id;
        const totalQty = recipe.result.quantity * count;
        state.craftedItems[resultId] = (state.craftedItems[resultId] || 0) + totalQty;

        postMessage({
          type: "COSMETIC_FOUND",
          text: `Erfolgreich hergestellt: ${totalQty}x ${recipe.result.name} ${recipe.result.emoji}! 🔨`,
        });

        broadcastStateUpdate(true);
      }
      break;
    }
    case "USE_CRAFTED_ITEM": {
      const { itemId, count: requestedCount } = data;
      if (!state.craftedItems) state.craftedItems = {};
      const qty = state.craftedItems[itemId] || 0;
      const count = Math.min(requestedCount || 1, qty);
      if (count <= 0) break;

      // Deduct items
      state.craftedItems[itemId] = qty - count;

      // Initialize accumulated rewards
      let lifeGained = 0;
      let starsGained = 0;
      let moonsGained = 0;
      let glitterGained = 0;
      let lootboxesGained = 0;
      let xpGained = 0;
      let prestigeGained = 0;
      let unlockedCosmeticsList: { id: string; name: string; emoji: string; duplicateRefund: boolean }[] = [];
      let animalsSpawned: Record<string, number> = {};
      let eventsTriggered: string[] = [];

      // Determine item's name/emoji for summary
      const recipe = CRAFTING_RECIPES.find((r) => r.result.id === itemId);
      const itemName = recipe?.result.name || "Kreations-Gegenstand";
      const itemEmoji = recipe?.result.emoji || "🔮";

      for (let step = 0; step < count; step++) {
        if (itemId === "use_silver_schnuppe") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 6;
          lootboxesGained += 6;
        }
        else if (itemId === "use_deko_box") {
          const allCosmetics = COSMETIC_ITEMS.map((c) => c.id);
          const locked = allCosmetics.filter((id) => !state.unlockedCosmetics.includes(id));
          if (locked.length > 0) {
            const rolled = locked[Math.floor(Math.random() * locked.length)];
            state.unlockedCosmetics.push(rolled);
            const cosmeticObj = COSMETIC_ITEMS.find((c) => c.id === rolled);
            unlockedCosmeticsList.push({
              id: rolled,
              name: cosmeticObj?.germanName || rolled,
              emoji: cosmeticObj?.emoji || "🎁",
              duplicateRefund: false
            });
          } else {
            state.glitterDust = (state.glitterDust || 0) + 35;
            glitterGained += 35;
            unlockedCosmeticsList.push({
              id: `refund_glitter_35_${step}`,
              name: "Glitzerstaub-Erstattung",
              emoji: "✨",
              duplicateRefund: true
            });
          }
        }
        else if (itemId === "use_moon_blessing") {
          state.glitterDust = (state.glitterDust || 0) + 120;
          state.life += 25000000;
          state.totalLifeEarned += 25000000;
          state.starsCount += 5;
          glitterGained += 120;
          lifeGained += 25000000;
          starsGained += 5;
        }
        else if (itemId === "use_gold_schnuppe") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 15;
          state.glitterDust = (state.glitterDust || 0) + 200;
          lootboxesGained += 15;
          glitterGained += 200;
        }
        else if (itemId === "use_trig_supernova") {
          state.activeEvent = "supernova";
          state.eventTimeRemaining = 120;
          state.activeEventDecision = null;
          if (!eventsTriggered.includes("Goldene Supernova 💥")) {
            eventsTriggered.push("Goldene Supernova 💥");
          }
        }
        else if (itemId === "use_trig_aurora") {
          state.activeEvent = "aurora";
          state.eventTimeRemaining = 120;
          state.activeEventDecision = null;
          if (!eventsTriggered.includes("Aurora Borealis 🌌")) {
            eventsTriggered.push("Aurora Borealis 🌌");
          }
        }
        else if (itemId === "use_trig_meteor") {
          state.activeEvent = "meteors";
          state.eventTimeRemaining = 120;
          state.activeEventDecision = null;
          if (!eventsTriggered.includes("Meteoritenschauer ☄️")) {
            eventsTriggered.push("Meteoritenschauer ☄️");
          }
        }
        else if (itemId === "use_trig_stars") {
          state.activeEvent = "shooting_stars";
          state.eventTimeRemaining = 120;
          state.activeEventDecision = null;
          if (!eventsTriggered.includes("Mondnacht-Sternschnuppen 🌠")) {
            eventsTriggered.push("Mondnacht-Sternschnuppen 🌠");
          }
        }
        else if (itemId === "use_trig_blackhole") {
          state.activeEvent = "black_hole";
          state.eventTimeRemaining = 120;
          state.activeEventDecision = null;
          if (!eventsTriggered.includes("Schwarzes Loch 🕳️")) {
            eventsTriggered.push("Schwarzes Loch 🕳️");
          }
        }
        else if (itemId === "use_prisma_boxes") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 3;
          lootboxesGained += 3;
        }
        else if (itemId === "use_prestige_amulet") {
          state.prestigeCount = (state.prestigeCount || 0) + 1;
          prestigeGained += 1;
        }
        else if (itemId === "use_giga_life") {
          state.life += 150000000;
          state.totalLifeEarned += 150000000;
          lifeGained += 150000000;
        }
        else if (itemId === "use_peach_bless") {
          state.life += 5000000;
          state.totalLifeEarned += 5000000;
          state.starsCount += 15;
          lifeGained += 5000000;
          starsGained += 15;
        }
        else if (itemId === "use_animal_cookies") {
          if (state.purchasedAnimals) {
            for (const animalId of Object.keys(state.purchasedAnimals)) {
              if (state.purchasedAnimals[animalId] > 0) {
                state.purchasedAnimals[animalId] += 1;
                animalsSpawned[animalId] = (animalsSpawned[animalId] || 0) + 1;
              }
            }
          }
        }
        else if (itemId === "use_nebula_coffer") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 2;
          state.life += 120000;
          state.totalLifeEarned += 120000;
          lootboxesGained += 2;
          lifeGained += 120000;
        }
        else if (itemId === "use_star_shards") {
          state.starsCount += 12;
          starsGained += 12;
        }
        else if (itemId === "use_glitter_fountain") {
          state.glitterDust = (state.glitterDust || 0) + 85;
          glitterGained += 85;
        }
        else if (itemId === "use_xp_capsule") {
          addPlanetExp(15000);
          xpGained += 15000;
        }
        else if (itemId === "use_solar_flare_box") {
          state.life += 30000000;
          state.totalLifeEarned += 30000000;
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 4;
          lifeGained += 30000000;
          lootboxesGained += 4;
        }
        else if (itemId === "use_grav_shifter") {
          state.starsCount += 30;
          starsGained += 30;
        }
        else if (itemId === "use_time_booster") {
          const stats = getLpsAndStats();
          const earnings = stats.totalLps * 7200;
          state.life += earnings;
          state.totalLifeEarned += earnings;
          lifeGained += earnings;
        }
        else if (itemId === "use_luck_amulet") {
          const epicLegend = COSMETIC_ITEMS.filter((c) => c.rarity === "epic" || c.rarity === "legendary");
          const epLocked = epicLegend.filter((c) => !state.unlockedCosmetics.includes(c.id));
          if (epLocked.length > 0) {
            const rolled = epLocked[Math.floor(Math.random() * epLocked.length)];
            state.unlockedCosmetics.push(rolled.id);
            unlockedCosmeticsList.push({
              id: rolled.id,
              name: rolled.germanName || rolled.id,
              emoji: rolled.emoji || "🧿",
              duplicateRefund: false
            });
          } else {
            state.glitterDust = (state.glitterDust || 0) + 100;
            glitterGained += 100;
            unlockedCosmeticsList.push({
              id: `refund_glitter_100_${step}`,
              name: "Premium-Glitzerstaub-Erstattung",
              emoji: "✨",
              duplicateRefund: true
            });
          }
        }
        else if (itemId === "use_starlight_elixir") {
          state.life += 1000000;
          state.totalLifeEarned += 1000000;
          state.starsCount += 5;
          lifeGained += 1000000;
          starsGained += 5;
        }
        else if (itemId === "use_moon_dust_bag") {
          state.life += 30000;
          state.totalLifeEarned += 30000;
          state.glitterDust = (state.glitterDust || 0) + 15;
          lifeGained += 30000;
          glitterGained += 15;
        }
        else if (itemId === "use_core_drill") {
          state.life += 50050000;
          state.totalLifeEarned += 50050000;
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 3;
          lifeGained += 50050000;
          lootboxesGained += 3;
        }
        else if (itemId === "use_glitter_bomb") {
          state.glitterDust = (state.glitterDust || 0) + 50;
          glitterGained += 50;
        }
        else if (itemId === "use_phoenix_feather") {
          state.life += 10000000;
          state.totalLifeEarned += 10000000;
          state.glitterDust = (state.glitterDust || 0) + 25;
          lifeGained += 10000000;
          glitterGained += 25;
        }
        else if (itemId === "use_cosmic_compass") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 8;
          lootboxesGained += 8;
        }
        else if (itemId === "use_gravity_tea") {
          state.starsCount += 15;
          state.life += 15000000;
          state.totalLifeEarned += 15000000;
          starsGained += 15;
          lifeGained += 15000000;
        }
        else if (itemId === "use_wormhole_drive") {
          state.shootingStarsCount = (state.shootingStarsCount || 0) + 12;
          state.glitterDust = (state.glitterDust || 0) + 50;
          lootboxesGained += 12;
          glitterGained += 50;
        }
        else if (itemId === "use_nebula_honey") {
          state.life += 2500000;
          state.totalLifeEarned += 2500000;
          state.starsCount += 10;
          lifeGained += 2500000;
          starsGained += 10;
        }
        else if (itemId === "use_chrono_pendant") {
          const stats = getLpsAndStats();
          const earnings = stats.totalLps * 5 * 3600;
          state.life += earnings;
          state.totalLifeEarned += earnings;
          lifeGained += earnings;
        }
      }

      // Format custom notifications or log triggers
      let summaryText = "";
      if (count === 1) {
        summaryText = `${itemEmoji} ${itemName} geöffnet!`;
      } else {
        summaryText = `${count}x ${itemEmoji} ${itemName} geöffnet!`;
      }

      postMessage({
        type: "CRAFTED_ITEMS_OPENED",
        itemId,
        itemName,
        itemEmoji,
        count,
        rewards: {
          lifeGained,
          starsGained,
          moonsGained,
          glitterGained,
          lootboxesGained,
          xpGained,
          prestigeGained,
          unlockedCosmeticsList,
          animalsSpawned,
          eventsTriggered,
        },
        text: summaryText
      });

      broadcastStateUpdate(true);
      break;
    }
    case "RESET": {
      state = {
        life: 0,
        totalLifeEarned: 0,
        starsCount: 0,
        purchasedAnimals: {},
        purchasedUpgrades: [],
        planetLevel: 1,
        planetExp: 0,
        clicksCount: 0,
        starClicksTriggered: 0,
        secondsPlayed: 0,
        isNight: true,
        cycleProgress: 0,
        activeEvent: null,
        activeEventDecision: null,
        eventTimeRemaining: 120,
        prestigeCount: 0,
        moonsCount: 0,
        constellations: {},
        unlockedCosmetics: [],
        cosmeticRarityLevels: {},
        glitterDust: 0,
        shootingStarsCount: 0,
        blackHoleSize: 1,
        craftedItems: {},
        zodiac: "katze",
        galaxyShards: 0,
      };
      broadcastStateUpdate(true);
      break;
    }
    case "PRESTIGE": {
      const oldZodiac = state.zodiac;
      if (state.planetLevel >= 20) {
        state.galaxyShards = (state.galaxyShards || 0) + 1;
      }
      state.prestigeCount = (state.prestigeCount || 0) + 1;
      state.life = 0;
      state.totalLifeEarned = 0;
      state.starsCount = 0;
      state.purchasedAnimals = {};
      state.purchasedUpgrades = [];
      state.planetLevel = 1;
      state.planetExp = 0;
      state.clicksCount = 0;
      state.starClicksTriggered = 0;
      state.moonsCount = 0;
      state.constellations = {};
      state.zodiac = rollNewZodiac(oldZodiac);
      broadcastStateUpdate(true);
      break;
    }
    case "INVEST_CONSTELLATION": {
      const { constellationId, starsCost, moonsCost } = data;
      const currentLevel = state.constellations?.[constellationId] || 0;
      if (state.starsCount >= starsCost && (state.moonsCount || 0) >= moonsCost) {
        state.starsCount -= starsCost;
        if (moonsCost > 0) {
          state.moonsCount = (state.moonsCount || 0) - moonsCost;
        }
        if (!state.constellations) {
          state.constellations = {};
        }
        state.constellations[constellationId] = currentLevel + 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "MERGE_MOONS": {
      let maxMoons = 3;
      const upgrades = state.purchasedUpgrades || [];
      if (upgrades.includes("upg-moon-limit-1")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-2")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-3")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-4")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-5")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-6")) maxMoons++;
      if (upgrades.includes("upg-moon-limit-7")) maxMoons++;
      if (state.zodiac === "mond") maxMoons++;

      if (state.starsCount >= 50 && (state.moonsCount || 0) < maxMoons) {
        state.starsCount -= 50;
        state.moonsCount = (state.moonsCount || 0) + 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "SET_ZODIAC": {
      const { zodiacId } = data;
      state.zodiac = zodiacId;
      broadcastStateUpdate(true);
      break;
    }
    case "SET_NIGHT_CYCLE_FORCE": {
      state.isNight = data.isNight;
      state.cycleProgress = 0;
      broadcastStateUpdate();
      break;
    }
    case "ADD_GLITTER_DUST": {
      const { amount } = data;
      const phoenixMultiplier = state.zodiac === "phoenix" ? 1.50 : 1.0;
      state.glitterDust = (state.glitterDust || 0) + Math.ceil(Number(amount) * phoenixMultiplier);
      broadcastStateUpdate(true);
      break;
    }
    case "SPEND_GLITTER_DUST": {
      const { amount } = data;
      if (state.glitterDust >= amount) {
        state.glitterDust -= Number(amount);
        broadcastStateUpdate(true);
      }
      break;
    }
    case "BUY_UPGRADE_GLITTER": {
      const { id, cost } = data;
      if (state.glitterDust >= cost && !state.purchasedUpgrades.includes(id)) {
        state.glitterDust -= cost;
        state.purchasedUpgrades.push(id);
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UNLOCK_COSMETIC_DIRECT": {
      const { cosmeticId, cost } = data;
      if (state.glitterDust >= cost && !state.unlockedCosmetics.includes(cosmeticId)) {
        state.glitterDust -= cost;
        state.unlockedCosmetics.push(cosmeticId);
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UNLOCK_COSMETIC_LOOTBOX": {
      const { cosmeticId } = data;
      if (!state.unlockedCosmetics.includes(cosmeticId)) {
        state.unlockedCosmetics.push(cosmeticId);
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UPGRADE_COSMETIC_RARITY": {
      const { cosmeticId, targetRarity, cost } = data;
      if (state.glitterDust >= cost) {
        state.glitterDust -= cost;
        if (!state.cosmeticRarityLevels) {
          state.cosmeticRarityLevels = {};
        }
        state.cosmeticRarityLevels[cosmeticId] = targetRarity;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "SET_EVENT_DECISION": {
      const { decision } = data;
      const previous = state.activeEventDecision;
      state.activeEventDecision = decision;
      if (decision === "ignorieren" && previous !== "ignorieren") {
        state.eventTimeRemaining += 60;
      } else if (decision !== "ignorieren" && previous === "ignorieren") {
        state.eventTimeRemaining = Math.max(5, state.eventTimeRemaining - 60);
      }
      broadcastStateUpdate();
      break;
    }
    case "UPDATE_SHOOTING_STARS": {
      state.shootingStarsCount = data.count;
      broadcastStateUpdate();
      break;
    }
    case "BLACK_HOLE_GAMBLE": {
      const { sacrificeType } = data;
      let cost = 0;
      let ok = false;
      if (sacrificeType === "life") {
        // Sacrifice 50% of life, minimum 10 million
        cost = Math.floor(state.life * 0.50);
        if (cost < 10000000) cost = 10000000;
        if (state.life >= cost) {
          state.life -= cost;
          ok = true;
        }
      } else if (sacrificeType === "stars") {
        // Sacrifice 25% of stars, minimum 10
        cost = Math.ceil(state.starsCount * 0.25);
        if (cost < 10) cost = 10;
        if (state.starsCount >= cost) {
          state.starsCount -= cost;
          ok = true;
        }
      } else if (sacrificeType === "dust") {
        // Sacrifice 50% of glitter dust, minimum 10
        cost = Math.ceil((state.glitterDust || 0) * 0.50);
        if (cost < 10) cost = 10;
        if ((state.glitterDust || 0) >= cost) {
          state.glitterDust -= cost;
          ok = true;
        }
      }

      if (ok) {
        // Roll outcome with equal 5% chance (20 options: 0-9 good, 10-19 bad)
        const roll = Math.floor(Math.random() * 20);
        let titleGerman = "";
        let textGerman = "";
        let type: "good" | "bad" = "good";

        const stats = getLpsAndStats();
        const baseLps = stats.totalStarsLps || 100;
        const holeMultiplier = 1 + ((state.blackHoleSize || 1) - 1) * 0.25;

        switch (roll) {
          // --- GOOD OUTCOMES (0 to 9) ---
          case 0: { // RIESIGER BONUS
            type = "good";
            titleGerman = "Singularitäts-Segen 🌌";
            if (sacrificeType === "life") {
              const reward = Math.floor(baseLps * 12000 * holeMultiplier);
              state.life += reward;
              state.totalLifeEarned += reward;
              textGerman = `Das Schwarze Loch spuckt einen gewaltigen Lebensschwarm aus! Du erhältst +${reward.toLocaleString("de-DE")} 💖 Leben!`;
            } else if (sacrificeType === "stars") {
              const reward = Math.floor(50 * holeMultiplier);
              state.starsCount += reward;
              textGerman = `Eine stellare Explosion schleudert Edelsteine heraus! Du erhältst +${reward} ⭐ Sterne!`;
            } else {
              const reward = Math.floor(40 * holeMultiplier);
              state.glitterDust += reward;
              textGerman = `Ein Regen aus reinem Kristallstaub bricht aus! Du erhältst +${reward} 💫 Kosmischen Glitzerstaub!`;
            }
            break;
          }
          case 1: { // SELTENES COSMETIC
            type = "good";
            titleGerman = "Kosmischer Fund 🎁";
            const allPossible = [
              "star_pink", "acc_flower_crown", "moon_sakura",
              "star_cyber", "acc_space_glasses", "moon_cyber",
              "star_gold", "acc_star_crown", "moon_gold",
              "star_ghostly", "frame_ghost", "moon_ghost",
              "star_butterfly", "acc_butterfly_wings", "frame_butterfly", "moon_butterfly"
            ];
            const locked = allPossible.filter(id => !state.unlockedCosmetics.includes(id));
            if (locked.length > 0) {
              const chosenCosmeticId = locked[Math.floor(Math.random() * locked.length)];
              state.unlockedCosmetics.push(chosenCosmeticId);
              textGerman = `Ein schwebendes Artefakt nähert sich aus der dunklen Zone! Du schaltetest ein seltenes Cosmetic frei: "${chosenCosmeticId.replace(/_/g, " ").toUpperCase()}"! 🎨`;
            } else {
              const fallbackDust = Math.floor(75 * holeMultiplier);
              state.glitterDust += fallbackDust;
              textGerman = `Da du bereits alle Kosmetika besitzt, erstrahlt der Fund in reinem Glitzerstaub! Du erhältst +${fallbackDust} 💫 Glitzerstaub!`;
            }
            break;
          }
          case 2: { // PRESTIGE-WÄHRUNG
            type = "good";
            titleGerman = "Quanten-Aufstieg 🎖️";
            state.prestigeCount = (state.prestigeCount || 0) + 1;
            textGerman = "Eine geheimnisvolle Hyperdimension faltet sich! Du erhältst +1 dauerhaftes Prestige-Level OHNE dein aktuelles Spiel zurückzusetzen!";
            break;
          }
          case 3: { // EVENT SOFORT STARTEN
            type = "good";
            titleGerman = "Akkretions-Ausbruch 💥";
            // Note: Since the black hole collapses, starting a supernova replaces it immediately
            state.activeEvent = "supernova";
            state.activeEventDecision = "ignorieren";
            state.eventTimeRemaining = 180;
            textGerman = "Das Schwarze Loch destabilisiert sich und bricht in einer Supernova aus! Ein 180-sekündiges kosmisches Event hat sofort begonnen!";
            break;
          }
          case 4: { // SCHWARZES LOCH WIRD GRÖSSER
            type = "good";
            titleGerman = "Singularitäts-Wachstum 📈";
            state.blackHoleSize = (state.blackHoleSize || 1) + 1;
            textGerman = `Das Schwarze Loch verschlingt deine Opfergabe vollständig und dehnt seinen Ereignishorizont aus! Es wächst auf Stufe ${state.blackHoleSize}. Zukünftige gute Belohnungen steigen dauerhaft um +25%!`;
            break;
          }
          case 5: { // NEW GOOD 1: SHOOTING STARS GIFT
            type = "good";
            titleGerman = "Sternenregen-Symphonie 🌠";
            const rewardStars = Math.floor((3 + Math.floor(Math.random() * 5)) * holeMultiplier);
            state.shootingStarsCount = (state.shootingStarsCount || 0) + rewardStars;
            textGerman = `Eine harmonische Erschütterung lässt Sternenstaub kondensieren! Du erhältst +${rewardStars} 🌠 Sternschnuppen-Kisten im Inventar!`;
            break;
          }
          case 6: { // NEW GOOD 2: GLITTER EXPLO
            type = "good";
            titleGerman = "Glitzer-Explosion 💫";
            const rewardDust = Math.floor((20 + Math.floor(Math.random() * 25)) * holeMultiplier);
            state.glitterDust = (state.glitterDust || 0) + rewardDust;
            textGerman = `Die Singularität entlädt eine funkelnde Staubwolke! Du erhältst +${rewardDust} 💫 Kosmischen Glitzerstaub!`;
            break;
          }
          case 7: { // NEW GOOD 3: FREE MOON / STARS
            type = "good";
            titleGerman = "Mond-Fusion 🌕";
            let maxMoons = 3;
            const upgrades = state.purchasedUpgrades || [];
            if (upgrades.includes("upg-moon-limit-1")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-2")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-3")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-4")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-5")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-6")) maxMoons++;
            if (upgrades.includes("upg-moon-limit-7")) maxMoons++;
            if (state.zodiac === "mond") maxMoons++;

            if ((state.moonsCount || 0) < maxMoons) {
              state.moonsCount = (state.moonsCount || 0) + 1;
              textGerman = "Ein vollkommen intakter Trabant löst sich aus dem Gravitationsfeld! Du erhältst +1 🌙 Mond gratis!";
            } else {
              const fallbackStars = Math.floor(35 * holeMultiplier);
              state.starsCount = (state.starsCount || 0) + fallbackStars;
              textGerman = `Der Ereignishorizont versucht einen Mond abzuspalten, aber deine Umlaufbahnen sind voll! Stattdessen erhältst du +${fallbackStars} ⭐ Sterne!`;
            }
            break;
          }
          case 8: { // NEW GOOD 4: CHRONOS COMPENSATION
            type = "good";
            titleGerman = "Chronos-Kompensation ⏳";
            const reward = Math.floor(baseLps * 3600 * holeMultiplier);
            state.life += reward;
            state.totalLifeEarned += reward;
            textGerman = `Das Schwarze Loch krümmt die Zeitlinie positiv! Du erhältst die Ausbeute von 1 Stunde Slumber-Ruhe: +${reward.toLocaleString("de-DE")} 💖 Leben!`;
            break;
          }
          case 9: { // NEW GOOD 5: ASTRAL INFLUENCE
            type = "good";
            titleGerman = "Astral-Einfluss 🔮";
            const lifeReward = Math.floor(baseLps * 5000 * holeMultiplier);
            const starReward = Math.floor(12 * holeMultiplier);
            state.life += lifeReward;
            state.totalLifeEarned += lifeReward;
            state.starsCount += starReward;
            textGerman = `Die feindliche Gravitation harmonisiert mit deinen Upgrades! Du erhältst +${lifeReward.toLocaleString("de-DE")} 💖 Leben und +${starReward} ⭐ Sterne!`;
            break;
          }

          // --- BAD OUTCOMES (10 to 19) ---
          case 10: { // NICHTS PASSIERT
            type = "bad";
            titleGerman = "Ewiges Schweigen 🧘";
            textGerman = "Das Schwarze Loch absorbiert deine Opfergabe lautlos. Nichts passiert. Nur die eisige Kälte des ewigen Nichts vibriert im Raum...";
            break;
          }
          case 11: { // KATASTROPHALE VERLANGSAMUNG
            type = "bad";
            titleGerman = "Zeitdilatation ⏳";
            const starsLoss = Math.min(5, state.starsCount);
            state.starsCount -= starsLoss;
            const dustLoss = Math.min(10, state.glitterDust);
            state.glitterDust -= dustLoss;
            textGerman = `Eine massive Gravitationswelle verzerrt deine planetare Schwerkraft! Du verlierst zusätzlich ${starsLoss} Sterne und ${dustLoss} Glitzerstaub!`;
            break;
          }
          case 12: { // LEBENS-ABSORPTION
            type = "bad";
            titleGerman = "Materie-Verschlingung 🌀";
            const lifeLoss = Math.floor(state.life * 0.15);
            state.life -= lifeLoss;
            textGerman = `Der Gravitationsstrudel ergreift deinen Planeten! Er saugt zusätzlich ${lifeLoss.toLocaleString("de-DE")} 💖 Leben direkt aus deiner Planetenkruste!`;
            break;
          }
          case 13: { // STERNE-VERLUST
            type = "bad";
            titleGerman = "Sternen-Vakuum ✨";
            const sLoss = Math.min(8, state.starsCount);
            state.starsCount -= sLoss;
            textGerman = `Die unbarmherzige Anziehungskraft bricht Sterne aus ihrer Kreisbahn! ${sLoss} Sterne stürzen unaufhaltsam in den Abgrund der Singularität.`;
            break;
          }
          case 14: { // SCHWARZES LOCH SCHRUMPFT
            type = "bad";
            titleGerman = "Vakuum-Erosion 📉";
            const previousSize = state.blackHoleSize || 1;
            const newSize = Math.max(1, previousSize - 1);
            state.blackHoleSize = newSize;
            
            const lifeDrain = Math.floor(state.life * 0.05);
            state.life -= lifeDrain;
            
            if (previousSize > 1) {
              textGerman = `Das Schwarze Loch kollabiert unter seiner eigenen Last und schrumpft zurück auf Stufe ${newSize}! Du verlierst zudem ${lifeDrain.toLocaleString("de-DE")} 💖 Leben.`;
            } else {
              textGerman = `Das Schwarze Loch spuckt antimaterische Störstrahlung aus! Es kann nicht weiter schrumpfen, aber du verlierst zusätzliche ${lifeDrain.toLocaleString("de-DE")} 💖 Leben.`;
            }
            break;
          }
          case 15: { // NEW BAD 1: BLACK STORM
            type = "bad";
            titleGerman = "Schwarzer Kosmischer Sturm 🌪️";
            const dustLoss = Math.min(25, Math.floor((state.glitterDust || 0) * 0.40));
            if (dustLoss > 0) {
              state.glitterDust -= dustLoss;
              textGerman = `Ein hyperaktiver Gravitationssturm wirbelt deinen Staub auf! Du verlierst ${dustLoss} 💫 Glitzerstaub!`;
            } else {
              const lifeLoss = Math.floor(state.life * 0.08);
              state.life -= lifeLoss;
              textGerman = `Ein hyperaktiver Gravitationssturm hat keinen Staub gefunden! Er entzieht deinem Planeten stattdessen ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
            }
            break;
          }
          case 16: { // NEW BAD 2: EXP FREEZE
            type = "bad";
            titleGerman = "Schwerkraft-Paralyse 🧊";
            const expLoss = Math.floor(state.planetExp * 0.50);
            state.planetExp -= expLoss;
            textGerman = `Eine Gravitationsstarre friert die Entwicklung deines Planeten ein! Du verlierst ${expLoss.toLocaleString("de-DE")} Planeten-EXP (Halbierung des aktuellen Levels-Fortschritts).`;
            break;
          }
          case 17: { // NEW BAD 3: ANIMAL VANISH
            type = "bad";
            titleGerman = "Kosmisches Vergessen 🧠";
            let highestAnimal: string | null = null;
            let highestQty = 0;
            const animals = state.purchasedAnimals || {};
            for (const key of Object.keys(animals)) {
              if (animals[key] > highestQty) {
                highestQty = animals[key];
                highestAnimal = key;
              }
            }
            if (highestAnimal && highestQty > 0) {
              state.purchasedAnimals[highestAnimal]--;
              textGerman = `Das raue Gravitationsfeld verwirrt deine Biosphäre! Eines deiner wertvollen Tiere (${highestAnimal.toUpperCase()}) verschwindet im Hyperraum!`;
            } else {
              const lifeLoss = Math.min(state.life, 50000000);
              state.life -= lifeLoss;
              textGerman = `Das Gesetz der Schwerkraft dekomprimiert deine Planetenatmosphäre! Du verlierst ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
            }
            break;
          }
          case 18: { // NEW BAD 4: SHADOW THEFT
            type = "bad";
            titleGerman = "Schatten-Infiltration 👥";
            const starsLoss = Math.min(15, Math.floor(state.starsCount * 0.35));
            if (starsLoss > 0) {
              state.starsCount -= starsLoss;
              textGerman = `Eine schattenhafte Anomalie schlängelt sich durch den Horizont und stiehlt wertvolle Sternenkristalle! Du verlierst ${starsLoss} ⭐ Sterne.`;
            } else {
              const lifeLoss = Math.floor(state.life * 0.10);
              state.life -= lifeLoss;
              textGerman = `Eine schattenhafte Anomalie findet keine Sterne, entzieht dir aber ${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
            }
            break;
          }
          case 19: { // NEW BAD 5: MOON COMPRESSION
            type = "bad";
            titleGerman = "Heisenberg-Kompression 📉";
            if ((state.moonsCount || 0) > 0) {
              state.moonsCount--;
              textGerman = "Eine heisenbergsche Massenkompression bricht deinen instabilsten Trabanten auseinander! Du verlierst -1 🌙 Mond!";
            } else {
              const lifeLoss = Math.floor(state.life * 0.25);
              state.life -= lifeLoss;
              textGerman = `Eine heisenbergsche Massenkompression erschüttert den Planetenkern! Du verlierst -25% deines gesamten angesammelten Lebens: -${lifeLoss.toLocaleString("de-DE")} 💖 Leben!`;
            }
            break;
          }
        }

        // COLLAPSE THE BLACK HOLE IMMEDIATELY (Unless started another active event like supernova)
        if (state.activeEvent === "black_hole") {
          state.activeEvent = null;
          state.activeEventDecision = null;

          let waitDuration = 120;
          if (state.purchasedUpgrades.includes("upg-event-frequency")) {
            waitDuration = 70;
          }
          const constellPolarlichtLvl = state.constellations?.ewiges_polarlicht || 0;
          waitDuration = Math.round(waitDuration * (1 - constellPolarlichtLvl * 0.15));
          state.eventTimeRemaining = waitDuration;

          postMessage({
            type: "EVENT_TRIGGER",
            event: null,
            active: false,
          });
        }

        postMessage({
          type: "BLACK_HOLE_GAMBLE_RESULT",
          success: true,
          roll,
          outcomeType: type,
          title: titleGerman,
          text: textGerman,
        });

        broadcastStateUpdate(true);
      } else {
        postMessage({
          type: "BLACK_HOLE_GAMBLE_RESULT",
          success: false,
          error: "Nicht genügend Ressourcen für diese Opfergabe!",
        });
      }
      break;
    }
    case "CLEANUP": {
      stopTimers();
      break;
    }
    default:
      break;
  }
});
