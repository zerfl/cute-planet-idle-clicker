import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Info,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  Star as StarIcon,
  Settings,
  Music,
} from "lucide-react";

import { Animal, FloatingText, GameState, Upgrade } from "./types";
import { INITIAL_ANIMALS, calculateCost, formatCompactNumber } from "./data";
import { Planet } from "./components/Planet";
import {
  playPop,
  playBuy,
  playUpgrade,
  playTick,
  playLevelUp,
  setMuted,
  getMuted,
  startBackgroundMusic,
  stopBackgroundMusic,
  setMusicVolume,
  MUSIC_STYLES,
  getMusicStyle,
  setMusicStyle,
  MusicStyleId,
} from "./utils/audio";

import { STATIC_UPGRADES } from "./data/upgrades";
import { ResetDialog } from "./components/modals/ResetDialog";
import { CheatEventModal } from "./components/modals/CheatEventModal";
import { TutorialModal } from "./components/modals/TutorialModal";
import { UpgradesModal } from "./components/modals/UpgradesModal";
import { AnimalsModal } from "./components/modals/AnimalsModal";
import { StarsModal } from "./components/modals/StarsModal";
import { StatsModal } from "./components/modals/StatsModal";
import { AchievementsModal } from "./components/modals/AchievementsModal";
import { MusicSettingsModal } from "./components/modals/MusicSettingsModal";
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { CloudSyncModal } from "./components/modals/CloudSyncModal";
import { SyncConflictDialog } from "./components/modals/SyncConflictDialog";
import { Cloud, Trophy } from "lucide-react";
import { MissionsModal } from "./components/modals/MissionsModal";
import { InventoryModal } from "./components/modals/InventoryModal";
import { ZodiacModal } from "./components/modals/ZodiacModal";
import { PrestigeModal } from "./components/modals/PrestigeModal";
import { OfflineEarningsModal } from "./components/modals/OfflineEarningsModal";
import { LeaderboardModal } from "./components/modals/LeaderboardModal";
import { CraftingModal } from "./components/modals/CraftingModal";
import { calculateOfflineLps } from "./utils/offline";
import { generateMissionsForSet } from "./data/missions";

// Modularized UI Components
import { BackgroundCompanions } from "./components/BackgroundCompanions";
import { EventBackgrounds } from "./components/EventBackgrounds";
import { CosmicHUD } from "./components/CosmicHUD";
import { ActiveEventBanner } from "./components/ActiveEventBanner";
import { DayNightIndicator } from "./components/DayNightIndicator";
import { ActionButtons } from "./components/ActionButtons";

// Static level bounds (significantly increased to slow down progression)
const EXP_PER_LEVEL = [0, 1500, 5000, 18000, 60000, 220000, 850000, 3200000, 12000000, 45000000];

const isObjEqual = (a: Record<string, any> | undefined, b: Record<string, any> | undefined): boolean => {
  if (!a || !b) return a === b;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
};

const isArrEqual = (a: any[] | undefined, b: any[] | undefined): boolean => {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};

export default function App() {
  // Loaded state guards
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Primary Game Engine State
  const [life, setLife] = useState<number>(0);
  const [totalLifeEarned, setTotalLifeEarned] = useState<number>(0);
  const [purchasedAnimals, setPurchasedAnimals] = useState<Record<string, number>>({});
  const [starsCount, setStarsCount] = useState<number>(0);
  const [moonsCount, setMoonsCount] = useState<number>(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<string[]>([]);
  const [planetLevel, setPlanetLevel] = useState<number>(1);
  const [planetExp, setPlanetExp] = useState<number>(0);
  const [clicksCount, setClicksCount] = useState<number>(0);
  const [starClicksTriggered, setStarClicksTriggered] = useState<number>(0);
  const [secondsPlayed, setSecondsPlayed] = useState<number>(0);

  // Day/Night Cycle States (Default to relaxing dark-pastel Night)
  const [isNight, setIsNight] = useState<boolean>(true);
  const [cycleProgress, setCycleProgress] = useState<number>(0);

  // UI States
  const [showAnimalsModal, setShowAnimalsModal] = useState<boolean>(false);
  const [showStarsModal, setShowStarsModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [isMutedState, setIsMutedState] = useState<boolean>(false);
  const [musicVolumeState, setMusicVolumeState] = useState<number>(0.35);
  const [musicStyleState, setMusicStyleState] = useState<MusicStyleId>("chiptune");
  const [showMusicSettingsModal, setShowMusicSettingsModal] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const nextParticleId = useRef<number>(1);
  const offlineCheckedRef = useRef<boolean>(false);

  // Performance (Low-Memory Mode) state
  const [isLowMemory, setIsLowMemory] = useState<boolean>(() => {
    return localStorage.getItem("cute_planet_low_memory") === "true";
  });

  useEffect(() => {
    localStorage.setItem("cute_planet_low_memory", isLowMemory.toString());
  }, [isLowMemory]);

  // Centralized cleanup loop for floating texts to eliminate heavy setTimeout cascade overhead
  useEffect(() => {
    const sweepInterval = setInterval(() => {
      setFloatingTexts((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        const next = prev.filter((p) => {
          const age = now - (p.createdAt || 0);
          const limit = p.type === "level" ? 4000 : 1200;
          return age < limit;
        });
        if (next.length === prev.length) return prev;
        return next;
      });
    }, 200);
    return () => clearInterval(sweepInterval);
  }, []);

  // Check for prefers-reduced-motion media query
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const disableAnimations = isLowMemory || prefersReducedMotion;

  // Cloud Sync Modal state
  const [showCloudSyncModal, setShowCloudSyncModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showCraftingModal, setShowCraftingModal] = useState<boolean>(false);
  const [craftedItems, setCraftedItems] = useState<Record<string, number>>({});
  const [constellations, setConstellations] = useState<Record<string, number>>({});
  const [autosaveNotification, setAutosaveNotification] = useState<{ show: boolean; text: string; success: boolean } | null>(null);

  // Calculated cache state from worker
  const [calculations, setCalculations] = useState<any>({
    upgradesSpecs: {
      bunnyBoost: false,
      chickBoost: false,
      catBoost: false,
      frogBoost: false,
      koalaBoost: false,
      pandaBoost: false,
      unicornBoost: false,
      globalAnimalsBoost: false,
      starGlow: false,
      starPulse: false,
      starSupercharger: false,
    },
    clickPower: 1,
    rawClickPower: 1,
    xpMultiplier: 1.0,
    clickMultiplierForEvents: 1.0,
    starMultiplierForEvents: 1.0,
    animalMultiplierForEvents: 1.0,
    xpEventMultiplier: 1.0,
    starPowerPerStar: 1.0,
    totalStarsLps: 0,
    totalAnimalsLps: 0,
    totalLps: 0,
    totalAnimalsCount: 0,
    researchedUpgradesCount: 0,
    planetExpNeeded: 1500,
    unlockedAchievementsCount: 0,
  });

  const [achievements, setAchievements] = useState<any[]>([]);

  // 3. Missions & Cosmetics States
  const isNightStyle = true; // Design choice: the core game elements always adopt the beautiful night mode.
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([]);
  const [glitterDust, setGlitterDust] = useState<number>(0);
  const [cosmeticRarityLevels, setCosmeticRarityLevels] = useState<Record<string, string>>({});
  const [activeStarColor, setActiveStarColor] = useState<string>("default");
  const [activeAccessory, setActiveAccessory] = useState<string>("none");
  const [activeFrame, setActiveFrame] = useState<string>("default");
  const [activeMoonSkin, setActiveMoonSkin] = useState<string>("default");
  const [shootingStarsCount, setShootingStarsCount] = useState<number>(0);
  const [missionSetNumber, setMissionSetNumber] = useState<number>(1);
  const [claimedMissionIds, setClaimedMissionIds] = useState<string[]>([]);
  const [missionsCooldownEnd, setMissionsCooldownEnd] = useState<number | null>(null);
  const [activeZodiacId, setActiveZodiacId] = useState<string>("katze");
  const [prestigeCount, setPrestigeCount] = useState<number>(0);
  const [blackHoleSize, setBlackHoleSize] = useState<number>(1);
  const [blackHoleResult, setBlackHoleResult] = useState<{
    show: boolean;
    title: string;
    text: string;
    success: boolean;
    outcomeType?: "good" | "bad";
  } | null>(null);

  // Modals Visibility
  const [showMissionsModal, setShowMissionsModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState<boolean>(false);
  const [showZodiacModal, setShowZodiacModal] = useState<boolean>(false);
  
  // Offline Progress States
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [offlineSeconds, setOfflineSeconds] = useState<number>(0);
  const [offlineLpsRate, setOfflineLpsRate] = useState<number>(0);
  const [offlineEarnedLife, setOfflineEarnedLife] = useState<number>(0);

  const handleClaimOfflineEarnings = (earnedLife: number) => {
    // Satisfying tick and level up-like sound
    playBuy();

    const updatedLife = life + earnedLife;
    const updatedTotalLife = totalLifeEarned + earnedLife;

    setLife(updatedLife);
    setTotalLifeEarned(updatedTotalLife);

    // Reset offline progress states to empty
    setOfflineSeconds(0);
    setOfflineLpsRate(0);
    setOfflineEarnedLife(0);

    // Sync to worker
    workerRef.current?.postMessage({
      type: "INIT",
      savedState: {
        life: updatedLife,
        totalLifeEarned: updatedTotalLife,
      }
    });

    // Close modal
    setShowOfflineModal(false);
  };

  useEffect(() => {
    if (isLoaded && !offlineCheckedRef.current) {
      offlineCheckedRef.current = true;
      try {
        const saved = localStorage.getItem("cute_planet_save");
        if (saved) {
          const savedStateObj = JSON.parse(saved);
          const cachedSecs = savedStateObj.offlineSeconds || 0;
          
          let elapsedSecs = 0;
          if (savedStateObj.lastSavedAt) {
            const elapsedMs = Date.now() - savedStateObj.lastSavedAt;
            elapsedSecs = Math.floor(elapsedMs / 1000);
          }

          const totalOfflineSecs = cachedSecs + elapsedSecs;

          // Only calculate if the total accumulated secs is >= 10
          if (totalOfflineSecs >= 10) {
            const maxOfflineSecs = 5 * 60 * 60; // 5 hours in seconds = 18000
            const cappedSecs = Math.min(totalOfflineSecs, maxOfflineSecs);
            const computedLps = calculateOfflineLps(savedStateObj);
            const lifeEarned = Math.floor(computedLps * cappedSecs);
            
            if (lifeEarned > 0) {
              setOfflineSeconds(cappedSecs);
              setOfflineLpsRate(computedLps);
              setOfflineEarnedLife(lifeEarned);
              // We do not open the modal automatically now; the user clicks the jar in the cycle indicator box!
            }
          }
        }
      } catch (err) {
        console.error("Failed to check offline earnings:", err);
      }
    }
  }, [isLoaded]);

  const handleClaimMissionReward = (missionId: string, starsReward: number) => {
    if (claimedMissionIds.includes(missionId)) return;
    playTick();
    
    // Check Sakura Set Bonus (+20% Mission-Rewards)
    const hasSetBonusSet = purchasedUpgrades.includes("upg-glitter-set");
    const sakuraSetComplete = hasSetBonusSet && ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) => unlockedCosmetics.includes(id));
    
    let actualReward = starsReward;
    if (sakuraSetComplete) {
      actualReward = Math.ceil(starsReward * 1.20);
    }
    
    const updatedClaimed = [...claimedMissionIds, missionId];
    setClaimedMissionIds(updatedClaimed);
    setShootingStarsCount((prev) => {
      const nextCount = prev + actualReward;
      workerRef.current?.postMessage({
        type: "UPDATE_SHOOTING_STARS",
        count: nextCount,
      });
      return nextCount;
    });

    const pId = nextParticleId.current++;
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: pId,
        x: 100,
        y: 100,
        text: sakuraSetComplete 
          ? `+${actualReward} 🌠 Sternschnuppe (🌸 +20% Set-Bonus)` 
          : `+${actualReward} 🌠 Sternschnuppe!`,
        type: "star",
      },
    ]);

    // Check if ALL 3 missions of this set are now claimed
    const currentMissions = generateMissionsForSet(missionSetNumber);
    const allClaimedNow = currentMissions.every((m) => updatedClaimed.includes(m.id));
    if (allClaimedNow) {
      // 5-minute cooldown starts! Frosch (frog) zodiac increases mission cooldown speed by 2.5x (cooldown is only 2 minutes instead of 5!)
      const isFrosch = activeZodiacId === "frosch";
      const cooldownMs = isFrosch ? 2 * 60 * 1000 : 5 * 60 * 1000;
      const cooldownEnd = Date.now() + cooldownMs;
      setMissionsCooldownEnd(cooldownEnd);
    }
  };

  // Check and progress mission set on cooldown end
  useEffect(() => {
    if (missionsCooldownEnd === null) return;
    
    const checkExpiry = () => {
      if (Date.now() >= missionsCooldownEnd) {
        // Cooldown has expired! Move to the next set and reset claimed IDs.
        setMissionSetNumber((prev) => prev + 1);
        setClaimedMissionIds([]);
        setMissionsCooldownEnd(null);
      }
    };
    
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [missionsCooldownEnd]);

  const handleOpenShootingStar = (cosmetic: any, alreadyUnlocked: boolean, refundAmt: number) => {
    playTick();
    setShootingStarsCount((prev) => {
      const nextCount = Math.max(0, prev - 1);
      workerRef.current?.postMessage({
        type: "UPDATE_SHOOTING_STARS",
        count: nextCount,
      });
      return nextCount;
    });

    if (alreadyUnlocked) {
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: "ADD_GLITTER_DUST",
          amount: refundAmt,
        });
      }

      const pId = nextParticleId.current++;
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: pId,
          x: 110,
          y: 110,
          text: `+${refundAmt} Glitzerstaub! ✨`,
          type: "star-click",
        },
      ]);
    } else {
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: "UNLOCK_COSMETIC_LOOTBOX",
          cosmeticId: cosmetic.id,
        });
      }
      setUnlockedCosmetics((prev) => [...prev, cosmetic.id]);
    }
  };

  const handleApplyCosmetic = (id: string, type: "star_color" | "planet_accessory" | "frame_style" | "moon_skin") => {
    playTick();
    if (type === "star_color") {
      setActiveStarColor(id);
    } else if (type === "planet_accessory") {
      setActiveAccessory(id);
    } else if (type === "frame_style") {
      setActiveFrame(id);
    } else if (type === "moon_skin") {
      setActiveMoonSkin(id);
    }
  };

  const handleUnlockCosmeticDirect = (cosmeticId: string, cost: number) => {
    playTick();
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "UNLOCK_COSMETIC_DIRECT",
        cosmeticId,
        cost,
      });

      const pId = nextParticleId.current++;
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: pId,
          x: 120,
          y: 90,
          text: `Freigeschaltet! ✨`,
          type: "star-click",
        },
      ]);
    }
  };

  const handleUpgradeCosmeticRarity = (cosmeticId: string, targetRarity: string, cost: number) => {
    playTick();
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "UPGRADE_COSMETIC_RARITY",
        cosmeticId,
        targetRarity,
        cost,
      });

      const pId = nextParticleId.current++;
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: pId,
          x: 125,
          y: 95,
          text: `Höhere Seltenheit! 👑 (+5% Boost)`,
          type: "star-click",
        },
      ]);
    }
  };

  // Destructure calculation stats for ease of rendering in the TSX layout
  const upgradesSpecs = calculations.upgradesSpecs;
  const clickPower = calculations.clickPower;
  const rawClickPower = calculations.rawClickPower;
  const xpMultiplier = calculations.xpMultiplier;
  const clickMultiplierForEvents = calculations.clickMultiplierForEvents;
  const starMultiplierForEvents = calculations.starMultiplierForEvents;
  const animalMultiplierForEvents = calculations.animalMultiplierForEvents;
  const xpEventMultiplier = calculations.xpEventMultiplier;
  const starPowerPerStar = calculations.starPowerPerStar;
  const totalStarsLps = calculations.totalStarsLps;
  const totalAnimalsLps = calculations.totalAnimalsLps;
  const totalLps = calculations.totalLps;
  const totalAnimalsCount = calculations.totalAnimalsCount;
  const researchedUpgradesCount = calculations.researchedUpgradesCount;
  const planetExpNeeded = calculations.planetExpNeeded;
  const unlockedAchievementsCount = calculations.unlockedAchievementsCount;
  const activeConstellationsCount = Object.keys(constellations).reduce((sum, key) => sum + (constellations[key] || 0), 0);

  // Selector for pending claim rewards
  const completedUnclaimedMissionsCount = useMemo(() => {
    return generateMissionsForSet(missionSetNumber).filter(
      (m) => {
        const progress = m.type === "clicks" ? clicksCount : m.type === "animals" ? totalAnimalsCount : starsCount;
        return progress >= m.target && !claimedMissionIds.includes(m.id);
      }
    ).length;
  }, [missionSetNumber, clicksCount, totalAnimalsCount, starsCount, claimedMissionIds]);

  // Web Worker Ref and Life Cycle Connection
  const workerRef = useRef<Worker | null>(null);

  // Firebase Cloud Sync Configuration
  const {
    user,
    authLoading,
    syncing,
    lastSynced,
    loginWithGoogle,
    logout,
    cloudSaveFound,
    showConflictDialog,
    setShowConflictDialog,
    saveStateToCloud,
    forceLocalOverwriteCloud,
    triggerCloudStateLoad,
  } = useFirebaseSync();

  useEffect(() => {
    const handleFirebaseLoad = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data && workerRef.current) {
        workerRef.current.postMessage({
          type: "INIT",
          savedState: data,
        });
        const fullSaveData = {
          ...data,
          lastSavedAt: data.lastSavedAt || Date.now(),
        };
        localStorage.setItem("cute_planet_save", JSON.stringify(fullSaveData));

        // Hydrate Cosmetics & Missions
        if (data.unlockedCosmetics) setUnlockedCosmetics(data.unlockedCosmetics);
        if (data.activeStarColor) setActiveStarColor(data.activeStarColor);
        if (data.activeAccessory) setActiveAccessory(data.activeAccessory);
        if (data.activeFrame) setActiveFrame(data.activeFrame);
        if (data.activeMoonSkin) setActiveMoonSkin(data.activeMoonSkin);
        if (data.shootingStarsCount !== undefined) setShootingStarsCount(data.shootingStarsCount);
        if (data.missionSetNumber !== undefined) setMissionSetNumber(data.missionSetNumber);
        if (data.claimedMissionIds) setClaimedMissionIds(data.claimedMissionIds);
        if (data.missionsCooldownEnd !== undefined) setMissionsCooldownEnd(data.missionsCooldownEnd);
        if (data.moonsCount !== undefined) setMoonsCount(data.moonsCount);
        if (data.constellations) setConstellations(data.constellations);
        if (data.craftedItems) setCraftedItems(data.craftedItems);
        if (data.glitterDust !== undefined) setGlitterDust(data.glitterDust);
        if (data.cosmeticRarityLevels) setCosmeticRarityLevels(data.cosmeticRarityLevels);
        if (data.blackHoleSize !== undefined) setBlackHoleSize(data.blackHoleSize || 1);
        if (data.zodiac !== undefined) setActiveZodiacId(data.zodiac);
      }
    };
    window.addEventListener("firebase-load-state", handleFirebaseLoad);
    return () => {
      window.removeEventListener("firebase-load-state", handleFirebaseLoad);
    };
  }, []);

  useEffect(() => {
    // Instantiate web worker
    const worker = new Worker(new URL("./game.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    // Load initial save from localStorage and hydrate worker state
    let savedStateObj = null;
    try {
      const saved = localStorage.getItem("cute_planet_save");
      if (saved) {
        savedStateObj = JSON.parse(saved);

        // Hydrate local cosmetics
        if (savedStateObj.unlockedCosmetics) setUnlockedCosmetics(savedStateObj.unlockedCosmetics);
        if (savedStateObj.activeStarColor) setActiveStarColor(savedStateObj.activeStarColor);
        if (savedStateObj.activeAccessory) setActiveAccessory(savedStateObj.activeAccessory);
        if (savedStateObj.activeFrame) setActiveFrame(savedStateObj.activeFrame);
        if (savedStateObj.activeMoonSkin) setActiveMoonSkin(savedStateObj.activeMoonSkin);
        if (savedStateObj.shootingStarsCount !== undefined) setShootingStarsCount(savedStateObj.shootingStarsCount);
        if (savedStateObj.missionSetNumber !== undefined) setMissionSetNumber(savedStateObj.missionSetNumber);
        if (savedStateObj.claimedMissionIds) setClaimedMissionIds(savedStateObj.claimedMissionIds);
        if (savedStateObj.missionsCooldownEnd !== undefined) setMissionsCooldownEnd(savedStateObj.missionsCooldownEnd);
        if (savedStateObj.moonsCount !== undefined) setMoonsCount(savedStateObj.moonsCount);
        if (savedStateObj.constellations) setConstellations(savedStateObj.constellations);
        if (savedStateObj.craftedItems) setCraftedItems(savedStateObj.craftedItems);
        if (savedStateObj.glitterDust !== undefined) setGlitterDust(savedStateObj.glitterDust);
        if (savedStateObj.cosmeticRarityLevels) setCosmeticRarityLevels(savedStateObj.cosmeticRarityLevels);
        setActiveZodiacId(savedStateObj.zodiac || "katze");
      }
    } catch (e) {
      console.error("Failed to parse initial save for Web Worker:", e);
    }

    worker.postMessage({
      type: "INIT",
      savedState: savedStateObj,
    });

    // Handle messages coming back from Worker thread
    worker.onmessage = (e) => {
      const data = e.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case "STATE_UPDATE": {
          const ws = data.state;
          setLife(ws.life);
          setTotalLifeEarned(ws.totalLifeEarned);
          setStarsCount(ws.starsCount);
          setMoonsCount(ws.moonsCount || 0);
          
          setPurchasedAnimals((prev) => isObjEqual(prev, ws.purchasedAnimals) ? prev : ws.purchasedAnimals);
          setPurchasedUpgrades((prev) => isArrEqual(prev, ws.purchasedUpgrades) ? prev : ws.purchasedUpgrades);
          setPlanetLevel(ws.planetLevel);
          setPlanetExp(ws.planetExp);
          setClicksCount(ws.clicksCount);
          setStarClicksTriggered(ws.starClicksTriggered);
          setSecondsPlayed(ws.secondsPlayed);
          setIsNight(ws.isNight);
          setCycleProgress(ws.cycleProgress);
          setActiveEvent(ws.activeEvent);
          setEventTimeRemaining(ws.eventTimeRemaining);
          setPrestigeCount(ws.prestigeCount || 0);
          if (ws.blackHoleSize !== undefined) setBlackHoleSize(ws.blackHoleSize || 1);
          
          setConstellations((prevOrder) => isObjEqual(prevOrder, ws.constellations) ? prevOrder : (ws.constellations || {}));
          setCraftedItems((prev) => isObjEqual(prev, ws.craftedItems) ? prev : (ws.craftedItems || {}));
          if (ws.glitterDust !== undefined) setGlitterDust(ws.glitterDust);
          if (ws.cosmeticRarityLevels) setCosmeticRarityLevels((prev) => isObjEqual(prev, ws.cosmeticRarityLevels) ? prev : ws.cosmeticRarityLevels);
          if (ws.activeEventDecision !== undefined) setActiveEventDecision(ws.activeEventDecision);
          if (ws.unlockedCosmetics !== undefined) setUnlockedCosmetics((prev) => isArrEqual(prev, ws.unlockedCosmetics) ? prev : ws.unlockedCosmetics);
          if (ws.shootingStarsCount !== undefined) setShootingStarsCount(ws.shootingStarsCount);
          if (ws.zodiac !== undefined) setActiveZodiacId(ws.zodiac || "katze");

          setCalculations((prevCalculations: any) => {
            if (
              prevCalculations.totalLps === data.calculations.totalLps &&
              prevCalculations.clickPower === data.calculations.clickPower &&
              prevCalculations.totalAnimalsCount === data.calculations.totalAnimalsCount &&
              prevCalculations.starPowerPerStar === data.calculations.starPowerPerStar &&
              prevCalculations.totalStarsLps === data.calculations.totalStarsLps &&
              prevCalculations.totalAnimalsLps === data.calculations.totalAnimalsLps &&
              prevCalculations.researchedUpgradesCount === data.calculations.researchedUpgradesCount
            ) {
              return prevCalculations;
            }
            return data.calculations;
          });

          setAchievements((prev) => {
            const prevUnlocked = prev.filter(a => a.unlocked).length;
            const nextUnlocked = data.achievements.filter((a: any) => a.unlocked).length;
            if (prevUnlocked === nextUnlocked && prev.length === data.achievements.length) {
              return prev;
            }
            return data.achievements;
          });
          
          setIsLoaded(true);
          break;
        }
        case "STAR_TRIGGER": {
          playTick();
          
          // Spawn star autoclick reward text
          const container = document.getElementById("planet-container");
          let rx = 100 + (Math.random() * 80 - 40);
          let ry = 100 + (Math.random() * 80 - 40);
          
          if (container) {
            const rect = container.getBoundingClientRect();
            rx = Math.floor(Math.random() * (rect.width - 40) + 20);
            ry = Math.floor(Math.random() * (rect.height - 40) + 20);
          }

          const pId = nextParticleId.current++;
          setFloatingTexts((prev) => {
            const next = [
              ...prev,
              {
                id: pId,
                x: rx,
                y: ry,
                text: `+${formatCompactNumber(data.reward)} ✧`,
                type: "star-click",
                createdAt: Date.now(),
              },
            ];
            if (next.length > 15) {
              return next.slice(next.length - 15);
            }
            return next;
          });
          break;
        }
        case "MOON_TRIGGER": {
          playTick();
          
          const container = document.getElementById("planet-container");
          let rx = 100 + (Math.random() * 80 - 40);
          let ry = 100 + (Math.random() * 80 - 40);
          
          if (container) {
            const rect = container.getBoundingClientRect();
            rx = Math.floor(Math.random() * (rect.width - 40) + 20);
            ry = Math.floor(Math.random() * (rect.height - 40) + 20);
          }

          const pId = nextParticleId.current++;
          setFloatingTexts((prev) => {
            const next = [
              ...prev,
              {
                id: pId,
                x: rx,
                y: ry,
                text: `+${formatCompactNumber(data.reward)} 🌙`,
                type: "moon-click",
                createdAt: Date.now(),
              },
            ];
            if (next.length > 25) {
              return next.slice(next.length - 25);
            }
            return next;
          });
          break;
        }
        case "LEVEL_UP": {
          playLevelUp();
          
          // Spawn planet level evolution tag
          const pId = nextParticleId.current++;
          setFloatingTexts((ptList) => {
            const next = [
              ...ptList,
              {
                id: pId,
                x: 80,
                y: 30,
                text: `PLANET EVOLUTION: Lv. ${data.level}! ✨`,
                type: "level",
                createdAt: Date.now(),
              },
            ];
            if (next.length > 15) {
              return next.slice(next.length - 15);
            }
            return next;
          });
          break;
        }
        case "EVENT_TRIGGER": {
          if (data.active) {
            playLevelUp();
          } else {
            playPop();
          }
          break;
        }
        case "COSMETIC_FOUND": {
          playLevelUp();
          const pId = nextParticleId.current++;
          setFloatingTexts((prev) => {
            const next = [
              ...prev,
              {
                id: pId,
                x: 100 + (Math.random() * 40 - 20),
                y: 50 + (Math.random() * 40 - 20),
                text: data.text,
                type: "level",
                createdAt: Date.now(),
              },
            ];
            if (next.length > 15) {
              return next.slice(next.length - 15);
            }
            return next;
          });
          break;
        }
        case "BLACK_HOLE_GAMBLE_RESULT": {
          if (data.success) {
            if (data.outcomeType === "good") {
              playLevelUp();
            } else {
              playPop();
            }
            setBlackHoleResult({
              show: true,
              title: data.title,
              text: data.text,
              success: true,
              outcomeType: data.outcomeType,
            });
          } else {
            playPop();
            setBlackHoleResult({
              show: true,
              title: "Fehler beim Opfern ⚠️",
              text: data.error || "Nicht genügend Ressourcen!",
              success: false,
              outcomeType: "bad",
            });
          }
          break;
        }
        default:
          break;
      }
    };

    // Clean up worker
    return () => {
      worker.postMessage({ type: "CLEANUP" });
      worker.terminate();
    };
  }, []);

  // Game stats tracking (hydrated by worker)
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
  const [showCheatEventModal, setShowCheatEventModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showUpgradesModal, setShowUpgradesModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<string>("all");
  const [achievementSearch, setAchievementSearch] = useState<string>("");

  // Cosmic Event System States
  const [activeEvent, setActiveEvent] = useState<"meteors" | "aurora" | "shooting_stars" | "supernova" | "black_hole" | null>(null);
  const [activeEventDecision, setActiveEventDecision] = useState<"sammeln" | "erforschen" | "zerlegen" | "ignorieren" | null>(null);
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number>(120);

  const handleSelectEventDecision = (decision: "sammeln" | "erforschen" | "zerlegen" | "ignorieren") => {
    workerRef.current?.postMessage({
      type: "SET_EVENT_DECISION",
      decision,
    });
  };

  const handleBlackHoleGamble = (sacrificeType: "life" | "stars" | "dust") => {
    workerRef.current?.postMessage({
      type: "BLACK_HOLE_GAMBLE",
      sacrificeType,
    });
  };

  // Load static music volumes and configurations
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem("cute_planet_muted");
      if (savedMuted) {
        const isMuted = savedMuted === "true";
        setMuted(isMuted);
        setIsMutedState(isMuted);
      }

      const savedVolume = localStorage.getItem("cute_planet_music_volume");
      if (savedVolume !== null) {
        const vol = Number(savedVolume);
        setMusicVolume(vol);
        setMusicVolumeState(vol);
      } else {
        setMusicVolume(0.35);
        setMusicVolumeState(0.35);
      }

      const savedStyle = localStorage.getItem("cute_planet_music_style") as MusicStyleId | null;
      if (savedStyle !== null && ["classic", "rainy", "space", "chiptune", "zen"].includes(savedStyle)) {
        setMusicStyle(savedStyle);
        setMusicStyleState(savedStyle);
      } else {
        setMusicStyle("chiptune");
        setMusicStyleState("chiptune");
      }
    } catch (e) {
      console.error("Failed to load audio settings:", e);
    }
  }, []);

  // Automatically trigger background music
  useEffect(() => {
    const handleFirstInteraction = () => {
      startBackgroundMusic();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  // Easter egg keydown handler for "uguu" cheat
  useEffect(() => {
    let inputBuffer = "";
    const targetCode = "uguu";

    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }

      const key = e.key.toLowerCase();
      if (key.length === 1) {
        inputBuffer += key;
        if (inputBuffer.length > 20) {
          inputBuffer = inputBuffer.slice(-targetCode.length);
        }

        if (inputBuffer.endsWith(targetCode)) {
          workerRef.current?.postMessage({
            type: "CHIPS_CHEAT",
          });

          // Open the cosmic event selector cheat modal
          setShowCheatEventModal(true);

          // Add 10% (1800s) to the sleep/slummer jar
          const currentState = autoSaveStateRef.current || {};
          const currentOfflineSecs = currentState.offlineSeconds || 0;
          const maxOfflineSecs = 5 * 60 * 60; // 18000s
          const addedSecs = 1800; // 10% of 5 hours
          const newOfflineSecs = Math.min(maxOfflineSecs, currentOfflineSecs + addedSecs);

          // Get simulated updated animals and stars count
          const updatedAnimals = { ...(currentState.purchasedAnimals || {}) };
          updatedAnimals.bunny = (updatedAnimals.bunny || 0) + 1;
          updatedAnimals.chick = (updatedAnimals.chick || 0) + 1;
          updatedAnimals.cat = (updatedAnimals.cat || 0) + 1;
          updatedAnimals.frog = (updatedAnimals.frog || 0) + 1;

          const updatedStateObj = {
            ...currentState,
            purchasedAnimals: updatedAnimals,
            starsCount: (currentState.starsCount || 0) + 2,
          };

          const computedLps = calculateOfflineLps(updatedStateObj);
          const newEarnedLife = Math.floor(computedLps * newOfflineSecs);

          setOfflineSeconds(newOfflineSecs);
          setOfflineLpsRate(computedLps);
          setOfflineEarnedLife(newEarnedLife);

          const textId = Date.now();
          setFloatingTexts((prev) => [
            ...prev,
            {
              id: textId + 1,
              x: 10,
              y: 60,
              text: "✨ Uguu-Magie erweckt: +5 Prestige! 👑 ✨",
              type: "level",
              createdAt: Date.now(),
            },
            {
              id: textId + 2,
              x: 0,
              y: 110,
              text: "💖 +1.000.000, ⭐ +2, Tiere & +10% Glas! ⭐",
              type: "level",
              createdAt: Date.now(),
            }
          ]);

          playLevelUp();
          inputBuffer = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Autosave game state periodically to browser localStorage (read from   // Synchronize modal styling class directly with the body element
  useEffect(() => {
    const b = document.body;
    b.classList.forEach((c) => {
      if (c.startsWith("active-frame-")) b.classList.remove(c);
    });
    b.classList.add(`active-frame-${activeFrame}`);
  }, [activeFrame]);

  // Keep save variables stored in a ref so the autosave interval doesn't rebuild 50 times a second
  const autoSaveStateRef = useRef<any>(null);
  useEffect(() => {
    autoSaveStateRef.current = {
      isLoaded,
      life,
      totalLifeEarned,
      starsCount,
      moonsCount,
      purchasedAnimals,
      purchasedUpgrades,
      planetLevel,
      planetExp,
      clicksCount,
      starClicksTriggered,
      secondsPlayed,
      unlockedCosmetics,
      activeStarColor,
      activeAccessory,
      activeFrame,
      activeMoonSkin,
      shootingStarsCount,
      missionSetNumber,
      claimedMissionIds,
      missionsCooldownEnd,
      prestigeCount,
      offlineSeconds,
      offlineLpsRate,
      offlineEarnedLife,
      constellations,
      craftedItems,
      glitterDust,
      cosmeticRarityLevels,
      blackHoleSize,
      activeZodiacId,
    };
  }, [
    isLoaded,
    life,
    totalLifeEarned,
    starsCount,
    moonsCount,
    purchasedAnimals,
    purchasedUpgrades,
    planetLevel,
    planetExp,
    clicksCount,
    starClicksTriggered,
    secondsPlayed,
    unlockedCosmetics,
    activeStarColor,
    activeAccessory,
    activeFrame,
    activeMoonSkin,
    shootingStarsCount,
    missionSetNumber,
    claimedMissionIds,
    missionsCooldownEnd,
    prestigeCount,
    blackHoleSize,
    offlineSeconds,
    offlineLpsRate,
    offlineEarnedLife,
    constellations,
    craftedItems,
    glitterDust,
    cosmeticRarityLevels,
    activeZodiacId,
  ]);

  // Synchronize dynamic local saves and autosave intervals
  useEffect(() => {
    const saveState = () => {
      const s = autoSaveStateRef.current;
      if (!s || !s.isLoaded) return;
      try {
        const stateToSave = {
          life: s.life,
          totalLifeEarned: s.totalLifeEarned,
          starsCount: s.starsCount,
          moonsCount: s.moonsCount,
          purchasedAnimals: s.purchasedAnimals,
          purchasedUpgrades: s.purchasedUpgrades,
          planetLevel: s.planetLevel,
          planetExp: s.planetExp,
          clicksCount: s.clicksCount,
          starClicksTriggered: s.starClicksTriggered,
          secondsPlayed: s.secondsPlayed,
          unlockedCosmetics: s.unlockedCosmetics,
          activeStarColor: s.activeStarColor,
          activeAccessory: s.activeAccessory,
          activeFrame: s.activeFrame,
          activeMoonSkin: s.activeMoonSkin,
          shootingStarsCount: s.shootingStarsCount,
          missionSetNumber: s.missionSetNumber,
          claimedMissionIds: s.claimedMissionIds,
          missionsCooldownEnd: s.missionsCooldownEnd,
          prestigeCount: s.prestigeCount,
          offlineSeconds: s.offlineSeconds,
          offlineLpsRate: s.offlineLpsRate,
          offlineEarnedLife: s.offlineEarnedLife,
          constellations: s.constellations,
          craftedItems: s.craftedItems,
          glitterDust: s.glitterDust,
          cosmeticRarityLevels: s.cosmeticRarityLevels,
          blackHoleSize: s.blackHoleSize,
          zodiac: s.activeZodiacId,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem("cute_planet_save", JSON.stringify(stateToSave));

        // Sync with Cloud every 20 seconds (since loop tick is 5 seconds, secondsPlayed % 20 === 0 works wonderfully!)
        if (user && s.secondsPlayed % 20 === 0) {
          saveStateToCloud(stateToSave);
        }
      } catch (e) {
        console.error("Autosave failed in dynamic interval:", e);
      }
    };

    const interval = setInterval(saveState, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Visible 2-Minute Autosave Notification Trigger
  useEffect(() => {
    const triggerTwoMinuteAutosave = async () => {
      const s = autoSaveStateRef.current;
      if (!s || !s.isLoaded) return;

      // 1. Show Saving In-Progress Toast
      setAutosaveNotification({
        show: true,
        text: user ? "Lokale Daten & Cloud-Synchronisierung werden übertragen..." : "Lokaler Spielfortschritt wird gesichert...",
        success: false,
      });

      try {
        const stateToSave = {
          life: s.life,
          totalLifeEarned: s.totalLifeEarned,
          starsCount: s.starsCount,
          moonsCount: s.moonsCount,
          purchasedAnimals: s.purchasedAnimals,
          purchasedUpgrades: s.purchasedUpgrades,
          planetLevel: s.planetLevel,
          planetExp: s.planetExp,
          clicksCount: s.clicksCount,
          starClicksTriggered: s.starClicksTriggered,
          secondsPlayed: s.secondsPlayed,
          unlockedCosmetics: s.unlockedCosmetics,
          activeStarColor: s.activeStarColor,
          activeAccessory: s.activeAccessory,
          activeFrame: s.activeFrame,
          activeMoonSkin: s.activeMoonSkin,
          shootingStarsCount: s.shootingStarsCount,
          missionSetNumber: s.missionSetNumber,
          claimedMissionIds: s.claimedMissionIds,
          missionsCooldownEnd: s.missionsCooldownEnd,
          prestigeCount: s.prestigeCount,
          offlineSeconds: s.offlineSeconds,
          offlineLpsRate: s.offlineLpsRate,
          offlineEarnedLife: s.offlineEarnedLife,
          constellations: s.constellations,
          craftedItems: s.craftedItems,
          glitterDust: s.glitterDust,
          cosmeticRarityLevels: s.cosmeticRarityLevels,
          blackHoleSize: s.blackHoleSize,
          zodiac: s.activeZodiacId,
          lastSavedAt: Date.now(),
        };

        // Save local
        localStorage.setItem("cute_planet_save", JSON.stringify(stateToSave));

        // Save Cloud if user is authenticated
        if (user) {
          await saveStateToCloud(stateToSave);
        }

        // 2. Success Feedback after a slight dynamic delay
        setTimeout(() => {
          setAutosaveNotification({
            show: true,
            text: user ? "Spielfortschritt in der Cloud gesichert! 🌌" : "Lokaler Fortschritt im Browser gesichert! 💾",
            success: true,
          });

          // 3. Auto-hide success toast after 3 seconds
          setTimeout(() => {
            setAutosaveNotification((prev) => prev ? { ...prev, show: false } : null);
          }, 3000);
        }, 850);

      } catch (e) {
        console.error("2-Minute Autosave failed:", e);
        setAutosaveNotification({
          show: true,
          text: "Automatisches Speichern fehlgeschlagen.",
          success: false,
        });
        setTimeout(() => {
          setAutosaveNotification((prev) => prev ? { ...prev, show: false } : null);
        }, 3000);
      }
    };

    // Set interval for every 2 minutes (120,000 milliseconds)
    const twoMinInterval = setInterval(triggerTwoMinuteAutosave, 120000);

    return () => clearInterval(twoMinInterval);
  }, [user]);

  // ----------------------------------------------------
  // Local Memoization calculations (Extremely light)
  // ----------------------------------------------------
  const animalDefs = INITIAL_ANIMALS;

  const purchasedAnimalsList = useMemo(() => {
    return animalDefs
      .filter((def) => (purchasedAnimals[def.id] || 0) > 0)
      .map((def) => ({
        id: def.id,
        emoji: def.emoji,
        germanName: def.germanName,
      }));
  }, [purchasedAnimals, animalDefs]);

  // Distribute companions randomly staying clear of planet center
  const backgroundCompanions = useMemo(() => {
    const list: { id: string; emoji: string; x: number; y: number; delay: number; scale: number; speed: number }[] = [];
    let seed = 54321;
    const random = () => {
      const val = Math.sin(seed++) * 10000;
      return val - Math.floor(val);
    };

    Object.entries(purchasedAnimals).forEach(([animalId, count]) => {
      const countVal = typeof count === "number" ? count : Number(count);
      if (isNaN(countVal) || countVal <= 0) return;
      const def = animalDefs.find((a) => a.id === animalId);
      if (!def) return;

      let x = 4 + random() * 92;
      let y = 12 + random() * 76;
      
      let attempts = 0;
      while (
        attempts < 20 &&
        Math.abs(x - 50) < 22 &&
        Math.abs(y - 50) < 24
      ) {
        x = 4 + random() * 92;
        y = 12 + random() * 76;
        attempts++;
      }

      const delay = random() * 5;
      const speed = 3.5 + random() * 5.0;
      const scale = 0.55 + random() * 0.18;
      
      list.push({
        id: `${animalId}-0`,
        emoji: def.emoji,
        x,
        y,
        delay,
        scale,
        speed,
      });
    });
    return isLowMemory ? list.slice(0, 3) : list;
  }, [purchasedAnimals, animalDefs, isLowMemory]);

  // Planet Click Event Handler
  const handlePlanetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    playPop();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;

    workerRef.current?.postMessage({
      type: "CLICK",
      x,
      y,
    });

    // Predict & render floating text instantly for absolute zero click lag/latency
    const isKatze = activeZodiacId === "katze";
    const critChance = isKatze ? 0.20 : 0.05;
    const isCrit = Math.random() < critChance;
    const critMult = isKatze ? 7 : 3;
    const clickVal = isCrit ? (clickPower * critMult) : clickPower;
    const actualClickLife = clickVal * clickMultiplierForEvents;
    const pId = nextParticleId.current++;
    setFloatingTexts((prev) => {
      const next = [
        ...prev,
        {
          id: pId,
          x,
          y,
          text: isCrit 
            ? `+${formatCompactNumber(actualClickLife)} CRIT! ✨` 
            : `+${formatCompactNumber(actualClickLife)}`,
          type: isCrit ? "crit-click" : "click",
          createdAt: Date.now(),
        },
      ];
      if (next.length > 15) {
        return next.slice(next.length - 15);
      }
      return next;
    });
  };

  // Custom particle spawner for general events
  const handleSpawningText = (txt: string, pType: "heart" | "click") => {
    const rx = 50 + Math.random() * 150;
    const ry = 40 + Math.random() * 50;
    const pId = nextParticleId.current++;

    setFloatingTexts((prev) => {
      const next = [
        ...prev,
        {
          id: pId,
          x: rx,
          y: ry,
          text: txt,
          type: pType,
          createdAt: Date.now(),
        },
      ];
      if (next.length > 15) {
        return next.slice(next.length - 15);
      }
      return next;
    });
  };

  // Click Sound Toggle helper
  const handleToggleMute = () => {
    const targetState = !isMutedState;
    setMuted(targetState);
    setIsMutedState(targetState);
    localStorage.setItem("cute_planet_muted", String(targetState));
  };

  // Buy cute star
  const starCost = useMemo(() => {
    return calculateCost(50, starsCount, 1.4);
  }, [starsCount]);

  const maxMoons = useMemo(() => {
    let limit = 3;
    if (purchasedUpgrades.includes("upg-moon-limit-1")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-2")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-3")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-4")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-5")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-6")) limit++;
    if (purchasedUpgrades.includes("upg-moon-limit-7")) limit++;
    return limit;
  }, [purchasedUpgrades]);

  const handleBuyStar = () => {
    if (life < starCost) return;
    
    playBuy();
    workerRef.current?.postMessage({
      type: "BUY_STAR",
      cost: starCost,
    });
  };

  const handleInvestConstellation = (constellationId: string, starsCost: number, moonsCost: number) => {
    playBuy();
    workerRef.current?.postMessage({
      type: "INVEST_CONSTELLATION",
      constellationId,
      starsCost,
      moonsCost,
    });
  };

  const handleCraftItem = (recipeId: string) => {
    playUpgrade();
    workerRef.current?.postMessage({
      type: "CRAFT_ITEM",
      recipeId,
    });
  };

  const handleUseCraftedItem = (itemId: string) => {
    playPop();
    workerRef.current?.postMessage({
      type: "USE_CRAFTED_ITEM",
      itemId,
    });
  };

  const handleSelectZodiac = (zodiacId: string) => {
    playPop();
    workerRef.current?.postMessage({
      type: "SET_ZODIAC",
      zodiacId,
    });
  };

  const handleMergeMoons = () => {
    if (starsCount >= 50 && moonsCount < maxMoons) {
      workerRef.current?.postMessage({
        type: "MERGE_MOONS",
      });
      playBuy();
      
      const textId = Date.now();
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: textId,
          x: 0,
          y: -80,
          text: "🌙 Mond erschaffen! 🌙",
          type: "level",
          createdAt: Date.now(),
        },
      ]);
    }
  };

  // Purchase Cute Animal Species
  const handleBuyAnimal = (animalId: string, cost: number, countToBuy: number) => {
    if (life < cost) return;

    playBuy();
    workerRef.current?.postMessage({
      type: "BUY_ANIMAL",
      animalId,
      cost,
      countToBuy,
    });
  };

  // Batch purchase upgrades
  const handleBuyUpgradesBatch = (list: { id: string; cost: number; isGlitter: boolean }[]) => {
    if (list.length === 0) return;

    playUpgrade();
    workerRef.current?.postMessage({
      type: "BUY_UPGRADES_BATCH",
      upgradesList: list,
    });
  };

  // Dynamic cost list of upgrades
  const staticUpgrades = STATIC_UPGRADES;

  // Helper to handle buying upgrades
  const handleBuyUpgrade = (id: string, cost: number) => {
    if (life < cost || purchasedUpgrades.includes(id)) return;

    playUpgrade();
    workerRef.current?.postMessage({
      type: "BUY_UPGRADE",
      id,
      cost,
    });
  };

  // Full Game hard Reset trigger
  const handleGameReset = () => {
    playLevelUp();
    localStorage.removeItem("cute_planet_save");
    workerRef.current?.postMessage({
      type: "RESET",
    });

    // Reset Cosmetics & Missions State
    setUnlockedCosmetics([]);
    setActiveStarColor("default");
    setActiveAccessory("none");
    setActiveFrame("default");
    setShootingStarsCount(0);
    setMissionSetNumber(1);
    setClaimedMissionIds([]);

    setShowResetDialog(false);
  };

  // Cosmic Prestige reset mechanism
  const handleConfirmPrestige = () => {
    // Satisfying sound effect
    playLevelUp();

    // Reset game state elements through the web worker
    workerRef.current?.postMessage({
      type: "PRESTIGE",
    });

    // Award 1x Star Shooting Lootbox
    setShootingStarsCount((prev) => {
      const nextCount = prev + 1;
      workerRef.current?.postMessage({
        type: "UPDATE_SHOOTING_STARS",
        count: nextCount,
      });
      return nextCount;
    });

    // Close the dialogue
    setShowPrestigeModal(false);
  };

  // Helper to view time played beautifully
  const formatTimePlayed = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const parts = [];
    if (hrs > 0) parts.push(`${hrs} Std.`);
    if (mins > 0 || hrs > 0) parts.push(`${mins} Min.`);
    parts.push(`${secs} Sek.`);
    return parts.join(" ");
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 ease-in-out flex flex-col font-sans scroll-smooth ${
      isNightStyle 
        ? "bg-gradient-to-b from-[#100d23] via-[#1b1535] to-[#0b0818] text-[#ffeef4] selection:bg-[#ff9db8] selection:text-[#100d23]" 
        : ""
    }`}>
      
      {/* Scattered Ambient Background Animals (floating freely over the entire cosmos background) */}
      <BackgroundCompanions companions={backgroundCompanions} />

      {/* Dynamic Cosmic Event Background Overlays (visualized smoothly in background index) */}
      <EventBackgrounds activeEvent={activeEvent} isLowMemory={isLowMemory} />

      {/* 1. Header Area with Soft Pastel Colors */}
      <header className={`sticky top-0 z-20 backdrop-blur-md py-4 px-4 sm:px-6 shadow-md transition-all duration-500 border-b-4 ${
        isNightStyle ? "bg-[#110e26]/85 border-[#caa5fe]/50 text-[#ffeef4]" : ""
      } ${showTutorial ? "blur-md pointer-events-none select-none" : ""}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          
          {/* Logo Title area */}
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-2xl sm:text-3xl select-none"
            >
              🪐
            </motion.span>
            <div>
              <h1 className={`font-sans font-black uppercase tracking-[0.12em] text-sm sm:text-base flex items-center gap-2 ${
                isNightStyle ? "text-[#ffeef4]" : ""
              }`}>
                Pastell-Kosmos <span className="text-[#100d23] text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#caa5fe] border-2 border-[#100d23] hidden sm:inline-block leading-none uppercase shadow-[2px_2px_0px_#100d23]">Idle Game</span>
              </h1>
              <p className={`text-[10px] sm:text-xs font-bold mt-0.5 ${
                isNightStyle ? "text-[#ab9fd2]" : ""
              }`}>Belebe deinen süßen Begleiter</p>
            </div>
          </div>

          {/* Core Quick stats & Utility buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Lifepoints summary */}
            <div className={`px-4 py-1.5 rounded-xl flex flex-col items-end shadow-sm border-2 transition-colors duration-500 ${
              isNightStyle ? "bg-[#191533] border-[#ff9db8]/60 text-[#ffeef4]" : ""
            }`}>
              <span className={`text-[9px] uppercase font-mono font-black tracking-wider leading-none ${
                isNightStyle ? "text-[#ff9db8]" : ""
              }`}>Erspieltes Leben</span>
              <span className="font-mono text-xs sm:text-sm font-black mt-0.5" title={Math.floor(life).toLocaleString("de-DE")}>
                {formatCompactNumber(life)} 💖
              </span>
            </div>

            {/* Quiet Mute Switch */}
            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
              title={isMutedState ? "Ton einschalten" : "Ton stummschalten"}
            >
              {isMutedState ? <VolumeX className="w-4 h-4 text-rose-350" /> : <Volume2 className="w-4 h-4 text-[#ff9db8] animate-pulse" />}
            </button>

            {/* Soundtrack Settings Window trigger */}
            <button
              onClick={() => setShowMusicSettingsModal(true)}
              className="group p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
              title="Sound & Einstellungen öffnen"
              id="header_lofi_music_btn"
            >
              <Settings className="w-4 h-4 text-[#caa5fe] transition-transform duration-500 group-hover:rotate-90" />
            </button>

            {/* Cloud Sync/Storage toggle */}
            <button
              onClick={() => setShowCloudSyncModal(true)}
              className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer relative border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
              title="Cloud Backup & Synchronisation öffnen"
              id="header_cloud_sync_btn"
            >
              <Cloud className="w-4 h-4 text-sky-400" />
              {user && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full animate-pulse" />
              )}
            </button>

            {/* Global Leaderboard trigger */}
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
              title="Globale Bestenliste öffnen"
              id="header_leaderboard_btn"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>

            {/* Quick Tutorial drawer toggle */}
            <button
              onClick={() => setShowTutorial((prev) => !prev)}
              className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
              title="Anleitung"
            >
              <Info className="w-4 h-4 text-[#caa5fe]" />
            </button>

            {/* Reset check trigger */}
            <button
              onClick={() => setShowResetDialog(true)}
              className="p-2.5 rounded-xl border-2 active:scale-92 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#ff9db8]/50 bg-red-950/40 hover:bg-red-900/40 text-red-300"
              title="Spiel zurücksetzen"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Immersive Centered Master View (Planet takes center stage with plenty of room around it) */}
      <main className={`flex-grow w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-5 relative z-10 transition-all duration-500 ${
        showTutorial ? "blur-md pointer-events-none select-none" : ""
      }`}>
        
        {/* Real-time compact live HUD metrics - Positioned at the very top and smaller to save space */}
        <CosmicHUD
          isNightStyle={isNightStyle}
          life={life}
          totalLps={totalLps}
          starsCount={starsCount}
          prestigeCount={prestigeCount}
          onShowPrestige={() => setShowPrestigeModal(true)}
        />

        {/* Cosmic Event Alert / Notification Panel - Displays countdown or active event state dynamically with glowing animations */}
        <ActiveEventBanner
          activeEvent={activeEvent}
          activeEventDecision={activeEventDecision}
          eventTimeRemaining={eventTimeRemaining}
          onSelectDecision={handleSelectEventDecision}
          life={life}
          starsCount={starsCount}
          glitterDust={glitterDust}
          blackHoleSize={blackHoleSize}
          onGamble={handleBlackHoleGamble}
        />

        {/* Dynamic Day/Night Cycle Indicator and Bonus Panel */}
        <DayNightIndicator
          isNight={isNight}
          cycleProgress={cycleProgress}
          offlineEarnedLife={offlineEarnedLife}
          offlineSeconds={offlineSeconds}
          onOpenOfflineModal={() => setShowOfflineModal(true)}
        />

        {/* Huge Interactive Planet Canvas: No overflow bounds, stars and animals float freely! */}
        <section className="relative group w-full max-w-3xl flex flex-col items-center justify-center py-4">
          <Planet
            level={planetLevel}
            life={life}
            planetExp={planetExp}
            planetExpNeeded={planetExpNeeded}
            starsCount={starsCount}
            moonsCount={moonsCount || 0}
            starPowerMultiplier={starPowerPerStar}
            onPlanetClick={handlePlanetClick}
            floatingTexts={floatingTexts}
            purchasedAnimalsList={purchasedAnimalsList}
            isNight={isNightStyle}
            activeStarColor={activeStarColor}
            activeAccessory={activeAccessory}
            activeMoonSkin={activeMoonSkin}
            isLowMemory={isLowMemory}
            activeZodiacId={activeZodiacId}
            onOpenZodiacModal={() => setShowZodiacModal(true)}
          />

          {/* Subtitle technical decoration lines */}
          <div className="mt-4 flex justify-center opacity-60 font-mono text-[9.5px] sm:text-[11px] font-bold text-rose-300/40 tracking-wide pointer-events-none">
            <span>SATELLITE SYST. LEVEL {planetLevel} // CLICK MULTIPLIER {clickPower}x</span>
          </div>
        </section>

        {/* Beautiful Tactile Floating Buttons to open their corresponding modal window */}
        <ActionButtons
          onShowAnimals={() => setShowAnimalsModal(true)}
          onShowCrafting={() => setShowCraftingModal(true)}
          onShowStars={() => setShowStarsModal(true)}
          onShowUpgrades={() => setShowUpgradesModal(true)}
          onShowAchievements={() => setShowAchievementsModal(true)}
          onShowStats={() => setShowStatsModal(true)}
          onShowMissions={() => setShowMissionsModal(true)}
          onShowInventory={() => setShowInventoryModal(true)}
          disableAnimations={disableAnimations}
          isNightStyle={isNightStyle}
          totalAnimalsCount={totalAnimalsCount}
          starsCount={starsCount}
          researchedUpgradesCount={researchedUpgradesCount}
          unlockedAchievementsCount={unlockedAchievementsCount}
          achievementsLength={achievements.length}
          completedUnclaimedMissionsCount={completedUnclaimedMissionsCount}
          shootingStarsCount={shootingStarsCount}
          activeConstellationsCount={activeConstellationsCount}
        />
      </main>

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        isNight={isNightStyle}
      />

      {/* 4. Footer credits with minimalist elements */}
      <footer className={`border-t-4 py-5 px-4 text-center text-[11px] mt-10 transition-colors duration-500 ${
        isNightStyle ? "bg-[#110e26]/95 border-[#caa5fe]/50 text-[#ab9fd2]" : "bg-[#110e26]/95 border-[#caa5fe]/50 text-[#ab9fd2]"
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold relative z-10">
          <p>
            Mit viel Liebe gemacht in Pastellfarben. Spielstand speichert sich automatisch im Browser.
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md border-2 font-mono font-black text-[10px] ${
              isNightStyle ? "bg-[#211a43] border-[#caa5fe] text-white" : "bg-[#211a43] border-[#caa5fe] text-white"
            }`}>Ver. 1.0.6</span>
            <span className="text-[#f15e75] animate-pulse">💖</span>
          </div>
        </div>
      </footer>

      <ResetDialog
        isOpen={showResetDialog}
        onConfirm={handleGameReset}
        onCancel={() => setShowResetDialog(false)}
      />

      <CheatEventModal
        isOpen={showCheatEventModal}
        onSelectEvent={(event) => {
          workerRef.current?.postMessage({
            type: "FORCE_TRIGGER_EVENT",
            event,
          });
        }}
        onClose={() => setShowCheatEventModal(false)}
      />

      <UpgradesModal
        isOpen={showUpgradesModal}
        onClose={() => setShowUpgradesModal(false)}
        life={life}
        glitterDust={glitterDust}
        totalLps={totalLps}
        purchasedUpgrades={purchasedUpgrades}
        staticUpgrades={staticUpgrades}
        onBuyUpgrade={handleBuyUpgrade}
        onBuyUpgradesBatch={handleBuyUpgradesBatch}
        formatCompactNumber={formatCompactNumber}
      />

      <AnimalsModal
        isOpen={showAnimalsModal}
        onClose={() => setShowAnimalsModal(false)}
        life={life}
        totalAnimalsLps={totalAnimalsLps}
        purchasedAnimals={purchasedAnimals}
        animalDefs={INITIAL_ANIMALS}
        onBuyAnimal={handleBuyAnimal}
        calculateCost={calculateCost}
        formatCompactNumber={formatCompactNumber}
        upgradesSpecs={upgradesSpecs}
      />

      <StarsModal
        isOpen={showStarsModal}
        onClose={() => setShowStarsModal(false)}
        life={life}
        starsCount={starsCount}
        starPowerPerStar={starPowerPerStar}
        starClicksTriggered={starClicksTriggered}
        onBuyStar={handleBuyStar}
        starCost={starCost}
        totalStarsLps={totalStarsLps}
        formatCompactNumber={formatCompactNumber}
        moonsCount={moonsCount}
        onMergeMoons={handleMergeMoons}
        prestigeCount={prestigeCount}
        maxMoons={maxMoons}
        constellations={constellations}
        onInvestConstellation={handleInvestConstellation}
      />

      <CraftingModal
        isOpen={showCraftingModal}
        onClose={() => setShowCraftingModal(false)}
        isNight={isNightStyle}
        life={life}
        starsCount={starsCount}
        moonsCount={moonsCount}
        glitterDust={glitterDust}
        shootingStarsCount={shootingStarsCount}
        craftedItems={craftedItems}
        onCraftItem={handleCraftItem}
        formatCompactNumber={formatCompactNumber}
      />

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        totalLifeEarned={totalLifeEarned}
        clicksCount={clicksCount}
        totalStarsLps={totalStarsLps}
        secondsPlayed={secondsPlayed}
        purchasedAnimals={purchasedAnimals}
        starsCount={starsCount}
        planetLevel={planetLevel}
        totalLps={totalLps}
        prestigeCount={prestigeCount}
        formatCompactNumber={formatCompactNumber}
        formatTimePlayed={formatTimePlayed}
      />

      <OfflineEarningsModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        secondsAway={offlineSeconds}
        offlineLps={offlineLpsRate}
        earnedLife={offlineEarnedLife}
        prestigeCount={prestigeCount}
        onClaim={handleClaimOfflineEarnings}
        formatCompactNumber={formatCompactNumber}
        isNight={isNightStyle}
      />

      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        isNight={isNightStyle}
        achievements={achievements}
        unlockedAchievementsCount={unlockedAchievementsCount}
        achievementCategoryFilter={achievementCategoryFilter}
        setAchievementCategoryFilter={setAchievementCategoryFilter}
        achievementSearch={achievementSearch}
        setAchievementSearch={setAchievementSearch}
        life={life}
        formatCompactNumber={formatCompactNumber}
        playUpgrade={playUpgrade}
      />

      <MusicSettingsModal
        isOpen={showMusicSettingsModal}
        onClose={() => setShowMusicSettingsModal(false)}
        isNight={isNightStyle}
        musicStyleState={musicStyleState}
        setMusicStyleState={setMusicStyleState}
        isLowMemory={isLowMemory}
        setIsLowMemory={setIsLowMemory}
      />

      <CloudSyncModal
        isOpen={showCloudSyncModal}
        onClose={() => setShowCloudSyncModal(false)}
        user={user}
        authLoading={authLoading}
        syncing={syncing}
        lastSynced={lastSynced}
        onLogin={loginWithGoogle}
        onLogout={logout}
        onForceSave={() => {
          saveStateToCloud({
            life,
            totalLifeEarned,
            starsCount,
            purchasedAnimals,
            purchasedUpgrades,
            planetLevel,
            planetExp,
            clicksCount,
            starClicksTriggered,
            secondsPlayed,
            unlockedCosmetics,
            activeStarColor,
            activeAccessory,
            activeFrame,
            activeMoonSkin,
            shootingStarsCount,
            missionSetNumber,
            claimedMissionIds,
            missionsCooldownEnd,
            prestigeCount,
            moonsCount,
            constellations,
          });
        }}
        onForceLoad={() => {
          if (cloudSaveFound) {
            triggerCloudStateLoad(cloudSaveFound);
          }
        }}
        localStats={{
          life,
          totalLifeEarned,
          planetLevel,
          secondsPlayed,
          prestigeCount,
          moonsCount,
          purchasedUpgrades,
        }}
        cloudStats={cloudSaveFound}
      />

      <SyncConflictDialog
        isOpen={showConflictDialog}
        cloudData={cloudSaveFound}
        localData={{
          life,
          planetLevel,
          secondsPlayed,
          prestigeCount,
          moonsCount,
          purchasedUpgrades,
        }}
        onKeepLocal={() => {
          forceLocalOverwriteCloud();
          setShowConflictDialog(false);
        }}
        onKeepCloud={() => {
          if (cloudSaveFound) {
            triggerCloudStateLoad(cloudSaveFound);
          }
          setShowConflictDialog(false);
        }}
      />

      <MissionsModal
        isOpen={showMissionsModal}
        onClose={() => setShowMissionsModal(false)}
        isNight={isNightStyle}
        clicksCount={clicksCount}
        totalAnimalsCount={totalAnimalsCount}
        starsCount={starsCount}
        missionSetNumber={missionSetNumber}
        claimedMissionIds={claimedMissionIds}
        missionsCooldownEnd={missionsCooldownEnd}
        onClaimReward={handleClaimMissionReward}
        activeFrame={activeFrame}
        unlockedCosmetics={unlockedCosmetics}
        purchasedUpgrades={purchasedUpgrades}
      />

      <InventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        isNight={isNightStyle}
        zodiac={activeZodiacId}
        shootingStarsCount={shootingStarsCount}
        unlockedCosmetics={unlockedCosmetics}
        activeStarColor={activeStarColor}
        activeAccessory={activeAccessory}
        activeFrame={activeFrame}
        activeMoonSkin={activeMoonSkin}
        onOpenShootingStar={handleOpenShootingStar}
        onApplyCosmetic={handleApplyCosmetic}
        glitterDust={glitterDust}
        purchasedUpgrades={purchasedUpgrades}
        cosmeticRarityLevels={cosmeticRarityLevels}
        onUnlockCosmeticDirect={handleUnlockCosmeticDirect}
        onUpgradeCosmeticRarity={handleUpgradeCosmeticRarity}
        craftedItems={craftedItems}
        onUseCraftedItem={handleUseCraftedItem}
        onSelectZodiac={handleSelectZodiac}
      />

      <ZodiacModal
        isOpen={showZodiacModal}
        onClose={() => setShowZodiacModal(false)}
        isNight={isNightStyle}
        activeZodiacId={activeZodiacId || "katze"}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserId={user?.uid}
        formatCompactNumber={formatCompactNumber}
      />

      <PrestigeModal
        isOpen={showPrestigeModal}
        onClose={() => setShowPrestigeModal(false)}
        isNight={isNightStyle}
        life={life}
        prestigeCount={prestigeCount}
        onPrestigeConfirm={handleConfirmPrestige}
        formatCompactNumber={formatCompactNumber}
      />

      {/* Dynamic Autosave Toast Indicator */}
      <AnimatePresence>
        {autosaveNotification && autosaveNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-colors ${
              autosaveNotification.success
                ? "bg-[#163a24]/90 border-emerald-400 text-emerald-100"
                : "bg-[#2c1328]/90 border-[#ff9db8] text-rose-100"
            }`}
          >
            {autosaveNotification.success ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <span className="text-xs text-emerald-400">✓</span>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center animate-spin">
                <span className="text-[10px] text-rose-350">⏳</span>
              </div>
            )}
            <div>
              <p className="font-sans font-black text-xs leading-none">
                {autosaveNotification.success ? "AUTOMATISCH GESPEICHERT" : "AUTO-SPEICHERUNG..."}
              </p>
              <p className="font-mono text-[9px] text-[#ab9fd2] mt-0.5">
                {autosaveNotification.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black Hole Result Dialog */}
      <AnimatePresence>
        {blackHoleResult && blackHoleResult.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              id="blackhole-result-dialog"
              className={`w-full max-w-md p-6 rounded-3xl border-3 shadow-[0_0_50px_rgba(147,51,234,0.4)] text-center relative overflow-hidden transition-all ${
                blackHoleResult.outcomeType === "good"
                  ? "bg-gradient-to-b from-[#1c0d3a] via-[#0d0722] to-black border-purple-500 text-purple-100"
                  : "bg-gradient-to-b from-[#1a070e] via-[#0c0307] to-black border-rose-800 text-rose-100"
              }`}
            >
              {/* Spinning/pulsing decorative backdrop glows */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

              <div className="w-20 h-20 mx-auto rounded-full bg-black/60 border border-purple-500/50 flex items-center justify-center text-4xl mb-4 shadow-[0_0_20px_rgba(147,51,234,0.3)] animate-pulse relative">
                {blackHoleResult.outcomeType === "good" ? "✨" : "🕳️"}
                <span className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-25"></span>
              </div>

              <span className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border leading-none shadow-sm ${
                blackHoleResult.outcomeType === "good"
                  ? "bg-[#180d38]/60 border-purple-500/30 text-purple-300"
                  : "bg-[#1a070e]/60 border-rose-800/30 text-rose-300"
              }`}>
                {blackHoleResult.outcomeType === "good" ? "🌌 Kosmischer Segen" : "🌀 Gravitativer Verlust"}
              </span>

              <h3 className="font-sans font-black text-lg uppercase mt-3 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-rose-300">
                {blackHoleResult.title}
              </h3>

              <p className="text-xs font-semibold leading-relaxed mt-3 px-2 text-slate-300">
                {blackHoleResult.text}
              </p>

              <button
                id="btn-close-blackhole-result"
                onClick={() => setBlackHoleResult(null)}
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none border shadow-md active:scale-98 ${
                  blackHoleResult.outcomeType === "good"
                    ? "bg-purple-900/50 border-purple-400/50 hover:bg-purple-800 text-purple-100 shadow-purple-500/10"
                    : "bg-rose-950/45 border-rose-700/50 hover:bg-rose-900 text-rose-100 shadow-rose-950/15"
                }`}
              >
                Ereignishorizont verlassen
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
