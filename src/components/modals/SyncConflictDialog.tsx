import React from "react";
import { Modal } from "../ui/Modal";
import { CloudSaveData } from "../../hooks/useFirebaseSync";
import { formatCompactNumber } from "../../data";
import { Sparkles, Cloud, Monitor } from "lucide-react";
import { useGameState } from "../../contexts/GameStateContext";

interface SyncConflictDialogProps {
  isOpen: boolean;
  cloudData: CloudSaveData | null;
  purchasedUpgrades?: string[];
  onKeepLocal: () => void;
  onKeepCloud: () => void;
}

const getMaxMoonsForList = (upgrades: string[] | undefined): number => {
  if (!upgrades) return 3;
  let limit = 3;
  if (upgrades.includes("upg-moon-limit-1")) limit++;
  if (upgrades.includes("upg-moon-limit-2")) limit++;
  if (upgrades.includes("upg-moon-limit-3")) limit++;
  if (upgrades.includes("upg-moon-limit-4")) limit++;
  if (upgrades.includes("upg-moon-limit-5")) limit++;
  if (upgrades.includes("upg-moon-limit-6")) limit++;
  if (upgrades.includes("upg-moon-limit-7")) limit++;
  return limit;
};

export const SyncConflictDialog: React.FC<SyncConflictDialogProps> = React.memo(
  ({ isOpen, cloudData, purchasedUpgrades, onKeepLocal, onKeepCloud }) => {
    const { life, planetLevel, secondsPlayed, prestigeCount, moonsCount } = useGameState();
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
        isOpen={isOpen && cloudData !== null}
        onClose={onKeepLocal}
        panelClassName="bg-[#181335]/95 border-3 border-cosmic-accent rounded-3.5xl p-6.5 max-w-xl w-full shadow-2xl text-cosmic-text max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-cosmic-accent" />
          <h5 className="font-sans font-black text-[#ffcbdc] text-base sm:text-lg uppercase tracking-wider">
            Synchronisations-Konflikt
          </h5>
        </div>

        <p className="font-sans text-xs text-cosmic-accent-muted font-semibold mt-3 leading-relaxed">
          Es wurde ein bestehender Spielstand in der Cloud gefunden! Vergleiche die Spieldaten und
          wähle die Spielwelt aus, mit der du fortfahren möchtest.
        </p>

        {/* Side by side comparison layout */}
        {cloudData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {/* Local Save Stats */}
            <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border-2 border-slate-500/20 hover:border-slate-550/35 transition-all text-left">
              <div className="flex items-center gap-1.5 text-xs text-sky-305 font-bold mb-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>LOKALER SPEICHER</span>
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
                    {moonsCount || 0}/{getMaxMoonsForList(purchasedUpgrades)} 🌙
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

            {/* Cloud Save Stats */}
            <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border-2 border-cosmic-accent/30 hover:border-cosmic-accent/50 transition-all text-left">
              <div className="flex items-center gap-1.5 text-xs text-cosmic-accent font-bold mb-2">
                <Cloud className="w-4 h-4 text-cosmic-accent" />
                <span>CLOUD-SPEICHER</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] font-black text-slate-350">
                <div className="flex justify-between">
                  <span>Evolutions-Stufe:</span>
                  <span className="text-cosmic-text">Lv. {cloudData.planetLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prestige-Stufe:</span>
                  <span className="text-amber-300">St. {cloudData.prestigeCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erschaffene Monde:</span>
                  <span className="text-purple-355">
                    {cloudData.moonsCount || 0}/{getMaxMoonsForList(cloudData.purchasedUpgrades)} 🌙
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Erspieltes Leben:</span>
                  <span className="text-cosmic-text">{formatCompactNumber(cloudData.life)} 💖</span>
                </div>
                <div className="flex justify-between">
                  <span>Spielzeit:</span>
                  <span className="text-cosmic-text">{formatTime(cloudData.secondsPlayed)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Badge */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10.5px] font-bold leading-normal text-left">
          ⚠️ Achtung: Wenn du eine Option wählst, wird die jeweils andere Spielwelt unwiderruflich
          überschrieben. Stelle sicher, dass du den richtigen Spielstand aktivierst!
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 font-black">
          <button
            onClick={onKeepCloud}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white border-2 border-cosmic-accent/60 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Cloud className="w-4 h-4 shrink-0" />
            Cloud-Spielstand laden
          </button>
          <button
            onClick={onKeepLocal}
            className="flex-1 py-3 px-4 bg-cosmic-surface-mid hover:bg-[#2d225c] text-slate-200 border-2 border-slate-500/40 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Monitor className="w-4 h-4 shrink-0" />
            Lokal behalten & hochladen
          </button>
        </div>
      </Modal>
    );
  },
);

SyncConflictDialog.displayName = "SyncConflictDialog";
