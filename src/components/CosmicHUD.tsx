import React from "react";
import { Heart, TrendingUp, Star as StarIcon, Award } from "lucide-react";
import { formatCompactNumber as defaultFormatCompactNumber, getPrestigeRequirement } from "../data";

interface CosmicHUDProps {
  isNightStyle: boolean;
  life: number;
  totalLps: number;
  starsCount: number;
  prestigeCount: number;
  formatCompactNumber?: (num: number) => string;
}

export const CosmicHUD: React.FC<CosmicHUDProps> = React.memo(
  ({
    isNightStyle,
    life,
    totalLps,
    starsCount,
    prestigeCount,
    formatCompactNumber = defaultFormatCompactNumber,
  }) => {
    const PRESTIGE_REQUIREMENT = getPrestigeRequirement(prestigeCount);

    return (
      <section
        className={`w-full max-w-2xl flex flex-row items-center justify-around gap-2 px-3.5 py-1.5 rounded-2xl border-2 transition-all duration-500 shadow-sm ${
          isNightStyle ? "bg-[#130f2c]/85 border-cosmic-accent/40 text-cosmic-text" : ""
        }`}
      >
        {/* Total Life HUD panel */}
        <div
          className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0"
          title={Math.floor(life).toLocaleString("de-DE")}
        >
          <Heart className="w-3.5 h-3.5 text-cosmic-pink fill-cosmic-pink/60 shrink-0 animate-pulse" />
          <span
            className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-cosmic-accent-muted" : ""}`}
          >
            Leben:
          </span>
          <span className="font-mono text-[11px] sm:text-xs font-black truncate">
            {formatCompactNumber(life)}
          </span>
        </div>

        <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

        {/* Combined Growth Per Second metrics helper */}
        <div
          className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0"
          title={totalLps.toLocaleString("de-DE")}
        >
          <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span
            className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-cosmic-accent-muted" : ""}`}
          >
            Zuwachs:
          </span>
          <span
            className={`font-mono text-[11px] sm:text-xs font-black ${isNightStyle ? "text-cosmic-text" : ""} truncate`}
          >
            +{formatCompactNumber(totalLps)}/s
          </span>
        </div>

        <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

        {/* Autoclick Stars HUD panel */}
        <div className="flex items-center gap-1.5 text-xs font-semibold py-0.5 min-w-0">
          <StarIcon className="w-3.5 h-3.5 text-amber-405 fill-amber-300/30 shrink-0" />
          <span
            className={`text-[10px] hidden sm:inline ${isNightStyle ? "text-cosmic-accent-muted" : ""}`}
          >
            Sterne:
          </span>
          <span
            className={`font-mono text-[11px] sm:text-xs font-black ${isNightStyle ? "text-amber-205" : ""}`}
          >
            {starsCount} ⭐
          </span>
        </div>

        <div className="w-[1.5px] h-3 bg-slate-350/20 dark:bg-slate-305/15 shrink-0" />

        {/* Prestige HUD Level Display (Earned only via Galaxiereise at Level 20!) */}
        <div
          id="hud-prestige-btn"
          className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-xl border border-purple-500/20 bg-[#181333]/40 text-cosmic-accent-muted select-none cursor-help"
          title="Dauerhafter Bonus durch Vollendung deines Planeten auf Level 20! Jede Galaxiereise erhöht deine Prestige-Stufe."
        >
          <Award className="w-3.5 h-3.5 shrink-0 text-amber-300 fill-amber-300/10" />
          <span className="text-[10px] hidden md:inline text-cosmic-accent-muted">Prestige:</span>
          <span className="font-mono text-[10px] sm:text-[11px] font-black text-amber-300">
            {prestigeCount > 0 ? `Lv. ${prestigeCount}` : "Aufstieg"}
          </span>
        </div>
      </section>
    );
  },
);
CosmicHUD.displayName = "CosmicHUD";
