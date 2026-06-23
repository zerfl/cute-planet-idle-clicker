import React from "react";
import { motion } from "motion/react";
import { formatCompactNumber } from "../data";

interface DayNightIndicatorProps {
  isNight: boolean;
  cycleProgress: number;
  offlineEarnedLife: number;
  offlineSeconds: number;
  onOpenOfflineModal: () => void;
}

export const DayNightIndicator: React.FC<DayNightIndicatorProps> = React.memo(
  ({ isNight, cycleProgress, offlineEarnedLife, offlineSeconds, onOpenOfflineModal }) => {
    return (
      <div className="w-full max-w-2xl p-3.5 rounded-2.5xl flex flex-col md:flex-row items-center justify-between gap-3 border-2 shadow-md transition-all duration-500 bg-[#14102d]/90 border-cosmic-accent/60 text-cosmic-text">
        <div className="flex items-center gap-3">
          <div className="text-3xl select-none animate-pulse">{isNight ? "🌙" : "☀️"}</div>
          <div>
            <h3 className="font-sans font-black text-xs uppercase tracking-wider flex items-center gap-1.5 leading-none text-cosmic-text">
              {isNight ? "Nacht-Phase active" : "Tag-Phase active"}
              <span
                className={`text-[8.5px] font-mono px-2.5 py-0.5 rounded-full border font-black uppercase leading-none ${isNight ? "text-cosmic-accent border-cosmic-accent/50 bg-cosmic-accent/10" : "text-amber-300 border-amber-500/50 bg-amber-500/10"}`}
              >
                {isNight ? "Stars +50% ✧" : "Klick +50% 👆"}
              </span>
            </h3>
            <p className="text-[10px] sm:text-[10.5px] mt-1 font-semibold leading-snug text-cosmic-accent-muted">
              {isNight
                ? "Sterne leuchten prachtvoll und sammeln heute Nacht +50% Energie."
                : "Der Planet erwacht! Deine händischen Klicks sind 1.5x stärker."}
            </p>
          </div>
        </div>

        {/* Interactive Schlummer-Glas Container */}
        <div
          onClick={() => {
            if (offlineEarnedLife > 0) {
              onOpenOfflineModal();
            }
          }}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all duration-300 select-none shrink-0 ${
            offlineEarnedLife > 0
              ? "bg-amber-303/10 border-amber-400/40 hover:border-amber-400 cursor-pointer hover:bg-amber-300/15"
              : "bg-black/10 border-white/5 opacity-55 cursor-not-allowed"
          }`}
          title={
            offlineEarnedLife > 0
              ? "Klicke zum Ernten deiner Schlummer-Energie! 🏺"
              : "Schlummer-Glas (aktuell leer)"
          }
        >
          <div
            className={`group/pot relative flex flex-col items-center justify-end w-10 h-13 rounded-b-xl rounded-t-sm border-2 p-[1px] transition-all duration-300 overflow-hidden bg-slate-950/60 ${
              offlineEarnedLife > 0 ? "border-amber-400" : "border-slate-500/30"
            }`}
          >
            {/* Bottle neck cork collar */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-1.5 border border-b-0 rounded bg-slate-950 -mt-[1px] ${
                offlineEarnedLife > 0 ? "border-amber-400" : "border-slate-500/30"
              }`}
            />
            {/* Cork plug */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-amber-700/85 rounded-xs -mt-[1.5px] opacity-85 animate-pulse" />

            {/* Glowing Liquid Fill */}
            {offlineEarnedLife > 0 && (
              <motion.div
                className="w-full bg-gradient-to-t from-pink-500 via-amber-400 to-yellow-300 rounded-b px-[0.5px] relative"
                style={{
                  height: `${Math.max(15, Math.min(100, (offlineSeconds / 18000) * 100))}%`,
                }}
                animate={{
                  y: [0, -1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-white/50 animate-pulse" />
                <div className="absolute bottom-1.5 left-1 w-0.5 h-0.5 rounded-full bg-white/20 animate-ping" />
              </motion.div>
            )}

            {/* Inner Percentage Label */}
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[8.5px] font-black pointer-events-none drop-shadow-md text-white/90">
              {offlineEarnedLife > 0
                ? `${Math.round(Math.min(100, (offlineSeconds / 18000) * 100))}%`
                : "0%"}
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[8.5px] uppercase font-mono font-black tracking-widest text-cosmic-accent-muted leading-none">
              Schlummer-Glas
            </span>
            <span
              className={`text-[10.5px] font-black leading-tight mt-0.5 flex items-center gap-1 ${
                offlineEarnedLife > 0 ? "text-amber-300" : "text-cosmic-accent-muted/50"
              }`}
            >
              {offlineEarnedLife > 0 ? `+${formatCompactNumber(offlineEarnedLife)}` : "Leer"}
            </span>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="w-full md:w-32 flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center justify-between w-full text-[9px] font-mono uppercase font-black tracking-wider leading-none text-cosmic-accent-muted">
            <span>Nächster Wechsel</span>
            <span className="text-cosmic-text">
              {Math.ceil(((100 - cycleProgress) / 100) * 60)}s
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden p-[1px] border bg-[#090715] border-cosmic-accent-muted/30">
            <motion.div
              className={`h-full rounded-full ${isNight ? "bg-gradient-to-r from-cosmic-accent to-cosmic-pink" : "bg-gradient-to-r from-yellow-400 to-amber-500"}`}
              style={{ width: `${cycleProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  },
);
DayNightIndicator.displayName = "DayNightIndicator";
