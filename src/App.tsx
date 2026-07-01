import React, { startTransition, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

import {
  PlanetTask,
  ActiveCosmicEvent,
  PlacedAnimal,
  FloatingText,
  Achievement,
  GameSaveSnapshot,
} from "./types";
import type {
  CalculationsSnapshot,
  GlitchBenchmarks,
  OpeningResult,
  BlackHoleResultState,
} from "./game/protocol";
import type { CosmeticItem } from "./data/cosmetics";
import {
  INITIAL_ANIMALS,
  calculateCost,
  formatCompactNumber,
  getPrestigeRequirement,
} from "./data";
import { GehegeModal } from "./components/modals/GehegeModal";
import { playPop, playBuy, playUpgrade, playTick, playLevelUp } from "./utils/audio";

import { STATIC_UPGRADES } from "./data/upgrades";
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { calculateOfflineLps } from "./utils/offline";
import {
  migrateLegacyGlobalSave,
  migrateSave,
  normalizeCloudTimestamp,
  readSave,
  removeSave,
  writeMeta,
  writeSave,
} from "./utils/persistence";
import { generateMissionsForSet } from "./data/missions";
import { TutorialModal } from "./components/modals/TutorialModal";
const GalaxyVoyageModal = React.lazy(() =>
  import("./components/modals/GalaxyVoyageModal").then((m) => ({ default: m.GalaxyVoyageModal })),
);
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
const RogueliteScreen = React.lazy(() =>
  import("./components/roguelite/RogueliteScreen").then((m) => ({ default: m.RogueliteScreen })),
);
import {
  chooseEncounterOption,
  createNewRun,
  createRogueliteMetaState,
  finalizeRun,
  getActForStation,
  hasRenderableRoguelitePrimaryState,
  pickPath,
  rerollCurrentEncounter,
  selectVictoryRewards,
} from "./roguelite/engine";
import type { ActiveRogueliteRun, RogueliteMetaState, RogueliteViewState } from "./roguelite/types";
import { getMaxMoons } from "./game/maxMoons";

export default function App() {
  // Loaded state guards
  const [isLoaded, setIsLoaded] = useState(false);

  const { isMutedState, musicStyleState, setMusicStyleState, handleToggleMute } =
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
    showGehegeModal,
    setShowGehegeModal,
    openOfflineModal,
    openZodiacModal,
    openGehegeModal,
    openAnimalsModal,
    openCraftingModal,
    openStarsModal,
    openUpgradesModal,
    openAchievementsModal,
    openStatsModal,
    openMissionsModal,
    openInventoryModal,
  } = useModalState();

  // Display / performance preferences (low-memory toggle, font scale + reduced motion)
  const { isLowMemory, setIsLowMemory, fontScale, setFontScale, disableAnimations } =
    useDisplayPreferences();

  // Floating "+N" reward particles (state + lifecycle owned by the hook)
  const { floatingTexts, setFloatingTexts, nextParticleId } = useFloatingTexts();

  const [craftedItems, setCraftedItems] = useState<Record<string, number>>({});
  const [constellations, setConstellations] = useState<Record<string, number>>({});
  const [placedAnimals, setPlacedAnimals] = useState<PlacedAnimal[]>([]);
  const [animalLove, setAnimalLove] = useState<Record<string, number>>({});
  const [animalLastPet, setAnimalLastPet] = useState<Record<string, number>>({});
  const [bowlLastFed, setBowlLastFed] = useState<number>(0);
  const [bowlFedMinutesCredited, setBowlFedMinutesCredited] = useState<number>(0);

  // Mirror of the live enclosure cluster. Lets a same-owner cloud load that resolves late
  // re-merge it instead of wiping animals the player just placed (see hydrateClientStateFromSave).
  const liveEnclosureRef = useRef({ placedAnimals, animalLove, animalLastPet });
  liveEnclosureRef.current = { placedAnimals, animalLove, animalLastPet };
  const [autosaveNotification, setAutosaveNotification] = useState<{
    show: boolean;
    text: string;
    success: boolean;
  } | null>(null);

  // Calculated cache state from worker
  const [calculations, setCalculations] = useState<CalculationsSnapshot>({
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
    flatMoonLps: 0,
    totalLps: 0,
    totalAnimalsCount: 0,
    researchedUpgradesCount: 0,
    planetExpNeeded: 1500,
    prestigeCount: 0,
    prestigeMultiplier: 1,
    moonsCount: 0,
    zodiac: "katze",
    unlockedAchievementsCount: 0,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // 3. Missions & Cosmetics States
  const isNightStyle = true; // Design choice: the core game elements always adopt the beautiful night mode.
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([]);
  const [glitterDust, setGlitterDust] = useState<number>(0);
  const [cosmeticRarityLevels, setCosmeticRarityLevels] = useState<Record<string, string>>({});
  const [activeStarColor, setActiveStarColor] = useState<string>("default");
  const [activeAccessory, setActiveAccessory] = useState<string>("none");
  const [activeFrame, setActiveFrame] = useState<string>("default");
  const [activeMoonSkin, setActiveMoonSkin] = useState<string>("default");
  const [activePlanetSkin, setActivePlanetSkin] = useState<string>("default");
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
  const [blackHoleResult, setBlackHoleResult] = useState<BlackHoleResultState | null>(null);

  // Modals Visibility
  const [inGlitchGalaxy, setInGlitchGalaxy] = useState<boolean>(false);
  const [glitchPending, setGlitchPending] = useState<boolean>(false);
  const [unlockedGlitchGalaxy, setUnlockedGlitchGalaxy] = useState<boolean>(false);
  const [spentGalaxyShards, setSpentGalaxyShards] = useState<number>(0);
  const [glitchBenchmarks, setGlitchBenchmarks] = useState<GlitchBenchmarks | undefined>(undefined);
  const [glitchCooldown, setGlitchCooldown] = useState<boolean>(false);
  const [rogueliteMeta, setRogueliteMeta] = useState<RogueliteMetaState>(
    createRogueliteMetaState(),
  );
  const [activeRogueliteRun, setActiveRogueliteRun] = useState<ActiveRogueliteRun | null>(null);
  const [showRogueliteScreen, setShowRogueliteScreen] = useState(false);
  const [rogueliteViewState, setRogueliteViewState] = useState<RogueliteViewState>("intro");

  const [openingResult, setOpeningResult] = useState<OpeningResult | null>(null);

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
    [
      purchasedUpgrades,
      unlockedCosmetics,
      missionSetNumber,
      activeZodiacId,
      nextParticleId,
      setFloatingTexts,
    ],
  );

  // Warm the most-opened modal chunks once the browser is idle so the first
  // tap doesn't pay the lazy-load latency.
  useEffect(() => {
    if (!isLoaded) return;
    const warm = () => {
      void import("./components/modals/AnimalsModal");
      void import("./components/modals/UpgradesModal");
      void import("./components/modals/StarsModal");
    };
    const id = window.requestIdleCallback(warm, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }, [isLoaded]);

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
    (cosmetic: CosmeticItem, alreadyUnlocked: boolean, refundAmt: number) => {
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
    [nextParticleId, setFloatingTexts],
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

  const handleUnlockCosmeticDirect = useCallback(
    (cosmeticId: string, cost: number) => {
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
    },
    [nextParticleId, setFloatingTexts],
  );

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
          text: `Hoehere Seltenheit! 👑 (+5% Boost)`,
          type: "star-click",
          createdAt: Date.now(),
        },
      ]);
    },
    [nextParticleId, setFloatingTexts],
  );

  // Destructure calculation stats for ease of rendering in the TSX layout
  const upgradesSpecs = calculations.upgradesSpecs;
  const clickPower = calculations.clickPower;
  const clickMultiplierForEvents = calculations.clickMultiplierForEvents;
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
    accountSwitchPrompt,
    continueWithCurrentAccount,
    adoptPreviousLocalSave,
    saveStateToCloud,
    triggerCloudStateLoad,
  } = useFirebaseSync();
  const activeSaveOwnerId = user?.uid ?? null;
  const currentSaveOwnerRef = useRef<string | null>(null);

  // Offline earnings (state + one-shot on-load check owned by the hook)
  const {
    offlineSeconds,
    setOfflineSeconds,
    offlineLpsRate,
    setOfflineLpsRate,
    offlineEarnedLife,
    setOfflineEarnedLife,
  } = useOfflineEarnings(isLoaded, activeSaveOwnerId);

  // Defined here (after useOfflineEarnings) so the stable offline setters it depends on are already
  // in scope for the dependency array.
  const handleClaimOfflineEarnings = useCallback(
    (earnedLife: number) => {
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
    },
    [setOfflineEarnedLife, setOfflineLpsRate, setOfflineSeconds, setShowOfflineModal],
  );

  const resetHydratedClientState = useCallback(() => {
    setPlacedAnimals([]);
    setAnimalLove({});
    setAnimalLastPet({});
    setBowlLastFed(0);
    setBowlFedMinutesCredited(0);
    setUnlockedCosmetics([]);
    setActiveStarColor("default");
    setActiveAccessory("none");
    setActiveFrame("default");
    setActiveMoonSkin("default");
    setActivePlanetSkin("default");
    setShootingStarsCount(0);
    setMissionSetNumber(1);
    setClaimedMissionIds([]);
    setMissionsCooldownEnd(null);
    setMoonsCount(0);
    setConstellations({});
    setCraftedItems({});
    setGlitterDust(0);
    setCosmeticRarityLevels({});
    setBlackHoleSize(1);
    setActiveZodiacId("katze");
    setGalaxyShards(0);
    setZodiacLevels({});
    setSlummerGlassLevel(1);
    setCatalystLevel(0);
    setDoubleStellarLevel(0);
    setInGlitchGalaxy(false);
    setGlitchPending(false);
    setUnlockedGlitchGalaxy(false);
    setSpentGalaxyShards(0);
    setGlitchBenchmarks(undefined);
    setGlitchCooldown(false);
    setRogueliteMeta(createRogueliteMetaState());
    setActiveRogueliteRun(null);
  }, []);

  const hydrateClientStateFromSave = useCallback(
    (rawSave: GameSaveSnapshot | null, preserveEnclosure = false) => {
      resetHydratedClientState();
      if (!rawSave) {
        return null;
      }

      // Enclosure cluster: a same-owner cloud load that resolves late must not clobber animals
      // the player just placed. Prefer the incoming save, but when it carries no enclosure data
      // and we're preserving (same owner), keep the live state rather than the empty reset default.
      // An actual account switch arrives with preserveEnclosure=false and fully replaces.
      const live = liveEnclosureRef.current;
      const incomingPlaced = Array.isArray(rawSave.placedAnimals) ? rawSave.placedAnimals : [];
      if (incomingPlaced.length > 0) setPlacedAnimals(incomingPlaced);
      else if (preserveEnclosure && live.placedAnimals.length > 0)
        setPlacedAnimals(live.placedAnimals);

      const incomingLove = rawSave.animalLove;
      if (incomingLove && Object.keys(incomingLove).length > 0) setAnimalLove(incomingLove);
      else if (preserveEnclosure && Object.keys(live.animalLove).length > 0)
        setAnimalLove(live.animalLove);

      const incomingLastPet = rawSave.animalLastPet;
      if (incomingLastPet && Object.keys(incomingLastPet).length > 0)
        setAnimalLastPet(incomingLastPet);
      else if (preserveEnclosure && Object.keys(live.animalLastPet).length > 0)
        setAnimalLastPet(live.animalLastPet);

      if (rawSave.bowlLastFed !== undefined) setBowlLastFed(rawSave.bowlLastFed);
      if (rawSave.bowlFedMinutesCredited !== undefined)
        setBowlFedMinutesCredited(rawSave.bowlFedMinutesCredited);
      if (rawSave.unlockedCosmetics) setUnlockedCosmetics(rawSave.unlockedCosmetics);
      if (rawSave.activeStarColor) setActiveStarColor(rawSave.activeStarColor);
      if (rawSave.activeAccessory) setActiveAccessory(rawSave.activeAccessory);
      if (rawSave.activeFrame) setActiveFrame(rawSave.activeFrame);
      if (rawSave.activeMoonSkin) setActiveMoonSkin(rawSave.activeMoonSkin);
      if (rawSave.activePlanetSkin) setActivePlanetSkin(rawSave.activePlanetSkin);
      if (rawSave.shootingStarsCount !== undefined)
        setShootingStarsCount(rawSave.shootingStarsCount);
      if (rawSave.missionSetNumber !== undefined) setMissionSetNumber(rawSave.missionSetNumber);
      if (rawSave.claimedMissionIds) setClaimedMissionIds(rawSave.claimedMissionIds);
      if (rawSave.missionsCooldownEnd !== undefined)
        setMissionsCooldownEnd(rawSave.missionsCooldownEnd);
      if (rawSave.moonsCount !== undefined) setMoonsCount(rawSave.moonsCount);
      if (rawSave.constellations) setConstellations(rawSave.constellations);
      if (rawSave.craftedItems) setCraftedItems(rawSave.craftedItems);
      if (rawSave.glitterDust !== undefined) setGlitterDust(rawSave.glitterDust);
      if (rawSave.cosmeticRarityLevels) setCosmeticRarityLevels(rawSave.cosmeticRarityLevels);
      if (rawSave.blackHoleSize !== undefined) setBlackHoleSize(rawSave.blackHoleSize || 1);
      if (rawSave.zodiac !== undefined) setActiveZodiacId(rawSave.zodiac);
      if (rawSave.galaxyShards !== undefined) setGalaxyShards(rawSave.galaxyShards || 0);
      if (rawSave.zodiacLevels !== undefined) setZodiacLevels(rawSave.zodiacLevels || {});
      if (rawSave.slummerGlassLevel !== undefined)
        setSlummerGlassLevel(rawSave.slummerGlassLevel || 1);
      if (rawSave.catalystLevel !== undefined) setCatalystLevel(rawSave.catalystLevel || 0);
      if (rawSave.doubleStellarLevel !== undefined)
        setDoubleStellarLevel(rawSave.doubleStellarLevel || 0);
      if (rawSave.inGlitchGalaxy !== undefined) setInGlitchGalaxy(rawSave.inGlitchGalaxy);
      if (rawSave.glitchPending !== undefined) setGlitchPending(rawSave.glitchPending);
      if (rawSave.unlockedGlitchGalaxy !== undefined)
        setUnlockedGlitchGalaxy(rawSave.unlockedGlitchGalaxy);
      if (rawSave.spentGalaxyShards !== undefined)
        setSpentGalaxyShards(rawSave.spentGalaxyShards || 0);
      if (rawSave.glitchBenchmarks !== undefined) setGlitchBenchmarks(rawSave.glitchBenchmarks);
      if (rawSave.glitchCooldown !== undefined) setGlitchCooldown(rawSave.glitchCooldown);
      if (rawSave.rogueliteMeta) {
        const { equippedRelicIds: _legacyEquippedRelics, ...rogueliteMetaFromSave } =
          rawSave.rogueliteMeta as RogueliteMetaState & { equippedRelicIds?: string[] };
        setRogueliteMeta({
          ...createRogueliteMetaState(),
          ...rogueliteMetaFromSave,
        });
      }
      if (rawSave.activeRogueliteRun !== undefined) {
        const savedRun = rawSave.activeRogueliteRun;
        if (savedRun) {
          setActiveRogueliteRun({
            ...savedRun,
            currentAct:
              typeof savedRun.currentAct === "number"
                ? savedRun.currentAct
                : getActForStation(Math.max(1, savedRun.completedStations + 1)),
            boss: {
              ...savedRun.boss,
              stage: savedRun.boss?.stage ?? "final",
            },
          });
        } else {
          setActiveRogueliteRun(null);
        }
      }

      return rawSave;
    },
    [resetHydratedClientState],
  );

  const loadSaveIntoGame = useCallback(
    (rawData: unknown, ownerId: string | null) => {
      const savedState = migrateSave(rawData, ownerId);
      const cloudUpdatedAt =
        rawData && typeof rawData === "object" && !Array.isArray(rawData)
          ? normalizeCloudTimestamp((rawData as Record<string, unknown>).updatedAt)
          : null;
      const previousOwnerId = currentSaveOwnerRef.current;
      currentSaveOwnerRef.current = ownerId;
      writeMeta({ activeOwnerId: ownerId });
      hydrateClientStateFromSave(
        savedState as GameSaveSnapshot | null,
        previousOwnerId === ownerId,
      );
      setIsLoaded(false);

      workerRef.current?.postMessage({
        type: "INIT",
        savedState,
      });

      if (savedState) {
        writeSave(ownerId, {
          ...savedState,
          lastSavedAt: Number(savedState.lastSavedAt) || Date.now(),
          lastCloudUpdatedAt:
            cloudUpdatedAt ?? normalizeCloudTimestamp(savedState.lastCloudUpdatedAt),
        });
      }
    },
    [hydrateClientStateFromSave],
  );

  useEffect(() => {
    const handleFirebaseLoad = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data && workerRef.current) {
        loadSaveIntoGame(data, currentSaveOwnerRef.current);
      }
    };
    window.addEventListener("firebase-load-state", handleFirebaseLoad);
    return () => {
      window.removeEventListener("firebase-load-state", handleFirebaseLoad);
    };
  }, [loadSaveIntoGame]);

  useEffect(() => {
    // Instantiate web worker
    const worker = new Worker(new URL("./game.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

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
  }, [nextParticleId, setFloatingTexts]);

  useEffect(() => {
    if (!workerRef.current || authLoading) {
      return;
    }

    migrateLegacyGlobalSave();
    loadSaveIntoGame(readSave(activeSaveOwnerId), activeSaveOwnerId);
  }, [activeSaveOwnerId, authLoading, loadSaveIntoGame]);

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
  }, [
    planetLevel,
    slummerGlassLevel,
    setFloatingTexts,
    setOfflineEarnedLife,
    setOfflineLpsRate,
    setOfflineSeconds,
    setShowCheatEventModal,
  ]);

  // Interval to increment animal love when feeding is active
  useEffect(() => {
    if (!bowlLastFed) {
      if (bowlFedMinutesCredited !== 0) setBowlFedMinutesCredited(0);
      return;
    }

    const checkFeedingAccrual = () => {
      const elapsedMs = Date.now() - bowlLastFed;
      const currentElapsedMinutes = Math.min(25, Math.floor(elapsedMs / 60000));

      if (elapsedMs >= 25 * 60 * 1000) {
        // The 25 mins active window is over. Credit remaining up to 25.
        const uncreditedMinutes = 25 - bowlFedMinutesCredited;
        if (uncreditedMinutes > 0 && placedAnimals.length > 0) {
          setAnimalLove((prev) => {
            const updated = { ...prev };
            placedAnimals.forEach((pa) => {
              const currentLove = updated[pa.animalId] || 0;
              updated[pa.animalId] = Math.min(300, currentLove + uncreditedMinutes);
            });
            return updated;
          });
          setBowlFedMinutesCredited(25);
        }
        return;
      }

      const uncreditedMinutes = currentElapsedMinutes - bowlFedMinutesCredited;
      if (uncreditedMinutes > 0 && placedAnimals.length > 0) {
        setAnimalLove((prev) => {
          const updated = { ...prev };
          placedAnimals.forEach((pa) => {
            const currentLove = updated[pa.animalId] || 0;
            updated[pa.animalId] = Math.min(300, currentLove + uncreditedMinutes);
          });
          return updated;
        });
        setBowlFedMinutesCredited(currentElapsedMinutes);
      }
    };

    checkFeedingAccrual();

    const interval = setInterval(checkFeedingAccrual, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [bowlLastFed, placedAnimals, bowlFedMinutesCredited]);

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

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    document.documentElement.style.setProperty("--game-font-scale", `${fontScale / 100}`);
    return () => {
      document.documentElement.style.fontSize = "";
      document.documentElement.style.removeProperty("--game-font-scale");
    };
  }, [fontScale]);

  // Toggle glitch galaxy class directly on document body
  useEffect(() => {
    document.body.classList.toggle("glitch-galaxy-active", inGlitchGalaxy);
    return () => {
      document.body.classList.remove("glitch-galaxy-active");
    };
  }, [inGlitchGalaxy]);

  // Keep save variables stored in a ref so the autosave interval doesn't rebuild 50 times a second
  const autoSaveStateRef = useRef<GameSaveSnapshot | null>(null);
  const lastCloudSyncTimeRef = useRef<number>(0);
  const showAccountSwitchPromptRef = useRef(false);
  showAccountSwitchPromptRef.current = Boolean(accountSwitchPrompt);
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
      activePlanetSkin,
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
      placedAnimals,
      animalLove,
      animalLastPet,
      bowlLastFed,
      bowlFedMinutesCredited,
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
      rogueliteMeta,
      activeRogueliteRun,
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
    activePlanetSkin,
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
    placedAnimals,
    animalLove,
    animalLastPet,
    bowlLastFed,
    bowlFedMinutesCredited,
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
    rogueliteMeta,
    activeRogueliteRun,
  ]);

  // Keep the latest cloud-save fn in a ref so the autosave interval below can call the freshest
  // closure without listing the (unstable) `saveStateToCloud` as an effect dependency — otherwise
  // the 5s interval would be torn down and recreated on every render.
  const saveStateToCloudRef = useRef(saveStateToCloud);
  saveStateToCloudRef.current = saveStateToCloud;

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
          activePlanetSkin: s.activePlanetSkin,
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
          placedAnimals: s.placedAnimals,
          animalLove: s.animalLove,
          animalLastPet: s.animalLastPet,
          bowlLastFed: s.bowlLastFed,
          bowlFedMinutesCredited: s.bowlFedMinutesCredited,
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
          rogueliteMeta: s.rogueliteMeta,
          activeRogueliteRun: s.activeRogueliteRun,
          lastSavedAt: Date.now(),
        };
        writeSave(activeSaveOwnerId, stateToSave);

        // Sync with cloud every 60 seconds; skip while the account-switch dialog is open
        const now = Date.now();
        if (now - lastCloudSyncTimeRef.current >= 60000 && !showAccountSwitchPromptRef.current) {
          lastCloudSyncTimeRef.current = now;

          setAutosaveNotification({
            show: true,
            text: user
              ? "Lokale Daten & Cloud-Synchronisierung werden uebertragen..."
              : "Lokaler Spielfortschritt wird gesichert...",
            success: false,
          });

          try {
            if (user) {
              await saveStateToCloudRef.current(stateToSave);
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
  }, [activeSaveOwnerId, user]);

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
        const next: FloatingText[] = [
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
    [activeZodiacId, clickPower, clickMultiplierForEvents, nextParticleId, setFloatingTexts],
  );

  // Buy cute star
  const starCost = useMemo(() => {
    return calculateCost(50, starsCount, 1.4);
  }, [starsCount]);

  const maxMoons = useMemo(() => {
    return getMaxMoons({ purchasedUpgrades, zodiac: activeZodiacId });
  }, [activeZodiacId, purchasedUpgrades]);

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
      activeZodiacId,
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
      activeZodiacId,
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
  }, [starsCount, moonsCount, maxMoons, setFloatingTexts]);

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
    removeSave(currentSaveOwnerRef.current);
    writeMeta({ activeOwnerId: currentSaveOwnerRef.current });
    workerRef.current?.postMessage({
      type: "RESET",
    });

    // Clear every piece of hydrated client-side state — enclosure (placedAnimals), animal love,
    // cosmetics, missions, currencies, zodiac, glitch + roguelite state — then close the roguelite
    // screen. Previously handleGameReset reset only a handful of these fields by hand.
    resetHydratedClientState();
    setShowRogueliteScreen(false);

    setShowResetDialog(false);
  }, [setShowResetDialog, resetHydratedClientState]);

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
  }, [
    planetLevel,
    life,
    prestigeCount,
    inGlitchGalaxy,
    handleRepairGlitchGalaxy,
    setShowPrestigeModal,
    setShowVoyageModal,
  ]);

  // Stable force-save callback — reads current state from a ref so the identity
  // never changes even though the saved values are always fresh.
  const latestCloudSaveRef = useRef<GameSaveSnapshot>({});
  latestCloudSaveRef.current = {
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
    activePlanetSkin,
    shootingStarsCount,
    missionSetNumber,
    claimedMissionIds,
    missionsCooldownEnd,
    prestigeCount,
    galaxyShards,
    constellations,
    craftedItems,
    placedAnimals,
    animalLove,
    animalLastPet,
    bowlLastFed,
    bowlFedMinutesCredited,
    glitterDust,
    cosmeticRarityLevels,
    blackHoleSize,
    zodiac: activeZodiacId,
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
    rogueliteMeta,
    activeRogueliteRun,
    lastSavedAt: Date.now(),
  };
  const handleForceSaveToCloud = useCallback(() => {
    saveStateToCloud(latestCloudSaveRef.current);
  }, [saveStateToCloud]);

  const applyRogueliteFinalize = useCallback((result: ReturnType<typeof finalizeRun>) => {
    setRogueliteMeta(result.meta);
    setActiveRogueliteRun(null);
    setRogueliteViewState("intro");
    if (result.grantedShards > 0) {
      workerRef.current?.postMessage({ type: "ADD_GALAXY_SHARDS", amount: result.grantedShards });
    }
    if (result.grantedGlitterDust > 0) {
      workerRef.current?.postMessage({
        type: "ADD_GLITTER_DUST",
        amount: result.grantedGlitterDust,
      });
    }
    if (result.unlockedSkinId) {
      setActivePlanetSkin(result.unlockedSkinId);
    }
  }, []);

  const handleOpenRogueliteScreen = useCallback(() => {
    playUpgrade();
    startTransition(() => {
      setRogueliteViewState(
        activeRogueliteRun && hasRenderableRoguelitePrimaryState(activeRogueliteRun)
          ? "run"
          : "intro",
      );
      setShowRogueliteScreen(true);
    });
  }, [activeRogueliteRun]);

  const handleCloseRogueliteScreen = useCallback(() => {
    startTransition(() => {
      setShowRogueliteScreen(false);
    });
  }, []);

  const handleBeginRogueliteSetup = useCallback(() => {
    playPop();
    startTransition(() => {
      setRogueliteViewState("relic_select");
    });
  }, []);

  const handleOpenRogueliteArchive = useCallback(() => {
    playUpgrade();
    startTransition(() => {
      setRogueliteViewState("archive");
    });
  }, []);

  const handleBackToRogueliteIntro = useCallback(() => {
    playTick();
    startTransition(() => {
      setRogueliteViewState("intro");
    });
  }, []);

  const handleBackToRogueliteRelicSelect = useCallback(() => {
    playTick();
    startTransition(() => {
      setRogueliteViewState("relic_select");
    });
  }, []);

  const handleStartRogueliteRun = useCallback(
    (selectedRelicIds: string[]) => {
      playLevelUp();
      const nextRun = createNewRun(rogueliteMeta, selectedRelicIds);
      startTransition(() => {
        setActiveRogueliteRun(nextRun);
        setRogueliteViewState(hasRenderableRoguelitePrimaryState(nextRun) ? "run" : "relic_select");
      });
    },
    [rogueliteMeta],
  );

  const handleChooseRogueliteEncounter = useCallback((choiceId: string) => {
    playPop();
    startTransition(() => {
      setActiveRogueliteRun((prev) => (prev ? chooseEncounterOption(prev, choiceId) : prev));
    });
  }, []);

  const handleChooseRoguelitePath = useCallback((pathId: string) => {
    playPop();
    startTransition(() => {
      setActiveRogueliteRun((prev) => (prev ? pickPath(prev, pathId) : prev));
    });
  }, []);

  const handleRerollRogueliteEncounter = useCallback(() => {
    playUpgrade();
    startTransition(() => {
      setActiveRogueliteRun((prev) => (prev ? rerollCurrentEncounter(prev) : prev));
    });
  }, []);

  const handleClaimRogueliteVictory = useCallback(
    (selectedRelicId: string) => {
      if (!activeRogueliteRun) return;
      playLevelUp();
      const claimedRun = selectVictoryRewards(activeRogueliteRun, selectedRelicId);
      applyRogueliteFinalize(finalizeRun(rogueliteMeta, claimedRun));
    },
    [activeRogueliteRun, applyRogueliteFinalize, rogueliteMeta],
  );

  const handleClaimRogueliteDefeat = useCallback(() => {
    if (!activeRogueliteRun) return;
    playTick();
    applyRogueliteFinalize(finalizeRun(rogueliteMeta, activeRogueliteRun));
  }, [activeRogueliteRun, applyRogueliteFinalize, rogueliteMeta]);

  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: showRogueliteScreen ? "PAUSE_TIMERS" : "RESUME_TIMERS" });
  }, [showRogueliteScreen]);

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

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ModalSettingsProvider disableAnimations={disableAnimations}>
      <div
        className={`min-h-screen relative overflow-hidden transition-all duration-1000 ease-in-out flex flex-col font-sans scroll-smooth ${
          isNightStyle
            ? "bg-linear-to-b from-cosmic-bg via-cosmic-bg-mid to-cosmic-bg-deep text-cosmic-text selection:bg-cosmic-pink selection:text-cosmic-bg"
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
          onOpenRoguelite={handleOpenRogueliteScreen}
          hasActiveRogueliteRun={Boolean(activeRogueliteRun)}
          rogueliteRunStatus={activeRogueliteRun?.phase}
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
          activePlanetSkin={activePlanetSkin}
          isLowMemory={isLowMemory}
          activeZodiacId={activeZodiacId}
          openZodiacModal={openZodiacModal}
          floatingTexts={floatingTexts}
          clickPower={clickPower}
          openGehegeModal={openGehegeModal}
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

        {showRogueliteScreen && (
          <React.Suspense fallback={null}>
            <RogueliteScreen
              isOpen={showRogueliteScreen}
              viewState={rogueliteViewState}
              meta={rogueliteMeta}
              activeRun={activeRogueliteRun}
              onClose={handleCloseRogueliteScreen}
              onBeginRunSetup={handleBeginRogueliteSetup}
              onBackToIntro={handleBackToRogueliteIntro}
              onOpenArchive={handleOpenRogueliteArchive}
              onCloseArchive={handleBackToRogueliteRelicSelect}
              onStartRun={handleStartRogueliteRun}
              onChooseEncounter={handleChooseRogueliteEncounter}
              onChoosePath={handleChooseRoguelitePath}
              onRerollEncounter={handleRerollRogueliteEncounter}
              onClaimVictory={handleClaimRogueliteVictory}
              onClaimDefeat={handleClaimRogueliteDefeat}
            />
          </React.Suspense>
        )}

        <GameStateProvider value={gameState}>
          <GameModalsContainer
            showResetDialog={showResetDialog}
            setShowResetDialog={setShowResetDialog}
            showCheatEventModal={showCheatEventModal}
            setShowCheatEventModal={setShowCheatEventModal}
            planetLevel={planetLevel}
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
            accountSwitchPrompt={accountSwitchPrompt}
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
            handleApplyPlanetSkin={setActivePlanetSkin}
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
            fontScale={fontScale}
            setFontScale={setFontScale}
            user={user}
            authLoading={authLoading}
            syncing={syncing}
            lastSynced={lastSynced}
            loginWithGoogle={loginWithGoogle}
            logout={logout}
            cloudSaveFound={cloudSaveFound}
            triggerCloudStateLoad={triggerCloudStateLoad}
            continueWithCurrentAccount={continueWithCurrentAccount}
            adoptPreviousLocalSave={adoptPreviousLocalSave}
            missionSetNumber={missionSetNumber}
            claimedMissionIds={claimedMissionIds}
            missionsCooldownEnd={missionsCooldownEnd}
            activeFrame={activeFrame}
            unlockedCosmetics={unlockedCosmetics}
            activeStarColor={activeStarColor}
            activeAccessory={activeAccessory}
            activeMoonSkin={activeMoonSkin}
            activePlanetSkin={activePlanetSkin}
            unlockedPlanetSkins={rogueliteMeta.unlockedPlanetSkins}
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

          <GehegeModal
            isOpen={showGehegeModal}
            onClose={() => setShowGehegeModal(false)}
            isNight={isNight}
            purchasedAnimals={purchasedAnimals}
            animalDefs={INITIAL_ANIMALS}
            placedAnimals={placedAnimals}
            onUpdatePlacedAnimals={setPlacedAnimals}
            animalLove={animalLove}
            onUpdateAnimalLove={setAnimalLove}
            animalLastPet={animalLastPet}
            onUpdateAnimalLastPet={setAnimalLastPet}
            bowlLastFed={bowlLastFed}
            onUpdateBowlLastFed={setBowlLastFed}
            bowlFedMinutesCredited={bowlFedMinutesCredited}
            onUpdateBowlFedMinutesCredited={setBowlFedMinutesCredited}
          />
        </GameStateProvider>

        {/* Dynamic Autosave Toast Indicator */}
        <AnimatePresence>
          {autosaveNotification && autosaveNotification.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className={`fixed bottom-6 right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-colors ${
                autosaveNotification.success
                  ? // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                    "bg-[#163a24]/90 border-emerald-400 text-emerald-100"
                  : // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                    "bg-[#2c1328]/90 border-cosmic-pink text-rose-100"
              }`}
            >
              {autosaveNotification.success ? (
                <div className="size-5  rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                  <span className="text-xs text-emerald-400">✓</span>
                </div>
              ) : (
                <div className="size-5  rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center animate-spin">
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
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                id="blackhole-result-dialog"
                className={`w-full max-w-md p-6 rounded-3xl border-3 shadow-[0_0_50px_rgba(147,51,234,0.4)] text-center relative overflow-hidden transition-all ${
                  blackHoleResult.outcomeType === "good"
                    ? "bg-linear-to-b from-cosmic-ink via-cosmic-bg to-black border-purple-500 text-purple-100"
                    : // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                      "bg-linear-to-b from-[#1a070e] via-[#0c0307] to-black border-rose-800 text-rose-100"
                }`}
              >
                {/* Spinning/pulsing decorative backdrop glows */}
                <div className="absolute -top-24 -left-24 size-48  rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 size-48  rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

                <div className="size-20  mx-auto rounded-full bg-black/60 border border-purple-500/50 flex items-center justify-center text-4xl mb-4 shadow-[0_0_20px_rgba(147,51,234,0.3)] animate-pulse relative">
                  {blackHoleResult.outcomeType === "good" ? "✨" : "🕳️"}
                  <span className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-25"></span>
                </div>

                <span
                  className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border leading-none shadow-sm ${
                    blackHoleResult.outcomeType === "good"
                      ? "bg-cosmic-bg-mid/60 border-purple-500/30 text-purple-300"
                      : // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                        "bg-[#1a070e]/60 border-rose-800/30 text-rose-300"
                  }`}
                >
                  {blackHoleResult.outcomeType === "good"
                    ? "🌌 Kosmischer Segen"
                    : "🌀 Gravitativer Verlust"}
                </span>

                <h3 className="font-sans font-black text-lg uppercase mt-3 tracking-wide text-transparent bg-clip-text bg-linear-to-r from-purple-200 via-white to-rose-300">
                  {blackHoleResult.title}
                </h3>

                <p className="text-xs/relaxed font-semibold  mt-3 px-2 text-slate-300">
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

      {showVoyageModal && (
        <React.Suspense fallback={null}>
          <GalaxyVoyageModal
            isOpen={showVoyageModal}
            prestigeCount={prestigeCount}
            onConfirmVoyage={handleConfirmPrestige}
            inGlitchGalaxy={inGlitchGalaxy}
          />
        </React.Suspense>
      )}
    </ModalSettingsProvider>
  );
}
