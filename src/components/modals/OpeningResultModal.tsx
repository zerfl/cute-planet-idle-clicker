import React from "react";
import { motion } from "motion/react";
import { Modal } from "../ui/Modal";
import { Sparkles, Trophy, X, Gift, Flame, Heart } from "lucide-react";
import { formatCompactNumber } from "../../data";

interface OpeningResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  result: {
    itemId: string;
    itemName: string;
    itemEmoji: string;
    count: number;
    rewards: {
      lifeGained: number;
      starsGained: number;
      moonsGained: number;
      glitterGained: number;
      lootboxesGained: number;
      xpGained: number;
      prestigeGained: number;
      unlockedCosmeticsList: {
        id: string;
        name: string;
        emoji: string;
        duplicateRefund: boolean;
      }[];
      animalsSpawned: Record<string, number>;
      eventsTriggered: string[];
    };
  } | null;
}

export const OpeningResultModal: React.FC<OpeningResultModalProps> = React.memo(
  ({ isOpen, onClose, isNight, result }) => {
    if (!result) return null;

    const { itemName, itemEmoji, count, rewards } = result;

    // Check which rewards are > 0 or have items to display
    const hasLife = rewards.lifeGained > 0;
    const hasStars = rewards.starsGained > 0;
    const hasMoons = rewards.moonsGained > 0;
    const hasGlitter = rewards.glitterGained > 0;
    const hasLootboxes = rewards.lootboxesGained > 0;
    const hasXp = rewards.xpGained > 0;
    const hasPrestige = rewards.prestigeGained > 0;
    const hasCosmetics = rewards.unlockedCosmeticsList && rewards.unlockedCosmeticsList.length > 0;
    const hasAnimals = rewards.animalsSpawned && Object.keys(rewards.animalsSpawned).length > 0;
    const hasEvents = rewards.eventsTriggered && rewards.eventsTriggered.length > 0;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName={`relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3.5xl border-3 shadow-2xl p-6 md:p-8 ${
          isNight
            ? "bg-[#16122f]/98 border-cosmic-accent/70 text-cosmic-text custom-scrollbar"
            : "bg-amber-50/98 border-amber-300 text-slate-800 custom-scrollbar"
        }`}
      >
        {/* Sparkles / Aura Effects in Background */}
        <div
          className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-25 ${isNight ? "bg-purple-500" : "bg-yellow-405"}`}
        />
        <div
          className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25 ${isNight ? "bg-pink-500" : "bg-orange-400"}`}
        />

        {/* Close Header button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full border transition-transform hover:rotate-90 active:scale-90 cursor-pointer ${
            isNight
              ? "border-purple-500/20 hover:border-purple-400 text-purple-200"
              : "border-amber-300 hover:border-amber-500 text-amber-950"
          }`}
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header Block */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ y: -10, scale: 0.8 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={`p-3.5 rounded-3xl bg-gradient-to-tr ${
              isNight
                ? "from-purple-900 to-indigo-950 border border-purple-500/20"
                : "from-amber-100 to-amber-50 border border-amber-200"
            } mb-3 shadow-md`}
          >
            <span className="text-5xl filter drop-shadow select-none animate-pulse">
              {itemEmoji}
            </span>
          </motion.div>

          <span
            className={`text-[10px] uppercase font-black tracking-widest ${isNight ? "text-purple-300" : "text-amber-700"}`}
          >
            Material-Auszahlung
          </span>

          <h3
            className={`font-sans font-black text-xl md:text-2xl mt-1 leading-snug tracking-tight ${
              isNight
                ? "bg-gradient-to-r from-purple-200 via-cosmic-accent to-pink-200 bg-clip-text text-transparent"
                : "text-amber-900"
            }`}
          >
            {count}x {itemName}
          </h3>
          <p
            className={`text-xs mt-1.5 font-bold ${isNight ? "text-[#a2a0de]" : "text-slate-600"}`}
          >
            Erfolgreich im kosmischen Core verarbeitet! Folgende Ressourcen wurden freigelassen:
          </p>
        </div>

        {/* Rewards Section */}
        <div className="mt-6 space-y-4">
          {/* Main Attributes / Currencies Row-Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {hasLife && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/25 mb-1" />
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Lebensenergie
                </span>
                <span className="font-sans font-black text-sm text-rose-500">
                  +{formatCompactNumber(rewards.lifeGained)}
                </span>
              </div>
            )}

            {hasStars && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <span className="text-lg filter drop-shadow mb-1">⭐</span>
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Sterne
                </span>
                <span className="font-sans font-black text-sm text-yellow-500">
                  +{formatCompactNumber(rewards.starsGained)}
                </span>
              </div>
            )}

            {hasGlitter && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <Sparkles
                  className="w-5 h-5 text-pink-400 fill-pink-500/10 mb-1 animate-spin"
                  style={{ animationDuration: "12s" }}
                />
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Glitzerstaub
                </span>
                <span className="font-sans font-black text-sm text-pink-400">
                  +{formatCompactNumber(rewards.glitterGained)}
                </span>
              </div>
            )}

            {hasLootboxes && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <Gift className="w-5 h-5 text-indigo-400 mb-1" />
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Schatullen
                </span>
                <span className="font-sans font-black text-sm text-indigo-400">
                  +{rewards.lootboxesGained}
                </span>
              </div>
            )}

            {hasXp && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <span className="text-lg mb-1">💊</span>
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Wachstums-EP
                </span>
                <span className="font-sans font-black text-sm text-teal-400">
                  +{formatCompactNumber(rewards.xpGained)}
                </span>
              </div>
            )}

            {hasPrestige && (
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm ${
                  isNight ? "bg-[#1e173e]/55 border-purple-500/20" : "bg-white border-amber-100"
                }`}
              >
                <Trophy className="w-5 h-5 text-amber-500 mb-1" />
                <span
                  className={`text-[9px] uppercase font-bold text-cosmic-text-muted ${!isNight && "text-slate-500"}`}
                >
                  Prestige Level
                </span>
                <span className="font-sans font-black text-sm text-amber-500">
                  +{rewards.prestigeGained}
                </span>
              </div>
            )}
          </div>

          {/* Triggered Events Feedback */}
          {hasEvents && (
            <div
              className={`p-4 rounded-2.5xl border flex flex-col gap-1.5 shadow-sm ${
                isNight
                  ? "bg-red-950/20 border-red-500/20 text-red-100"
                  : "bg-red-50 border-red-100 text-red-950"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-500">
                <Flame className="w-4 h-4 fill-rose-500/10 animate-bounce" />
                Atmosphärisches Event Entfesselt!
              </span>
              <ul className="list-disc list-inside text-xs font-bold space-y-1 pl-1">
                {rewards.eventsTriggered.map((evt, id) => (
                  <li key={id}>{evt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unlocked Custom Cosmetics (e.g. from Lootbox or Luck Amulet) */}
          {hasCosmetics && (
            <div
              className={`p-4 rounded-2.5xl border shadow-sm ${
                isNight
                  ? "bg-purple-950/25 border-purple-500/30 text-purple-100"
                  : "bg-amber-100/30 border-amber-200 text-slate-800"
              }`}
            >
              <span className="block text-[10px] uppercase font-black tracking-wider text-purple-300 mb-2.5">
                💎 Kosmetische Fundstücke ({rewards.unlockedCosmeticsList.length}x):
              </span>
              <div className="space-y-2">
                {rewards.unlockedCosmeticsList.map((cosm, id) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${
                      cosm.duplicateRefund
                        ? isNight
                          ? "bg-slate-900/60 border-slate-800 text-slate-400"
                          : "bg-gray-100 border-gray-250 text-slate-500"
                        : isNight
                          ? "bg-[#211b4a] border-purple-500/20 text-white"
                          : "bg-white border-amber-100 text-amber-950"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl select-none">{cosm.emoji}</span>
                      <span>{cosm.name}</span>
                    </div>
                    {cosm.duplicateRefund ? (
                      <span className="text-[10px] text-pink-400 uppercase font-black">
                        Duplikat-Erstattung
                      </span>
                    ) : (
                      <span className="text-[10px] text-green-500 uppercase font-black bg-green-500/10 px-2 py-0.5 rounded-full">
                        Neu! ✨
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Animals Feed (Premium animal cookies) */}
          {hasAnimals && (
            <div
              className={`p-4 rounded-2.5xl border shadow-sm ${
                isNight
                  ? "bg-indigo-950/25 border-indigo-500/25 text-indigo-100"
                  : "bg-blue-50/50 border-blue-100 text-slate-800"
              }`}
            >
              <span className="block text-[10px] uppercase font-black tracking-wider text-indigo-300 mb-2.5 font-sans">
                🍪 Tierpflege-Auszahlung (Zuwachs):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {Object.entries(rewards.animalsSpawned).map(([animalId, countGained]) => {
                  // Standard capitalizations or naming fallback
                  const capitalized = animalId.charAt(0).toUpperCase() + animalId.slice(1);
                  return (
                    <div
                      key={animalId}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                        isNight
                          ? "bg-[#18153c]/80 border-indigo-500/10"
                          : "bg-white border-blue-50 text-blue-950"
                      }`}
                    >
                      <span className="text-base select-none">🐾</span>
                      <span>{capitalized}:</span>
                      <strong className="text-green-550">+{countGained}x</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-98 cursor-pointer shadow-md hover:shadow-lg text-center ${
              isNight
                ? "bg-gradient-to-r from-purple-550 to-indigo-650 hover:from-purple-650 hover:to-indigo-750 text-white border-2 border-purple-400/40"
                : "bg-amber-500 hover:bg-amber-600 text-amber-950 border-2 border-amber-400"
            }`}
          >
            Süß, her damit! 🎉
          </button>
        </div>
      </Modal>
    );
  },
);

OpeningResultModal.displayName = "OpeningResultModal";
