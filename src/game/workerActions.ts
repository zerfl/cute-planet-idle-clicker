import { PlanetTask, ActiveCosmicEvent } from "../types";
import { INITIAL_ANIMALS } from "../data";
import { CRAFTING_RECIPES } from "../data/recipes";
import { resolve, RECIPE_BY_RESULT, getItem } from "../data/craftingGraph";
import { expForLevel, EXP_PER_LEVEL } from "./engine";
import { rollTaskForLevel } from "./planetTasks";
import { handleUseCraftedItem } from "./itemHandlers";
import { executeBlackHoleGamble } from "./blackHoleGamble";
import { formatCompactNumber } from "./achievements";
import type { WorkerCommand, WorkerEvent, WorkerGameState, StatsResult } from "./protocol";

export interface WorkerActionHelpers {
  getLpsAndStats: () => StatsResult;
  addPlanetExp: (qty: number) => void;
  setupActiveEvent: (event?: string | null) => void;
  updateTaskProgress: (type: string, amount: number) => void;
  broadcastStateUpdate: (forceRecalc?: boolean) => void;
  rollNewZodiac: (exclude?: string) => string;
  emit: (event: WorkerEvent) => void;
  stopTimers: () => void;
}

export function handleWorkerAction(
  data: WorkerCommand,
  state: WorkerGameState,
  helpers: WorkerActionHelpers,
): void {
  const {
    getLpsAndStats,
    addPlanetExp,
    setupActiveEvent,
    updateTaskProgress,
    broadcastStateUpdate,
    rollNewZodiac,
    emit,
    stopTimers,
  } = helpers;

  switch (data.type) {
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
        const doubleStellarLvl = state.doubleStellarLevel || 0;
        const amountGained = doubleStellarLvl > 0 && Math.random() < doubleStellarLvl * 0.1 ? 2 : 1;
        state.starsCount += amountGained;
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
      state.life += 1000000;
      state.totalLifeEarned += 1000000;
      state.starsCount += 2;
      state.purchasedAnimals.bunny = (state.purchasedAnimals.bunny || 0) + 1;
      state.purchasedAnimals.chick = (state.purchasedAnimals.chick || 0) + 1;
      state.purchasedAnimals.cat = (state.purchasedAnimals.cat || 0) + 1;
      state.purchasedAnimals.frog = (state.purchasedAnimals.frog || 0) + 1;
      state.prestigeCount = (state.prestigeCount || 0) + 5;

      state.planetLevel += 1;
      emit({
        type: "LEVEL_UP",
        level: state.planetLevel,
      });

      broadcastStateUpdate(true);
      break;
    }
    case "SET_PLANET_LEVEL": {
      const level = Math.min(20, Math.max(1, Math.trunc(data.level)));
      if (!Number.isFinite(level)) {
        break;
      }

      state.planetLevel = level;
      state.planetExp = 0;
      state.planetTask = rollTaskForLevel(level, state.prestigeCount || 0, INITIAL_ANIMALS);

      broadcastStateUpdate(true);
      break;
    }
    case "FORCE_TRIGGER_EVENT": {
      const { event } = data;
      setupActiveEvent(event);
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

      const {
        life: reqLife,
        stars: reqStars,
        moons: reqMoons,
        glitter: reqGlitter,
        lootboxes: reqLootboxes,
        items: reqItems,
      } = recipe.ingredients;

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
        if (reqLife) state.life -= reqLife * count;
        if (reqStars) state.starsCount -= reqStars * count;
        if (reqMoons) state.moonsCount -= reqMoons * count;
        if (reqGlitter) state.glitterDust -= reqGlitter * count;
        if (reqLootboxes) state.shootingStarsCount -= reqLootboxes * count;

        if (reqItems) {
          for (const [itemId, qty] of Object.entries(reqItems)) {
            state.craftedItems[itemId] = (state.craftedItems[itemId] || 0) - qty * count;
          }
        }

        if (!state.craftedItems) state.craftedItems = {};
        const resultId = recipe.result.id;
        const totalQty = recipe.result.quantity * count;
        state.craftedItems[resultId] = (state.craftedItems[resultId] || 0) + totalQty;

        updateTaskProgress("crafting", count);

        emit({
          type: "COSMETIC_FOUND",
          text: `Erfolgreich hergestellt: ${totalQty}x ${recipe.result.name} ${recipe.result.emoji}! 🔨`,
        });

        broadcastStateUpdate(true);
      }
      break;
    }
    case "CRAFT_RECURSIVE": {
      const { targetItemId, count: rawCountR } = data;
      const countR = Math.max(1, Number(rawCountR || 1));
      if (!state.craftedItems) state.craftedItems = {};

      const haveR: Record<string, number> = {
        life: state.life,
        stars: state.starsCount,
        moons: state.moonsCount,
        glitter: state.glitterDust,
        lootboxes: state.shootingStarsCount,
        ...state.craftedItems,
      };

      const { plan: planR, ok: okR } = resolve(targetItemId, countR, haveR);
      if (!okR) break;

      for (const step of planR) {
        const recipe = RECIPE_BY_RESULT.get(step.id);
        if (!recipe) continue;
        const {
          life: rl,
          stars: rs,
          moons: rm,
          glitter: rg,
          lootboxes: rlb,
          items: ri,
        } = recipe.ingredients;
        const ops = step.ops;
        if (rl) state.life -= rl * ops;
        if (rs) state.starsCount -= rs * ops;
        if (rm) state.moonsCount -= rm * ops;
        if (rg) state.glitterDust -= rg * ops;
        if (rlb) state.shootingStarsCount -= rlb * ops;
        if (ri) {
          for (const [iid, iqty] of Object.entries(ri)) {
            state.craftedItems[iid] = (state.craftedItems[iid] || 0) - iqty * ops;
          }
        }
        state.craftedItems[step.id] = (state.craftedItems[step.id] || 0) + step.produces;
      }

      let totalCraftOps = 0;
      for (const step of planR) {
        totalCraftOps += step.ops;
      }
      updateTaskProgress("crafting", totalCraftOps);

      const targetItemInfo = getItem(targetItemId);
      emit({
        type: "COSMETIC_FOUND",
        text: `Auto-geschmiedet: ${countR}x ${targetItemInfo.name} ${targetItemInfo.emoji}! 🔨`,
      });
      broadcastStateUpdate(true);
      break;
    }
    case "USE_CRAFTED_ITEM": {
      const { itemId, count: requestedCount } = data;
      const res = handleUseCraftedItem(
        state,
        itemId,
        requestedCount,
        getLpsAndStats,
        setupActiveEvent,
        addPlanetExp,
      );

      emit({
        type: "CRAFTED_ITEMS_OPENED",
        itemId,
        count: requestedCount,
        rewards: {
          lifeGained: res.lifeGained,
          starsGained: res.starsGained,
          moonsGained: res.moonsGained,
          glitterGained: res.glitterGained,
          lootboxesGained: res.lootboxesGained,
          xpGained: res.xpGained,
          prestigeGained: res.prestigeGained,
          unlockedCosmeticsList: res.unlockedCosmeticsList,
          animalsSpawned: res.animalsSpawned,
          eventsTriggered: res.eventsTriggered,
        },
        text: res.summaryText,
      });

      broadcastStateUpdate(true);
      break;
    }
    case "RESET": {
      Object.assign(state, {
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
        zodiacLevels: {},
        slummerGlassLevel: 1,
        catalystLevel: 0,
        doubleStellarLevel: 0,
        glitchCooldown: false,
      });
      broadcastStateUpdate(true);
      break;
    }
    case "ENTER_GLITCH_GALAXY": {
      state.inGlitchGalaxy = true;
      state.unlockedGlitchGalaxy = true;
      state.glitchPending = false;
      const oldZodiac = state.zodiac;
      Object.assign(state, {
        life: 0,
        totalLifeEarned: 0,
        starsCount: 0,
        purchasedAnimals: {},
        purchasedUpgrades: [],
        planetLevel: 1,
        planetExp: 0,
        clicksCount: 0,
        starClicksTriggered: 0,
        moonsCount: 0,
        constellations: {},
        zodiac: rollNewZodiac(oldZodiac),
      });
      broadcastStateUpdate(true);
      break;
    }
    case "REPAIR_GLITCH_GALAXY": {
      state.inGlitchGalaxy = false;
      state.glitchPending = false;
      // Start the cooldown: the player must complete at least one normal galaxy
      // voyage (PRESTIGE) before another glitch galaxy can trigger, so it never
      // re-fires on the very next level 20.
      state.glitchCooldown = true;
      state.galaxyShards = (state.galaxyShards || 0) + 2;
      state.glitterDust = (state.glitterDust || 0) + 77;
      state.prestigeCount = (state.prestigeCount || 0) + 1;

      state.glitchBenchmarks = {
        prestigeTarget: (state.prestigeCount || 0) + 10,
        stardustTarget: (state.craftedItems?.["mat_stardust"] || 0) + 150,
        shardsTarget: (state.galaxyShards || 0) + (state.spentGalaxyShards || 0) + 10,
        phoenixTarget: (state.purchasedAnimals?.["phoenix"] || 0) + 5,
        glitterTarget: (state.glitterDust || 0) + 150,
      };

      const oldZodiac = state.zodiac;
      Object.assign(state, {
        life: 0,
        totalLifeEarned: 0,
        starsCount: 0,
        purchasedAnimals: {},
        purchasedUpgrades: [],
        planetLevel: 1,
        planetExp: 0,
        clicksCount: 0,
        starClicksTriggered: 0,
        moonsCount: 0,
        constellations: {},
        zodiac: rollNewZodiac(oldZodiac),
        placedAnimals: [],
        animalLove: {},
        animalLastPet: {},
        bowlLastFed: 0,
        bowlFedMinutesCredited: 0,
      });
      broadcastStateUpdate(true);
      break;
    }
    case "PRESTIGE": {
      const oldZodiac = state.zodiac;
      if (state.planetLevel >= 20) {
        state.galaxyShards = (state.galaxyShards || 0) + 1;
      }
      state.prestigeCount = (state.prestigeCount || 0) + 1;
      // A completed normal galaxy voyage clears the post-repair glitch cooldown.
      state.glitchCooldown = false;

      // NOTE: a normal prestige must NOT touch glitchBenchmarks. Recomputing the
      // targets to "current amount + margin" on every prestige kept them forever
      // ahead of the player, so the glitch galaxy could never trigger. Benchmarks
      // are seeded once (default) and only escalated on REPAIR_GLITCH_GALAXY.

      Object.assign(state, {
        life: 0,
        totalLifeEarned: 0,
        starsCount: 0,
        purchasedAnimals: {},
        purchasedUpgrades: [],
        planetLevel: 1,
        planetExp: 0,
        clicksCount: 0,
        starClicksTriggered: 0,
        moonsCount: 0,
        constellations: {},
        zodiac: rollNewZodiac(oldZodiac),
        placedAnimals: [],
        animalLove: {},
        animalLastPet: {},
        bowlLastFed: 0,
        bowlFedMinutesCredited: 0,
      });
      broadcastStateUpdate(true);
      break;
    }
    case "UPGRADE_ZODIAC_LEVEL": {
      const { id, cost } = data;
      if ((state.galaxyShards || 0) >= cost) {
        state.galaxyShards = (state.galaxyShards || 0) - cost;
        state.spentGalaxyShards = (state.spentGalaxyShards || 0) + cost;
        if (!state.zodiacLevels) {
          state.zodiacLevels = {};
        }
        state.zodiacLevels[id] = (state.zodiacLevels[id] || 1) + 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UPGRADE_SLUMMER_GLASS": {
      const { cost } = data;
      if ((state.galaxyShards || 0) >= cost) {
        state.galaxyShards = (state.galaxyShards || 0) - cost;
        state.spentGalaxyShards = (state.spentGalaxyShards || 0) + cost;
        state.slummerGlassLevel = (state.slummerGlassLevel || 1) + 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UPGRADE_CATALYST": {
      const { cost } = data;
      if ((state.galaxyShards || 0) >= cost) {
        state.galaxyShards = (state.galaxyShards || 0) - cost;
        state.spentGalaxyShards = (state.spentGalaxyShards || 0) + cost;
        state.catalystLevel = (state.catalystLevel || 0) + 1;
        broadcastStateUpdate(true);
      }
      break;
    }
    case "UPGRADE_DOUBLE_STELLAR": {
      const { cost } = data;
      if ((state.galaxyShards || 0) >= cost) {
        state.galaxyShards = (state.galaxyShards || 0) - cost;
        state.spentGalaxyShards = (state.spentGalaxyShards || 0) + cost;
        state.doubleStellarLevel = (state.doubleStellarLevel || 0) + 1;
        broadcastStateUpdate(true);
      }
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
        updateTaskProgress("merge_moons", 1);
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
      let { amount } = data;
      const doubleStellarLvl = state.doubleStellarLevel || 0;
      if (doubleStellarLvl > 0 && Math.random() < doubleStellarLvl * 0.1) {
        amount = amount * 2;
      }

      const phoenixLvl = state.zodiacLevels?.phoenix || 1;
      const phoenixMultiplier = state.zodiac === "phoenix" ? 1.5 + (phoenixLvl - 1) * 0.15 : 1.0;
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

      if (state.activeEventInstantClaimed) {
        break;
      }

      state.activeEventDecision = decision;

      if (state.activeEvent && state.activeEventDetails && decision && decision !== "ignorieren") {
        const option = state.activeEventDetails.options.find((o: any) => o.id === decision);
        if (option && !state.activeEventInstantClaimed) {
          const eff = option.effectType;
          let rewardDesc = "";
          let claimed = false;

          if (eff === "instant_stars" && option.bonusStars !== undefined) {
            const amount = option.bonusStars;
            state.starsCount += amount;
            rewardDesc = `+${amount} ⭐ Sterne erhalten!`;
            claimed = true;
          } else if (eff === "instant_dust" && option.bonusDust !== undefined) {
            const amount = option.bonusDust;
            state.glitterDust += amount;
            rewardDesc = `+${amount} ✨ Glitzerstaub erhalten!`;
            claimed = true;
          } else if (eff === "instant_moons" && option.bonusMoons !== undefined) {
            const amount = option.bonusMoons;
            state.moonsCount = (state.moonsCount || 0) + amount;
            rewardDesc = `+${amount} 🌙 Mond(e) erhalten!`;
            claimed = true;
          } else if (eff === "instant_life" && option.bonusLife !== undefined) {
            const amount = option.bonusLife;
            state.life += amount;
            state.totalLifeEarned += amount;
            rewardDesc = `+${formatCompactNumber(amount)} Lebenskraft erhalten!`;
            claimed = true;
          } else if (
            eff === "instant_hybrid" &&
            option.bonusDust !== undefined &&
            option.bonusStars !== undefined
          ) {
            state.starsCount += option.bonusStars;
            state.glitterDust += option.bonusDust;
            rewardDesc = `+${option.bonusStars} ⭐ Sterne und +${option.bonusDust} ✨ Glitzerstaub erhalten!`;
            claimed = true;
          } else if (eff.startsWith("instant_stars_")) {
            const amount = parseInt(eff.replace("instant_stars_", ""), 10) || 10;
            state.starsCount += amount;
            rewardDesc = `+${amount} ⭐ Sterne erhalten!`;
            claimed = true;
          } else if (eff.startsWith("instant_dust_")) {
            const amount = parseInt(eff.replace("instant_dust_", ""), 10) || 5;
            state.glitterDust += amount;
            rewardDesc = `+${amount} ✨ Glitzerstaub erhalten!`;
            claimed = true;
          } else if (eff.startsWith("instant_moons_")) {
            const amount = parseInt(eff.replace("instant_moons_", ""), 10) || 1;
            state.moonsCount = (state.moonsCount || 0) + amount;
            rewardDesc = `+${amount} 🌙 Mond(e) erhalten!`;
            claimed = true;
          } else if (eff.startsWith("instant_life_")) {
            const minStr = eff.replace("instant_life_", "").replace("m", "");
            const minutes = parseInt(minStr, 10) || 5;
            const currentLps = getLpsAndStats().totalLps;
            const rewardLife = currentLps * minutes * 60;
            state.life += rewardLife;
            state.totalLifeEarned += rewardLife;
            rewardDesc = `+${formatCompactNumber(rewardLife)} Lebenskraft erhalten (Produktion von ${minutes}m)!`;
            claimed = true;
          } else if (eff === "instant_hybrid_dust_stars") {
            state.starsCount += 50;
            state.glitterDust += 20;
            rewardDesc = `+50 ⭐ Sterne und +20 ✨ Glitzerstaub erhalten!`;
            claimed = true;
          }

          if (claimed) {
            state.activeEventInstantClaimed = true;
            state.eventTimeRemaining = Math.min(5, state.eventTimeRemaining);
            emit({
              type: "COSMETIC_FOUND",
              text: `${rewardDesc} 🎉`,
            });
          }
        }
      }

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
    case "MISSION_CLAIMED": {
      updateTaskProgress("missions_completed", 1);
      break;
    }
    case "BLACK_HOLE_GAMBLE": {
      const { sacrificeType } = data;
      const res = executeBlackHoleGamble(state, sacrificeType, getLpsAndStats, setupActiveEvent);

      if (res.success) {
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

          emit({
            type: "EVENT_TRIGGER",
            event: null,
            active: false,
          });
        }

        emit({
          type: "BLACK_HOLE_GAMBLE_RESULT",
          success: true,
          roll: res.roll,
          outcomeType: res.outcomeType,
          title: res.title,
          text: res.text,
        });

        broadcastStateUpdate(true);
      } else {
        emit({
          type: "BLACK_HOLE_GAMBLE_RESULT",
          success: false,
          error: res.error,
        });
      }
      break;
    }
    case "PAUSE_TIMERS": {
      stopTimers();
      break;
    }
    case "CLEANUP": {
      stopTimers();
      break;
    }
    default:
      return;
  }
}
