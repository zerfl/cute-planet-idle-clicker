import React from "react";
import { Heart, TrendingUp, Star as StarIcon, Award } from "lucide-react";
import { formatCompactNumber, getPrestigeRequirement } from "../data";

interface CosmicHUDProps {
  isNightStyle: boolean;
  life: number;
  totalLps: number;
  starsCount: number;
  prestigeCount: number;
  onShowPrestige: () => void;
}

export const CosmicHUD: React.FC<CosmicHUDProps> = React.memo(({
  isNightStyle,
  life,
  totalLps,
  starsCount,
  prestigeCount,
  onShowPrestige,
}) => {
  const PRESTIGE_REQUIREMENT = getPrestigeRequirement(prestigeCount);

  return (
    <section className={`w-full max-w-2xl flex flex-row items-center justify-around gap-2 px-3.5 py-1.5 rounded-2xl border-2 transition-all duration-500 shadow-sm ${
      isNightStyle ? "bg-[#130f2c]/85 border-[#caa5fe]/40 text-[#ffeef4]" : ""
    }`}>
      {/* Total Life HUD panel */}
      <div className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0" title={Math.floor(life).toLocaleString("de-DE")}>
        <Heart className="w-3.5 h-3.5 text-[#ff9db8] fill-[#ff9db8]/60 shrink-0 animate-pulse" />
        <span className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-[#ab9fd2]" : ""}`}>Leben:</span>
        <span className="font-mono text-[11px] sm:text-xs font-black truncate">{formatCompactNumber(life)}</span>
      </div>

      <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

      {/* Combined Growth Per Second metrics helper */}
      <div className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0" title={totalLps.toLocaleString("de-DE")}>
        <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-[#ab9fd2]" : ""}`}>Zuwachs:</span>
        <span className={`font-mono text-[11px] sm:text-xs font-black ${isNightStyle ? "text-[#ffeef4]" : ""} truncate`}>+{formatCompactNumber(totalLps)}/s</span>
      </div>

      <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

      {/* Autoclick Stars HUD panel */}
      <div className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0">
        <StarIcon className="w-3.5 h-3.5 text-amber-405 fill-amber-300/30 shrink-0" />
        <span className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-[#ab9fd2]" : ""}`}>Sterne:</span>
        <span className={`font-mono text-[11px] sm:text-xs font-black ${isNightStyle ? "text-amber-205" : ""}`}>{starsCount} ⭐</span>
      </div>

      <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

      {/* Prestige HUD panel / Button */}
      <button
        onClick={onShowPrestige}
        id="hud-prestige-btn"
        className={`flex items-center gap-1 sm:gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-xl border transition-all ${
          life >= PRESTIGE_REQUIREMENT
            ? "bg-amber-400/25 text-amber-300 border-amber-400/60 animate-pulse hover:bg-amber-400/35 cursor-pointer hover:scale-105 active:scale-95"
            : "opacity-40 text-slate-500 border-slate-700 bg-slate-800/10 cursor-not-allowed select-none"
        }`}
        title={
          life >= PRESTIGE_REQUIREMENT
            ? "Prestige ist BEREIT! Klicke zum Aufsteigen! ✨"
            : `Prestige gesperrt (Benötigt ${formatCompactNumber(PRESTIGE_REQUIREMENT)} Leben. Aktuell: ${formatCompactNumber(life)})`
        }
      >
        <Award className={`w-3.5 h-3.5 shrink-0 ${life >= PRESTIGE_REQUIREMENT ? "text-amber-300 fill-amber-300/10" : "text-slate-500"}`} />
        <span className={`text-[10px] hidden md:inline ${life >= PRESTIGE_REQUIREMENT ? "text-amber-200" : "text-slate-500"}`}>Prestige:</span>
        <span className="font-mono text-[10px] sm:text-[11px] font-black">
          {prestigeCount > 0 ? `Lv. ${prestigeCount}` : "Aufstieg"}
        </span>
      </button>
    </section>
  );
});
CosmicHUD.displayName = "CosmicHUD";
