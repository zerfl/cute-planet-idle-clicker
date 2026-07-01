import React from "react";

interface ActionButtonsProps {
  dimmed?: boolean;
  onShowGehege: () => void;
  onShowAnimals: () => void;
  onShowCrafting: () => void;
  onShowStars: () => void;
  onShowUpgrades: () => void;
  onShowAchievements: () => void;
  onShowStats: () => void;
  onShowMissions: () => void;
  onShowInventory: () => void;
  disableAnimations: boolean;
  isNightStyle: boolean;
  totalAnimalsCount: number;
  starsCount: number;
  researchedUpgradesCount: number;
  unlockedAchievementsCount: number;
  achievementsLength: number;
  completedUnclaimedMissionsCount: number;
  shootingStarsCount: number;
  activeConstellationsCount: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = React.memo(
  ({
    dimmed = false,
    onShowGehege,
    onShowAnimals,
    onShowCrafting,
    onShowStars,
    onShowUpgrades,
    onShowAchievements,
    onShowStats,
    onShowMissions,
    onShowInventory,
    disableAnimations,
    isNightStyle,
    totalAnimalsCount,
    starsCount,
    researchedUpgradesCount,
    unlockedAchievementsCount,
    achievementsLength,
    completedUnclaimedMissionsCount,
    shootingStarsCount,
    activeConstellationsCount,
  }) => {
    return (
      <section
        className={`fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-white/10 bg-cosmic-bg/90 px-2 pt-1 pb-safe backdrop-blur-md game:static game:z-auto game:mt-2 game:grid game:w-full game:max-w-4xl game:grid-cols-9 game:gap-2.5 game:overflow-visible game:border-t-0 game:bg-transparent game:p-0 game:backdrop-blur-none ${dimmed ? "blur-md pointer-events-none select-none" : ""}`}
      >
        {/* Button 0: Tier Gehege (Enclosure) */}
        <button
          onClick={onShowGehege}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/tier_gehege.webp"
            alt="Tier Gehege"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-indigo-200">
            Tier Gehege
          </span>
        </button>

        {/* Button 1: Animals (Tiere) */}
        <button
          onClick={onShowAnimals}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/tiere_zuechten.webp"
            alt="Tiere zuechten"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-brand-pink">
            Tiere zuechten
          </span>

          {/* Dynamic badge indicator count */}
          <span className="absolute -top-1.5 -right-1.5 bg-danger text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-cosmic-pink shadow-sm">
            {totalAnimalsCount}
          </span>
        </button>

        {/* Button 1.5: Schmieden (Crafting) */}
        <button
          onClick={onShowCrafting}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/schmieden.webp"
            alt="Schmieden"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-pulse"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-orange-300">
            Schmieden
          </span>

          <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-orange-400 shadow-sm">
            52
          </span>
        </button>

        {/* Button 2: Stars (Sterne) */}
        <button
          onClick={onShowStars}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/sterne_rufen.webp"
            alt="Sterne rufen"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-spin"}`}
            style={disableAnimations ? {} : { animationDuration: "3s" }}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-amber-200">
            Sterne rufen
          </span>

          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-sm">
            {starsCount}
          </span>
        </button>

        {/* Button 3: Upgrades & Research (Forschung) */}
        <button
          onClick={onShowUpgrades}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/forschung.webp"
            alt="Forschung"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-pulse"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-cosmic-accent">
            Forschung
          </span>

          <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-cosmic-accent shadow-sm">
            {researchedUpgradesCount}
          </span>
        </button>

        {/* Button 4: Achievements (Erfolge) */}
        <button
          onClick={onShowAchievements}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/erfolge.webp"
            alt="Erfolge"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-amber-250">
            Erfolge
          </span>

          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-sm">
            {unlockedAchievementsCount}/{achievementsLength}
          </span>
        </button>

        {/* Button 5: Stats/Diary (Daten) */}
        <button
          onClick={onShowStats}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/tagebuch.webp"
            alt="Tagebuch"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:rotate-12 transition-transform"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-teal-200">
            Tagebuch
          </span>

          <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-teal-300 shadow-sm">
            Statistik
          </span>
        </button>

        {/* Button 6: Missions (Missionen) */}
        <button
          onClick={onShowMissions}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/missionen.webp"
            alt="Missionen"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-fuchsia-200">
            Missionen
          </span>

          {completedUnclaimedMissionsCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[10px] h-5 px-2 rounded-full flex items-center justify-center border-2 border-fuchsia-300 shadow-sm ${disableAnimations ? "" : "animate-pulse"}`}
            >
              {completedUnclaimedMissionsCount}!
            </span>
          )}
        </button>

        {/* Button 7: Inventory (Inventar) */}
        <button
          onClick={onShowInventory}
          className={`group relative flex min-w-18 shrink-0 flex-col items-center justify-center rounded-2.5xl border-3 border-transparent bg-transparent p-1.5 game:min-w-0 game:p-4 hover:bg-white/5 shadow-none font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
            disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
          }`}
        >
          <img
            src="/assets/stuff/inventar.webp"
            alt="Inventar"
            referrerPolicy="no-referrer"
            className={`size-9 game:size-12 object-contain mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}
          />
          <span className="text-[9px] game:text-[11px] uppercase tracking-wider text-center leading-normal text-amber-200">
            Inventar
          </span>

          <span
            className={`absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-sm ${disableAnimations ? "" : "animate-pulse"}`}
          >
            {shootingStarsCount}
          </span>
        </button>
      </section>
    );
  },
);
ActionButtons.displayName = "ActionButtons";
