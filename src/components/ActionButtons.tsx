import React from "react";

interface ActionButtonsProps {
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

export const ActionButtons: React.FC<ActionButtonsProps> = ({
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
    <section className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mt-2">
      {/* Button 1: Animals (Tiere) */}
      <button
        onClick={onShowAnimals}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-[#ff9db8] bg-gradient-to-br from-[#2d1a33] via-[#1d1022] to-[#25122a] hover:from-[#3e2546] hover:to-[#311938] text-[#ffeef4] shadow-[4px_4px_0px_#ff9db8]"
            : "border-[#ff9db8] bg-gradient-to-br from-[#2d1a33] via-[#1d1022] to-[#25122a] hover:from-[#3e2546] hover:to-[#311938] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}>🐾</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-[#ffcbdc]" : "text-[#ffcbdc]"}`}>Tiere züchten</span>
        
        {/* Dynamic badge indicator count */}
        <span className="absolute -top-1.5 -right-1.5 bg-[#f15e75] text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-[#ff9db8] shadow-sm">
          {totalAnimalsCount}
        </span>
      </button>

      {/* Button 1.5: Schmieden (Crafting) */}
      <button
        onClick={onShowCrafting}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-orange-400 bg-gradient-to-br from-[#3b1a10] via-[#210e08] to-[#2b1008] hover:from-[#4d251d] hover:to-[#3f1c14] text-[#ffeef4] shadow-[4px_4px_0px_rgba(251,146,60,0.8)]"
            : "border-orange-400 bg-gradient-to-br from-[#3b1a10] via-[#210e08] to-[#2b1008] hover:from-[#4d251d] hover:to-[#3f1c14] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-pulse"}`}>🔨</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-orange-300" : "text-orange-300"}`}>Schmieden</span>
        
        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-orange-400 shadow-sm">
          52
        </span>
      </button>

      {/* Button 2: Stars (Sterne) */}
      <button
        onClick={onShowStars}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-amber-300 bg-gradient-to-br from-[#302720] via-[#1f1813] to-[#261d16] hover:from-[#43362a] hover:to-[#35281d] text-[#ffeef4] shadow-[4px_4px_0px_rgba(251,191,36,0.8)]"
            : "border-amber-300 bg-gradient-to-br from-[#302720] via-[#1f1813] to-[#261d16] hover:from-[#43362a] hover:to-[#35281d] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)] mb-1 ${disableAnimations ? "" : "group-hover:animate-spin"}`} style={disableAnimations ? {} : { animationDuration: '3s' }}>⭐</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-amber-205" : "text-amber-205"}`}>Sterne rufen</span>
        
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-sm">
          {starsCount}
        </span>
      </button>

      {/* Button 3: Upgrades & Research (Forschung) */}
      <button
        onClick={onShowUpgrades}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-[#caa5fe] bg-gradient-to-br from-[#1b1c3b] via-[#101127] to-[#151631] hover:from-[#292a54] hover:to-[#1e1f42] text-[#ffeef4] shadow-[4px_4px_0px_#caa5fe]"
            : "border-[#caa5fe] bg-gradient-to-br from-[#1b1c3b] via-[#101127] to-[#151631] hover:from-[#292a54] hover:to-[#1e1f42] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-pulse"}`}>🔬</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-[#d4c3ff]" : "text-[#d4c3ff]"}`}>Forschung</span>
        
        <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-[#caa5fe] shadow-sm">
          {researchedUpgradesCount}
        </span>
      </button>

      {/* Button 4: Achievements (Erfolge) */}
      <button
        onClick={onShowAchievements}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-amber-305 bg-gradient-to-br from-[#2a1d13] via-[#18110b] to-[#251910] hover:from-[#3f2a1c] hover:to-[#312015] text-[#ffeef4] shadow-[4px_4px_0px_#f59e0b]"
            : "border-amber-305 bg-gradient-to-br from-[#2a1d13] via-[#18110b] to-[#251910] hover:from-[#3f2a1c] hover:to-[#312015] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}>🏆</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-amber-250" : "text-amber-250"}`}>Erfolge</span>
        
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-355 shadow-sm">
          {unlockedAchievementsCount}/{achievementsLength}
        </span>
      </button>

      {/* Button 5: Stats/Diary (Daten) */}
      <button
        onClick={onShowStats}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-teal-350 bg-gradient-to-br from-[#14282e] via-[#0b181c] to-[#0f2125] hover:from-[#213b43] hover:to-[#162a2f] text-[#ffeef4] shadow-[4px_4px_0px_rgba(20,184,166,0.8)]"
            : "border-teal-350 bg-gradient-to-br from-[#14282e] via-[#0b181c] to-[#0f2125] hover:from-[#213b43] hover:to-[#162a2f] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:rotate-12 transition-transform"}`}>📊</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-teal-200" : "text-teal-200"}`}>Tagebuch</span>
        
        <span className="absolute -top-1.5 -right-1.5 bg-[#14b8a6] text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-teal-300 shadow-sm">
          Statistik
        </span>
      </button>

      {/* Button 6: Missions (Missionen) */}
      <button
        onClick={onShowMissions}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-fuchsia-300 bg-gradient-to-br from-[#2f1839] via-[#1c0c23] to-[#240f2b] hover:from-[#3e2546] hover:to-[#311938] text-[#ffeef4] shadow-[4px_4px_0px_#e879f9]"
            : "border-fuchsia-300 bg-gradient-to-br from-[#2f1839] via-[#1c0c23] to-[#240f2b] hover:from-[#3e2546] hover:to-[#311938] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}>🌌</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-fuchsia-200" : "text-fuchsia-200"}`}>Missionen</span>
        
        {completedUnclaimedMissionsCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[10px] h-5 px-2 rounded-full flex items-center justify-center border-2 border-fuchsia-300 shadow-sm ${disableAnimations ? "" : "animate-pulse"}`}>
            {completedUnclaimedMissionsCount}!
          </span>
        )}
      </button>

      {/* Button 7: Inventory (Inventar) */}
      <button
        onClick={onShowInventory}
        className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2.5xl border-3 font-sans font-black cursor-pointer selection:bg-transparent modal-frame-target ${
          disableAnimations ? "" : "transition-all hover:scale-105 active:scale-95"
        } ${
          isNightStyle
            ? "border-amber-300 bg-gradient-to-br from-[#3b2e1f] via-[#241b12] to-[#2c1e14] text-[#ffeef4] shadow-[4px_4px_0px_#f59e0b]"
            : "border-amber-300 bg-gradient-to-br from-[#3b2e1f] via-[#241b12] to-[#2c1e14] text-[#ffeef4]"
        }`}
      >
        <div className={`text-3xl filter drop-shadow-sm mb-1 ${disableAnimations ? "" : "group-hover:animate-bounce"}`}>🎒</div>
        <span className={`text-[11px] uppercase tracking-wider text-center leading-normal ${isNightStyle ? "text-amber-205" : "text-amber-205"}`}>Inventar</span>
        
        <span className={`absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-sm ${disableAnimations ? "" : "animate-pulse"}`}>
          {shootingStarsCount}
        </span>
      </button>
    </section>
  );
};
