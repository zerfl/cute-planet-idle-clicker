import { useCallback, useState } from "react";

/**
 * Centralizes the visibility flags for every modal / dialog / overlay.
 *
 * Flags are intentionally independent booleans (several overlays can be open at
 * once — e.g. a sync-conflict dialog over another modal), so this hook is a
 * pure container: it owns the `useState`s and the simple `open*` callbacks and
 * returns them under their original names. `showTutorial` defaults to `true`
 * (first-run tutorial); every other flag defaults to `false`.
 */
export function useModalState() {
  const [showAnimalsModal, setShowAnimalsModal] = useState(false);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMusicSettingsModal, setShowMusicSettingsModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showGalaxyShardsShop, setShowGalaxyShardsShop] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [showVoyageModal, setShowVoyageModal] = useState(false);
  const [showZodiacModal, setShowZodiacModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRepairDialog, setShowRepairDialog] = useState(false);
  const [showCheatEventModal, setShowCheatEventModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  const openPrestigeModal = useCallback(() => setShowPrestigeModal(true), []);
  const openOfflineModal = useCallback(() => setShowOfflineModal(true), []);
  const openZodiacModal = useCallback(() => setShowZodiacModal(true), []);
  const openAnimalsModal = useCallback(() => setShowAnimalsModal(true), []);
  const openCraftingModal = useCallback(() => setShowCraftingModal(true), []);
  const openStarsModal = useCallback(() => setShowStarsModal(true), []);
  const openUpgradesModal = useCallback(() => setShowUpgradesModal(true), []);
  const openAchievementsModal = useCallback(() => setShowAchievementsModal(true), []);
  const openStatsModal = useCallback(() => setShowStatsModal(true), []);
  const openMissionsModal = useCallback(() => setShowMissionsModal(true), []);
  const openInventoryModal = useCallback(() => setShowInventoryModal(true), []);

  return {
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
  };
}
