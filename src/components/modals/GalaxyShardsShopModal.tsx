import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";
import { ZODIACS, getZodiac } from "../../data/zodiacs";
import { Sparkles, X, Flame, ShieldAlert, Award, Star, History, BatteryCharging } from "lucide-react";

interface GalaxyShardsShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  galaxyShards: number;
  zodiacLevels: Record<string, number>;
  slummerGlassLevel: number;
  catalystLevel: number;
  doubleStellarLevel: number;
  onUpgradeZodiacLevel: (id: string, cost: number) => void;
  onUpgradeSlummerGlass: (cost: number) => void;
  onUpgradeCatalyst: (cost: number) => void;
  onUpgradeDoubleStellar: (cost: number) => void;
}

export const GalaxyShardsShopModal: React.FC<GalaxyShardsShopModalProps> = React.memo(({
  isOpen,
  onClose,
  galaxyShards,
  zodiacLevels,
  slummerGlassLevel,
  catalystLevel,
  doubleStellarLevel,
  onUpgradeZodiacLevel,
  onUpgradeSlummerGlass,
  onUpgradeCatalyst,
  onUpgradeDoubleStellar,
}) => {
  const [activeTab, setActiveTab] = useState<"zodiacs" | "utilities">("zodiacs");

  // Get localized or default level of a zodiac
  const getZodiacLvl = (id: string) => zodiacLevels[id] || 1;

  // Render upgraded description for a zodiac
  const getUpgradedZodiacBenefit = (id: string, lvl: number) => {
    switch (id) {
      case "katze":
        return {
          current: `${20 + (lvl - 1) * 5}% Crit-Chance & ${7 + (lvl - 1) * 2}x Crit-Kraft`,
          next: `${20 + lvl * 5}% Crit-Chance & ${7 + lvl * 2}x Crit-Kraft`,
        };
      case "biene":
        return {
          current: `+${35 + (lvl - 1) * 15}% passiver Tier-Boost`,
          next: `+${35 + lvl * 15}% passiver Tier-Boost`,
        };
      case "mond":
        return {
          current: `+${225 + (lvl - 1) * 25}% Mondmultiplikator`,
          next: `+${225 + lvl * 25}% Mondmultiplikator`,
        };
      case "drache":
        return {
          current: `+${40 + (lvl - 1) * 15}% stärkere Events`,
          next: `+${40 + lvl * 15}% stärkere Events`,
        };
      case "frosch":
        return {
          current: `-${Math.min(65, 35 + (lvl - 1) * 5)}% Missionstimer`,
          next: `-${Math.min(65, 35 + lvl * 5)}% Missionstimer`,
        };
      case "fuchs":
        return {
          current: `+${40 + (lvl - 1) * 15}% Klick-Kraft`,
          next: `+${40 + lvl * 15}% Klick-Kraft`,
        };
      case "eule":
        return {
          current: `+${30 + (lvl - 1) * 15}% Sternen-Produktion`,
          next: `+${30 + lvl * 15}% Sternen-Produktion`,
        };
      case "schildkroete":
        return {
          current: `+${20 + (lvl - 1) * 10}% Gesamt-LPS`,
          next: `+${20 + lvl * 10}% Gesamt-LPS`,
        };
      case "einhorn":
        return {
          current: `-${Math.min(50, 20 + (lvl - 1) * 5)}% Kosmetik-Preise`,
          next: `-${Math.min(50, 20 + lvl * 5)}% Kosmetik-Preise`,
        };
      case "phoenix":
        return {
          current: `+${35 + (lvl - 1) * 15}% Glitzerstaub`,
          next: `+${35 + lvl * 15}% Glitzerstaub`,
        };
      default:
        return { current: "N/A", next: "N/A" };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="bg-[#191336]/95 rounded-3.5xl border-3 border-fuchsia-400 flex flex-col max-w-2xl w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text"
    >
      {/* Modal Header */}
      <div className="p-4 sm:p-5 border-b-3 border-fuchsia-400/50 bg-gradient-to-r from-[#171430] via-[#241744] to-[#171430] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none animate-bounce">🌌</span>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-fuchsia-300 block">Dunkle Materie Labor</span>
            <h4 id="shard_shop_title" className="font-sans font-black text-[#f5d0fe] text-sm uppercase tracking-wider flex items-center gap-1.5">
              Galaxie-Splitter Shop
            </h4>
          </div>
        </div>
        <button
          onClick={onClose}
          id="shard_shop_close_btn"
          className="w-8 h-8 rounded-full bg-[#1b153b] border-2 border-fuchsia-400 flex items-center justify-center font-bold text-base text-[#f5d0fe] hover:bg-fuchsia-900 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Galaxy Shard Balance Summary Panel */}
      <div className="bg-[#120a28] border-b border-fuchsia-500/20 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-fuchsia-800 to-indigo-950 rounded-xl border border-fuchsia-500/30">
            <span className="text-lg">🌌</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-fuchsia-250 block leading-tight">Dein kosmisches Vermögen</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-2xl font-black text-[#f5d0fe]">
                {galaxyShards}
              </span>
              <span className="text-xs font-semibold text-fuchsia-300">Galaxie-Splitter vorhanden</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs leading-relaxed max-w-xs text-fuchsia-200/80 font-medium text-center sm:text-right">
          Sammle Galaxie-Splitter, indem du mit deinem Planeten <span className="text-amber-350 font-bold">Stufe 20</span> erreichst und einen <span className="text-fuchsia-300 font-bold">Aufstieg (Prestige)</span> vollziehst!
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-[#100924] shrink-0 border-b border-fuchsia-500/10 h-10 select-none">
        <button
          onClick={() => setActiveTab("zodiacs")}
          id="shard_shop_tab_zodiacs"
          className={`flex-1 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "zodiacs"
              ? "bg-[#1d143c] border-b-2 border-fuchsia-400 text-[#f5d0fe]"
              : "text-[#8d82bd] hover:text-cosmic-text hover:bg-white/5"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Sternzeichen-Tiere ({ZODIACS.length})
        </button>
        <button
          onClick={() => setActiveTab("utilities")}
          id="shard_shop_tab_utils"
          className={`flex-1 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "utilities"
              ? "bg-[#1d143c] border-b-2 border-fuchsia-400 text-[#f5d0fe]"
              : "text-[#8d82bd] hover:text-cosmic-text hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Kosmische Meilensteine
        </button>
      </div>

      {/* Main shop options area with custom scrollbars */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#150a2b]">
        {activeTab === "zodiacs" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ZODIACS.map((zod) => {
              const lvl = getZodiacLvl(zod.id);
              const benefits = getUpgradedZodiacBenefit(zod.id, lvl);
              const isMaxFrog = zod.id === "frosch" && lvl >= 7; // cap reduction at 65% (lvl 7)
              const isMaxUnicorn = zod.id === "einhorn" && lvl >= 7; // cap discount at 50% (lvl 7)
              const isMaxLevel = isMaxFrog || isMaxUnicorn;
              
              // Level up costs L shards (level 1 -> 2 costs 1, level 2 -> 3 costs 2...)
              const cost = lvl;
              const hasEnough = galaxyShards >= cost;

              return (
                <div
                  key={zod.id}
                  id={`shard_shop_zod_${zod.id}`}
                  className="bg-[#211640] rounded-2xl border-2 border-purple-500/20 p-3.5 flex flex-col justify-between hover:border-fuchsia-400/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl select-none">{zod.emoji}</span>
                        <div>
                          <h5 className="font-sans font-black text-xs text-white leading-tight">
                            {zod.name}
                          </h5>
                          <span className="text-[9px] font-mono px-2 py-0.25 bg-fuchsia-500/20 text-[#f5d0fe] rounded-full border border-fuchsia-500/20 font-bold">
                            Stufe {lvl}
                          </span>
                        </div>
                      </div>
                      
                      {isMaxLevel ? (
                        <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">MAX Stufe</span>
                      ) : (
                        <div className="flex items-center gap-1 font-mono text-[10px] font-black text-fuchsia-200">
                          <span>Kosten:</span>
                          <span className={`${hasEnough ? "text-fuchsia-300" : "text-rose-400"}`}>
                            {cost} 🌌
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-fuchsia-100/70 leading-snug font-medium mb-3">
                      {zod.description}
                    </p>

                    <div className="p-2 rounded-xl bg-[#170e30] border border-white/5 flex flex-col gap-1 text-[9.5px]">
                      <div className="flex justify-between items-center text-purple-250">
                        <span>Aktuell:</span>
                        <span className="font-bold text-purple-100">{benefits.current}</span>
                      </div>
                      {!isMaxLevel && (
                        <div className="flex justify-between items-center text-fuchsia-350">
                          <span>Nächste Stufe:</span>
                          <span className="font-bold text-fuchsia-300">{benefits.next}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    id={`btn_upgrade_zod_${zod.id}`}
                    disabled={isMaxLevel || !hasEnough}
                    onClick={() => onUpgradeZodiacLevel(zod.id, cost)}
                    className={`w-full mt-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isMaxLevel
                        ? "bg-[#18122d]/60 text-slate-500 border border-slate-750 cursor-not-allowed"
                        : hasEnough
                          ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:scale-[1.02] text-white border border-fuchsia-400/40 shadow-md"
                          : "bg-[#1e133a]/80 text-[#8d82bd]/45 border border-purple-900/40 opacity-70 cursor-not-allowed"
                    }`}
                  >
                    {isMaxLevel ? "Maximiert!" : hasEnough ? `Upgrade auf Stufe ${lvl + 1}` : "Nicht genug Splitter"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 🏺 Schlummer-Glas Hours Upgrade */}
            <div id="shard_shop_utility_glass" className="bg-[#211640] rounded-2xl border-2 border-purple-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 self-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/35 flex items-center justify-center text-2xl shadow-inner shrink-0 select-none">
                  🏺
                </div>
                <div>
                  <h5 className="font-sans font-black text-sm text-amber-300 uppercase tracking-wide leading-none">
                    Unendliches Schlummer-Glas
                  </h5>
                  <p className="text-[10px] sm:text-xs text-fuchsia-100/75 mt-1 leading-relaxed max-w-sm">
                    Erhöht die maximale Kapazität der Offline-Ruhe um <span className="text-amber-300 font-extrabold">+2 Stunden</span> pro Stufe! Damit dehnst du deine Erntezeiten dramatisch aus.
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-400/15 text-amber-300 rounded-full border border-amber-400/20 font-mono">
                      Stufe {slummerGlassLevel}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-200">
                      Aktuell: <span className="font-extrabold text-[#f5d0fe]">{5 + (slummerGlassLevel - 1) * 2} Std. Max</span>
                    </span>
                    <span className="text-[10px] font-semibold text-fuchsia-300">
                      → <span className="font-extrabold">{5 + slummerGlassLevel * 2} Std. Max</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 self-stretch sm:self-center justify-center">
                <div className="flex items-center gap-1 font-mono text-xs font-black text-[#f5d0fe] bg-[#120a28] px-3 py-1 rounded-xl border border-fuchsia-500/15">
                  <span>Upgrade:</span>
                  <span className={galaxyShards >= slummerGlassLevel ? "text-fuchsia-300" : "text-rose-400"}>
                    {slummerGlassLevel} 🌌
                  </span>
                </div>
                <button
                  id="btn_upgrade_slummer_glass"
                  disabled={galaxyShards < slummerGlassLevel}
                  onClick={() => onUpgradeSlummerGlass(slummerGlassLevel)}
                  className={`w-full sm:w-40 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    galaxyShards >= slummerGlassLevel
                      ? "bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:scale-[1.02] text-white border border-amber-400/30 shadow-md"
                      : "bg-[#1e133a]/80 text-[#8d82bd]/45 border border-purple-900/40 opacity-70 cursor-not-allowed"
                  }`}
                >
                  {galaxyShards >= slummerGlassLevel ? "Wachstum wecken 🏺" : "Zu wenige Splitter"}
                </button>
              </div>
            </div>

            {/* 📈 Kosmischer Katalysator Upgrade */}
            <div id="shard_shop_utility_catalyst" className="bg-[#211640] rounded-2xl border-2 border-purple-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 self-start">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/35 flex items-center justify-center text-2xl shadow-inner shrink-0 select-none">
                  📈
                </div>
                <div>
                  <h5 className="font-sans font-black text-sm text-indigo-300 uppercase tracking-wide leading-none">
                    Hyper-Katalysator
                  </h5>
                  <p className="text-[10px] sm:text-xs text-fuchsia-100/75 mt-1 leading-relaxed max-w-sm">
                    Infundiert ein hyperdynamisches Feld auf dem Planeten! Erhalte dauerhaft <span className="text-indigo-300 font-extrabold">+15% EP</span> (Planet-Erfahrung) und <span className="text-indigo-200 font-extrabold">+15% LPS</span> (passives Gesamteinkommen) pro Stufe.
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-400/15 text-indigo-300 rounded-full border border-indigo-400/20 font-mono">
                      Stufe {catalystLevel}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-200">
                      Aktuell: <span className="font-extrabold text-[#f5d0fe]">+{catalystLevel * 15}%</span>
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-300">
                      → <span className="font-extrabold">+{(catalystLevel + 1) * 15}%</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 self-stretch sm:self-center justify-center">
                <div className="flex items-center gap-1 font-mono text-xs font-black text-[#f5d0fe] bg-[#120a28] px-3 py-1 rounded-xl border border-fuchsia-500/15">
                  <span>Upgrade:</span>
                  <span className={galaxyShards >= (catalystLevel + 1) ? "text-fuchsia-300" : "text-rose-400"}>
                    {catalystLevel + 1} 🌌
                  </span>
                </div>
                <button
                  id="btn_upgrade_catalyst"
                  disabled={galaxyShards < (catalystLevel + 1)}
                  onClick={() => onUpgradeCatalyst(catalystLevel + 1)}
                  className={`w-full sm:w-40 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    galaxyShards >= (catalystLevel + 1)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] text-white border border-indigo-400/30 shadow-md"
                      : "bg-[#1e133a]/80 text-[#8d82bd]/45 border border-purple-900/40 opacity-70 cursor-not-allowed"
                  }`}
                >
                  {galaxyShards >= (catalystLevel + 1) ? "Beschleunigen ⚙️" : "Zu wenige Splitter"}
                </button>
              </div>
            </div>

            {/* 🌠 Sternen-Glitzer-Fänger Upgrade */}
            <div id="shard_shop_utility_catcher" className="bg-[#211640] rounded-2xl border-2 border-purple-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 self-start">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-400/35 flex items-center justify-center text-2xl shadow-inner shrink-0 select-none">
                  🌠
                </div>
                <div>
                  <h5 className="font-sans font-black text-sm text-pink-300 uppercase tracking-wide leading-none">
                    Zwielicht-Glitzer-Magnet
                  </h5>
                  <p className="text-[10px] sm:text-xs text-fuchsia-100/75 mt-1 leading-relaxed max-w-sm">
                    Gibt dir eine permanente <span className="text-pink-300 font-extrabold">+10% Chance</span> pro Stufe auf <span className="text-fuchsia-300 font-black">verdoppelten Sternengewinn</span> und <span className="text-fuchsia-200 font-black">verdoppelte Ausbeute</span> von kosmischem Glitzerstaub!
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-pink-400/15 text-pink-300 rounded-full border border-pink-400/20 font-mono">
                      Stufe {doubleStellarLevel}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-200">
                      Aktuell: <span className="font-extrabold text-[#f5d0fe]">{doubleStellarLevel * 10}% Chance</span>
                    </span>
                    <span className="text-[10px] font-semibold text-pink-300">
                      → <span className="font-extrabold">{(doubleStellarLevel + 1) * 10}% Chance</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 self-stretch sm:self-center justify-center">
                <div className="flex items-center gap-1 font-mono text-xs font-black text-[#f5d0fe] bg-[#120a28] px-3 py-1 rounded-xl border border-fuchsia-500/15">
                  <span>Upgrade:</span>
                  <span className={galaxyShards >= (doubleStellarLevel + 1) ? "text-fuchsia-300" : "text-rose-400"}>
                    {doubleStellarLevel + 1} 🌌
                  </span>
                </div>
                <button
                  id="btn_upgrade_double_catcher"
                  disabled={galaxyShards < (doubleStellarLevel + 1)}
                  onClick={() => onUpgradeDoubleStellar(doubleStellarLevel + 1)}
                  className={`w-full sm:w-40 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    galaxyShards >= (doubleStellarLevel + 1)
                      ? "bg-gradient-to-r from-pink-500 to-indigo-600 hover:scale-[1.02] text-white border border-pink-400/30 shadow-md"
                      : "bg-[#1e133a]/80 text-[#8d82bd]/45 border border-purple-900/40 opacity-70 cursor-not-allowed"
                  }`}
                >
                  {galaxyShards >= (doubleStellarLevel + 1) ? "Magnetisieren 🌠" : "Zu wenige Splitter"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close and Bottom Panel */}
      <div className="p-4 bg-[#100824] border-t border-fuchsia-500/15 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-200/50 font-bold">
          <span>Süßes Universum</span>
          <span>•</span>
          <span>Spezial-Forschung v2.0</span>
        </div>
        <button
          onClick={onClose}
          id="shard_shop_bottom_close"
          className="px-6 py-2 bg-gradient-to-r from-purple-800 to-fuchsia-900 hover:from-purple-750 hover:to-fuchsia-850 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 text-[#f5d0fe] border border-fuchsia-500/25 shadow-lg cursor-pointer"
        >
          Fertig gelernt! 🌌
        </button>
      </div>
    </Modal>
  );
});

GalaxyShardsShopModal.displayName = "GalaxyShardsShopModal";
