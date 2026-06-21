import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

import { Animal, FloatingText, GameState, Upgrade, PlanetTask, ActiveCosmicEvent } from "./types";
import {
  INITIAL_ANIMALS,
  calculateCost,
  formatCompactNumber,
  getPrestigeRequirement,
} from "./data";
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
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { Cloud, Trophy } from "lucide-react";
import { calculateOfflineLps } from "./utils/offline";
import { SAVE_KEY, migrateSave, withSaveVersion } from "./utils/persistence";
import { generateMissionsForSet } from "./data/missions";
import { TutorialModal } from "./components/modals/TutorialModal";
import { GalaxyVoyageModal } from "./components/modals/GalaxyVoyageModal";
import { GalaxyShardsShopModal } from "./components/modals/GalaxyShardsShopModal";

// Modularized UI Components
import { CosmicHeader } from "./components/CosmicHeader";
import { GameModalsContainer } from "./components/GameModalsContainer";
import { ModalSettingsProvider } from "./components/ui/Modal";
import { GameStateProvider, GameStateValue } from "./contexts/GameStateContext";
import { BackgroundCompanions } from "./components/BackgroundCompanions";
import { EventBackgrounds } from "./components/EventBackgrounds";
import { LoadingScreen } from "./components/LoadingScreen";
import { CosmicFooter } from "./components/CosmicFooter";
import { useAudioSettings } from "./hooks/useAudioSettings";
import { useDisplayPreferences } from "./hooks/useDisplayPreferences";
import { useFloatingTexts } from "./hooks/useFloatingTexts";
import { useModalState } from "./hooks/useModalState";
import { useWorkerVisibility } from "./hooks/useWorkerVisibility";
import { useOfflineEarnings } from "./hooks/useOfflineEarnings";
import { applyWorkerEvent, type WorkerEventHandlers } from "./game/applyWorkerEvent";
import { CosmicOverlays } from "./components/CosmicOverlays";
import { InteractiveCosmos } from "./components/InteractiveCosmos";

// Static level bounds (significantly increased to slow down progression)
const EXP_PER_LEVEL = [
  0, 1500, 5000, 18000, 60000, 220000, 850000, 3200000, 12000000, 45000000, 160000000, 550000000,
  1800000000, 6000000000, 20000000000, 65000000000, 200000000000, 600000000000, 1800000000000,
  5000000000000,
];

export default function App() {
  // Loaded state guards
  const [isLoaded, setIsLoaded] = useState(false);

  const { isMutedState, musicVolumeState, musicStyleState, setMusicStyleState, handleToggleMute } =
    useAudioSettings();

  // 1. Primary Game Engine State
  const [life, setLife] = useState<number>(0);
  const [totalLifeEarned, setTotalLifeEarned] = useState<number>(0);
  const [purchasedAnimals, setPurchasedAnimals] = useState<Record<string, number>>({});
  const [starsCount, setStarsCount] = useState<number>(0);
  const [moonsCount, setMoonsCount] = useState<number>(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<string[]>([]);
  const [planetLevel, setPlanetLevel] = useState<number>(1);
  const [planetExp, setPlanetExp] = useState<number>(0);
  const [planetTask, setPlanetTask] = useState<PlanetTask | undefined>(undefined);
  const [clicksCount, setClicksCount] = useState<number>(0);
  const [starClicksTriggered, setStarClicksTriggered] = useState<number>(0);
  const [secondsPlayed, setSecondsPlayed] = useState<number>(0);

  // Day/Night Cycle States (Default to relaxing dark-pastel Night)
  const [isNight, setIsNight] = useState<boolean>(true);
  const [cycleProgress, setCycleProgress] = useState<number>(0);

  // UI States
  // Offline earnings (state + one-shot on-load check owned by the hook)
  const {
    offlineSeconds,
    setOfflineSeconds,
    offlineLpsRate,
    setOfflineLpsRate,
    offlineEarnedLife,
    setOfflineEarnedLife,
  } = useOfflineEarnings(isLoaded);

  // All modal / dialog / overlay visibility flags + simple openers
  const {
    showAnimalsModal,
    setShowAnimalsModal,
    showStarsModal,
    setShowStarsModal,
    showStatsModal,
    setShowStatsModal,
    showMusicSettingsModal,
    setShowMusicSettingsModal,
    showCloudSyncModal,
    setShowCloudSyncModal,
    showLeaderboardModal,
    setShowLeaderboardModal,
    showCraftingModal,
    setShowCraftingModal,
    showGalaxyShardsShop,
    setShowGalaxyShardsShop,
    showMissionsModal,
    setShowMissionsModal,
    showInventoryModal,
    setShowInventoryModal,
    showPrestigeModal,
    setShowPrestigeModal,
    showVoyageModal,
    setShowVoyageModal,
    showZodiacModal,
    setShowZodiacModal,
    showOfflineModal,
    setShowOfflineModal,
    showResetDialog,
    setShowResetDialog,
    showRepairDialog,
    setShowRepairDialog,
    showCheatEventModal,
    setShowCheatEventModal,
    showTutorial,
    setShowTutorial,
    showUpgradesModal,
    setShowUpgradesModal,
    showAchievementsModal,
    setShowAchievementsModal,
    openPrestigeModal,
    openOfflineModal,
    openZodiacModal,
    openAnimalsModal,
    openCraftingModal,
    openStarsModal,
    openUpgradesModal,
    openAchievementsModal,
    openStatsModal,
    openMissionsModal,
    openInventoryModal,
  } = useModalState();

  // Display / performance preferences (low-memory toggle + reduced motion)
  const { isLowMemory, setIsLowMemory, disableAnimations } = useDisplayPreferences();

  // Floating "+N" reward particles (state + lifecycle owned by the hook)
  const { floatingTexts, setFloatingTexts, nextParticleId } = useFloatingTexts();

  const [craftedItems, setCraftedItems] = useState<Record<string, number>>({});
  const [constellations, setConstellations] = useState<Record<string, number>>({});
  const [autosaveNotification, setAutosaveNotification] = useState<{
    show: boolean;
    text: string;
    success: boolean;
  } | null>(null);

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
  const [galaxyShards, setGalaxyShards] = useState<number>(0);
  const [zodiacLevels, setZodiacLevels] = useState<Record<string, number>>({});
  const [slummerGlassLevel, setSlummerGlassLevel] = useState<number>(1);
  const [catalystLevel, setCatalystLevel] = useState<number>(0);
  const [doubleStellarLevel, setDoubleStellarLevel] = useState<number>(0);
  const [blackHoleSize, setBlackHoleSize] = useState<number>(1);
  const [blackHoleResult, setBlackHoleResult] = useState<{
    show: boolean;
    title: string;
    text: string;
    success: boolean;
    outcomeType?: "good" | "bad";
  } | null>(null);

  // Modals Visibility
  const [inGlitchGalaxy, setInGlitchGalaxy] = useState<boolean>(false);
  const [glitchPending, setGlitchPending] = useState<boolean>(false);
  const [unlockedGlitchGalaxy, setUnlockedGlitchGalaxy] = useState<boolean>(false);
  const [spentGalaxyShards, setSpentGalaxyShards] = useState<number>(0);
  const [glitchBenchmarks, setGlitchBenchmarks] = useState<any>(undefined);
  const [glitchCooldown, setGlitchCooldown] = useState<boolean>(false);

  const [openingResult, setOpeningResult] = useState<{
    itemId: string;
    itemName: string;
    itemEmoji: string;
    count: number;
    rewards: {
      lifeGained: number;
      starsGained: number;
      moonsGained: number;
      glitterGained: number;
      lootboxesGained: number;
      xpGained: number;
      prestigeGained: number;
      unlockedCosmeticsList: {
        id: string;
        name: string;
        emoji: string;
        duplicateRefund: boolean;
      }[];
      animalsSpawned: Record<string, number>;
      eventsTriggered: string[];
    };
  } | null>(null);

  const handleClaimOfflineEarnings = useCallback((earnedLife: number) => {
    playBuy();

    setLife((prevLife) => {
      const updatedLife = prevLife + earnedLife;
      setTotalLifeEarned((prevTotal) => {
        const updatedTotalLife = prevTotal + earnedLife;
        workerRef.current?.postMessage({
          type: "INIT",
          savedState: { life: updatedLife, totalLifeEarned: updatedTotalLife },
        });
        return updatedTotalLife;
      });
      return updatedLife;
    });

    setOfflineSeconds(0);
    setOfflineLpsRate(0);
    setOfflineEarnedLife(0);
    setShowOfflineModal(false);
  }, []);

  const glitchedFormatCompactNumber = useCallback(
    (num: number): string => {
      const normal = formatCompactNumber(num);
      if (!inGlitchGalaxy) return normal;

      // Scramble values to look broken/unstable
      const glitchSymbols = ["ø", "µ", "×", "‡", "■", "░", "█", "¥", "⧉"];
      const hash = Math.floor(Math.abs(num) * 12345) % 100;
      if (hash < 33) {
        const idx = hash % glitchSymbols.length;
        return normal + glitchSymbols[idx];
      } else if (hash < 66) {
        return normal.replace(/[0-9]/g, (char) => {
          const digit = parseInt(char, 10);
          return String.fromCharCode(0x2460 + digit); // Circled numbers ①, ②...
        });
      }
      return normal;
    },
    [inGlitchGalaxy],
  );

  const handleClaimMissionReward = useCallback(
    (missionId: string, starsReward: number) => {
      setClaimedMissionIds((prevClaimed) => {
        if (prevClaimed.includes(missionId)) return prevClaimed;
        playTick();

        const hasSetBonusSet = purchasedUpgrades.includes("upg-glitter-set");
        const sakuraSetComplete =
          hasSetBonusSet &&
          ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) =>
            unlockedCosmetics.includes(id),
          );
        const actualReward = sakuraSetComplete ? Math.ceil(starsReward * 1.2) : starsReward;

        const updatedClaimed = [...prevClaimed, missionId];

        setShootingStarsCount((prev) => {
          const nextCount = prev + actualReward;
          workerRef.current?.postMessage({ type: "UPDATE_SHOOTING_STARS", count: nextCount });
          workerRef.current?.postMessage({ type: "MISSION_CLAIMED" });
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
            createdAt: Date.now(),
          },
        ]);

        const currentMissions = generateMissionsForSet(missionSetNumber);
        const allClaimedNow = currentMissions.every((m) => updatedClaimed.includes(m.id));
        if (allClaimedNow) {
          const isFrosch = activeZodiacId === "frosch";
          const cooldownMs = isFrosch ? 2 * 60 * 1000 : 5 * 60 * 1000;
          setMissionsCooldownEnd(Date.now() + cooldownMs);
        }

        return updatedClaimed;
      });
    },
    [purchasedUpgrades, unlockedCosmetics, missionSetNumber, activeZodiacId],
  );

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

  const handleOpenShootingStar = useCallback(
    (cosmetic: any, alreadyUnlocked: boolean, refundAmt: number) => {
      playTick();
      setShootingStarsCount((prev) => {
        const nextCount = Math.max(0, prev - 1);
        workerRef.current?.postMessage({ type: "UPDATE_SHOOTING_STARS", count: nextCount });
        return nextCount;
      });

      if (alreadyUnlocked) {
        workerRef.current?.postMessage({ type: "ADD_GLITTER_DUST", amount: refundAmt });
        const pId = nextParticleId.current++;
        setFloatingTexts((prev) => [
          ...prev,
          {
            id: pId,
            x: 110,
            y: 110,
            text: `+${refundAmt} Glitzerstaub! ✨`,
            type: "star-click",
            createdAt: Date.now(),
          },
        ]);
      } else {
        workerRef.current?.postMessage({
          type: "UNLOCK_COSMETIC_LOOTBOX",
          cosmeticId: cosmetic.id,
        });
        setUnlockedCosmetics((prev) => [...prev, cosmetic.id]);
      }
    },
    [],
  );

  const handleApplyCosmetic = useCallback(
    (id: string, type: "star_color" | "planet_accessory" | "frame_style" | "moon_skin") => {
      playTick();
      if (type === "star_color") setActiveStarColor(id);
      else if (type === "planet_accessory") setActiveAccessory(id);
      else if (type === "frame_style") setActiveFrame(id);
      else if (type === "moon_skin") setActiveMoonSkin(id);
    },
    [],
  );

  const handleUnlockCosmeticDirect = useCallback((cosmeticId: string, cost: number) => {
    playTick();
    workerRef.current?.postMessage({ type: "UNLOCK_COSMETIC_DIRECT", cosmeticId, cost });
    const pId = nextParticleId.current++;
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: pId,
        x: 120,
        y: 90,
        text: `Freigeschaltet! ✨`,
        type: "star-click",
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const handleUpgradeCosmeticRarity = useCallback(
    (cosmeticId: string, targetRarity: string, cost: number) => {
      playTick();
      workerRef.current?.postMessage({
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
          createdAt: Date.now(),
        },
      ]);
    },
    [],
  );

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
  const activeConstellationsCount = Object.keys(constellations).reduce(
    (sum, key) => sum + (constellations[key] || 0),
    0,
  );

  // Selector for pending claim rewards
  const completedUnclaimedMissionsCount = useMemo(() => {
    return generateMissionsForSet(missionSetNumber).filter((m) => {
      const progress =
        m.type === "clicks" ? clicksCount : m.type === "animals" ? totalAnimalsCount : starsCount;
      return progress >= m.target && !claimedMissionIds.includes(m.id);
    }).length;
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
          savedState: migrateSave(data),
        });
        const fullSaveData = withSaveVersion({
          ...data,
          lastSavedAt: data.lastSavedAt || Date.now(),
        });
        localStorage.setItem(SAVE_KEY, JSON.stringify(fullSaveData));

        // Hydrate Cosmetics & Missions
        if (data.unlockedCosmetics) setUnlockedCosmetics(data.unlockedCosmetics);
        if (data.activeStarColor) setActiveStarColor(data.activeStarColor);
        if (data.activeAccessory) setActiveAccessory(data.activeAccessory);
        if (data.activeFrame) setActiveFrame(data.activeFrame);
        if (data.activeMoonSkin) setActiveMoonSkin(data.activeMoonSkin);
        if (data.shootingStarsCount !== undefined) setShootingStarsCount(data.shootingStarsCount);
        if (data.missionSetNumber !== undefined) setMissionSetNumber(data.missionSetNumber);
        if (data.claimedMissionIds) setClaimedMissionIds(data.claimedMissionIds);
        if (data.missionsCooldownEnd !== undefined)
          setMissionsCooldownEnd(data.missionsCooldownEnd);
        if (data.moonsCount !== undefined) setMoonsCount(data.moonsCount);
        if (data.constellations) setConstellations(data.constellations);
        if (data.craftedItems) setCraftedItems(data.craftedItems);
        if (data.glitterDust !== undefined) setGlitterDust(data.glitterDust);
        if (data.cosmeticRarityLevels) setCosmeticRarityLevels(data.cosmeticRarityLevels);
        if (data.blackHoleSize !== undefined) setBlackHoleSize(data.blackHoleSize || 1);
        if (data.zodiac !== undefined) setActiveZodiacId(data.zodiac);
        if (data.galaxyShards !== undefined) setGalaxyShards(data.galaxyShards || 0);
        if (data.zodiacLevels !== undefined) setZodiacLevels(data.zodiacLevels || {});
        if (data.slummerGlassLevel !== undefined) setSlummerGlassLevel(data.slummerGlassLevel || 1);
        if (data.catalystLevel !== undefined) setCatalystLevel(data.catalystLevel || 0);
        if (data.doubleStellarLevel !== undefined)
          setDoubleStellarLevel(data.doubleStellarLevel || 0);
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
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        savedStateObj = migrateSave(JSON.parse(saved));

        // Hydrate local cosmetics
        if (savedStateObj.unlockedCosmetics) setUnlockedCosmetics(savedStateObj.unlockedCosmetics);
        if (savedStateObj.activeStarColor) setActiveStarColor(savedStateObj.activeStarColor);
        if (savedStateObj.activeAccessory) setActiveAccessory(savedStateObj.activeAccessory);
        if (savedStateObj.activeFrame) setActiveFrame(savedStateObj.activeFrame);
        if (savedStateObj.activeMoonSkin) setActiveMoonSkin(savedStateObj.activeMoonSkin);
        if (savedStateObj.shootingStarsCount !== undefined)
          setShootingStarsCount(savedStateObj.shootingStarsCount);
        if (savedStateObj.missionSetNumber !== undefined)
          setMissionSetNumber(savedStateObj.missionSetNumber);
        if (savedStateObj.claimedMissionIds) setClaimedMissionIds(savedStateObj.claimedMissionIds);
        if (savedStateObj.missionsCooldownEnd !== undefined)
          setMissionsCooldownEnd(savedStateObj.missionsCooldownEnd);
        if (savedStateObj.moonsCount !== undefined) setMoonsCount(savedStateObj.moonsCount);
        if (savedStateObj.constellations) setConstellations(savedStateObj.constellations);
        if (savedStateObj.craftedItems) setCraftedItems(savedStateObj.craftedItems);
        if (savedStateObj.glitterDust !== undefined) setGlitterDust(savedStateObj.glitterDust);
        if (savedStateObj.cosmeticRarityLevels)
          setCosmeticRarityLevels(savedStateObj.cosmeticRarityLevels);
        setActiveZodiacId(savedStateObj.zodiac || "katze");
        if (savedStateObj.galaxyShards !== undefined)
          setGalaxyShards(savedStateObj.galaxyShards || 0);
        if (savedStateObj.zodiacLevels !== undefined)
          setZodiacLevels(savedStateObj.zodiacLevels || {});
        if (savedStateObj.slummerGlassLevel !== undefined)
          setSlummerGlassLevel(savedStateObj.slummerGlassLevel || 1);
        if (savedStateObj.catalystLevel !== undefined)
          setCatalystLevel(savedStateObj.catalystLevel || 0);
        if (savedStateObj.doubleStellarLevel !== undefined)
          setDoubleStellarLevel(savedStateObj.doubleStellarLevel || 0);
        if (savedStateObj.inGlitchGalaxy !== undefined)
          setInGlitchGalaxy(savedStateObj.inGlitchGalaxy);
        if (savedStateObj.glitchPending !== undefined)
          setGlitchPending(savedStateObj.glitchPending);
        if (savedStateObj.unlockedGlitchGalaxy !== undefined)
          setUnlockedGlitchGalaxy(savedStateObj.unlockedGlitchGalaxy);
        if (savedStateObj.spentGalaxyShards !== undefined)
          setSpentGalaxyShards(savedStateObj.spentGalaxyShards || 0);
        if (savedStateObj.glitchBenchmarks !== undefined)
          setGlitchBenchmarks(savedStateObj.glitchBenchmarks);
        if (savedStateObj.glitchCooldown !== undefined)
          setGlitchCooldown(savedStateObj.glitchCooldown);
      }
    } catch (e) {
      console.error("Failed to parse initial save for Web Worker:", e);
    }

    worker.postMessage({
      type: "INIT",
      savedState: savedStateObj,
    });

    // Fan worker events out into React state (logic lives in applyWorkerEvent).
    const workerEventHandlers: WorkerEventHandlers = {
      setLife,
      setTotalLifeEarned,
      setStarsCount,
      setMoonsCount,
      setPurchasedAnimals,
      setPurchasedUpgrades,
      setPlanetLevel,
      setPlanetExp,
      setPlanetTask,
      setClicksCount,
      setStarClicksTriggered,
      setSecondsPlayed,
      setIsNight,
      setCycleProgress,
      setActiveEvent,
      setEventTimeRemaining,
      setPrestigeCount,
      setGalaxyShards,
      setZodiacLevels,
      setSlummerGlassLevel,
      setCatalystLevel,
      setDoubleStellarLevel,
      setBlackHoleSize,
      setInGlitchGalaxy,
      setGlitchPending,
      setUnlockedGlitchGalaxy,
      setSpentGalaxyShards,
      setGlitchBenchmarks,
      setGlitchCooldown,
      setConstellations,
      setCraftedItems,
      setGlitterDust,
      setCosmeticRarityLevels,
      setActiveEventDecision,
      setActiveEventDetails,
      setUnlockedCosmetics,
      setShootingStarsCount,
      setActiveZodiacId,
      setCalculations,
      setAchievements,
      setIsLoaded,
      setOpeningResult,
      setBlackHoleResult,
      playTick,
      playPop,
      playLevelUp,
      setFloatingTexts,
      nextParticleId,
    };
    worker.onmessage = (e) => applyWorkerEvent(e.data, workerEventHandlers);

    // Clean up worker
    return () => {
      worker.postMessage({ type: "CLEANUP" });
      worker.terminate();
    };
  }, []);

  // Tab visibility — pause/resume the worker loop to avoid backlog + freeze on return
  useWorkerVisibility(workerRef);

  // Game stats tracking (hydrated by worker)
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<string>("all");
  const [achievementSearch, setAchievementSearch] = useState<string>("");

  // Cosmic Event System States
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [activeEventDecision, setActiveEventDecision] = useState<string | null>(null);
  const [activeEventDetails, setActiveEventDetails] = useState<ActiveCosmicEvent | null>(null);
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number>(120);

  const handleSelectEventDecision = useCallback((decision: string) => {
    workerRef.current?.postMessage({
      type: "SET_EVENT_DECISION",
      decision,
    });
  }, []);

  const handleBlackHoleGamble = useCallback((sacrificeType: "life" | "stars" | "dust") => {
    workerRef.current?.postMessage({
      type: "BLACK_HOLE_GAMBLE",
      sacrificeType,
    });
  }, []);

  // Easter egg keydown handler for "uguu" cheat
  useEffect(() => {
    let inputBuffer = "";
    const targetCode = "uguu";

    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard all hotkeys/cheats while Galaxy Voyage is active
      if (planetLevel >= 20) {
        return;
      }

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

          // Add 10% of maximum to the sleep/slummer jar
          const currentState = autoSaveStateRef.current || {};
          const currentOfflineSecs = currentState.offlineSeconds || 0;
          const currentSlummerLvl = currentState.slummerGlassLevel || slummerGlassLevel || 1;
          const maxOfflineHours = 5 + (currentSlummerLvl - 1) * 2;
          const maxOfflineSecs = maxOfflineHours * 60 * 60;
          const addedSecs = Math.floor(maxOfflineSecs * 0.1); // 10% of modern maximum
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
              text: "✨ Uguu-Magie erweckt: +1 Planeten-Level & +5 Prestige! 👑 ✨",
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
            },
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

  // Synchronize modal styling class directly with the body element
  useEffect(() => {
    const b = document.body;
    b.classList.forEach((c) => {
      if (c.startsWith("active-frame-")) b.classList.remove(c);
    });
    b.classList.add(`active-frame-${activeFrame}`);
  }, [activeFrame]);

  // Toggle low-memory body class so CSS can kill all GPU-heavy effects app-wide
  useEffect(() => {
    document.body.classList.toggle("low-memory", disableAnimations);
    return () => {
      document.body.classList.remove("low-memory");
    };
  }, [disableAnimations]);

  // Toggle glitch galaxy class directly on document body
  useEffect(() => {
    document.body.classList.toggle("glitch-galaxy-active", inGlitchGalaxy);
    return () => {
      document.body.classList.remove("glitch-galaxy-active");
    };
  }, [inGlitchGalaxy]);

  // Keep save variables stored in a ref so the autosave interval doesn't rebuild 50 times a second
  const autoSaveStateRef = useRef<any>(null);
  const lastCloudSyncTimeRef = useRef<number>(0);
  const showConflictRef = useRef(false);
  showConflictRef.current = showConflictDialog;
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
      galaxyShards,
      offlineSeconds,
      offlineLpsRate,
      offlineEarnedLife,
      constellations,
      craftedItems,
      glitterDust,
      cosmeticRarityLevels,
      blackHoleSize,
      activeZodiacId,
      zodiacLevels,
      slummerGlassLevel,
      catalystLevel,
      doubleStellarLevel,
      inGlitchGalaxy,
      glitchPending,
      unlockedGlitchGalaxy,
      spentGalaxyShards,
      glitchBenchmarks,
      glitchCooldown,
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
    galaxyShards,
    blackHoleSize,
    offlineSeconds,
    offlineLpsRate,
    offlineEarnedLife,
    constellations,
    craftedItems,
    glitterDust,
    cosmeticRarityLevels,
    activeZodiacId,
    zodiacLevels,
    slummerGlassLevel,
    catalystLevel,
    doubleStellarLevel,
    inGlitchGalaxy,
    glitchPending,
    unlockedGlitchGalaxy,
    spentGalaxyShards,
    glitchBenchmarks,
    glitchCooldown,
  ]);

  // Synchronize dynamic local saves and autosave intervals
  useEffect(() => {
    // Reset the gate so the first cloud sync waits a full minute after login
    // (avoids overwriting freshly loaded cloud data while the worker is still hydrating)
    lastCloudSyncTimeRef.current = Date.now();

    const saveState = async () => {
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
          galaxyShards: s.galaxyShards,
          offlineSeconds: s.offlineSeconds,
          offlineLpsRate: s.offlineLpsRate,
          offlineEarnedLife: s.offlineEarnedLife,
          constellations: s.constellations,
          craftedItems: s.craftedItems,
          glitterDust: s.glitterDust,
          cosmeticRarityLevels: s.cosmeticRarityLevels,
          blackHoleSize: s.blackHoleSize,
          zodiac: s.activeZodiacId,
          zodiacLevels: s.zodiacLevels,
          slummerGlassLevel: s.slummerGlassLevel,
          catalystLevel: s.catalystLevel,
          doubleStellarLevel: s.doubleStellarLevel,
          inGlitchGalaxy: s.inGlitchGalaxy,
          glitchPending: s.glitchPending,
          unlockedGlitchGalaxy: s.unlockedGlitchGalaxy,
          spentGalaxyShards: s.spentGalaxyShards,
          glitchBenchmarks: s.glitchBenchmarks,
          glitchCooldown: s.glitchCooldown,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(withSaveVersion(stateToSave)));

        // Sync with cloud every 60 seconds; skip while conflict dialog is open
        const now = Date.now();
        if (now - lastCloudSyncTimeRef.current >= 60000 && !showConflictRef.current) {
          lastCloudSyncTimeRef.current = now;

          setAutosaveNotification({
            show: true,
            text: user
              ? "Lokale Daten & Cloud-Synchronisierung werden übertragen..."
              : "Lokaler Spielfortschritt wird gesichert...",
            success: false,
          });

          try {
            if (user) {
              await saveStateToCloud(stateToSave);
            }
            setTimeout(() => {
              setAutosaveNotification({
                show: true,
                text: user
                  ? "Spielfortschritt in der Cloud gesichert! 🌌"
                  : "Lokaler Fortschritt im Browser gesichert! 💾",
                success: true,
              });
              setTimeout(() => {
                setAutosaveNotification((prev) => (prev ? { ...prev, show: false } : null));
              }, 3000);
            }, 850);
          } catch (e) {
            console.error("Autosave failed:", e);
            setAutosaveNotification({
              show: true,
              text: "Automatisches Speichern fehlgeschlagen.",
              success: false,
            });
            setTimeout(() => {
              setAutosaveNotification((prev) => (prev ? { ...prev, show: false } : null));
            }, 3000);
          }
        }
      } catch (e) {
        console.error("Autosave failed in dynamic interval:", e);
      }
    };

    const interval = setInterval(saveState, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // ----------------------------------------------------
  // Local Memoization calculations (Extremely light)
  // ----------------------------------------------------
  const animalDefs = INITIAL_ANIMALS;

  // Distribute companions randomly staying clear of planet center
  const backgroundCompanions = useMemo(() => {
    const list: {
      id: string;
      emoji: string;
      x: number;
      y: number;
      delay: number;
      scale: number;
      speed: number;
    }[] = [];
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
      while (attempts < 20 && Math.abs(x - 50) < 22 && Math.abs(y - 50) < 24) {
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
  const handlePlanetClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      playPop();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - 20;
      const y = e.clientY - rect.top - 20;

      workerRef.current?.postMessage({ type: "CLICK", x, y });

      const isKatze = activeZodiacId === "katze";
      const critChance = isKatze ? 0.2 : 0.05;
      const isCrit = Math.random() < critChance;
      const critMult = isKatze ? 7 : 3;
      const clickVal = isCrit ? clickPower * critMult : clickPower;
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
        return next.length > 15 ? next.slice(next.length - 15) : next;
      });
    },
    [activeZodiacId, clickPower, clickMultiplierForEvents],
  );

  const handleSpawningText = useCallback((txt: string, pType: "heart" | "click") => {
    const rx = 50 + Math.random() * 150;
    const ry = 40 + Math.random() * 50;
    const pId = nextParticleId.current++;
    setFloatingTexts((prev) => {
      const next = [
        ...prev,
        { id: pId, x: rx, y: ry, text: txt, type: pType, createdAt: Date.now() },
      ];
      return next.length > 15 ? next.slice(next.length - 15) : next;
    });
  }, []);

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

  // Memoized context value — changes only when a game scalar actually changes.
  // GameModalsContainer does NOT consume this context, so its React.memo holds
  // between ticks. Only the single open modal (which calls useGameState()) re-renders.
  const gameState = useMemo<GameStateValue>(
    () => ({
      life,
      totalLifeEarned,
      secondsPlayed,
      planetExp,
      planetLevel,
      prestigeCount,
      glitterDust,
      starsCount,
      moonsCount,
      shootingStarsCount,
      clicksCount,
      starClicksTriggered,
      totalLps,
      totalStarsLps,
      totalAnimalsLps,
      starPowerPerStar,
      totalAnimalsCount,
      unlockedAchievementsCount,
      starCost,
      maxMoons,
    }),
    [
      life,
      totalLifeEarned,
      secondsPlayed,
      planetExp,
      planetLevel,
      prestigeCount,
      glitterDust,
      starsCount,
      moonsCount,
      shootingStarsCount,
      clicksCount,
      starClicksTriggered,
      totalLps,
      totalStarsLps,
      totalAnimalsLps,
      starPowerPerStar,
      totalAnimalsCount,
      unlockedAchievementsCount,
      starCost,
      maxMoons,
    ],
  );

  const handleBuyStar = useCallback(() => {
    if (life < starCost) return;
    playBuy();
    workerRef.current?.postMessage({ type: "BUY_STAR", cost: starCost });
  }, [life, starCost]);

  const handleInvestConstellation = useCallback(
    (constellationId: string, starsCost: number, moonsCost: number) => {
      playBuy();
      workerRef.current?.postMessage({
        type: "INVEST_CONSTELLATION",
        constellationId,
        starsCost,
        moonsCost,
      });
    },
    [],
  );

  const handleCraftItem = useCallback((recipeId: string, count: number = 1) => {
    playUpgrade();
    workerRef.current?.postMessage({ type: "CRAFT_ITEM", recipeId, count });
  }, []);

  const handleCraftRecursive = useCallback((targetItemId: string, count: number = 1) => {
    playUpgrade();
    workerRef.current?.postMessage({ type: "CRAFT_RECURSIVE", targetItemId, count });
  }, []);

  const handleUseCraftedItem = useCallback((itemId: string, count: number = 1) => {
    playPop();
    workerRef.current?.postMessage({ type: "USE_CRAFTED_ITEM", itemId, count });
  }, []);

  const handleSelectZodiac = useCallback((zodiacId: string) => {
    playPop();
    workerRef.current?.postMessage({ type: "SET_ZODIAC", zodiacId });
  }, []);

  const handleMergeMoons = useCallback(() => {
    if (starsCount >= 50 && moonsCount < maxMoons) {
      workerRef.current?.postMessage({ type: "MERGE_MOONS" });
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
  }, [starsCount, moonsCount, maxMoons]);

  const handleBuyAnimal = useCallback(
    (animalId: string, cost: number, countToBuy: number) => {
      if (life < cost) return;
      playBuy();
      workerRef.current?.postMessage({ type: "BUY_ANIMAL", animalId, cost, countToBuy });
    },
    [life],
  );

  const handleBuyUpgradesBatch = useCallback(
    (list: { id: string; cost: number; isGlitter: boolean }[]) => {
      if (list.length === 0) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "BUY_UPGRADES_BATCH", upgradesList: list });
    },
    [],
  );

  const staticUpgrades = STATIC_UPGRADES;

  const handleBuyUpgrade = useCallback(
    (id: string, cost: number) => {
      if (life < cost || purchasedUpgrades.includes(id)) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "BUY_UPGRADE", id, cost });
    },
    [life, purchasedUpgrades],
  );

  const handleUpgradeZodiacLevel = useCallback(
    (id: string, cost: number) => {
      if (galaxyShards < cost) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "UPGRADE_ZODIAC_LEVEL", id, cost });
    },
    [galaxyShards],
  );

  const handleUpgradeSlummerGlass = useCallback(
    (cost: number) => {
      if (galaxyShards < cost) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "UPGRADE_SLUMMER_GLASS", cost });
    },
    [galaxyShards],
  );

  const handleUpgradeCatalyst = useCallback(
    (cost: number) => {
      if (galaxyShards < cost) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "UPGRADE_CATALYST", cost });
    },
    [galaxyShards],
  );

  const handleUpgradeDoubleStellar = useCallback(
    (cost: number) => {
      if (galaxyShards < cost) return;
      playUpgrade();
      workerRef.current?.postMessage({ type: "UPGRADE_DOUBLE_STELLAR", cost });
    },
    [galaxyShards],
  );

  // Full Game hard Reset trigger
  const handleGameReset = useCallback(() => {
    playLevelUp();
    localStorage.removeItem(SAVE_KEY);
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
  }, []);

  const handleEnterGlitchGalaxy = useCallback(() => {
    playLevelUp();
    workerRef.current?.postMessage({ type: "ENTER_GLITCH_GALAXY" });
  }, []);

  const handleRepairGlitchGalaxy = useCallback(() => {
    playLevelUp();
    workerRef.current?.postMessage({ type: "REPAIR_GLITCH_GALAXY" });
  }, []);

  const handleConfirmPrestige = useCallback(() => {
    if (planetLevel < 20 && life < getPrestigeRequirement(prestigeCount)) return;
    playLevelUp();
    if (inGlitchGalaxy) {
      handleRepairGlitchGalaxy();
    } else {
      workerRef.current?.postMessage({ type: "PRESTIGE" });
    }
    setShootingStarsCount((prev) => {
      const nextCount = prev + 1;
      workerRef.current?.postMessage({ type: "UPDATE_SHOOTING_STARS", count: nextCount });
      return nextCount;
    });
    setShowPrestigeModal(false);
    setShowVoyageModal(false);
  }, [planetLevel, life, prestigeCount, inGlitchGalaxy, handleRepairGlitchGalaxy]);

  // Stable force-save callback — reads current state from a ref so the identity
  // never changes even though the saved values are always fresh.
  const latestCloudSaveRef = useRef<any>({});
  latestCloudSaveRef.current = {
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
  };
  const handleForceSaveToCloud = useCallback(() => {
    saveStateToCloud(latestCloudSaveRef.current);
  }, [saveStateToCloud]);

  // Helper to view time played beautifully
  const formatTimePlayed = useCallback((totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts: string[] = [];
    if (hrs > 0) parts.push(`${hrs} Std.`);
    if (mins > 0 || hrs > 0) parts.push(`${mins} Min.`);
    parts.push(`${secs} Sek.`);
    return parts.join(" ");
  }, []);

  // Stable modal openers — defined once so memoized children never see new refs
  const closeTutorial = useCallback(() => setShowTutorial(false), []);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ModalSettingsProvider disableAnimations={disableAnimations}>
      <div
        className={`min-h-screen relative overflow-hidden transition-all duration-1000 ease-in-out flex flex-col font-sans scroll-smooth ${
          isNightStyle
            ? "bg-gradient-to-b from-cosmic-bg via-[#1b1535] to-[#0b0818] text-cosmic-text selection:bg-cosmic-pink selection:text-cosmic-bg"
            : ""
        } ${inGlitchGalaxy ? "glitch-bg shadow-[inset_0_0_80px_rgba(244,63,94,0.3)]" : ""}`}
      >
        {/* Scattered Ambient Background Animals (floating freely over the entire cosmos background) */}
        <BackgroundCompanions companions={backgroundCompanions} />

        {/* Dynamic Cosmic Event Background Overlays (visualized smoothly in background index) */}
        <EventBackgrounds activeEvent={activeEvent} isLowMemory={isLowMemory} />

        {/* 1. Header Area with Soft Pastel Colors */}
        <CosmicHeader
          isNightStyle={isNightStyle}
          showTutorial={showTutorial}
          life={life}
          galaxyShards={galaxyShards}
          isMutedState={isMutedState}
          user={user}
          handleToggleMute={handleToggleMute}
          setShowMusicSettingsModal={setShowMusicSettingsModal}
          setShowCloudSyncModal={setShowCloudSyncModal}
          setShowLeaderboardModal={setShowLeaderboardModal}
          setShowTutorial={setShowTutorial}
          setShowResetDialog={setShowResetDialog}
          formatCompactNumber={glitchedFormatCompactNumber}
          prestigeCount={prestigeCount}
          onOpenGalaxyShardsShop={() => {
            playUpgrade();
            setShowGalaxyShardsShop(true);
          }}
          inGlitchGalaxy={inGlitchGalaxy}
        />

        {/* 2. Immersive Centered Master View (Planet takes center stage with plenty of room around it) */}
        <InteractiveCosmos
          isNightStyle={isNightStyle}
          showTutorial={showTutorial}
          life={life}
          totalLps={totalLps}
          starsCount={starsCount}
          prestigeCount={prestigeCount}
          glitchedFormatCompactNumber={glitchedFormatCompactNumber}
          activeEvent={activeEvent}
          activeEventDecision={activeEventDecision}
          activeEventDetails={activeEventDetails}
          eventTimeRemaining={eventTimeRemaining}
          handleSelectEventDecision={handleSelectEventDecision}
          glitterDust={glitterDust}
          blackHoleSize={blackHoleSize}
          handleBlackHoleGamble={handleBlackHoleGamble}
          inGlitchGalaxy={inGlitchGalaxy}
          planetLevel={planetLevel}
          setShowVoyageModal={setShowVoyageModal}
          isNight={isNight}
          cycleProgress={cycleProgress}
          offlineEarnedLife={offlineEarnedLife}
          offlineSeconds={offlineSeconds}
          openOfflineModal={openOfflineModal}
          planetExp={planetExp}
          planetExpNeeded={planetExpNeeded}
          planetTask={planetTask}
          moonsCount={moonsCount || 0}
          starPowerPerStar={starPowerPerStar}
          handlePlanetClick={handlePlanetClick}
          activeStarColor={activeStarColor}
          activeAccessory={activeAccessory}
          activeMoonSkin={activeMoonSkin}
          isLowMemory={isLowMemory}
          activeZodiacId={activeZodiacId}
          openZodiacModal={openZodiacModal}
          floatingTexts={floatingTexts}
          clickPower={clickPower}
          openAnimalsModal={openAnimalsModal}
          openCraftingModal={openCraftingModal}
          openStarsModal={openStarsModal}
          openUpgradesModal={openUpgradesModal}
          openAchievementsModal={openAchievementsModal}
          openStatsModal={openStatsModal}
          openMissionsModal={openMissionsModal}
          openInventoryModal={openInventoryModal}
          disableAnimations={disableAnimations}
          totalAnimalsCount={totalAnimalsCount}
          researchedUpgradesCount={researchedUpgradesCount}
          unlockedAchievementsCount={unlockedAchievementsCount}
          achievementsLength={achievements.length}
          completedUnclaimedMissionsCount={completedUnclaimedMissionsCount}
          shootingStarsCount={shootingStarsCount}
          activeConstellationsCount={activeConstellationsCount}
        />

        {showTutorial && (
          <TutorialModal
            isOpen={showTutorial}
            onClose={() => setShowTutorial(false)}
            isNight={isNightStyle}
          />
        )}

        {/* 4. Footer credits with minimalist elements */}
        <CosmicFooter />

        <GameStateProvider value={gameState}>
          <GameModalsContainer
            showResetDialog={showResetDialog}
            setShowResetDialog={setShowResetDialog}
            showCheatEventModal={showCheatEventModal}
            setShowCheatEventModal={setShowCheatEventModal}
            showUpgradesModal={showUpgradesModal}
            setShowUpgradesModal={setShowUpgradesModal}
            showAnimalsModal={showAnimalsModal}
            setShowAnimalsModal={setShowAnimalsModal}
            showStarsModal={showStarsModal}
            setShowStarsModal={setShowStarsModal}
            showCraftingModal={showCraftingModal}
            setShowCraftingModal={setShowCraftingModal}
            showStatsModal={showStatsModal}
            setShowStatsModal={setShowStatsModal}
            showOfflineModal={showOfflineModal}
            setShowOfflineModal={setShowOfflineModal}
            showAchievementsModal={showAchievementsModal}
            setShowAchievementsModal={setShowAchievementsModal}
            showMusicSettingsModal={showMusicSettingsModal}
            setShowMusicSettingsModal={setShowMusicSettingsModal}
            showCloudSyncModal={showCloudSyncModal}
            setShowCloudSyncModal={setShowCloudSyncModal}
            showConflictDialog={showConflictDialog}
            setShowConflictDialog={setShowConflictDialog}
            showMissionsModal={showMissionsModal}
            setShowMissionsModal={setShowMissionsModal}
            openingResult={openingResult}
            setOpeningResult={setOpeningResult}
            showInventoryModal={showInventoryModal}
            setShowInventoryModal={setShowInventoryModal}
            showZodiacModal={showZodiacModal}
            setShowZodiacModal={setShowZodiacModal}
            showLeaderboardModal={showLeaderboardModal}
            setShowLeaderboardModal={setShowLeaderboardModal}
            showPrestigeModal={showPrestigeModal}
            setShowPrestigeModal={setShowPrestigeModal}
            handleGameReset={handleGameReset}
            workerRef={workerRef}
            handleBuyUpgrade={handleBuyUpgrade}
            handleBuyUpgradesBatch={handleBuyUpgradesBatch}
            handleBuyAnimal={handleBuyAnimal}
            handleBuyStar={handleBuyStar}
            handleMergeMoons={handleMergeMoons}
            handleInvestConstellation={handleInvestConstellation}
            handleCraftItem={handleCraftItem}
            handleCraftRecursive={handleCraftRecursive}
            handleClaimOfflineEarnings={handleClaimOfflineEarnings}
            handleClaimMissionReward={handleClaimMissionReward}
            handleOpenShootingStar={handleOpenShootingStar}
            handleApplyCosmetic={handleApplyCosmetic}
            handleUnlockCosmeticDirect={handleUnlockCosmeticDirect}
            handleUpgradeCosmeticRarity={handleUpgradeCosmeticRarity}
            handleUseCraftedItem={handleUseCraftedItem}
            handleSelectZodiac={handleSelectZodiac}
            handleConfirmPrestige={handleConfirmPrestige}
            onForceSave={handleForceSaveToCloud}
            purchasedUpgrades={purchasedUpgrades}
            staticUpgrades={STATIC_UPGRADES}
            purchasedAnimals={purchasedAnimals}
            constellations={constellations}
            isNightStyle={isNightStyle}
            craftedItems={craftedItems}
            formatCompactNumber={glitchedFormatCompactNumber}
            formatTimePlayed={formatTimePlayed}
            offlineSeconds={offlineSeconds}
            offlineLpsRate={offlineLpsRate}
            offlineEarnedLife={offlineEarnedLife}
            achievements={achievements}
            achievementCategoryFilter={achievementCategoryFilter}
            setAchievementCategoryFilter={setAchievementCategoryFilter}
            achievementSearch={achievementSearch}
            setAchievementSearch={setAchievementSearch}
            playUpgrade={playUpgrade}
            musicStyleState={musicStyleState}
            setMusicStyleState={setMusicStyleState}
            isLowMemory={isLowMemory}
            setIsLowMemory={setIsLowMemory}
            user={user}
            authLoading={authLoading}
            syncing={syncing}
            lastSynced={lastSynced}
            loginWithGoogle={loginWithGoogle}
            logout={logout}
            cloudSaveFound={cloudSaveFound}
            triggerCloudStateLoad={triggerCloudStateLoad}
            forceLocalOverwriteCloud={forceLocalOverwriteCloud}
            missionSetNumber={missionSetNumber}
            claimedMissionIds={claimedMissionIds}
            missionsCooldownEnd={missionsCooldownEnd}
            activeFrame={activeFrame}
            unlockedCosmetics={unlockedCosmetics}
            activeStarColor={activeStarColor}
            activeAccessory={activeAccessory}
            activeMoonSkin={activeMoonSkin}
            activeZodiacId={activeZodiacId}
            cosmeticRarityLevels={cosmeticRarityLevels}
            upgradesSpecs={upgradesSpecs}
          />

          <GalaxyShardsShopModal
            isOpen={showGalaxyShardsShop}
            onClose={() => setShowGalaxyShardsShop(false)}
            galaxyShards={galaxyShards}
            zodiacLevels={zodiacLevels}
            slummerGlassLevel={slummerGlassLevel}
            catalystLevel={catalystLevel}
            doubleStellarLevel={doubleStellarLevel}
            onUpgradeZodiacLevel={handleUpgradeZodiacLevel}
            onUpgradeSlummerGlass={handleUpgradeSlummerGlass}
            onUpgradeCatalyst={handleUpgradeCatalyst}
            onUpgradeDoubleStellar={handleUpgradeDoubleStellar}
          />
        </GameStateProvider>

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
                  : "bg-[#2c1328]/90 border-cosmic-pink text-rose-100"
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
                <p className="font-mono text-[9px] text-cosmic-accent-muted mt-0.5">
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

                <span
                  className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border leading-none shadow-sm ${
                    blackHoleResult.outcomeType === "good"
                      ? "bg-[#180d38]/60 border-purple-500/30 text-purple-300"
                      : "bg-[#1a070e]/60 border-rose-800/30 text-rose-300"
                  }`}
                >
                  {blackHoleResult.outcomeType === "good"
                    ? "🌌 Kosmischer Segen"
                    : "🌀 Gravitativer Verlust"}
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

      <CosmicOverlays
        planetLevel={planetLevel}
        inGlitchGalaxy={inGlitchGalaxy}
        glitchPending={glitchPending}
        showRepairDialog={showRepairDialog}
        setShowRepairDialog={setShowRepairDialog}
        setShowVoyageModal={setShowVoyageModal}
        handleEnterGlitchGalaxy={handleEnterGlitchGalaxy}
        handleRepairGlitchGalaxy={handleRepairGlitchGalaxy}
      />

      <GalaxyVoyageModal
        isOpen={showVoyageModal}
        prestigeCount={prestigeCount}
        onConfirmVoyage={handleConfirmPrestige}
        inGlitchGalaxy={inGlitchGalaxy}
      />
    </ModalSettingsProvider>
  );
}
