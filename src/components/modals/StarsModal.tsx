import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star, HelpCircle, Flame, Sparkles, Orbit } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";

export interface ConstellationDef {
  id: string;
  name: string;
  germanName: string;
  emoji: string;
  baseStarsCost: number;
  baseMoonsCost: number;
  maxLevel: number;
  bonusText: string;
  germanDescription: string;
}

export const CONSTELLATIONS_LIST: ConstellationDef[] = [
  {
    id: "kuschel",
    name: "Cuddle Constellation",
    germanName: "Kuschel-Sternbild",
    emoji: "🧸",
    baseStarsCost: 10,
    baseMoonsCost: 0,
    maxLevel: 5,
    bonusText: "+10% Tier-Produktion pro Stufe",
    germanDescription:
      "Eine kuschelige Himmelsgruppe, die eine schützende Aura spendet. Sie ermutigt alle deine Tiere, glücklicher zu sein und passive Lebensenergie zu produzieren.",
  },
  {
    id: "mondhasen",
    name: "Moon Bunny Constellation",
    germanName: "Mondhasen-Sternbild",
    emoji: "🐇",
    baseStarsCost: 25,
    baseMoonsCost: 1,
    maxLevel: 3,
    bonusText: "+25% längere Nachtphase pro Stufe",
    germanDescription:
      "Die Gestalt eines flinken Mondhasen. Verlängert die wunderschöne Nacht-Phase, in der deine Sterne mit +50% erhöhter Kraft leuchten.",
  },
  {
    id: "supernova",
    name: "Supernova Constellation",
    germanName: "Supernova-Sternbild",
    emoji: "💥",
    baseStarsCost: 100,
    baseMoonsCost: 0,
    maxLevel: 3,
    bonusText: "+20% stärkere kosmische Events pro Stufe",
    germanDescription:
      "Eine energetische Kraftquelle am Himmelszelt. verstärkt die Erträge und Effekte aller aktiven Events (z.B. Sternschnuppen, Polarlichter und Meteoritenstürme).",
  },
  {
    id: "stardust_rain",
    name: "Stardust Cascade",
    germanName: "Sternenregen-Sternbild",
    emoji: "💫",
    baseStarsCost: 20,
    baseMoonsCost: 0,
    maxLevel: 5,
    bonusText: "+15% mehr Planeten-EXP pro Stufe",
    germanDescription:
      "Eine funkelnde Kaskade von Sternenlicht. Lässt deinen Planeten beim Klicken und automatischen Tappen deutlich schneller Erfahrung sammeln.",
  },
  {
    id: "cosmic_harmony",
    name: "Cosmic Harmony",
    germanName: "Kosmische Harmonie",
    emoji: "🌌",
    baseStarsCost: 40,
    baseMoonsCost: 2,
    maxLevel: 3,
    bonusText: "+8% Klick- & Star-Schlagkraft pro Stufe",
    germanDescription:
      "Die perfekte Ausrichtung von Sternen und Monden im Einklang. Erhöht die manuelle Schlagkraft deiner Klicks sowie den Ertrag deiner Gravitations-Sterne.",
  },
  {
    id: "ewiges_polarlicht",
    name: "Eternal Aurorabeam",
    germanName: "Ewiges Polarlicht",
    emoji: "🔮",
    baseStarsCost: 50,
    baseMoonsCost: 0,
    maxLevel: 3,
    bonusText: "-15% Wartezeit zwischen Events pro Stufe",
    germanDescription:
      "Ein unaufhörliches kosmisches Leuchten. Zieht kosmische Ereignisse magisch an, sodass die coolen Events deutlich schneller hintereinander auftreten.",
  },
];

interface StarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyStar: () => void;
  formatCompactNumber: (num: number) => string;
  onMergeMoons: () => void;
  constellations: Record<string, number>;
  onInvestConstellation: (constellationId: string, starsCost: number, moonsCost: number) => void;
}

export const StarsModal: React.FC<StarsModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    onBuyStar,
    formatCompactNumber,
    onMergeMoons,
    constellations,
    onInvestConstellation,
  }) => {
    const {
      life,
      starsCount,
      starPowerPerStar,
      starClicksTriggered,
      starCost,
      totalStarsLps,
      moonsCount,
      prestigeCount,
      maxMoons,
    } = useGameState();
    const [activeTab, setActiveTab] = useState<"stars_call" | "constellations">("stars_call");

    const canMerge = starsCount >= 50 && moonsCount < maxMoons;
    const prestigeMultiplier = 1 + prestigeCount * 0.1;
    const singleMoonPower = 15000 * prestigeMultiplier;
    const totalMoonPower = moonsCount * singleMoonPower;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-[#141235]/95 rounded-3.5xl border-3 border-amber-300 flex flex-col max-w-xl w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-3 border-amber-300/60 bg-gradient-to-r from-[#110e2f] via-[#1b1747] to-[#110e2f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none animate-pulse">🌌</span>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 block">
                Kosmisches Gewölbe
              </span>
              <h4 className="font-sans font-black text-cosmic-text text-sm uppercase tracking-wide">
                Umlaufbahnen &amp; Sternzeichen
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1b1836] border-2 border-amber-300 flex items-center justify-center font-bold text-lg text-white hover:bg-cosmic-surface-hover active:scale-95 transition-all shadow-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Currency Display Bar (HUD) */}
        <div className="px-5 py-3 bg-[#0d0a22] border-b border-cosmic-accent/10 flex gap-4 items-center justify-around shrink-0 text-xs">
          <div className="flex items-center gap-1 bg-[#1b1743] px-3 py-1 rounded-xl border border-amber-300/40 font-mono">
            <span>Sterne:</span>
            <strong className="text-amber-200 font-extrabold text-sm ml-1 flex items-center gap-0.5">
              ⭐ {starsCount}
            </strong>
          </div>
          <div className="flex items-center gap-1 bg-[#1b1743] px-3 py-1 rounded-xl border border-purple-400/40 font-mono">
            <span>Monde:</span>
            <strong className="text-purple-300 font-extrabold text-sm ml-1 flex items-center gap-0.5">
              🌙 {moonsCount}
            </strong>
          </div>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-4 pt-4 shrink-0">
          <div className="flex rounded-2xl bg-[#0a081d] p-1 border border-cosmic-accent/10">
            <button
              onClick={() => setActiveTab("stars_call")}
              className={`flex-1 py-2 rounded-xl font-sans font-black text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "stars_call"
                  ? "bg-[#211a4e] text-amber-300 shadow-lg border border-cosmic-accent/20"
                  : "text-[#978aac] hover:text-white"
              }`}
            >
              ⭐ Autoclicker (Sterne)
            </button>
            <button
              onClick={() => setActiveTab("constellations")}
              className={`flex-1 py-2 rounded-xl font-sans font-black text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "constellations"
                  ? "bg-[#211a4e] text-cyan-300 shadow-lg border border-cosmic-accent/20"
                  : "text-[#978aac] hover:text-white"
              }`}
            >
              🌌 Sternbilder füllen
            </button>
          </div>
        </div>

        {/* Content Box with tabs switcher */}
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "stars_call" ? (
              <motion.div
                key="stars"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Informative description banner */}
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border-2 border-amber-300/40 text-xs text-cosmic-text space-y-1.5 leading-relaxed shadow-md">
                  <span className="font-black flex items-center gap-1 select-none uppercase tracking-wide text-[11px] text-amber-200">
                    ⭐ Wie funktionieren Sterne?
                  </span>
                  <p className="font-semibold text-[11px] text-cosmic-accent-muted leading-relaxed">
                    Sterne kreisen zierlich um deinen Planeten und tippen ihn passiv an.{" "}
                    <b>Synergie:</b> Deine Klick-Stärken-Upgrades verstärken deine Sterne zusätzlich
                    (+20% der Klick-Upgrades)!
                  </p>
                  <div className="pt-1.5 text-[11.5px] font-mono font-black flex items-center justify-between border-t border-cosmic-accent/25 text-amber-200">
                    <span>Stern-Schlagkraft:</span>
                    <span>+{formatCompactNumber(starPowerPerStar)} Leben/Tipp</span>
                  </div>
                </div>

                {/* Interactive Purchase Row */}
                <div className="bg-cosmic-surface-mid/50 p-4 rounded-2.5xl border-2 border-amber-350 flex flex-col items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-3 rounded-xl bg-cosmic-surface border-2 border-amber-300 flex items-center justify-center text-3xl shadow-md shrink-0 select-none">
                      ⭐
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h5 className="font-sans font-black text-xs sm:text-sm text-cosmic-text uppercase tracking-wide truncate">
                        Orbitaler Sternenläufer
                      </h5>
                      <p className="font-sans text-[11px] font-semibold text-cosmic-accent-muted mt-0.5 leading-tight">
                        Rufe einen kleinen schwebenden Stern herbei.
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300 font-mono font-black">
                        <span>Aktive Stars:</span>
                        <span className="px-2.5 py-0.5 border-2 border-amber-300 rounded-md bg-[#1d173c] text-amber-200">
                          {starsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onBuyStar}
                    disabled={life < starCost}
                    className={`w-full px-4 py-3 rounded-xl font-black flex flex-col items-center justify-center transition-all select-none border-2 cursor-pointer ${
                      life >= starCost
                        ? "bg-gradient-to-b from-[#24214e] to-[#12112b] text-cosmic-text border-cosmic-accent hover:from-[#353174] hover:to-[#171638] hover:scale-103 shadow-[2.5px_2.5px_0px_var(--color-cosmic-accent)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--color-cosmic-accent)]"
                        : "bg-[#18162f]/80 text-cosmic-accent-muted/40 border-cosmic-accent/20 shadow-none cursor-not-allowed opacity-40"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-cosmic-accent-muted">
                      Herbeirufen
                    </span>
                    <span className="font-mono text-xs font-black mt-0.5 text-white">
                      {formatCompactNumber(starCost)} 💖
                    </span>
                  </button>
                </div>

                {/* Mond-Verschmelzung / Moon Merger Row */}
                <div className="bg-gradient-to-b from-[#2a174d] to-[#171131] p-4 rounded-2.5xl border-2 border-fuchsia-400/50 flex flex-col items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

                  <div className="flex items-center gap-3 w-full relative z-10">
                    <div className="p-3 rounded-xl bg-cosmic-surface border-2 border-purple-400 flex items-center justify-center text-3xl shadow-md shrink-0 select-none animate-pulse">
                      🌙
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <h5 className="font-sans font-black text-xs sm:text-sm text-fuchsia-200 uppercase tracking-wide truncate">
                          Mond-Verschmelzung
                        </h5>
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] bg-amber-400/10 border border-amber-300 text-amber-200 uppercase font-mono font-black shrink-0 tracking-widest leading-none">
                          Massiv!
                        </span>
                      </div>
                      <p className="font-sans text-[11.5px] font-semibold text-[#c8bdf4] mt-0.5 leading-tight">
                        Verschmelze <b className="text-white">50 Sterne</b> zu einem mächtigen
                        umkreisenden Mond (Trabant).
                      </p>
                      <div className="mt-2 text-xs text-purple-300 font-mono font-black border-b border-purple-500/20 pb-1.5 flex justify-between">
                        <span>Erschaffene Monde:</span>
                        <span className="text-purple-200">
                          {moonsCount} / {maxMoons}
                        </span>
                      </div>

                      <div className="mt-2.5 w-full text-[10.5px] font-mono leading-relaxed space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-purple-300">🌙 Leben pro Sekunde:</span>
                          <span className="font-black text-fuchsia-250 filter drop-shadow-[0_0_4px_rgba(217,70,239,0.5)]">
                            +{formatCompactNumber(singleMoonPower)} 💖/s
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-purple-400 font-semibold">• EP-Anteil:</span>
                          <span className="text-fuchsia-300 font-bold">+15 EP/s</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-purple-450 font-bold">• Globaler Booster:</span>
                          <span className="text-amber-300 font-black">
                            +150% Gesamt-LPS pro Mond! 🚀
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onMergeMoons}
                    disabled={!canMerge}
                    className={`w-full px-4 py-3 rounded-xl font-black flex flex-col items-center justify-center transition-all select-none border-2 cursor-pointer z-10 ${
                      canMerge
                        ? "bg-gradient-to-b from-[#6b21a8] to-[#3b0764] text-white border-purple-400 hover:from-[#7e22ce] hover:to-[#581c87] hover:scale-103 shadow-[2.5px_2.5px_0px_var(--color-cosmic-accent)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--color-cosmic-accent)]"
                        : "bg-[#18162f]/80 text-cosmic-accent-muted/40 border-purple-400/20 shadow-none cursor-not-allowed opacity-45"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-[#c8bdf4]">
                      {moonsCount >= maxMoons ? "Maximum erreicht" : "Qualitativ verschmelzen"}
                    </span>
                    <span className="font-mono text-xs font-black mt-0.5 text-white">
                      {moonsCount >= maxMoons
                        ? `${maxMoons}/${maxMoons} Monde aktiv 🌙`
                        : starsCount >= 50
                          ? "Fliegenden Mond schmieden! ✨"
                          : `Benötigt 50 Sterne (${starsCount}/50)`}
                    </span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="constellations"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {/* Constellation explanation banner */}
                <div className="p-3.5 rounded-2xl bg-cyan-400/10 border-2 border-cyan-400/30 text-xs leading-relaxed text-slate-200">
                  <span className="font-black text-cyan-200 flex items-center gap-1 uppercase tracking-wide text-[10.5px]">
                    🌌 Was bewirken Sternbilder?
                  </span>
                  <b className="text-white mt-1 block font-semibold text-[11px]">
                    Sterne &amp; Monde dauerhaft investieren!
                  </b>
                  <p className="text-cosmic-accent-muted text-[10.5px] mt-0.5 leading-tight">
                    Investiere deine gesammelten Sterne und Monde permanent in wunderschöne
                    kosmische Konstellationen. Sie geben dir mächtige, dauerhafte Multiplikatoren,
                    die auch nach einem Prestige aktiv bleiben!
                  </p>
                </div>

                <div className="space-y-3">
                  {CONSTELLATIONS_LIST.map((constell) => {
                    const currentLevel = constellations[constell.id] || 0;
                    const isMaxed = currentLevel >= constell.maxLevel;

                    const starsCost = isMaxed ? 0 : (currentLevel + 1) * constell.baseStarsCost;
                    const moonsCost = isMaxed ? 0 : (currentLevel + 1) * constell.baseMoonsCost;

                    const hasEnoughStars = starsCount >= starsCost;
                    const hasEnoughMoons = moonsCount >= moonsCost;
                    const canAfford = !isMaxed && hasEnoughStars && hasEnoughMoons;

                    return (
                      <div
                        key={constell.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border-2 transition-all gap-3.5 group relative overflow-hidden ${
                          isMaxed
                            ? "border-emerald-500/50 bg-[#16272b]/50"
                            : currentLevel > 0
                              ? "border-cyan-400/50 bg-[#192248]/55"
                              : "border-cosmic-accent/25 bg-[#1b193f]/40 hover:bg-[#1b193f]/70"
                        }`}
                      >
                        {isMaxed && (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-sans font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-bl-lg">
                            MAXIMIERT
                          </div>
                        )}

                        {/* Left Details */}
                        <div className="flex items-start gap-3 min-w-0 flex-grow">
                          <div
                            className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-2xl shadow-lg shrink-0 select-none ${
                              isMaxed
                                ? "bg-slate-900 border-emerald-400"
                                : "bg-[#18153d] border-cyan-400/60"
                            }`}
                          >
                            {constell.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-sans font-black text-xs text-cosmic-text uppercase tracking-wider">
                                {constell.germanName}
                              </h5>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-black ${
                                  isMaxed
                                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                    : currentLevel > 0
                                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                                      : "bg-slate-500/10 text-slate-400"
                                }`}
                              >
                                {currentLevel}/{constell.maxLevel}
                              </span>
                            </div>
                            <p className="font-sans text-[10px] text-[#a599d1] mt-1 leading-normal">
                              {constell.germanDescription}
                            </p>

                            <div className="flex flex-col gap-0.5 mt-1.5 font-mono text-[9px]">
                              <div className="text-cyan-300 font-bold">
                                Effekt:{" "}
                                <span className="text-cyan-100 font-normal">
                                  {constell.bonusText}
                                </span>
                              </div>
                              {currentLevel > 0 && (
                                <div className="text-emerald-400 font-bold">
                                  Aktiver Bonus: +
                                  {currentLevel *
                                    (constell.id === "kuschel"
                                      ? 10
                                      : constell.id === "mondhasen"
                                        ? 25
                                        : constell.id === "supernova"
                                          ? 20
                                          : constell.id === "stardust_rain"
                                            ? 15
                                            : constell.id === "cosmic_harmony"
                                              ? 8
                                              : 15)}
                                  %
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action */}
                        <div className="shrink-0 flex items-center">
                          {isMaxed ? (
                            <div className="w-full text-center py-1.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono font-black">
                              VOLLENDET 🔮
                            </div>
                          ) : (
                            <button
                              disabled={!canAfford}
                              onClick={() =>
                                onInvestConstellation(constell.id, starsCost, moonsCost)
                              }
                              className={`w-full sm:w-auto px-3 py-2 rounded-xl font-black flex flex-col items-center justify-center transition-all select-none border-2 cursor-pointer ${
                                canAfford
                                  ? "bg-gradient-to-b from-[#213f56] to-[#0f1d2a] text-cosmic-text border-cyan-400 hover:from-[#2e5a7b] hover:to-[#172d3e] hover:scale-103 shadow-[2px_2px_0px_#22d3ee] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#22d3ee]"
                                  : "bg-[#18162f]/80 text-cosmic-accent-muted/40 border-cyan-400/20 shadow-none cursor-not-allowed opacity-40"
                              }`}
                            >
                              <span className="text-[8px] uppercase font-mono tracking-wider font-semibold text-cyan-300">
                                Sternbild füllen
                              </span>
                              <div className="flex gap-1.5 items-center mt-0.5 text-[9px] font-mono font-black text-white">
                                <span
                                  className={hasEnoughStars ? "text-amber-200" : "text-rose-300"}
                                >
                                  ⭐ {starsCost}
                                </span>
                                {moonsCost > 0 && (
                                  <span
                                    className={hasEnoughMoons ? "text-purple-300" : "text-rose-300"}
                                  >
                                    🌙 {moonsCost}
                                  </span>
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#13112a] border-t border-amber-300/40 flex flex-col sm:flex-row justify-between items-center text-[10px] text-cosmic-accent-muted font-semibold px-5 gap-1.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
            <span>
              Sterne:{" "}
              <b className="text-amber-300 font-black">
                +{formatCompactNumber(totalStarsLps)} 💖/s
              </b>
            </span>
            <span className="hidden sm:inline text-purple-400">|</span>
            <span>
              Trabanten:{" "}
              <b className="text-purple-300 font-black">
                +{formatCompactNumber(totalMoonPower)} 💖/s
              </b>
            </span>
          </div>
          <span>
            Guthaben: <b className="text-cosmic-pink font-black">{formatCompactNumber(life)} 💖</b>
          </span>
        </div>
      </Modal>
    );
  },
);

StarsModal.displayName = "StarsModal";
