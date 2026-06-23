import React from "react";
import { ResetDialog } from "./modals/ResetDialog";
import { CheatEventModal } from "./modals/CheatEventModal";
import { UpgradesModal } from "./modals/UpgradesModal";
import { AnimalsModal } from "./modals/AnimalsModal";
import { StarsModal } from "./modals/StarsModal";
import { CraftingModal } from "./modals/CraftingModal";
import { StatsModal } from "./modals/StatsModal";
import { OfflineEarningsModal } from "./modals/OfflineEarningsModal";
import { AchievementsModal } from "./modals/AchievementsModal";
import { MusicSettingsModal } from "./modals/MusicSettingsModal";
import { CloudSyncModal } from "./modals/CloudSyncModal";
import { SyncConflictDialog } from "./modals/SyncConflictDialog";
import { MissionsModal } from "./modals/MissionsModal";
import { OpeningResultModal } from "./modals/OpeningResultModal";
import { InventoryModal } from "./modals/InventoryModal";
import { ZodiacModal } from "./modals/ZodiacModal";
import { LeaderboardModal } from "./modals/LeaderboardModal";
import { PrestigeModal } from "./modals/PrestigeModal";

import { INITIAL_ANIMALS, calculateCost } from "../data";

interface GameModalsContainerProps {
  // Modal visibility flags
  showResetDialog: boolean;
  setShowResetDialog: (show: boolean) => void;
  showCheatEventModal: boolean;
  setShowCheatEventModal: (show: boolean) => void;
  showUpgradesModal: boolean;
  setShowUpgradesModal: (show: boolean) => void;
  showAnimalsModal: boolean;
  setShowAnimalsModal: (show: boolean) => void;
  showStarsModal: boolean;
  setShowStarsModal: (show: boolean) => void;
  showCraftingModal: boolean;
  setShowCraftingModal: (show: boolean) => void;
  showStatsModal: boolean;
  setShowStatsModal: (show: boolean) => void;
  showOfflineModal: boolean;
  setShowOfflineModal: (show: boolean) => void;
  showAchievementsModal: boolean;
  setShowAchievementsModal: (show: boolean) => void;
  showMusicSettingsModal: boolean;
  setShowMusicSettingsModal: (show: boolean) => void;
  showCloudSyncModal: boolean;
  setShowCloudSyncModal: (show: boolean) => void;
  showConflictDialog: boolean;
  setShowConflictDialog: (show: boolean) => void;
  showMissionsModal: boolean;
  setShowMissionsModal: (show: boolean) => void;
  openingResult: any;
  setOpeningResult: (res: any) => void;
  showInventoryModal: boolean;
  setShowInventoryModal: (show: boolean) => void;
  showZodiacModal: boolean;
  setShowZodiacModal: (show: boolean) => void;
  showLeaderboardModal: boolean;
  setShowLeaderboardModal: (show: boolean) => void;
  showPrestigeModal: boolean;
  setShowPrestigeModal: (show: boolean) => void;

  // Handlers
  handleGameReset: () => void;
  workerRef: React.RefObject<Worker | null>;
  handleBuyUpgrade: (id: string, cost: number) => void;
  handleBuyUpgradesBatch: (list: { id: string; cost: number; isGlitter: boolean }[]) => void;
  handleBuyAnimal: (animalId: string, cost: number, countToBuy: number) => void;
  handleBuyStar: () => void;
  handleMergeMoons: () => void;
  handleInvestConstellation: (
    constellationId: string,
    starsCost: number,
    moonsCost: number,
  ) => void;
  handleCraftItem: (recipeId: string, count?: number) => void;
  handleCraftRecursive: (targetItemId: string, count?: number) => void;
  handleClaimOfflineEarnings: (earnedLife: number) => void;
  handleClaimMissionReward: (missionId: string, starsReward: number) => void;
  handleOpenShootingStar: (cosmetic: any, alreadyUnlocked: boolean, refundAmt: number) => void;
  handleApplyCosmetic: (
    id: string,
    type: "star_color" | "planet_accessory" | "frame_style" | "moon_skin",
  ) => void;
  handleUnlockCosmeticDirect: (cosmeticId: string, cost: number) => void;
  handleUpgradeCosmeticRarity: (cosmeticId: string, targetRarity: string, cost: number) => void;
  handleUseCraftedItem: (itemId: string, count?: number) => void;
  handleSelectZodiac: (zodiacId: string) => void;
  handleConfirmPrestige: () => void;
  onForceSave: () => void;

  // Stable state — referentially guarded or changes only on user actions
  purchasedUpgrades: string[];
  staticUpgrades: any;
  purchasedAnimals: Record<string, number>;
  constellations: Record<string, number>;
  isNightStyle: boolean;
  craftedItems: Record<string, number>;
  formatCompactNumber: (num: number) => string;
  formatTimePlayed: (sec: number) => string;
  offlineSeconds: number;
  offlineLpsRate: number;
  offlineEarnedLife: number;
  achievements: any[];
  achievementCategoryFilter: string;
  setAchievementCategoryFilter: (filter: string) => void;
  achievementSearch: string;
  setAchievementSearch: (search: string) => void;
  playUpgrade: () => void;
  musicStyleState: any;
  setMusicStyleState: any;
  isLowMemory: boolean;
  setIsLowMemory: any;
  user: any;
  authLoading: boolean;
  syncing: boolean;
  lastSynced: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  cloudSaveFound: any;
  triggerCloudStateLoad: (data: any) => void;
  forceLocalOverwriteCloud: () => void;
  missionSetNumber: number;
  claimedMissionIds: string[];
  missionsCooldownEnd: number | null;
  activeFrame: string;
  unlockedCosmetics: string[];
  activeStarColor: string;
  activeAccessory: string;
  activeMoonSkin: string;
  activeZodiacId: string;
  cosmeticRarityLevels: Record<string, string>;
  upgradesSpecs: any;
}

export const GameModalsContainer: React.FC<GameModalsContainerProps> = React.memo(
  ({
    showResetDialog,
    setShowResetDialog,
    showCheatEventModal,
    setShowCheatEventModal,
    showUpgradesModal,
    setShowUpgradesModal,
    showAnimalsModal,
    setShowAnimalsModal,
    showStarsModal,
    setShowStarsModal,
    showCraftingModal,
    setShowCraftingModal,
    showStatsModal,
    setShowStatsModal,
    showOfflineModal,
    setShowOfflineModal,
    showAchievementsModal,
    setShowAchievementsModal,
    showMusicSettingsModal,
    setShowMusicSettingsModal,
    showCloudSyncModal,
    setShowCloudSyncModal,
    showConflictDialog,
    setShowConflictDialog,
    showMissionsModal,
    setShowMissionsModal,
    openingResult,
    setOpeningResult,
    showInventoryModal,
    setShowInventoryModal,
    showZodiacModal,
    setShowZodiacModal,
    showLeaderboardModal,
    setShowLeaderboardModal,
    showPrestigeModal,
    setShowPrestigeModal,

    handleGameReset,
    workerRef,
    handleBuyUpgrade,
    handleBuyUpgradesBatch,
    handleBuyAnimal,
    handleBuyStar,
    handleMergeMoons,
    handleInvestConstellation,
    handleCraftItem,
    handleCraftRecursive,
    handleClaimOfflineEarnings,
    handleClaimMissionReward,
    handleOpenShootingStar,
    handleApplyCosmetic,
    handleUnlockCosmeticDirect,
    handleUpgradeCosmeticRarity,
    handleUseCraftedItem,
    handleSelectZodiac,
    handleConfirmPrestige,
    onForceSave,

    purchasedUpgrades,
    staticUpgrades,
    purchasedAnimals,
    constellations,
    isNightStyle,
    craftedItems,
    formatCompactNumber,
    formatTimePlayed,
    offlineSeconds,
    offlineLpsRate,
    offlineEarnedLife,
    achievements,
    achievementCategoryFilter,
    setAchievementCategoryFilter,
    achievementSearch,
    setAchievementSearch,
    playUpgrade,
    musicStyleState,
    setMusicStyleState,
    isLowMemory,
    setIsLowMemory,
    user,
    authLoading,
    syncing,
    lastSynced,
    loginWithGoogle,
    logout,
    cloudSaveFound,
    triggerCloudStateLoad,
    forceLocalOverwriteCloud,
    missionSetNumber,
    claimedMissionIds,
    missionsCooldownEnd,
    activeFrame,
    unlockedCosmetics,
    activeStarColor,
    activeAccessory,
    activeMoonSkin,
    activeZodiacId,
    cosmeticRarityLevels,
    upgradesSpecs,
  }) => {
    return (
      <>
        {showResetDialog && (
          <ResetDialog
            isOpen={showResetDialog}
            onConfirm={handleGameReset}
            onCancel={() => setShowResetDialog(false)}
          />
        )}

        {showCheatEventModal && (
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
        )}

        {showUpgradesModal && (
          <UpgradesModal
            isOpen={showUpgradesModal}
            onClose={() => setShowUpgradesModal(false)}
            purchasedUpgrades={purchasedUpgrades}
            staticUpgrades={staticUpgrades}
            onBuyUpgrade={handleBuyUpgrade}
            onBuyUpgradesBatch={handleBuyUpgradesBatch}
            formatCompactNumber={formatCompactNumber}
          />
        )}

        {showAnimalsModal && (
          <AnimalsModal
            isOpen={showAnimalsModal}
            onClose={() => setShowAnimalsModal(false)}
            purchasedAnimals={purchasedAnimals}
            animalDefs={INITIAL_ANIMALS}
            onBuyAnimal={handleBuyAnimal}
            calculateCost={calculateCost}
            formatCompactNumber={formatCompactNumber}
            upgradesSpecs={upgradesSpecs}
          />
        )}

        {showStarsModal && (
          <StarsModal
            isOpen={showStarsModal}
            onClose={() => setShowStarsModal(false)}
            onBuyStar={handleBuyStar}
            formatCompactNumber={formatCompactNumber}
            onMergeMoons={handleMergeMoons}
            constellations={constellations}
            onInvestConstellation={handleInvestConstellation}
          />
        )}

        {showCraftingModal && (
          <CraftingModal
            isOpen={showCraftingModal}
            onClose={() => setShowCraftingModal(false)}
            craftedItems={craftedItems}
            onCraftRecursive={handleCraftRecursive}
            formatCompactNumber={formatCompactNumber}
          />
        )}

        {showStatsModal && (
          <StatsModal
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
            purchasedAnimals={purchasedAnimals}
            formatCompactNumber={formatCompactNumber}
            formatTimePlayed={formatTimePlayed}
          />
        )}

        {showOfflineModal && (
          <OfflineEarningsModal
            isOpen={showOfflineModal}
            onClose={() => setShowOfflineModal(false)}
            secondsAway={offlineSeconds}
            offlineLps={offlineLpsRate}
            earnedLife={offlineEarnedLife}
            onClaim={handleClaimOfflineEarnings}
            formatCompactNumber={formatCompactNumber}
            isNight={isNightStyle}
          />
        )}

        {showAchievementsModal && (
          <AchievementsModal
            isOpen={showAchievementsModal}
            onClose={() => setShowAchievementsModal(false)}
            isNight={isNightStyle}
            achievements={achievements}
            achievementCategoryFilter={achievementCategoryFilter}
            setAchievementCategoryFilter={setAchievementCategoryFilter}
            achievementSearch={achievementSearch}
            setAchievementSearch={setAchievementSearch}
            formatCompactNumber={formatCompactNumber}
            playUpgrade={playUpgrade}
          />
        )}

        {showMusicSettingsModal && (
          <MusicSettingsModal
            isOpen={showMusicSettingsModal}
            onClose={() => setShowMusicSettingsModal(false)}
            isNight={isNightStyle}
            musicStyleState={musicStyleState}
            setMusicStyleState={setMusicStyleState}
            isLowMemory={isLowMemory}
            setIsLowMemory={setIsLowMemory}
          />
        )}

        {showCloudSyncModal && (
          <CloudSyncModal
            isOpen={showCloudSyncModal}
            onClose={() => setShowCloudSyncModal(false)}
            user={user}
            authLoading={authLoading}
            syncing={syncing}
            lastSynced={lastSynced}
            onLogin={loginWithGoogle}
            onLogout={logout}
            onForceSave={onForceSave}
            onForceLoad={() => {
              if (cloudSaveFound) {
                triggerCloudStateLoad(cloudSaveFound);
              }
            }}
            purchasedUpgrades={purchasedUpgrades}
            cloudStats={cloudSaveFound}
          />
        )}

        {showConflictDialog && (
          <SyncConflictDialog
            isOpen={showConflictDialog}
            cloudData={cloudSaveFound}
            purchasedUpgrades={purchasedUpgrades}
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
        )}

        {showMissionsModal && (
          <MissionsModal
            isOpen={showMissionsModal}
            onClose={() => setShowMissionsModal(false)}
            isNight={isNightStyle}
            missionSetNumber={missionSetNumber}
            claimedMissionIds={claimedMissionIds}
            missionsCooldownEnd={missionsCooldownEnd}
            onClaimReward={handleClaimMissionReward}
            activeFrame={activeFrame}
            unlockedCosmetics={unlockedCosmetics}
            purchasedUpgrades={purchasedUpgrades}
          />
        )}

        {openingResult !== null && (
          <OpeningResultModal
            isOpen={openingResult !== null}
            onClose={() => setOpeningResult(null)}
            isNight={isNightStyle}
            result={openingResult}
          />
        )}

        {showInventoryModal && (
          <InventoryModal
            isOpen={showInventoryModal}
            onClose={() => setShowInventoryModal(false)}
            isNight={isNightStyle}
            zodiac={activeZodiacId}
            unlockedCosmetics={unlockedCosmetics}
            activeStarColor={activeStarColor}
            activeAccessory={activeAccessory}
            activeFrame={activeFrame}
            activeMoonSkin={activeMoonSkin}
            onOpenShootingStar={handleOpenShootingStar}
            onApplyCosmetic={handleApplyCosmetic}
            purchasedUpgrades={purchasedUpgrades}
            cosmeticRarityLevels={cosmeticRarityLevels}
            onUnlockCosmeticDirect={handleUnlockCosmeticDirect}
            onUpgradeCosmeticRarity={handleUpgradeCosmeticRarity}
            craftedItems={craftedItems}
            onUseCraftedItem={handleUseCraftedItem}
            onSelectZodiac={handleSelectZodiac}
          />
        )}

        {showZodiacModal && (
          <ZodiacModal
            isOpen={showZodiacModal}
            onClose={() => setShowZodiacModal(false)}
            isNight={isNightStyle}
            activeZodiacId={activeZodiacId || "katze"}
          />
        )}

        {showLeaderboardModal && (
          <LeaderboardModal
            isOpen={showLeaderboardModal}
            onClose={() => setShowLeaderboardModal(false)}
            currentUserId={user?.uid}
            formatCompactNumber={formatCompactNumber}
          />
        )}

        {showPrestigeModal && (
          <PrestigeModal
            isOpen={showPrestigeModal}
            onClose={() => setShowPrestigeModal(false)}
            isNight={isNightStyle}
            onPrestigeConfirm={handleConfirmPrestige}
            formatCompactNumber={formatCompactNumber}
          />
        )}
      </>
    );
  },
);

GameModalsContainer.displayName = "GameModalsContainer";
