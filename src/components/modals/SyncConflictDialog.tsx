import React from "react";
import { Modal } from "../ui/Modal";
import { formatCompactNumber } from "../../data";
import { Sparkles, Monitor, UserRound } from "lucide-react";
import { useGameState } from "../../contexts/GameStateContext";
import { getMaxMoons } from "../../game/maxMoons";
import type { RawSave } from "../../utils/persistence";

interface SyncConflictDialogProps {
  isOpen: boolean;
  mode: "account-switch";
  previousLocalSave: RawSave;
  purchasedUpgrades?: string[];
  onKeepCurrentAccount: () => void;
  onAdoptPreviousLocalSave: () => void;
}

export const SyncConflictDialog: React.FC<SyncConflictDialogProps> = React.memo(
  ({
    isOpen,
    mode,
    previousLocalSave,
    purchasedUpgrades,
    onKeepCurrentAccount,
    onAdoptPreviousLocalSave,
  }) => {
    const { life, planetLevel, secondsPlayed, prestigeCount, moonsCount, activeZodiacId } =
      useGameState();
    const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        return `${hours} Std. ${minutes} Min.`;
      }
      return `${minutes} Min.`;
    };

    return (
      <Modal
        isOpen={isOpen && mode === "account-switch"}
        onClose={onKeepCurrentAccount}
        panelClassName="bg-[#181335]/95 border-3 border-cosmic-accent rounded-3.5xl p-6.5 max-w-xl w-full shadow-2xl text-cosmic-text max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-cosmic-accent" />
          <h5 className="font-sans font-black text-[#ffcbdc] text-base sm:text-lg uppercase tracking-wider">
            Anderer lokaler Spielstand erkannt
          </h5>
        </div>

        <p className="font-sans text-xs text-cosmic-accent-muted font-semibold mt-3 leading-relaxed">
          Dein aktueller Account hat einen eigenen Spielstand. Lokal liegt aber noch Fortschritt von
          einem Gast oder einem anderen Account. Entscheide, ob du mit dem aktuellen Account
          weiterspielst oder den vorherigen lokalen Stand in diesen Account uebernimmst.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border-2 border-cosmic-accent/30 transition-all text-left">
            <div className="flex items-center gap-1.5 text-xs text-cosmic-accent font-bold mb-2">
              <UserRound className="w-4 h-4 text-cosmic-accent" />
              <span>AKTUELLER ACCOUNT</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] font-black text-slate-350">
              <div className="flex justify-between">
                <span>Evolutions-Stufe:</span>
                <span className="text-cosmic-text">Lv. {planetLevel}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestige-Stufe:</span>
                <span className="text-amber-300">St. {prestigeCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Erschaffene Monde:</span>
                <span className="text-purple-305">
                  {moonsCount || 0}/{getMaxMoons({ purchasedUpgrades, zodiac: activeZodiacId })} 🌙
                </span>
              </div>
              <div className="flex justify-between">
                <span>Erspieltes Leben:</span>
                <span className="text-cosmic-text">{formatCompactNumber(life)} 💖</span>
              </div>
              <div className="flex justify-between">
                <span>Spielzeit:</span>
                <span className="text-cosmic-text">{formatTime(secondsPlayed)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border-2 border-slate-500/20 transition-all text-left">
            <div className="flex items-center gap-1.5 text-xs text-sky-305 font-bold mb-2">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>VORHERIGER LOKALER STAND</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] font-black text-slate-350">
              <div className="flex justify-between">
                <span>Evolutions-Stufe:</span>
                <span className="text-cosmic-text">
                  Lv. {previousLocalSave.planetLevel as number}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Prestige-Stufe:</span>
                <span className="text-amber-300">
                  St. {(previousLocalSave.prestigeCount as number) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Erschaffene Monde:</span>
                <span className="text-purple-305">
                  {(previousLocalSave.moonsCount as number) || 0}/
                  {getMaxMoons({
                    purchasedUpgrades: previousLocalSave.purchasedUpgrades as string[] | undefined,
                    zodiac: previousLocalSave.zodiac as string | undefined,
                  })}{" "}
                  🌙
                </span>
              </div>
              <div className="flex justify-between">
                <span>Erspieltes Leben:</span>
                <span className="text-cosmic-text">
                  {formatCompactNumber(Number(previousLocalSave.life || 0))} 💖
                </span>
              </div>
              <div className="flex justify-between">
                <span>Spielzeit:</span>
                <span className="text-cosmic-text">
                  {formatTime(Number(previousLocalSave.secondsPlayed || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10.5px] font-bold leading-normal text-left">
          Der vorherige lokale Slot bleibt als Backup bestehen. Wenn du ihn in den aktuellen Account
          uebernimmst, wird er zusaetzlich in dessen Cloud-Speicher geladen.
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 font-black">
          <button
            onClick={onKeepCurrentAccount}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white border-2 border-cosmic-accent/60 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <UserRound className="w-4 h-4 shrink-0" />
            Aktuellen Account fortsetzen
          </button>
          <button
            onClick={onAdoptPreviousLocalSave}
            className="flex-1 py-3 px-4 bg-cosmic-surface-mid hover:bg-[#2d225c] text-slate-200 border-2 border-slate-500/40 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Monitor className="w-4 h-4 shrink-0" />
            Vorherigen lokalen Stand uebernehmen
          </button>
        </div>
      </Modal>
    );
  },
);

SyncConflictDialog.displayName = "SyncConflictDialog";
