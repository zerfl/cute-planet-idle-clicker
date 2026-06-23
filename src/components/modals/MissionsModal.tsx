import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Modal } from "../ui/Modal";
import { generateMissionsForSet, Mission } from "../../data/missions";
import { useGameState } from "../../contexts/GameStateContext";

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  missionSetNumber: number;
  claimedMissionIds: string[];
  missionsCooldownEnd?: number | null;
  onClaimReward: (missionId: string, shootingStars: number) => void;
  activeFrame?: string;
  unlockedCosmetics?: string[];
  purchasedUpgrades?: string[];
}

export const MissionsModal: React.FC<MissionsModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    isNight,
    missionSetNumber,
    claimedMissionIds,
    missionsCooldownEnd = null,
    onClaimReward,
    activeFrame = "default",
    unlockedCosmetics = [],
    purchasedUpgrades = [],
  }) => {
    const { clicksCount, totalAnimalsCount, starsCount } = useGameState();
    // Check Sakura Set Bonus (+20% Mission-Rewards)
    const hasSetBonusSet = purchasedUpgrades.includes("upg-glitter-set");
    const sakuraSetComplete =
      hasSetBonusSet &&
      ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) =>
        unlockedCosmetics.includes(id),
      );

    // React hook to tick countdown
    const [now, setNow] = React.useState<number>(Date.now());

    React.useEffect(() => {
      if (!isOpen || !missionsCooldownEnd) return;
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }, [isOpen, missionsCooldownEnd]);

    // Is cooldown active?
    const isCooldownActive = !!(missionsCooldownEnd && now < missionsCooldownEnd);

    // Remaining time calculations
    const msRemaining = missionsCooldownEnd ? Math.max(0, missionsCooldownEnd - now) : 0;
    const secRemaining = Math.ceil(msRemaining / 1000);
    const mins = Math.floor(secRemaining / 60);
    const secs = secRemaining % 60;
    const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    const progressPercent = missionsCooldownEnd
      ? Math.min(100, Math.floor(((5 * 60 * 1000 - msRemaining) / (5 * 60 * 1000)) * 100))
      : 100;

    // Generate missions for the current set number
    const missions = generateMissionsForSet(missionSetNumber);

    // Helper to calculate progress for each mission type
    const getMissionProgress = (mission: Mission) => {
      switch (mission.type) {
        case "clicks":
          return clicksCount;
        case "animals":
          return totalAnimalsCount;
        case "stars":
          return starsCount;
        default:
          return 0;
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="flex flex-col max-w-xl w-full max-h-[85vh] shadow-2xl rounded-3.5xl overflow-hidden border-3 transition-colors duration-500 text-cosmic-text bg-[#181435]/95 border-cosmic-accent"
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b-3 flex items-center justify-between shrink-0 transition-colors duration-500 border-cosmic-accent/40 bg-[#0e0b23]`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none animate-pulse">🌌</span>
            <div>
              <span
                className={`text-[9px] uppercase font-black tracking-wider block text-purple-300`}
              >
                Kosmische Abenteuer
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-wide flex items-center gap-2">
                {isCooldownActive
                  ? "Missionen regenerieren"
                  : `Missionen (Stufe ${missionSetNumber})`}
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer bg-[#1a1738] border-2 border-cosmic-accent text-purple-200 hover:bg-cosmic-surface-hover`}
          >
            ✕
          </button>
        </div>

        {/* Cooldown Screen UI */}
        {isCooldownActive ? (
          <div className="p-6 overflow-y-auto flex-grow flex flex-col items-center justify-center py-10 space-y-6">
            <div className="w-21 h-21 rounded-full bg-purple-500/15 border-2 border-cosmic-accent/40 flex items-center justify-center text-4xl animate-pulse select-none shadow-[0_0_24px_rgba(202,165,254,0.35)]">
              🌠
            </div>

            <div className="text-center space-y-1 px-4">
              <span className="text-[10px] font-mono font-black uppercase text-cosmic-accent tracking-widest bg-cosmic-accent/10 border border-cosmic-accent/30 px-3 py-1 rounded-full inline-block">
                Sternen-Aufladung
              </span>
              <h4 className="font-sans font-black text-md text-cosmic-text uppercase tracking-wide mt-3.5">
                Nächste Aufgaben laden...
              </h4>
              <p className="text-[11px] font-bold text-[#b4addd] max-w-sm mx-auto leading-relaxed">
                Der Himmel kalibriert sich neu. In Kürze erwarten dich 3 neue Abenteuer!
              </p>
            </div>

            {/* Live Countdown Display */}
            <div className="bg-gradient-to-r from-[#14102c] to-cosmic-surface-mid border-2 border-cosmic-accent/40 rounded-3xl px-12 py-5 shadow-lg text-center flex flex-col items-center justify-center">
              <span className="text-[9.5px] font-mono font-black uppercase text-cosmic-accent-muted tracking-wider block">
                Umlaufzeit verbleibend:
              </span>
              <span className="font-mono font-black text-3xl sm:text-4xl text-yellow-300 tracking-widest mt-1 block select-none">
                {timeFormatted}
              </span>
            </div>

            {/* Progress Visualizer bar */}
            <div className="w-full max-w-xs space-y-1.5 flex flex-col items-center">
              <div className="w-full h-3 rounded-full overflow-hidden p-0.5 border bg-[#090715] border-cosmic-accent-muted/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cosmic-accent to-cosmic-pink h-3"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-purple-300 font-extrabold uppercase tracking-wide animate-pulse">
                Bereit: {progressPercent}%
              </span>
            </div>
          </div>
        ) : (
          /* Normal Missions List UI */
          <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-4">
            <p className="text-[11px] sm:text-xs leading-relaxed text-center font-bold px-3 py-2.5 rounded-2xl text-cosmic-accent bg-[#221c48]/55 border border-cosmic-accent/20">
              Löse diese schnuckeligen Aufgaben, um wertvolle{" "}
              <strong className="text-cosmic-accent font-black underline decoration-pink-300">
                Sternschnuppen (Lootboxen)
              </strong>{" "}
              zu verdienen! Öffne sie im Inventar für exklusive Farben, Accessoires und
              Fensterrahmen! 🌠
            </p>

            {sakuraSetComplete && (
              <div className="p-3 rounded-2xl bg-pink-500/10 border-2 border-pink-500/30 flex items-center gap-2.5 shadow-md animate-pulse">
                <span className="text-2xl select-none">🌸</span>
                <div>
                  <h6 className="text-[11.5px] font-black text-pink-300">
                    Sakura Set-Bonus Aktiv! (+20% Missionen-Ertrag)
                  </h6>
                  <p className="text-[10px] text-pink-200 leading-tight">
                    Deine Missionen bringen dir extra Sternschnuppen (aufgerundet)!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {missions.map((mission) => {
                const progress = getMissionProgress(mission);
                const isDone = progress >= mission.target;
                const isClaimed = claimedMissionIds.includes(mission.id);
                const percent = Math.min(100, Math.floor((progress / mission.target) * 100));

                return (
                  <div
                    key={mission.id}
                    className={`p-3.5 sm:p-4 rounded-2.5xl border-2 transition-all flex flex-col gap-3 relative overflow-hidden ${
                      isClaimed
                        ? "bg-[#14122d]/40 border-green-500/20 opacity-50"
                        : isDone
                          ? "bg-gradient-to-r from-[#201d4a] to-[#271d49] border-green-400/80 shadow-[0_4px_12px_rgba(74,222,128,0.15)]"
                          : "bg-cosmic-surface-mid/50 border-cosmic-accent/20 hover:bg-cosmic-surface-mid/70"
                    }`}
                  >
                    {/* Status Overlay Ribbon for Claimed */}
                    {isClaimed && (
                      <div className="absolute right-3 top-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase text-green-300 bg-green-950/60 flex items-center gap-1 border border-green-500/40">
                        <Check className="w-3 h-3" /> Eingelöst
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 select-none border-2 ${
                            isClaimed
                              ? "bg-gray-800/10 border-gray-600/20"
                              : isDone
                                ? "bg-green-500/15 border-green-400 text-green-400"
                                : "bg-cosmic-surface border-cosmic-accent"
                          }`}
                        >
                          {mission.type === "clicks"
                            ? "👆"
                            : mission.type === "animals"
                              ? "🐶"
                              : "⭐"}
                        </div>
                        <div>
                          <h5 className="font-sans font-black text-xs sm:text-xs leading-none text-cosmic-text">
                            {mission.germanTitle}
                          </h5>
                          <p className="font-sans text-[10.5px] mt-1 font-bold leading-tight text-cosmic-accent-muted">
                            {mission.germanDescription}
                          </p>
                        </div>
                      </div>

                      {!isClaimed && (
                        <div className="flex flex-col items-end shrink-0 select-none">
                          <span className="text-[9px] font-mono uppercase text-cosmic-accent font-black tracking-wide font-bold">
                            Belohnung:
                          </span>
                          <span className="font-sans font-black text-xs text-amber-300 flex items-center gap-1 mt-0.5 filter drop-shadow-[0_1px_3px_rgba(245,158,11,0.2)]">
                            {sakuraSetComplete ? (
                              <>
                                <span className="line-through opacity-40 text-rose-300 mr-1 text-[10px]">
                                  {mission.rewardShootingStars}x
                                </span>
                                <span className="text-pink-350 font-black">
                                  🌠 {Math.ceil(mission.rewardShootingStars * 1.2)}x
                                </span>
                              </>
                            ) : (
                              <span>🌠 {mission.rewardShootingStars}x</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {!isClaimed && (
                      <div className="space-y-1.5 mt-1">
                        <div className="flex justify-between items-center text-[10px] font-mono font-black">
                          <span className="text-purple-300">
                            Fortschritt: {progress} / {mission.target}
                          </span>
                          <span
                            className={isDone ? "text-green-400 font-extrabold" : "text-purple-300"}
                          >
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border bg-[#13112b] border-cosmic-accent/20">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isDone
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : "bg-gradient-to-r from-purple-400 to-pink-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Claim Button */}
                    {isDone && !isClaimed && (
                      <button
                        onClick={() => onClaimReward(mission.id, mission.rewardShootingStars)}
                        className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-sans font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-250 animate-bounce" />
                        Belohnung einfordern!
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    );
  },
);

MissionsModal.displayName = "MissionsModal";
