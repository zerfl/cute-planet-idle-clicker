import React, { useState } from "react";
import { motion } from "motion/react";
import { Animal } from "../../types";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";

const AnimalImage: React.FC<{
  image?: string;
  emoji: string;
  sizeClassName?: string;
  emojiSizeClassName?: string;
}> = ({
  image,
  emoji,
  sizeClassName = "w-10 h-10 object-contain select-none",
  emojiSizeClassName = "text-2.5xl select-none",
}) => {
  const [error, setError] = useState(false);

  if (image && !error) {
    return (
      <img
        src={image}
        alt={emoji}
        onError={() => setError(true)}
        className={sizeClassName}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span className={emojiSizeClassName}>{emoji}</span>;
};

interface AnimalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedAnimals: Record<string, number>;
  animalDefs: Animal[];
  onBuyAnimal: (animalId: string, cost: number, countToBuy: number) => void;
  calculateCost: (baseCost: number, count: number, multiplier: number) => number;
  formatCompactNumber: (num: number) => string;
  upgradesSpecs: {
    bunnyBoost: boolean;
    chickBoost: boolean;
    catBoost: boolean;
    frogBoost: boolean;
    koalaBoost: boolean;
    pandaBoost: boolean;
    unicornBoost: boolean;
    globalAnimalsBoost: boolean;
  };
}

export const AnimalsModal: React.FC<AnimalsModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    purchasedAnimals,
    animalDefs,
    onBuyAnimal,
    calculateCost,
    formatCompactNumber,
    upgradesSpecs,
  }) => {
    const { life, totalAnimalsLps } = useGameState();
    const [buyAmount, setBuyAmount] = useState<1 | 10 | 25 | "max">(1);
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

    // Smart Helpers math calculations
    const getCheapestAnimal = () => {
      let cheapest: (typeof animalDefs)[0] | null = null;
      let cheapestCost = Infinity;

      animalDefs.forEach((animal) => {
        const count = purchasedAnimals[animal.id] || 0;
        const cost = Math.floor(animal.baseCost * Math.pow(animal.costMultiplier, count));
        if (cost < cheapestCost) {
          cheapestCost = cost;
          cheapest = animal;
        }
      });

      return cheapest ? { animal: cheapest, cost: cheapestCost } : null;
    };

    const getBestRatioAnimal = () => {
      let best: (typeof animalDefs)[0] | null = null;
      let bestRatio = -1;
      let bestCost = 0;

      animalDefs.forEach((animal) => {
        const count = purchasedAnimals[animal.id] || 0;
        const cost = Math.floor(animal.baseCost * Math.pow(animal.costMultiplier, count));

        let multiplier = 1.0;
        if (animal.id === "bunny" && upgradesSpecs.bunnyBoost) multiplier *= 2.0;
        if (animal.id === "chick" && upgradesSpecs.chickBoost) multiplier *= 2.0;
        if (animal.id === "cat" && upgradesSpecs.catBoost) multiplier *= 2.0;
        if (animal.id === "frog" && upgradesSpecs.frogBoost) multiplier *= 2.0;
        if (animal.id === "koala" && upgradesSpecs.koalaBoost) multiplier *= 2.0;
        if (animal.id === "panda" && upgradesSpecs.pandaBoost) multiplier *= 2.0;
        if (animal.id === "unicorn" && upgradesSpecs.unicornBoost) multiplier *= 2.0;
        if (upgradesSpecs.globalAnimalsBoost) multiplier *= 1.5;

        const lpsDisplay = animal.baseLps * multiplier;
        const ratio = lpsDisplay / cost;

        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = animal;
          bestCost = cost;
        }
      });

      return best ? { animal: best, cost: bestCost } : null;
    };

    const cheapestInfo = getCheapestAnimal();
    const bestRatioInfo = getBestRatioAnimal();

    const buyCheapest = () => {
      if (cheapestInfo && life >= cheapestInfo.cost) {
        onBuyAnimal(cheapestInfo.animal.id, cheapestInfo.cost, 1);
      }
    };

    const buyBestRatio = () => {
      if (bestRatioInfo && life >= bestRatioInfo.cost) {
        onBuyAnimal(bestRatioInfo.animal.id, bestRatioInfo.cost, 1);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-[#1a163a]/95 rounded-3.5xl border-3 border-cosmic-accent flex flex-col max-w-xl w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-3 border-cosmic-accent/60 bg-gradient-to-r from-[#171430] via-[#211a3d] to-[#171430] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">
              {selectedAnimal ? selectedAnimal.emoji : "🐾"}
            </span>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block">
                {selectedAnimal ? "Detailansicht" : "Sanfte Tierzucht"}
              </span>
              <h4 className="font-sans font-black text-cosmic-text text-sm uppercase tracking-wide">
                {selectedAnimal ? selectedAnimal.germanName : "Passive Lebensenergie gewinnen"}
              </h4>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedAnimal(null);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#1b1836] border-2 border-cosmic-accent flex items-center justify-center font-bold text-lg text-white hover:bg-cosmic-surface-hover active:scale-95 transition-all shadow-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Multi Buy and Smart Actions Toolbar - Show only if no animal selected */}
        {!selectedAnimal && (
          <div className="p-3 bg-[#13112a]/90 border-b border-cosmic-accent/30 flex flex-col gap-2 shrink-0 px-4 sm:px-5">
            {/* Purchase Amount Selection */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#b4a8e2] uppercase tracking-wider font-mono">
                Kauf-Menge:
              </span>
              <div className="flex rounded-full bg-[#1c193b] border border-cosmic-accent/40 p-0.5 shadow-sm">
                {([1, 10, 25, "max"] as const).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBuyAmount(amt)}
                    className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider transition-all cursor-pointer ${
                      buyAmount === amt
                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {amt === "max" ? "MAX" : `x${amt}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Automation Actions */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                disabled={!cheapestInfo || life < cheapestInfo.cost}
                onClick={buyCheapest}
                className={`p-1.5 px-3 rounded-xl border flex items-center justify-between transition-all text-[9.5px] font-black font-mono cursor-pointer select-none ${
                  cheapestInfo && life >= cheapestInfo.cost
                    ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20"
                    : "bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-50"
                }`}
              >
                <span className="truncate">🛒 Billigstes Tier</span>
                {cheapestInfo && (
                  <span className="bg-emerald-500/20 px-1 py-0.5 rounded ml-1 shrink-0 text-emerald-200">
                    {formatCompactNumber(cheapestInfo.cost)} 💖
                  </span>
                )}
              </button>

              <button
                disabled={!bestRatioInfo || life < bestRatioInfo.cost}
                onClick={buyBestRatio}
                className={`p-1.5 px-3 rounded-xl border flex items-center justify-between transition-all text-[9.5px] font-black font-mono cursor-pointer select-none ${
                  bestRatioInfo && life >= bestRatioInfo.cost
                    ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20"
                    : "bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-50"
                }`}
              >
                <span className="truncate">🧪 Bestes LPS/Kosten</span>
                {bestRatioInfo && (
                  <span className="bg-cyan-500/20 px-1 py-0.5 rounded ml-1 shrink-0 text-cyan-200">
                    {formatCompactNumber(bestRatioInfo.cost)} 💖
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto pr-2">
          {selectedAnimal ? (
            <div className="flex flex-col items-center py-2 px-1">
              {/* Back button */}
              <button
                onClick={() => setSelectedAnimal(null)}
                className="self-start mb-4 flex items-center gap-1.5 text-xs font-black text-purple-300 hover:text-white uppercase tracking-wider font-sans transition-all cursor-pointer bg-[#1e1a42] px-3.5 py-2 rounded-full border border-cosmic-accent/30"
              >
                <span>← Zurück zur Übersicht</span>
              </button>

              {/* Big Presentation Circle */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-40 h-40 rounded-3xl bg-cosmic-surface border-3 border-cosmic-accent flex items-center justify-center shadow-lg relative shrink-0 overflow-hidden"
              >
                {/* Ambient lighting backdrop */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-pink-900/20 opacity-60" />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="z-10"
                >
                  <AnimalImage
                    image={selectedAnimal.image}
                    emoji={selectedAnimal.emoji}
                    sizeClassName="w-32 h-32 object-contain select-none filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
                    emojiSizeClassName="text-7xl select-none filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.4)]"
                  />
                </motion.div>
                {(purchasedAnimals[selectedAnimal.id] || 0) > 0 && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-[#f15e75] to-rose-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-full border-2 border-cosmic-accent shadow-md animate-pulse z-20">
                    Bestand: {purchasedAnimals[selectedAnimal.id] || 0}
                  </span>
                )}
              </motion.div>

              {/* Name & Title */}
              <h4 className="text-xl sm:text-2xl font-black text-cosmic-text text-center mt-4 uppercase tracking-wide">
                {selectedAnimal.germanName}
              </h4>
              <p className="text-xs text-center text-[#d1cbeb] font-bold italic max-w-sm px-4 mt-1.5 leading-relaxed">
                "{selectedAnimal.germanDescription || selectedAnimal.description}"
              </p>

              {/* Grid of statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-5">
                {/* Box 1: Einnahmen-Statistik */}
                <div className="bg-[#201c46]/60 p-3.5 rounded-2xl border border-cosmic-accent/30 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block mb-2">
                    📊 Produktion
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-cosmic-accent-muted font-semibold">Ertrag / Tier:</span>
                      <span className="font-mono font-black text-rose-300">
                        +
                        {formatCompactNumber(
                          selectedAnimal.baseLps *
                            (selectedAnimal.id === "bunny" && upgradesSpecs.bunnyBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "chick" && upgradesSpecs.chickBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "cat" && upgradesSpecs.catBoost ? 2.0 : 1.0) *
                            (selectedAnimal.id === "frog" && upgradesSpecs.frogBoost ? 2.0 : 1.0) *
                            (selectedAnimal.id === "koala" && upgradesSpecs.koalaBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "panda" && upgradesSpecs.pandaBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "unicorn" && upgradesSpecs.unicornBoost
                              ? 2.0
                              : 1.0) *
                            (upgradesSpecs.globalAnimalsBoost ? 1.5 : 1.0),
                        )}{" "}
                        💖/s
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-cosmic-accent-muted font-semibold">Bestand:</span>
                      <span className="font-mono font-black text-white">
                        {purchasedAnimals[selectedAnimal.id] || 0}x
                      </span>
                    </div>
                    <div className="border-t border-cosmic-accent/20 my-1 pt-1.5 flex justify-between items-center text-xs">
                      <span className="text-pink-300 font-bold">Gesamtertrag:</span>
                      <span className="font-mono font-black text-pink-300">
                        +
                        {formatCompactNumber(
                          (purchasedAnimals[selectedAnimal.id] || 0) *
                            selectedAnimal.baseLps *
                            (selectedAnimal.id === "bunny" && upgradesSpecs.bunnyBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "chick" && upgradesSpecs.chickBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "cat" && upgradesSpecs.catBoost ? 2.0 : 1.0) *
                            (selectedAnimal.id === "frog" && upgradesSpecs.frogBoost ? 2.0 : 1.0) *
                            (selectedAnimal.id === "koala" && upgradesSpecs.koalaBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "panda" && upgradesSpecs.pandaBoost
                              ? 2.0
                              : 1.0) *
                            (selectedAnimal.id === "unicorn" && upgradesSpecs.unicornBoost
                              ? 2.0
                              : 1.0) *
                            (upgradesSpecs.globalAnimalsBoost ? 1.5 : 1.0),
                        )}{" "}
                        💖/s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 2: Upgrade-Bündnisse */}
                <div className="bg-[#201c46]/60 p-3.5 rounded-2xl border border-cosmic-accent/30 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block mb-2">
                    ✨ Booster & Boni
                  </span>
                  <div className="space-y-1.5 text-xs font-semibold">
                    {[
                      {
                        key: "bunny",
                        name: "Wattebausch-Schuhe",
                        active: upgradesSpecs.bunnyBoost,
                      },
                      {
                        key: "chick",
                        name: "Luxus-Sternenkörner",
                        active: upgradesSpecs.chickBoost,
                      },
                      { key: "cat", name: "Baldrian-Kissen", active: upgradesSpecs.catBoost },
                      { key: "frog", name: "Seerosen-Heizung", active: upgradesSpecs.frogBoost },
                      {
                        key: "koala",
                        name: "Gold-Eukalyptusblatt",
                        active: upgradesSpecs.koalaBoost,
                      },
                      {
                        key: "panda",
                        name: "Riesen-Bambustorte",
                        active: upgradesSpecs.pandaBoost,
                      },
                      {
                        key: "unicorn",
                        name: "Prisma-Glimmerhorn",
                        active: upgradesSpecs.unicornBoost,
                      },
                    ].some((u) => u.key === selectedAnimal.id) ? (
                      <div className="flex justify-between items-center">
                        <span className="text-cosmic-accent-muted truncate mr-2">
                          {
                            [
                              { key: "bunny", name: "Wattebausch-Schuhe" },
                              { key: "chick", name: "Luxus-Sternenkörner" },
                              { key: "cat", name: "Baldrian-Kissen" },
                              { key: "frog", name: "Seerosen-Heizung" },
                              { key: "koala", name: "Gold-Eukalyptusblatt" },
                              { key: "panda", name: "Riesen-Bambustorte" },
                              { key: "unicorn", name: "Prisma-Glimmerhorn" },
                            ].find((u) => u.key === selectedAnimal.id)?.name
                          }
                          :
                        </span>
                        <span
                          className={
                            [
                              { key: "bunny", active: upgradesSpecs.bunnyBoost },
                              { key: "chick", active: upgradesSpecs.chickBoost },
                              { key: "cat", active: upgradesSpecs.catBoost },
                              { key: "frog", active: upgradesSpecs.frogBoost },
                              { key: "koala", active: upgradesSpecs.koalaBoost },
                              { key: "panda", active: upgradesSpecs.pandaBoost },
                              { key: "unicorn", active: upgradesSpecs.unicornBoost },
                            ].find((u) => u.key === selectedAnimal.id)?.active
                              ? "text-emerald-400 font-black animate-pulse"
                              : "text-slate-500"
                          }
                        >
                          {[
                            { key: "bunny", active: upgradesSpecs.bunnyBoost },
                            { key: "chick", active: upgradesSpecs.chickBoost },
                            { key: "cat", active: upgradesSpecs.catBoost },
                            { key: "frog", active: upgradesSpecs.frogBoost },
                            { key: "koala", active: upgradesSpecs.koalaBoost },
                            { key: "panda", active: upgradesSpecs.pandaBoost },
                            { key: "unicorn", active: upgradesSpecs.unicornBoost },
                          ].find((u) => u.key === selectedAnimal.id)?.active
                            ? "Aktiv (x2.0) ✅"
                            : "Inaktiv ❌"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-cosmic-accent-muted/70">
                        <span>Spezial-Booster:</span>
                        <span>Keine</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-cosmic-accent-muted">Kosmische Segen:</span>
                      <span
                        className={
                          upgradesSpecs.globalAnimalsBoost
                            ? "text-emerald-400 font-black animate-pulse"
                            : "text-slate-500"
                        }
                      >
                        {upgradesSpecs.globalAnimalsBoost ? "Aktiv (x1.5) ✅" : "Nicht gekauft ❌"}
                      </span>
                    </div>
                    <div className="border-t border-cosmic-accent/20 my-1 pt-1.5 flex justify-between items-center">
                      <span className="text-indigo-300 font-bold">Aktiver Multiplikator:</span>
                      <span className="font-mono font-black text-indigo-300">
                        x
                        {(
                          (selectedAnimal.id === "bunny" && upgradesSpecs.bunnyBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "chick" && upgradesSpecs.chickBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "cat" && upgradesSpecs.catBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "frog" && upgradesSpecs.frogBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "koala" && upgradesSpecs.koalaBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "panda" && upgradesSpecs.pandaBoost ? 2.0 : 1.0) *
                          (selectedAnimal.id === "unicorn" && upgradesSpecs.unicornBoost
                            ? 2.0
                            : 1.0) *
                          (upgradesSpecs.globalAnimalsBoost ? 1.5 : 1.0)
                        ).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Direct Bulk Buying Section inside detail view */}
              <div className="bg-[#141230]/70 border-2 border-cosmic-accent/30 p-3.5 rounded-2xl w-full mt-4 space-y-3">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#b4a8e2] block">
                  🛒 Schneller Kauf im Detailfenster
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Buy 1 */}
                  {(() => {
                    const cNow = purchasedAnimals[selectedAnimal.id] || 0;
                    const cost1 = Math.floor(
                      selectedAnimal.baseCost * Math.pow(selectedAnimal.costMultiplier, cNow),
                    );
                    return (
                      <button
                        disabled={life < cost1}
                        onClick={() => onBuyAnimal(selectedAnimal.id, cost1, 1)}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          life >= cost1
                            ? "bg-[#201c46] hover:bg-[#2b255e] border-cosmic-accent text-white hover:scale-102 shadow-md active:scale-97"
                            : "bg-[#18162e]/40 border-slate-700/30 text-cosmic-accent-muted/40 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          Kaufe x1
                        </span>
                        <span className="text-[10px] font-mono font-black text-cosmic-pink mt-0.5">
                          {formatCompactNumber(cost1)} 💖
                        </span>
                      </button>
                    );
                  })()}

                  {/* Buy 10 */}
                  {(() => {
                    const cNow = purchasedAnimals[selectedAnimal.id] || 0;
                    let cost10 = 0;
                    for (let i = 0; i < 10; i++)
                      cost10 += Math.floor(
                        selectedAnimal.baseCost * Math.pow(selectedAnimal.costMultiplier, cNow + i),
                      );
                    return (
                      <button
                        disabled={life < cost10}
                        onClick={() => onBuyAnimal(selectedAnimal.id, cost10, 10)}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          life >= cost10
                            ? "bg-[#201c46] hover:bg-[#2b255e] border-cosmic-accent text-white hover:scale-102 shadow-md active:scale-97"
                            : "bg-[#18162e]/40 border-slate-700/30 text-cosmic-accent-muted/40 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          Kaufe x10
                        </span>
                        <span className="text-[10px] font-mono font-black text-cosmic-pink mt-0.5">
                          {formatCompactNumber(cost10)} 💖
                        </span>
                      </button>
                    );
                  })()}

                  {/* Buy 25 */}
                  {(() => {
                    const cNow = purchasedAnimals[selectedAnimal.id] || 0;
                    let cost25 = 0;
                    for (let i = 0; i < 25; i++)
                      cost25 += Math.floor(
                        selectedAnimal.baseCost * Math.pow(selectedAnimal.costMultiplier, cNow + i),
                      );
                    return (
                      <button
                        disabled={life < cost25}
                        onClick={() => onBuyAnimal(selectedAnimal.id, cost25, 25)}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          life >= cost25
                            ? "bg-[#201c46] hover:bg-[#2b255e] border-cosmic-accent text-white hover:scale-102 shadow-md active:scale-97"
                            : "bg-[#18162e]/40 border-slate-700/30 text-cosmic-accent-muted/40 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          Kaufe x25
                        </span>
                        <span className="text-[10px] font-mono font-black text-cosmic-pink mt-0.5">
                          {formatCompactNumber(cost25)} 💖
                        </span>
                      </button>
                    );
                  })()}

                  {/* Buy MAX */}
                  {(() => {
                    const cNow = purchasedAnimals[selectedAnimal.id] || 0;
                    let tempC = cNow;
                    let totalCostMax = 0;
                    let countToBuyMax = 0;
                    while (true) {
                      const nextCost = Math.floor(
                        selectedAnimal.baseCost * Math.pow(selectedAnimal.costMultiplier, tempC),
                      );
                      if (totalCostMax + nextCost <= life) {
                        totalCostMax += nextCost;
                        tempC++;
                        countToBuyMax++;
                      } else {
                        break;
                      }
                    }
                    if (countToBuyMax === 0) {
                      countToBuyMax = 1;
                      totalCostMax = Math.floor(
                        selectedAnimal.baseCost * Math.pow(selectedAnimal.costMultiplier, cNow),
                      );
                    }
                    return (
                      <button
                        disabled={life < totalCostMax || countToBuyMax === 0}
                        onClick={() => onBuyAnimal(selectedAnimal.id, totalCostMax, countToBuyMax)}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          life >= totalCostMax && countToBuyMax > 0
                            ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] border-cosmic-accent text-white hover:scale-102 shadow-md active:scale-97"
                            : "bg-[#18162e]/40 border-slate-700/30 text-cosmic-accent-muted/40 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wide text-white">
                          MAX (x{countToBuyMax})
                        </span>
                        <span className="text-[10px] font-mono font-black text-white mt-0.5">
                          {formatCompactNumber(totalCostMax)} 💖
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {animalDefs.map((animal) => {
                const count = purchasedAnimals[animal.id] || 0;

                // Calculate dynamic bulk costs
                let tempCount = count;
                let totalCost = 0;
                let countToBuy = 0;

                if (buyAmount === "max") {
                  while (true) {
                    const nextCost = Math.floor(
                      animal.baseCost * Math.pow(animal.costMultiplier, tempCount),
                    );
                    if (totalCost + nextCost <= life) {
                      totalCost += nextCost;
                      tempCount++;
                      countToBuy++;
                    } else {
                      break;
                    }
                  }
                  if (countToBuy === 0) {
                    countToBuy = 1;
                    totalCost = Math.floor(
                      animal.baseCost * Math.pow(animal.costMultiplier, count),
                    );
                  }
                } else {
                  countToBuy = buyAmount;
                  for (let i = 0; i < buyAmount; i++) {
                    totalCost += Math.floor(
                      animal.baseCost * Math.pow(animal.costMultiplier, tempCount + i),
                    );
                  }
                }

                const hasMoney = life >= totalCost;

                // Calculate dynamic species display production
                let multiplier = 1.0;
                if (animal.id === "bunny" && upgradesSpecs.bunnyBoost) multiplier *= 2.0;
                if (animal.id === "chick" && upgradesSpecs.chickBoost) multiplier *= 2.0;
                if (animal.id === "cat" && upgradesSpecs.catBoost) multiplier *= 2.0;
                if (animal.id === "frog" && upgradesSpecs.frogBoost) multiplier *= 2.0;
                if (animal.id === "koala" && upgradesSpecs.koalaBoost) multiplier *= 2.0;
                if (animal.id === "panda" && upgradesSpecs.pandaBoost) multiplier *= 2.0;
                if (animal.id === "unicorn" && upgradesSpecs.unicornBoost) multiplier *= 2.0;
                if (upgradesSpecs.globalAnimalsBoost) multiplier *= 1.5;

                const lpsDisplay = animal.baseLps * multiplier;

                return (
                  <div
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal)}
                    style={{ contentVisibility: "auto" } as React.CSSProperties}
                    className="flex items-center justify-between p-3.5 rounded-3xl border-2 border-cosmic-accent/35 bg-cosmic-surface-mid/55 hover:bg-cosmic-surface-mid/85 hover:border-cosmic-accent/80 transition-all gap-4 group cursor-pointer"
                  >
                    {/* Animal visual thumbnail - SIZED UP */}
                    <div className="flex items-center gap-4 min-w-0 flex-grow">
                      <div className="w-18 h-18 rounded-2xl bg-cosmic-surface border-2 border-cosmic-accent flex items-center justify-center shadow-lg relative shrink-0">
                        <AnimalImage
                          image={animal.image}
                          emoji={animal.emoji}
                          sizeClassName="w-14 h-14 object-contain select-none"
                          emojiSizeClassName="text-4xl select-none"
                        />
                        {count > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#f15e75] text-white font-mono font-black text-[9.5px] h-5.5 w-5.5 rounded-full flex items-center justify-center border-2 border-cosmic-accent shadow-sm animate-pulse">
                            {count}
                          </span>
                        )}
                        {/* Hover search overlay */}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
                          <span className="text-white text-base">🔍</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-sans font-black text-sm sm:text-base text-cosmic-text truncate group-hover:text-cosmic-accent transition-colors">
                            {animal.germanName}
                          </h5>
                          {count > 0 && (
                            <span className="text-[10.5px] font-black text-cosmic-pink font-sans italic truncate">
                              {count * lpsDisplay > 0
                                ? `(+${formatCompactNumber(count * lpsDisplay)}/s)`
                                : ""}
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-[11px] font-semibold text-cosmic-accent-muted leading-snug mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                          {animal.germanDescription}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono font-black text-sky-300">
                          <span>Produziert: +{formatCompactNumber(lpsDisplay)} Leben/sek</span>
                          <span className="text-purple-400 font-sans text-[9px] uppercase font-black tracking-wider group-hover:opacity-100 opacity-65 ml-auto shrink-0 bg-[#251e44] px-1.5 py-0.5 rounded border border-cosmic-accent/20">
                            Details 🔍
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kauf-Button */}
                    <button
                      disabled={!hasMoney}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBuyAnimal(animal.id, totalCost, countToBuy);
                      }}
                      className={`px-3 py-2.5 sm:px-4 rounded-xl font-black flex flex-col items-center justify-center min-w-[98px] shrink-0 transition-all select-none border-2 cursor-pointer ${
                        hasMoney
                          ? "bg-gradient-to-b from-[#24214e] to-[#12112b] text-cosmic-text border-cosmic-accent hover:from-[#353174] hover:to-[#171638] hover:scale-103 shadow-[2.5px_2.5px_0px_var(--color-cosmic-accent)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--color-cosmic-accent)]"
                          : "bg-[#18162f]/80 text-cosmic-accent-muted/40 border-cosmic-accent/20 shadow-none cursor-not-allowed opacity-40 opacity-50"
                      }`}
                    >
                      <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-cosmic-accent-muted">
                        Kaufe x{countToBuy}
                      </span>
                      <span
                        className="font-mono text-[10px] font-black mt-0.5 text-white"
                        title={Math.floor(totalCost).toLocaleString("de-DE")}
                      >
                        {formatCompactNumber(totalCost)} 💖
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer helper summary info */}
        <div className="p-3 bg-[#13112a] border-t border-cosmic-accent/40 flex justify-between items-center text-[10px] text-cosmic-accent-muted font-semibold px-5 shrink-0">
          <span>
            Hintergrund-Einnahmen:{" "}
            <b className="text-cosmic-pink font-black">
              +{formatCompactNumber(totalAnimalsLps)} 💖/s
            </b>
          </span>
          <span>
            Aktuelles Guthaben:{" "}
            <b className="text-cosmic-pink" title={Math.floor(life).toLocaleString("de-DE")}>
              {formatCompactNumber(life)} 💖
            </b>
          </span>
        </div>
      </Modal>
    );
  },
);

AnimalsModal.displayName = "AnimalsModal";
