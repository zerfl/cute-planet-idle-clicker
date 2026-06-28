import React from "react";
import { motion } from "motion/react";
import { CosmicHUD } from "./CosmicHUD";
import { ActiveEventBanner } from "./ActiveEventBanner";
import { DayNightIndicator } from "./DayNightIndicator";
import { Planet } from "./Planet";
import { FloatingTexts } from "./FloatingTexts";
import { ActionButtons } from "../data/ActionButtons";

interface InteractiveCosmosProps {
  isNightStyle: boolean;
  showTutorial: boolean;
  life: number;
  totalLps: number;
  starsCount: number;
  prestigeCount: number;
  glitchedFormatCompactNumber: (num: number) => string;
  activeEvent: any;
  activeEventDecision: any;
  activeEventDetails: any;
  eventTimeRemaining: number;
  handleSelectEventDecision: (decisionId: string) => void;
  glitterDust: number;
  blackHoleSize: number;
  handleBlackHoleGamble: (sacrificeType: "life" | "stars" | "dust") => void;
  inGlitchGalaxy: boolean;
  planetLevel: number;
  setShowVoyageModal: (val: boolean) => void;
  isNight: boolean;
  cycleProgress: number;
  offlineEarnedLife: number;
  offlineSeconds: number;
  openOfflineModal: () => void;
  planetExp: number;
  planetExpNeeded: number;
  planetTask: any;
  moonsCount: number;
  starPowerPerStar: number;
  handlePlanetClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  activeStarColor: string;
  activeAccessory: string;
  activeMoonSkin: string;
  activePlanetSkin: string;
  isLowMemory: boolean;
  activeZodiacId: string;
  openZodiacModal: () => void;
  floatingTexts: any[];
  clickPower: number;
  openGehegeModal: () => void;
  openAnimalsModal: () => void;
  openCraftingModal: () => void;
  openStarsModal: () => void;
  openUpgradesModal: () => void;
  openAchievementsModal: () => void;
  openStatsModal: () => void;
  openMissionsModal: () => void;
  openInventoryModal: () => void;
  disableAnimations: boolean;
  totalAnimalsCount: number;
  researchedUpgradesCount: number;
  unlockedAchievementsCount: number;
  achievementsLength: number;
  completedUnclaimedMissionsCount: number;
  shootingStarsCount: number;
  activeConstellationsCount: number;
}

export const InteractiveCosmos: React.FC<InteractiveCosmosProps> = ({
  isNightStyle,
  showTutorial,
  life,
  totalLps,
  starsCount,
  prestigeCount,
  glitchedFormatCompactNumber,
  activeEvent,
  activeEventDecision,
  activeEventDetails,
  eventTimeRemaining,
  handleSelectEventDecision,
  glitterDust,
  blackHoleSize,
  handleBlackHoleGamble,
  inGlitchGalaxy,
  planetLevel,
  setShowVoyageModal,
  isNight,
  cycleProgress,
  offlineEarnedLife,
  offlineSeconds,
  openOfflineModal,
  planetExp,
  planetExpNeeded,
  planetTask,
  moonsCount,
  starPowerPerStar,
  handlePlanetClick,
  activeStarColor,
  activeAccessory,
  activeMoonSkin,
  activePlanetSkin,
  isLowMemory,
  activeZodiacId,
  openZodiacModal,
  floatingTexts,
  clickPower,
  openGehegeModal,
  openAnimalsModal,
  openCraftingModal,
  openStarsModal,
  openUpgradesModal,
  openAchievementsModal,
  openStatsModal,
  openMissionsModal,
  openInventoryModal,
  disableAnimations,
  totalAnimalsCount,
  researchedUpgradesCount,
  unlockedAchievementsCount,
  achievementsLength,
  completedUnclaimedMissionsCount,
  shootingStarsCount,
  activeConstellationsCount,
}) => {
  return (
    <main
      className={`flex-grow w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-5 relative z-10 transition-all duration-500 ${
        showTutorial ? "blur-md pointer-events-none select-none" : ""
      }`}
    >
      {/* Real-time compact live HUD metrics - Positioned at the very top and smaller to save space */}
      <CosmicHUD
        isNightStyle={isNightStyle}
        life={life}
        totalLps={totalLps}
        starsCount={starsCount}
        prestigeCount={prestigeCount}
        formatCompactNumber={glitchedFormatCompactNumber}
      />

      {/* Cosmic Event Alert / Notification Panel - Displays countdown or active event state dynamically with glowing animations */}
      <ActiveEventBanner
        activeEvent={activeEvent}
        activeEventDecision={activeEventDecision}
        activeEventDetails={activeEventDetails}
        eventTimeRemaining={eventTimeRemaining}
        onSelectDecision={handleSelectEventDecision}
        life={life}
        starsCount={starsCount}
        glitterDust={glitterDust}
        blackHoleSize={blackHoleSize}
        onGamble={handleBlackHoleGamble}
      />

      {inGlitchGalaxy && (
        <div className="w-full max-w-2xl rounded-2xl bg-black/85 border-2 border-dashed border-cyan-500/80 p-4 font-mono text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] select-none">
          <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] mb-1 glitch-text-anim">
            🌌 COSMIC_CORRUPTION DETECTED 🌌
          </h3>
          <p className="text-[11px] sm:text-xs text-rose-300 font-bold mb-3 border border-cyan-500/20 py-1.5 px-2 bg-cyan-950/20 rounded">
            Aktivierte Instabilitaet:{" "}
            <span className="text-cyan-300 font-extrabold glitch-chromatic-text">
              x7.77 LPS & Klick-Energie
            </span>
            . Zahlenwerte sind instabil!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-pulse">
            <span className="text-[10px] text-cyan-400 font-bold">
              Kernstabilitaet bei {Math.min(100, Math.floor((planetLevel / 20) * 100))}% (Planet
              Level {planetLevel}/20)
            </span>
            {planetLevel >= 20 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVoyageModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-wider border border-cyan-300/40 cursor-pointer shadow-lg hover:shadow-cyan-500/30 transition-all pointer-events-auto"
              >
                Kern Reparieren & Reisen ⚙️ (+2 Shards, +77 Dust)
              </motion.button>
            ) : (
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider border border-red-500/40 px-3 py-1 bg-red-950/30 rounded">
                ⚠️ REPARATUR BLOCKIERT: ERST AB PLANET LEVEL 20 MOeGLICH! ⚠️
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Day/Night Cycle Indicator and Bonus Panel */}
      <DayNightIndicator
        isNight={isNight}
        cycleProgress={cycleProgress}
        offlineEarnedLife={offlineEarnedLife}
        offlineSeconds={offlineSeconds}
        onOpenOfflineModal={openOfflineModal}
      />

      {/* Huge Interactive Planet Canvas: No overflow bounds, stars and animals float freely! */}
      <section className="relative group w-full max-w-3xl flex flex-col items-center justify-center py-4">
        {/* Wrapper shrinks to planet content width so FloatingTexts' inset-0 aligns with click coords */}
        <div className="relative">
          <Planet
            level={planetLevel}
            planetExp={planetExp}
            planetExpNeeded={planetExpNeeded}
            planetTask={planetTask}
            starsCount={starsCount}
            moonsCount={moonsCount || 0}
            starPowerMultiplier={starPowerPerStar}
            onPlanetClick={handlePlanetClick}
            isNight={isNightStyle}
            activeStarColor={activeStarColor}
            activeAccessory={activeAccessory}
            activeMoonSkin={activeMoonSkin}
            activePlanetSkin={activePlanetSkin}
            isLowMemory={isLowMemory}
            activeZodiacId={activeZodiacId}
            onOpenZodiacModal={openZodiacModal}
          />

          {/* Floating click/star/level text particles — sibling overlay anchored to planet bounds */}
          <FloatingTexts
            floatingTexts={floatingTexts}
            isLowMemory={isLowMemory}
            isNight={isNightStyle}
            activeStarColor={activeStarColor}
          />
        </div>

        {/* Subtitle technical decoration lines */}
        <div className="mt-4 flex justify-center opacity-60 font-mono text-[9.5px] sm:text-[11px] font-bold text-rose-300/40 tracking-wide pointer-events-none">
          <span>
            SATELLITE SYST. LEVEL {planetLevel} // CLICK MULTIPLIER {clickPower}x
          </span>
        </div>
      </section>

      {/* Beautiful Tactile Floating Buttons to open their corresponding modal window */}
      <ActionButtons
        onShowGehege={openGehegeModal}
        onShowAnimals={openAnimalsModal}
        onShowCrafting={openCraftingModal}
        onShowStars={openStarsModal}
        onShowUpgrades={openUpgradesModal}
        onShowAchievements={openAchievementsModal}
        onShowStats={openStatsModal}
        onShowMissions={openMissionsModal}
        onShowInventory={openInventoryModal}
        disableAnimations={disableAnimations}
        isNightStyle={isNightStyle}
        totalAnimalsCount={totalAnimalsCount}
        starsCount={starsCount}
        researchedUpgradesCount={researchedUpgradesCount}
        unlockedAchievementsCount={unlockedAchievementsCount}
        achievementsLength={achievementsLength}
        completedUnclaimedMissionsCount={completedUnclaimedMissionsCount}
        shootingStarsCount={shootingStarsCount}
        activeConstellationsCount={activeConstellationsCount}
      />
    </main>
  );
};
