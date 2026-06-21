import React from "react";
import { Modal } from "../ui/Modal";
import { Clock, Sparkles, Flame, Coins, Award } from "lucide-react";
import { useGameState } from "../../contexts/GameStateContext";

interface OfflineEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsAway: number;
  offlineLps: number;
  earnedLife: number;
  onClaim: (earned: number) => void;
  formatCompactNumber: (num: number) => string;
  isNight: boolean;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    secondsAway,
    offlineLps,
    earnedLife,
    onClaim,
    formatCompactNumber,
    isNight,
  }) => {
    const { prestigeCount } = useGameState();
    // Format seconds into a beautiful readable string (Up to 5 hours maximum)
    const formatOfflineTime = (totalSeconds: number) => {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      const parts: string[] = [];
      if (hrs > 0) parts.push(`${hrs} Std.`);
      if (mins > 0) parts.push(`${mins} Min.`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs} Sek.`);

      return parts.join(" ");
    };

    const prestigeBonusPercent = prestigeCount * 10;
    const prestigeMultiplier = 1 + prestigeCount * 0.1;
    const baseLps = offlineLps / prestigeMultiplier;

    return (
      <Modal
        isOpen={isOpen && earnedLife > 0}
        onClose={onClose}
        panelClassName={`flex flex-col max-w-sm w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] rounded-3.5xl overflow-hidden border-3 transition-colors duration-500 text-cosmic-text relative ${
          isNight
            ? "bg-[#181333]/95 border-cosmic-accent"
            : "bg-amber-50 border-amber-400 text-slate-800"
        }`}
      >
        {/* Subtle glowing sparks in background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300/10 via-[#0d0a20]/0 to-indigo-900/10 pointer-events-none" />

        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b-3 flex items-center gap-3 shrink-0 transition-colors duration-500 ${
            isNight
              ? "border-cosmic-accent/40 bg-[#0d0a20]"
              : "border-amber-300 bg-amber-100 text-[#2c1d0a]"
          }`}
        >
          <span className="text-3xl select-none animate-pulse">😴💤</span>
          <div>
            <span
              className={`text-[9px] uppercase font-black tracking-wider block ${isNight ? "text-purple-300" : "text-amber-700"}`}
            >
              Willkommen zurück!
            </span>
            <h4 className="font-sans font-black text-sm uppercase tracking-wide">
              Schlummer-Einkommen
            </h4>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4.5 relative z-10">
          <p
            className={`text-xs text-center leading-relaxed font-medium ${isNight ? "text-purple-150" : "text-slate-600"}`}
          >
            Dein Planet hat geschlafen, aber deine süßen Tierchen und funkelnden Sterne waren
            fleißig!
          </p>

          {/* Large display of earned life */}
          <div className="text-center p-3 sm:p-4 rounded-3xl bg-amber-300/10 border-2 border-amber-305/40 relative overflow-hidden">
            <span className="text-amber-400 font-mono text-3xl sm:text-4xl font-black tracking-tight block animate-pulse">
              +{formatCompactNumber(earnedLife)}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider block mt-1 ${isNight ? "text-amber-205" : "text-amber-700"}`}
            >
              Lebensenergie gesammelt! 🌸
            </span>
          </div>

          {/* Stats details */}
          <div className="space-y-2">
            <div
              className={`flex justify-between items-center text-xs p-2.5 rounded-2xl border ${
                isNight ? "bg-slate-900/45 border-cosmic-accent/10" : "bg-white border-amber-100"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold text-gray-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                Zeit abwesend:
              </span>
              <span className="font-mono font-black text-[12px] text-pink-400">
                {formatOfflineTime(secondsAway)}
              </span>
            </div>

            <div
              className={`flex justify-between items-center text-xs p-2.5 rounded-2xl border ${
                isNight ? "bg-slate-900/45 border-cosmic-accent/10" : "bg-white border-amber-100"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold text-gray-500 text-[11px]">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Aktive LPS Rate:
              </span>
              <span className="font-mono font-black text-[12px] text-amber-400">
                {formatCompactNumber(offlineLps)} /s
              </span>
            </div>

            {prestigeCount > 0 && (
              <div className="p-3 rounded-2xl border bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-300/20 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-bold text-[10px] text-purple-350 uppercase">
                    <Award className="w-3.5 h-3.5 text-purple-300 fill-purple-300/10" />
                    Prestige-Aktiv:
                  </span>
                  <span className="font-mono font-black text-xs text-purple-300">
                    Stufe {prestigeCount}
                  </span>
                </div>
                <p className="text-[9px] font-medium text-purple-200/90 leading-tight">
                  Dein permanenter{" "}
                  <strong className="text-amber-300">
                    +{prestigeBonusPercent}% Prestige-Booster
                  </strong>{" "}
                  hat dein Offline-Einkommen um ein Vielfaches verstärkt! ✨
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-center italic text-slate-400 font-bold select-none">
            (Maximale Schlummerzeit beträgt 5 Stunden)
          </p>
        </div>

        {/* Claim Action */}
        <div
          className={`p-4 border-t-2 flex flex-col transition-colors duration-500 shrink-0 ${
            isNight ? "border-cosmic-accent/20 bg-[#0d0a20]" : "border-amber-200 bg-amber-50"
          }`}
        >
          <button
            onClick={() => onClaim(earnedLife)}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 border-2 border-yellow-300 text-white font-sans font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer cursor-glow"
          >
            <Sparkles
              className="w-4 h-4 text-amber-100 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            Lebensenergie ernten!
          </button>
        </div>
      </Modal>
    );
  },
);

OfflineEarningsModal.displayName = "OfflineEarningsModal";
