import { CRAFTING_RECIPES } from "../data/recipes";
import { COSMETIC_ITEMS } from "../data/cosmetics";

export interface CraftedItemRewardResult {
  lifeGained: number;
  starsGained: number;
  moonsGained: number;
  glitterGained: number;
  lootboxesGained: number;
  xpGained: number;
  prestigeGained: number;
  unlockedCosmeticsList: { id: string; name: string; emoji: string; duplicateRefund: boolean }[];
  animalsSpawned: Record<string, number>;
  eventsTriggered: string[];
  summaryText: string;
}

/**
 * Executes item usage logic for a given crafted item. Modifies state in-place.
 */
export function handleUseCraftedItem(
  state: any,
  itemId: string,
  requestedCount: number,
  getLpsAndStats: (state: any) => any,
  setupActiveEvent: (eventId: string) => void,
  addPlanetExp: (amount: number) => void,
): CraftedItemRewardResult {
  if (!state.craftedItems) state.craftedItems = {};
  const qty = state.craftedItems[itemId] || 0;
  const count = Math.min(requestedCount || 1, qty);

  // Deduct items
  state.craftedItems[itemId] = qty - count;

  let lifeGained = 0;
  let starsGained = 0;
  const moonsGained = 0;
  let glitterGained = 0;
  let lootboxesGained = 0;
  let xpGained = 0;
  let prestigeGained = 0;
  const unlockedCosmeticsList: {
    id: string;
    name: string;
    emoji: string;
    duplicateRefund: boolean;
  }[] = [];
  const animalsSpawned: Record<string, number> = {};
  const eventsTriggered: string[] = [];

  const recipe = CRAFTING_RECIPES.find((r) => r.result.id === itemId);
  const itemName = recipe?.result.name || "Kreations-Gegenstand";
  const itemEmoji = recipe?.result.emoji || "🔮";

  for (let step = 0; step < count; step++) {
    if (itemId === "use_silver_schnuppe") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 6;
      lootboxesGained += 6;
    } else if (itemId === "use_deko_box") {
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
          duplicateRefund: false,
        });
      } else {
        state.glitterDust = (state.glitterDust || 0) + 35;
        glitterGained += 35;
        unlockedCosmeticsList.push({
          id: `refund_glitter_35_${step}`,
          name: "Glitzerstaub-Erstattung",
          emoji: "✨",
          duplicateRefund: true,
        });
      }
    } else if (itemId === "use_moon_blessing") {
      state.glitterDust = (state.glitterDust || 0) + 120;
      state.life += 25000000;
      state.totalLifeEarned += 25000000;
      state.starsCount += 5;
      glitterGained += 120;
      lifeGained += 25000000;
      starsGained += 5;
    } else if (itemId === "use_gold_schnuppe") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 15;
      state.glitterDust = (state.glitterDust || 0) + 200;
      lootboxesGained += 15;
      glitterGained += 200;
    } else if (itemId === "use_trig_supernova") {
      setupActiveEvent("hyper_star");
      state.eventTimeRemaining = 120;
      if (!eventsTriggered.includes("Energetischer Helio-Sturm 💥")) {
        eventsTriggered.push("Energetischer Helio-Sturm 💥");
      }
    } else if (itemId === "use_trig_aurora") {
      setupActiveEvent("nebula_cloud");
      state.eventTimeRemaining = 120;
      if (!eventsTriggered.includes("Interstellare Nebelwolke ☁️")) {
        eventsTriggered.push("Interstellare Nebelwolke ☁️");
      }
    } else if (itemId === "use_trig_meteor") {
      setupActiveEvent("comet_tail");
      state.eventTimeRemaining = 120;
      if (!eventsTriggered.includes("Eisiger Kometenschweif ☄️")) {
        eventsTriggered.push("Eisiger Kometenschweif ☄️");
      }
    } else if (itemId === "use_trig_stars") {
      setupActiveEvent("stella_nursery");
      state.eventTimeRemaining = 120;
      if (!eventsTriggered.includes("Kosmische Sternenwiege 🍼")) {
        eventsTriggered.push("Kosmische Sternenwiege 🍼");
      }
    } else if (itemId === "use_trig_blackhole") {
      state.activeEvent = "black_hole";
      state.eventTimeRemaining = 120;
      state.activeEventDecision = null;
      if (!eventsTriggered.includes("Schwarzes Loch 🕳️")) {
        eventsTriggered.push("Schwarzes Loch 🕳️");
      }
    } else if (itemId === "use_prisma_boxes") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 3;
      lootboxesGained += 3;
    } else if (itemId === "use_prestige_amulet") {
      state.prestigeCount = (state.prestigeCount || 0) + 1;
      prestigeGained += 1;
    } else if (itemId === "use_giga_life") {
      state.life += 150000000;
      state.totalLifeEarned += 150000000;
      lifeGained += 150000000;
    } else if (itemId === "use_peach_bless") {
      state.life += 5000000;
      state.totalLifeEarned += 5000000;
      state.starsCount += 15;
      lifeGained += 5000000;
      starsGained += 15;
    } else if (itemId === "use_animal_cookies") {
      if (state.purchasedAnimals) {
        for (const animalId of Object.keys(state.purchasedAnimals)) {
          if (state.purchasedAnimals[animalId] > 0) {
            state.purchasedAnimals[animalId] += 1;
            animalsSpawned[animalId] = (animalsSpawned[animalId] || 0) + 1;
          }
        }
      }
    } else if (itemId === "use_nebula_coffer") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 2;
      state.life += 120000;
      state.totalLifeEarned += 120000;
      lootboxesGained += 2;
      lifeGained += 120000;
    } else if (itemId === "use_star_shards") {
      state.starsCount += 12;
      starsGained += 12;
    } else if (itemId === "use_glitter_fountain") {
      state.glitterDust = (state.glitterDust || 0) + 85;
      glitterGained += 85;
    } else if (itemId === "use_xp_capsule") {
      addPlanetExp(15000);
      xpGained += 15000;
    } else if (itemId === "use_solar_flare_box") {
      state.life += 30000000;
      state.totalLifeEarned += 30000000;
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 4;
      lifeGained += 30000000;
      lootboxesGained += 4;
    } else if (itemId === "use_grav_shifter") {
      state.starsCount += 30;
      starsGained += 30;
    } else if (itemId === "use_time_booster") {
      const stats = getLpsAndStats(state);
      const earnings = stats.totalLps * 7200;
      state.life += earnings;
      state.totalLifeEarned += earnings;
      lifeGained += earnings;
    } else if (itemId === "use_luck_amulet") {
      const epicLegend = COSMETIC_ITEMS.filter(
        (c) => c.rarity === "epic" || c.rarity === "legendary",
      );
      const epLocked = epicLegend.filter((c) => !state.unlockedCosmetics.includes(c.id));
      if (epLocked.length > 0) {
        const rolled = epLocked[Math.floor(Math.random() * epLocked.length)];
        state.unlockedCosmetics.push(rolled.id);
        unlockedCosmeticsList.push({
          id: rolled.id,
          name: rolled.germanName || rolled.id,
          emoji: rolled.emoji || "🧿",
          duplicateRefund: false,
        });
      } else {
        state.glitterDust = (state.glitterDust || 0) + 100;
        glitterGained += 100;
        unlockedCosmeticsList.push({
          id: `refund_glitter_100_${step}`,
          name: "Premium-Glitzerstaub-Erstattung",
          emoji: "✨",
          duplicateRefund: true,
        });
      }
    } else if (itemId === "use_starlight_elixir") {
      state.life += 1000000;
      state.totalLifeEarned += 1000000;
      state.starsCount += 5;
      lifeGained += 1000000;
      starsGained += 5;
    } else if (itemId === "use_moon_dust_bag") {
      state.life += 30000;
      state.totalLifeEarned += 30000;
      state.glitterDust = (state.glitterDust || 0) + 15;
      lifeGained += 30000;
      glitterGained += 15;
    } else if (itemId === "use_core_drill") {
      state.life += 50050000;
      state.totalLifeEarned += 50050000;
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 3;
      lifeGained += 50050000;
      lootboxesGained += 3;
    } else if (itemId === "use_glitter_bomb") {
      state.glitterDust = (state.glitterDust || 0) + 50;
      glitterGained += 50;
    } else if (itemId === "use_phoenix_feather") {
      state.life += 10000000;
      state.totalLifeEarned += 10000000;
      state.glitterDust = (state.glitterDust || 0) + 25;
      lifeGained += 10000000;
      glitterGained += 25;
    } else if (itemId === "use_cosmic_compass") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 8;
      lootboxesGained += 8;
    } else if (itemId === "use_gravity_tea") {
      state.starsCount += 15;
      state.life += 15000000;
      state.totalLifeEarned += 15000000;
      starsGained += 15;
      lifeGained += 15000000;
    } else if (itemId === "use_wormhole_drive") {
      state.shootingStarsCount = (state.shootingStarsCount || 0) + 12;
      state.glitterDust = (state.glitterDust || 0) + 50;
      lootboxesGained += 12;
      glitterGained += 50;
    } else if (itemId === "use_nebula_honey") {
      state.life += 2500000;
      state.totalLifeEarned += 2500000;
      state.starsCount += 10;
      lifeGained += 2500000;
      starsGained += 10;
    } else if (itemId === "use_chrono_pendant") {
      const stats = getLpsAndStats(state);
      const earnings = stats.totalLps * 5 * 3600;
      state.life += earnings;
      state.totalLifeEarned += earnings;
      lifeGained += earnings;
    }
  }

  const summaryText =
    count === 1
      ? `${itemEmoji} ${itemName} geöffnet!`
      : `${count}x ${itemEmoji} ${itemName} geöffnet!`;

  return {
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
    summaryText,
  };
}
