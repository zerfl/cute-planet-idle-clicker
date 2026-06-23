import React from "react";
import { motion } from "motion/react";
import { Modal } from "../ui/Modal";
import { Sparkles, Award, RotateCcw, HelpCircle, Flame, Check } from "lucide-react";
import { getPrestigeRequirement } from "../../data";
import { useGameState } from "../../contexts/GameStateContext";

interface PrestigeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  onPrestigeConfirm: () => void;
  formatCompactNumber: (num: number) => string;
}

export const PrestigeModal: React.FC<PrestigeModalProps> = React.memo(
  ({ isOpen, onClose, isNight, onPrestigeConfirm, formatCompactNumber }) => {
    const { life, prestigeCount } = useGameState();
    const PRESTIGE_REQUIREMENT = getPrestigeRequirement(prestigeCount);
    const canPrestige = life >= PRESTIGE_REQUIREMENT;
    const progressPercent = Math.min(100, (life / PRESTIGE_REQUIREMENT) * 100);

    const currentMultiplier = 1 + prestigeCount * 0.1;
    const nextMultiplier = 1 + (prestigeCount + 1) * 0.1;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName={`flex flex-col max-w-md w-full shadow-2xl rounded-3.5xl overflow-hidden border-3 transition-colors duration-500 text-cosmic-text relative ${
          isNight
            ? "bg-[#181333]/95 border-cosmic-accent"
            : "bg-amber-50 border-amber-400 text-slate-800"
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b-3 flex items-center justify-between shrink-0 transition-colors duration-500 ${
            isNight
              ? "border-cosmic-accent/40 bg-[#0d0a20]"
              : "border-amber-300 bg-amber-100 text-[#2c1d0a]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-3xl select-none animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              🎖️
            </span>
            <div>
              <span
                className={`text-[9px] uppercase font-black tracking-wider block ${isNight ? "text-purple-300" : "text-amber-700"}`}
              >
                Kosmischer Aufstieg
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-wide">
                Prestige-Kristall
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer ${
              isNight
                ? "bg-[#1b1937] border-2 border-cosmic-accent text-purple-200 hover:bg-cosmic-surface-hover"
                : "bg-white border-2 border-amber-450 text-amber-900 hover:bg-amber-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] space-y-5">
          {/* Status Display Card */}
          <div
            className={`p-4 rounded-3xl border-2 text-center relative overflow-hidden transition-all ${
              isNight
                ? "bg-[#120f26]/80 border-cosmic-accent/20"
                : "bg-amber-100/40 border-amber-200"
            }`}
          >
            <span className="text-4xl block mb-2 select-none">👑</span>
            <h5 className="font-sans font-extrabold text-xs uppercase tracking-wider text-amber-400">
              Aktueller Prestige-Zustand
            </h5>
            <p className="font-mono text-xl font-black mt-1">Stufe {prestigeCount}</p>
            <p
              className={`text-[10px] font-bold mt-1 opacity-75 ${isNight ? "text-cosmic-accent-muted" : "text-slate-600"}`}
            >
              Permanenter Bonus: <strong className="text-amber-300">+{prestigeCount * 10}%</strong>{" "}
              alle Lebenseinkommen
            </p>
          </div>

          {/* Explanation Box */}
          <div className="space-y-2.5">
            <h6
              className={`font-sans font-black text-[10px] uppercase tracking-wider font-mono ${isNight ? "text-purple-300" : "text-amber-700"}`}
            >
              Über das Prestige-System
            </h6>
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 font-semibold ${
                isNight
                  ? "bg-[#201c40]/30 border-cosmic-accent/15 text-purple-100"
                  : "bg-white border-amber-100 text-slate-700"
              }`}
            >
              <div className="flex gap-2">
                <span className="text-amber-400">✦</span>
                <p>
                  Du kannst das Prestige durchführen, sobald du mindestens
                  <strong className="text-amber-400">
                    {" "}
                    {formatCompactNumber(PRESTIGE_REQUIREMENT)} Leben{" "}
                  </strong>{" "}
                  besitzt. Mit jedem Aufstieg wird diese Anforderung höher.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-pink-400">✦</span>
                <p>
                  Ein Prestige setzt dein aktuelles{" "}
                  <strong className="text-pink-400">Leben, LPS, Tiere, Sterne</strong> und{" "}
                  <strong className="text-pink-400">Planeten-Level</strong> zurück.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">✦</span>
                <p>
                  Als Belohnung steigt deine Prestige-Stufe dauerhaft auf. Jede Stufe gewinnt
                  <strong className="text-green-400"> +10% Lebensenergie-Produktion </strong>{" "}
                  (aktive Klicks & LPS).
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-sky-400">✦</span>
                <p>
                  Außerdem erhältst du bei jedem Aufstieg{" "}
                  <strong className="text-sky-400">1x Sternschnuppen-Lootbox 🌠</strong>, die du im
                  Inventar für neue Kosmetika öffnen kannst.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Tracker toward requirement */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase font-mono tracking-wider">
              <span className={isNight ? "text-purple-300" : "text-amber-800"}>
                Weg zum Prestige-Aufstieg
              </span>
              <span className="text-amber-400">
                {formatCompactNumber(life)} / {formatCompactNumber(PRESTIGE_REQUIREMENT)}
              </span>
            </div>
            {/* Custom high contrast life bar */}
            <div className="w-full h-3 bg-slate-900/40 rounded-full overflow-hidden border border-purple-500/10 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-cosmic-accent-muted via-cosmic-accent to-amber-300 rounded-full"
              />
              {canPrestige && <div className="absolute inset-0 bg-[#ffffff1c] animate-pulse" />}
            </div>
            <p className="text-[9px] text-cosmic-accent-muted font-semibold text-center italic">
              {canPrestige
                ? "Bereit für den Aufstieg in den unendlichen Kosmos! ✨"
                : `Sammle noch ${formatCompactNumber(PRESTIGE_REQUIREMENT - life)} Leben für das Prestige.`}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div
          className={`p-4 border-t-2 flex flex-col gap-2 transition-colors duration-500 shrink-0 ${
            isNight ? "border-cosmic-accent/20 bg-[#0d0a20]" : "border-amber-200 bg-amber-50"
          }`}
        >
          {canPrestige ? (
            <button
              onClick={onPrestigeConfirm}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-450 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 border-2 border-yellow-300 text-white font-sans font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer cursor-glow"
            >
              <Sparkles
                className="w-4 h-4 text-amber-100 animate-spin"
                style={{ animationDuration: "4s" }}
              />
              Kosmisch Aufsteigen! (Stufe {prestigeCount + 1})
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-2xl bg-slate-850/40 border border-slate-700/30 text-gray-400 font-sans font-black text-xs uppercase tracking-widest cursor-not-allowed select-none text-center"
            >
              Kriterium nicht erfüllt (Benötigt {formatCompactNumber(PRESTIGE_REQUIREMENT)} Leben)
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-center font-sans font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              isNight
                ? "hover:bg-purple-950/20 text-cosmic-accent-muted hover:text-white"
                : "hover:bg-slate-200/40 text-slate-500"
            }`}
          >
            Zurück zum Planeten
          </button>
        </div>
      </Modal>
    );
  },
);

PrestigeModal.displayName = "PrestigeModal";
