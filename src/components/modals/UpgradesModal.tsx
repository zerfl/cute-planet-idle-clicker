import React from "react";
import { Upgrade } from "../../types";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedUpgrades: string[];
  staticUpgrades: Upgrade[];
  onBuyUpgrade: (id: string, cost: number) => void;
  onBuyUpgradesBatch: (list: { id: string; cost: number; isGlitter: boolean }[]) => void;
  formatCompactNumber: (num: number) => string;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    purchasedUpgrades,
    staticUpgrades,
    onBuyUpgrade,
    onBuyUpgradesBatch,
    formatCompactNumber,
  }) => {
    const { life, glitterDust, totalLps } = useGameState();
    // Calculate affordable upgrades list (simulation of buy order: cheapest first)
    const getAffordableUpgradesList = () => {
      const unpurchased = staticUpgrades.filter((upg) => !purchasedUpgrades.includes(upg.id));
      // Sort ascending by cost
      const sorted = [...unpurchased].sort((a, b) => a.cost - b.cost);

      let currentLife = life;
      let currentGlitter = glitterDust;
      const list: { id: string; cost: number; isGlitter: boolean }[] = [];

      sorted.forEach((upg) => {
        const isGlitter = upg.costResource === "glitterDust";
        if (isGlitter) {
          if (currentGlitter >= upg.cost) {
            currentGlitter -= upg.cost;
            list.push({ id: upg.id, cost: upg.cost, isGlitter: true });
          }
        } else {
          if (currentLife >= upg.cost) {
            currentLife -= upg.cost;
            list.push({ id: upg.id, cost: upg.cost, isGlitter: false });
          }
        }
      });

      return list;
    };

    const affordableList = getAffordableUpgradesList();

    const handleBuyAll = () => {
      if (affordableList.length > 0) {
        onBuyUpgradesBatch(affordableList);
      }
    };

    return (
      <Modal
        presentation="auto"
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-cosmic-bg-mid/95 rounded-3.5xl border-3 border-cosmic-accent flex flex-col max-w-xl w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-3 border-cosmic-accent/60 bg-linear-to-r from-cosmic-bg-mid via-cosmic-surface-mid to-cosmic-bg-mid flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block">
                Niedliche Kosmos-Forschung
              </span>
              <h4 className="font-sans font-black text-cosmic-text text-sm uppercase tracking-wide">
                Multiplikator-Magie & Upgrades
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8  rounded-full bg-cosmic-surface border-2 border-cosmic-accent flex items-center justify-center font-bold text-lg text-white hover:bg-cosmic-surface-hover active:scale-95 transition-all shadow-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Smart Batch Actions Toolbar */}
        <div className="p-3 bg-cosmic-bg/95 border-b border-cosmic-accent/30 px-4 sm:px-5 shrink-0 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold text-cosmic-accent-muted uppercase tracking-wider font-mono">
            Automatisierung:
          </span>
          <button
            disabled={affordableList.length === 0}
            onClick={handleBuyAll}
            className={`p-1.5 px-4 rounded-full border transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${
              affordableList.length > 0
                ? "bg-linear-to-r from-violet-500 to-pink-500 border-purple-400 text-white hover:scale-103 hover:shadow-purple-500/10"
                : "bg-cosmic-bg-mid/80 text-cosmic-accent-muted/40 border-cosmic-accent/10 opacity-50 cursor-not-allowed"
            }`}
          >
            <span>✨ Kaufe alle kaufbaren Upgrades</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[9px] font-black text-white">
              {affordableList.length}
            </span>
          </button>
        </div>

        {/* Modal Content - Scrollable upgrades list */}
        <div className="p-4 sm:p-5 grow overflow-y-auto space-y-3 *:cv-auto">
          {/* Unpurchased Upgrades list */}
          {staticUpgrades
            .filter((upg) => !purchasedUpgrades.includes(upg.id))
            .map((upg) => {
              const isGlitterCost = upg.costResource === "glitterDust";
              const hasMoney = isGlitterCost ? glitterDust >= upg.cost : life >= upg.cost;

              // Specific styling depending on upgrade categories
              let badgeColors = "bg-cosmic-pink/15 text-cosmic-pink border-cosmic-pink/40";
              if (upg.category === "stars")
                badgeColors = "bg-amber-300/15 text-amber-300 border-amber-300/40";
              if (upg.category === "click")
                badgeColors = "bg-sky-300/15 text-sky-200 border-sky-300/40";
              if (upg.category === "special")
                badgeColors = "bg-purple-300/15 text-purple-200 border-purple-300/40";
              if (isGlitterCost) badgeColors = "bg-pink-300/15 text-pink-305 border-pink-300/40";

              return (
                <div
                  key={upg.id}
                  className="flex items-center justify-between p-3 rounded-2xl border-2 border-cosmic-accent/45 bg-cosmic-surface-mid/50 hover:bg-cosmic-surface-mid/80 transition-all gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-11  rounded-xl bg-cosmic-surface border-2 border-cosmic-accent flex items-center justify-center text-xl shadow-md shrink-0">
                      {upg.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-sans font-black text-xs sm:text-sm text-cosmic-text">
                          {upg.germanName}
                        </h5>
                        <span
                          className={`text-[8.5px] font-mono uppercase px-1.5 py-0.5 border-2 rounded-full font-black ${badgeColors}`}
                        >
                          {isGlitterCost ? "Glitzer" : upg.category}
                        </span>
                      </div>
                      <p className="font-sans text-[10.5px] font-bold text-cosmic-accent-muted mt-0.5 leading-tight">
                        {upg.germanEffectDescription}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onBuyUpgrade(upg.id, upg.cost)}
                    disabled={!hasMoney}
                    className={`px-3 py-2 rounded-xl font-black flex flex-col items-center justify-center min-w-[90px] shrink-0 transition-all select-none border-2 cursor-pointer ${
                      hasMoney
                        ? isGlitterCost
                          ? // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                            "bg-linear-to-b from-[#4d214a] to-cosmic-ink text-cosmic-text border-pink-400 hover:from-[#5e2b5b] hover:to-cosmic-border hover:scale-103 shadow-[2.5px_2.5px_0px_#fca5a5] active:translate-px  active:shadow-[1px_1px_0px_#fca5a5]"
                          : "bg-linear-to-b from-cosmic-surface-hover to-cosmic-bg text-cosmic-text border-cosmic-accent hover:from-indigo-900 hover:to-cosmic-bg-mid hover:scale-103 shadow-[2.5px_2.5px_0px_var(--color-cosmic-accent)] active:translate-px  active:shadow-[1px_1px_0px_var(--color-cosmic-accent)]"
                        : "bg-cosmic-bg-mid/80 text-cosmic-accent-muted/40 border-cosmic-accent/20 shadow-none cursor-not-allowed opacity-40"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-center">
                      Erforschen
                    </span>
                    <span
                      className="font-mono text-[9px] font-black mt-0.5 whitespace-nowrap"
                      title={upg.cost.toLocaleString("de-DE")}
                    >
                      {formatCompactNumber(upg.cost)} {isGlitterCost ? "✨" : "💖"}
                    </span>
                  </button>
                </div>
              );
            })}

          {/* Completed message if all unpurchased upgrades are cleared */}
          {staticUpgrades.filter((upg) => !purchasedUpgrades.includes(upg.id)).length === 0 && (
            <div className="py-12 text-center flex flex-col items-center justify-center text-ab9fd2 bg-cosmic-bg-mid border-2 border-dashed border-cosmic-accent/40 rounded-3xl p-6">
              <span className="text-5xl animate-bounce">👑</span>
              <h6 className="font-bold text-yellow-300 text-sm mt-3 uppercase tracking-wider">
                Kosmischer Meilenstein!
              </h6>
              <p className="font-sans text-xs text-gray-400 mt-1.5 max-w-sm">
                Heureka! Du hast bereits alle magischen Upgrades und jegliche Forschung in diesem
                Universum gemeistert! Du bist ein wahrer Kosmos-Hueter!
              </p>
            </div>
          )}

          {/* Already purchased list expander */}
          {purchasedUpgrades.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cosmic-accent/40">
              <span className="text-[9.5px] uppercase font-black tracking-wider text-cosmic-accent-muted font-mono block mb-2">
                Bereits erforscht ({purchasedUpgrades.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {purchasedUpgrades.map((id) => {
                  const details = staticUpgrades.find((u) => u.id === id);
                  if (!details) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cosmic-surface border-2 border-cosmic-accent/20 text-[10px] font-sans text-slate-400 shadow-sm pointer-events-none"
                    >
                      <span className="text-xs">{details.emoji}</span>
                      <span className="text-[9px] uppercase font-black text-slate-500 line-through">
                        {details.germanName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer helper summary info */}
        <div className="p-3 bg-cosmic-bg border-t border-cosmic-accent/40 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] text-cosmic-accent-muted font-semibold px-5">
          <span>
            Aktuelles Einkommen:{" "}
            <b className="text-cosmic-accent font-black">+{formatCompactNumber(totalLps)} 💖/s</b>
          </span>
          <div className="flex gap-4">
            <span>
              Glitzerstaub: <b className="text-pink-300 font-black">✨ {glitterDust}</b>
            </span>
            <span>
              Guthaben:{" "}
              <b className="text-cosmic-pink" title={Math.floor(life).toLocaleString("de-DE")}>
                {formatCompactNumber(life)} 💖
              </b>
            </span>
          </div>
        </div>
      </Modal>
    );
  },
);

UpgradesModal.displayName = "UpgradesModal";
