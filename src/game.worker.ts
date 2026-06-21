import { INITIAL_ANIMALS } from "./data";
import { COSMETIC_ITEMS } from "./data/cosmetics";
import { CRAFTING_RECIPES } from "./data/recipes";
import { resolve, RECIPE_BY_RESULT, getItem } from "./data/craftingGraph";
import { ZODIACS } from "./data/zodiacs";
import { computeLevelUpResult, expForLevel, EXP_PER_LEVEL } from "./game/engine";
import { rollTaskForLevel } from "./game/planetTasks";
import { COSMIC_EVENTS_POOL } from "./data/cosmicEvents";
import { getLpsAndStats as calcLpsAndStats } from "./game/statsCalculator";
import { generateAchievements as calcAchievements, formatCompactNumber } from "./game/achievements";
import { handleUseCraftedItem } from "./game/itemHandlers";
import { executeBlackHoleGamble } from "./game/blackHoleGamble";
import { handleWorkerAction } from "./game/workerActions";
import { DEFAULT_GLITCH_BENCHMARKS, hasReachedGlitchMilestone } from "./game/glitchGalaxy";
import type {
  WorkerCommand,
  WorkerEvent,
  WorkerGameState,
  StateUpdateEvent,
} from "./game/protocol";

/** Typed wrapper around the worker's global postMessage. */
function emit(event: WorkerEvent) {
  postMessage(event);
}

function getLpsAndStats() {
  return calcLpsAndStats(state);
}

function generateAchievements() {
  return calcAchievements(state);
}

// Default initial state
let state: WorkerGameState = {
  life: 0,
  totalLifeEarned: 0,
  starsCount: 0,
  purchasedAnimals: {},
  purchasedUpgrades: [],
  planetLevel: 1,
  planetExp: 0,
  planetTask: undefined,
  clicksCount: 0,
  starClicksTriggered: 0,
  secondsPlayed: 0,
  isNight: true,
  cycleProgress: 0,
  activeEvent: null,
  activeEventDecision: null,
  activeEventDetails: null,
  activeEventInstantClaimed: false,
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
  inGlitchGalaxy: false,
  glitchPending: false,
  unlockedGlitchGalaxy: false,
  spentGalaxyShards: 0,
};

// Timers refs
let gameTimerId: any = null;
// Timestamp when the tab was hidden (for batched catch-up on resume)
let hiddenAt: number | null = null;

// Roll helper to guarantee never calling the same zodiac twice in a row
function rollNewZodiac(currentId?: string): string {
  const eligible = currentId ? ZODIACS.filter((z) => z.id !== currentId) : ZODIACS;
  if (eligible.length === 0) return ZODIACS[0].id;
  const picked = eligible[Math.floor(Math.random() * eligible.length)];
  return picked.id;
}

function checkGlitchGalaxyTrigger() {
  if (state.inGlitchGalaxy || state.glitchPending) return;

  // The glitch galaxy is offered at the level-20 voyage gate, in place of a
  // normal galaxy voyage. Below level 20 there is no voyage to replace.
  if ((state.planetLevel || 0) < 20) return;

  // Seed the fixed first-time benchmarks once; they are only escalated when a
  // glitch galaxy is repaired, never on a normal prestige.
  if (!state.glitchBenchmarks) {
    state.glitchBenchmarks = { ...DEFAULT_GLITCH_BENCHMARKS };
  }

  // Eligible the moment ANY single milestone is reached — fire deterministically.
  if (hasReachedGlitchMilestone(state)) {
    state.glitchPending = true;
    broadcastStateUpdate(true);
  }
}
let secondaryTimerId: any = null;
let starTimerId: any = null;
let cycleTimerId: any = null;
let eventTimerId: any = null;

// --- Task-Based Progressive Leveling System ---
let secondsNoClick = 0;
let lastCheckedGlitter = 0;
let lastCheckedStars = 0;
let isSyncing = false;

function checkPlanetLevelUp() {
  if (!state.planetTask) return;
  if (state.planetTask.progress >= state.planetTask.target) {
    state.planetLevel += 1;
    state.planetTask = rollTaskForLevel(
      state.planetLevel,
      state.prestigeCount || 0,
      INITIAL_ANIMALS,
    );
    secondsNoClick = 0;

    // Reset baseline indicators for the new task so we don't carry over delta progress
    lastCheckedGlitter = state.glitterDust || 0;
    lastCheckedStars = state.starsCount || 0;

    emit({
      type: "LEVEL_UP",
      level: state.planetLevel,
    });

    // Synchronize cumulative tasks under the new level/task if applicable
    syncCumulativeTasks();
    broadcastStateUpdate(true);
  }
}

function updateTaskProgress(
  type: string,
  amount: number,
  isSet: boolean = false,
  extraId?: string,
) {
  if (!state.planetTask) {
    state.planetTask = rollTaskForLevel(
      state.planetLevel,
      state.prestigeCount || 0,
      INITIAL_ANIMALS,
    );
  }
  const task = state.planetTask;
  if (!task) return;

  if (task.type === type) {
    if (type === "buy_animal" && extraId && task.targetAnimalId !== extraId) {
      return;
    }
    if (isSet) {
      task.progress = amount;
    } else {
      task.progress += amount;
    }

    if (task.progress > task.target) {
      task.progress = task.target;
    }
    if (task.progress < 0) {
      task.progress = 0;
    }

    checkPlanetLevelUp();
  }
}

function syncCumulativeTasks() {
  if (!state.planetTask) {
    state.planetTask = rollTaskForLevel(
      state.planetLevel,
      state.prestigeCount || 0,
      INITIAL_ANIMALS,
    );
  }
  const task = state.planetTask;
  if (!task || !task.isCumulative) return;

  if (task.type === "animals_count") {
    const total = Object.values(state.purchasedAnimals).reduce((a, b) => a + b, 0);
    task.progress = Math.min(task.target, total);
    checkPlanetLevelUp();
  } else if (task.type === "buy_animal") {
    const owned = state.purchasedAnimals[task.targetAnimalId || ""] || 0;
    task.progress = Math.min(task.target, owned);
    checkPlanetLevelUp();
  }
}

function syncIncrementalDeltas() {
  const currentGlitter = state.glitterDust || 0;
  if (currentGlitter > lastCheckedGlitter) {
    updateTaskProgress("glitter_dust", currentGlitter - lastCheckedGlitter);
  }
  lastCheckedGlitter = currentGlitter;

  const currentStars = state.starsCount || 0;
  if (currentStars > lastCheckedStars) {
    updateTaskProgress("collect_stars", currentStars - lastCheckedStars);
  }
  lastCheckedStars = currentStars;
}

function addPlanetExp(amount: number) {
  // Silent legacy no-op since leveling is now entirely task-driven
}

let cachedAchievementsObj: any[] = [];
let lastAchievementsCalcTime = 0;

// State Broadcaster
// cachedStats: pre-computed getLpsAndStats() from the calling tick (avoids a second call)
function broadcastStateUpdate(
  forceRecalculateAchievements = false,
  cachedStats?: ReturnType<typeof getLpsAndStats>,
) {
  if (!isSyncing) {
    isSyncing = true;
    syncCumulativeTasks();
    syncIncrementalDeltas();
    isSyncing = false;
  }

  const calculations = cachedStats ?? getLpsAndStats();

  // Throttle achievements calculation to once every 1250ms unless forced by a buy/click event
  const now = Date.now();
  let freshAchievements: any[] | undefined;
  if (
    forceRecalculateAchievements ||
    cachedAchievementsObj.length === 0 ||
    now - lastAchievementsCalcTime > 1250
  ) {
    cachedAchievementsObj = generateAchievements();
    lastAchievementsCalcTime = now;
    freshAchievements = cachedAchievementsObj;
  }

  const unlockedAchievementsCount = cachedAchievementsObj.filter((a: any) => a.isUnlocked).length;

  const msg: StateUpdateEvent = {
    type: "STATE_UPDATE",
    state: {
      life: state.life,
      totalLifeEarned: state.totalLifeEarned,
      starsCount: state.starsCount,
      purchasedAnimals: state.purchasedAnimals,
      purchasedUpgrades: state.purchasedUpgrades,
      planetLevel: state.planetLevel,
      planetExp: state.planetExp,
      planetTask: state.planetTask,
      clicksCount: state.clicksCount,
      starClicksTriggered: state.starClicksTriggered,
      secondsPlayed: state.secondsPlayed,
      isNight: state.isNight,
      cycleProgress: state.cycleProgress,
      activeEvent: state.activeEvent,
      activeEventDecision: state.activeEventDecision || null,
      activeEventDetails: state.activeEventDetails || null,
      activeEventInstantClaimed: state.activeEventInstantClaimed || false,
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
      zodiacLevels: state.zodiacLevels || {},
      slummerGlassLevel: state.slummerGlassLevel || 1,
      catalystLevel: state.catalystLevel || 0,
      doubleStellarLevel: state.doubleStellarLevel || 0,
      inGlitchGalaxy: state.inGlitchGalaxy || false,
      glitchPending: state.glitchPending || false,
      unlockedGlitchGalaxy: state.unlockedGlitchGalaxy || false,
      spentGalaxyShards: state.spentGalaxyShards || 0,
    },
    calculations: {
      ...calculations,
      unlockedAchievementsCount,
    },
  };
  if (freshAchievements !== undefined) {
    msg.achievements = freshAchievements;
  }
  emit(msg);
}

function setupActiveEvent(eventId: string) {
  let finalEventId = eventId;
  if (eventId === "meteors") {
    finalEventId = "comet_tail";
  } else if (eventId === "aurora") {
    finalEventId = "nebula_cloud";
  } else if (eventId === "shooting_stars") {
    finalEventId = "stella_nursery";
  } else if (eventId === "supernova") {
    finalEventId = "hyper_star";
  }

  state.activeEvent = finalEventId;
  state.activeEventDecision = "ignorieren";
  state.activeEventInstantClaimed = false;

  if (finalEventId === "black_hole") {
    state.activeEventDetails = null;
    return;
  }

  const eventData =
    COSMIC_EVENTS_POOL.find((ev) => ev.id === finalEventId) || COSMIC_EVENTS_POOL[0];
  const shuffledOpts = [...eventData.options].sort(() => Math.random() - 0.5);
  const selectedOpts = shuffledOpts.slice(0, 3);

  state.activeEventDetails = {
    id: eventData.id,
    name: eventData.name,
    description: eventData.description,
    emoji: eventData.emoji,
    options: selectedOpts.map((opt) => ({
      id: opt.id,
      name: opt.name,
      description: opt.description,
      effectType: opt.effectType,
      bonusLife: opt.bonusLife,
      bonusStars: opt.bonusStars,
      bonusDust: opt.bonusDust,
      bonusMoons: opt.bonusMoons,
    })),
  };
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
    broadcastStateUpdate(false, stats);
  }, 250);

  // 2. Seconds played ticker (every 1000ms)
  secondaryTimerId = setInterval(() => {
    state.secondsPlayed += 1;
    secondsNoClick += 1;
    updateTaskProgress("no_click_produce", secondsNoClick, true);
    checkGlitchGalaxyTrigger();
  }, 1000);

  // 3. Planet Cycle progress ticker (every 250ms)
  cycleTimerId = setInterval(() => {
    // Mondhasen-Sternbild bonus: Night lasts longer (slower cycleProgress during night)
    const constellMondhasenLvl = state.constellations?.mondhasen || 0;
    const progressModifier = state.isNight ? 1 / (1 + constellMondhasenLvl * 0.25) : 1.0;

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

      emit({
        type: "STAR_TRIGGER",
        reward: reward,
        starsCount: state.starsCount,
      });

      addPlanetExp(state.starsCount * 1.0 * stats.xpMultiplier * stats.xpEventMultiplier);
      updated = true;
    }

    if (state.moonsCount && state.moonsCount > 0) {
      const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.1;
      const moonReward = state.moonsCount * 15000 * prestigeMultiplier;

      emit({
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
        const eventPool: string[] = COSMIC_EVENTS_POOL.map((ev) => ev.id);
        if ((state.prestigeCount || 0) >= 5) {
          eventPool.push("black_hole");
        }
        const chosen = eventPool[Math.floor(Math.random() * eventPool.length)];

        setupActiveEvent(chosen);

        let duration = 120;
        if (state.purchasedUpgrades.includes("upg-event-duration")) {
          duration += 60;
        }
        // Since it starts with "ignorieren", we automatically add the extra 60s
        duration += 60;
        state.eventTimeRemaining = duration;

        if (state.purchasedUpgrades.includes("upg-quantum-tapper")) {
          const prestigeMultiplier = 1 + (state.prestigeCount || 0) * 0.1;
          const bonus = 1000 * prestigeMultiplier;
          state.life += bonus;
          state.totalLifeEarned += bonus;
        }

        emit({
          type: "EVENT_TRIGGER",
          event: chosen,
          active: true,
        });
      } else {
        // End current event
        if (state.activeEventDecision && state.activeEventDecision !== "ignorieren") {
          updateTaskProgress("events_won", 1);
        }
        state.activeEvent = null;
        state.activeEventDecision = null;
        state.activeEventDetails = null;
        state.activeEventInstantClaimed = false;

        let waitDuration = 120;
        if (state.purchasedUpgrades.includes("upg-event-frequency")) {
          waitDuration = 70;
        }

        // Ewiges Polarlicht reduces wait time by 15% per level
        const constellPolarlichtLvl = state.constellations?.ewiges_polarlicht || 0;
        waitDuration = Math.round(waitDuration * (1 - constellPolarlichtLvl * 0.15));

        state.eventTimeRemaining = waitDuration;

        emit({
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
addEventListener("message", (e: MessageEvent<WorkerCommand>) => {
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
      if (!state.planetTask) {
        state.planetTask = rollTaskForLevel(
          state.planetLevel,
          state.prestigeCount || 0,
          INITIAL_ANIMALS,
        );
      }
      lastCheckedGlitter = state.glitterDust || 0;
      lastCheckedStars = state.starsCount || 0;
      if (!state.zodiac) {
        state.zodiac = rollNewZodiac();
      }
      startTimers();
      broadcastStateUpdate();
      break;
    }
    case "CLICK": {
      state.clicksCount += 1;
      secondsNoClick = 0;
      updateTaskProgress("clicks", 1);
      const stats = getLpsAndStats();

      const isKatze = state.zodiac === "katze";
      const lvl = state.zodiacLevels?.katze || 1;
      const critChance = isKatze ? 0.2 + (lvl - 1) * 0.05 : 0.05;
      const isCrit = Math.random() < critChance;
      const critMult = isKatze ? 7 + (lvl - 1) * 2 : 3;
      const clickVal = isCrit ? stats.clickPower * critMult : stats.clickPower;

      const actualClickLife = clickVal * stats.clickMultiplierForEvents;
      const actualClickXP = 1.0 * stats.xpMultiplier * stats.xpEventMultiplier;

      state.life += actualClickLife;
      state.totalLifeEarned += actualClickLife;

      // 🌌 EVENT DECISION: Dynamic or legacy Glitter Dust dropping
      let targetChance = 0;
      let targetAmount = 0;

      if (state.activeEvent && state.activeEventDetails && state.activeEventDecision) {
        const selectedOpt = state.activeEventDetails.options.find(
          (o) => o.id === state.activeEventDecision,
        );
        if (selectedOpt) {
          if (selectedOpt.effectType === "glitter_click_2") {
            targetChance = 20.0;
            targetAmount = 2;
          } else if (selectedOpt.effectType === "glitter_click_3") {
            targetChance = 15.0;
            targetAmount = 3;
          }
        }
      }

      // Legacy fallback in case of legacy trigger names
      if (state.activeEvent && state.activeEventDecision === "zerlegen") {
        targetChance =
          state.activeEvent === "aurora" ? 15.0 : state.activeEvent === "supernova" ? 15.0 : 10.0;
        targetAmount = state.activeEvent === "supernova" ? 5 : 2;
      }

      if (targetChance > 0) {
        const dustRand = Math.random() * 100;
        if (dustRand < targetChance) {
          const isPhoenix = state.zodiac === "phoenix";
          const amount = Math.ceil(targetAmount * (isPhoenix ? 1.5 : 1.0));
          state.glitterDust = (state.glitterDust || 0) + amount;
          emit({
            type: "COSMETIC_FOUND",
            text: `+${amount} Glitzerstaub ✨ (Ereignis)`,
          });
        }
      }

      emit({
        type: "CLICK_EFFECT",
        actualClickLife,
        x: data.x,
        y: data.y,
      });

      addPlanetExp(actualClickXP);
      broadcastStateUpdate();
      break;
    }
    case "PAUSE_TIMERS": {
      stopTimers();
      hiddenAt = Date.now();
      break;
    }
    case "RESUME_TIMERS": {
      if (hiddenAt !== null) {
        const elapsedMs = Date.now() - hiddenAt;
        hiddenAt = null;

        const elapsedSecs = Math.floor(elapsedMs / 1000);
        if (elapsedSecs >= 1) {
          const MAX_CATCHUP_SECS = 5 * 60 * 60;
          const cappedSecs = Math.min(elapsedSecs, MAX_CATCHUP_SECS);

          const stats = getLpsAndStats();
          const lifeEarned = stats.totalLps * cappedSecs;
          state.life += lifeEarned;
          state.totalLifeEarned += lifeEarned;

          state.secondsPlayed += cappedSecs;

          const cycleUnits = cappedSecs * 4;
          const constellMondhasenLvl = state.constellations?.mondhasen || 0;
          let cycleProgress = state.cycleProgress;
          let isNight = state.isNight;
          let progressToAdd = cycleUnits * 0.4166667;
          const nightMod = isNight ? 1 / (1 + constellMondhasenLvl * 0.25) : 1.0;
          progressToAdd *= nightMod;
          cycleProgress += progressToAdd;
          const fullCycles = Math.floor(cycleProgress / 100);
          if (fullCycles > 0) {
            if (fullCycles % 2 === 1) isNight = !isNight;
            cycleProgress = cycleProgress % 100;
          }
          state.cycleProgress = cycleProgress;
          state.isNight = isNight;

          const xpFromStars =
            state.starsCount * 1.0 * stats.xpMultiplier * stats.xpEventMultiplier * cappedSecs;
          const xpFromMoons =
            (state.moonsCount || 0) *
            15 *
            stats.xpMultiplier *
            stats.xpEventMultiplier *
            cappedSecs;
          addPlanetExp(xpFromStars + xpFromMoons);
        }
      }

      startTimers();
      broadcastStateUpdate(false);
      break;
    }
    default: {
      handleWorkerAction(data, state, {
        getLpsAndStats,
        addPlanetExp,
        setupActiveEvent,
        updateTaskProgress,
        broadcastStateUpdate,
        rollNewZodiac,
        emit,
        stopTimers,
      });
      break;
    }
  }
});
