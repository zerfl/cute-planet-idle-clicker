import React from "react";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  emoji: string;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  achievements: Achievement[];
  achievementCategoryFilter: string;
  setAchievementCategoryFilter: (filter: string) => void;
  achievementSearch: string;
  setAchievementSearch: (search: string) => void;
  formatCompactNumber: (num: number) => string;
  playUpgrade: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = React.memo(
  function AchievementsModal({
    isOpen,
    onClose,
    isNight,
    achievements,
    achievementCategoryFilter,
    setAchievementCategoryFilter,
    achievementSearch,
    setAchievementSearch,
    formatCompactNumber,
    playUpgrade,
  }) {
    const { life, unlockedAchievementsCount } = useGameState();
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName={`flex flex-col max-w-2xl w-full max-h-[85vh] shadow-2xl rounded-3xl overflow-hidden border-3 transition-colors duration-500 text-cosmic-text ${
          isNight
            ? "bg-[#181435]/95 border-amber-300"
            : "bg-amber-50/95 border-amber-400 text-slate-800"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b-3 flex items-center justify-between shrink-0 transition-colors duration-500 ${
            isNight
              ? "border-amber-300/40 bg-[#0e0b23]"
              : "border-amber-300 bg-amber-100 text-[#2c1d0a]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none animate-bounce">🏆</span>
            <div>
              <span
                className={`text-[9px] uppercase font-black tracking-wider block ${isNight ? "text-amber-300" : "text-amber-700"}`}
              >
                Kosmische Auszeichnungen
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-wide">
                Deine Erfolge ({achievements.length} Meilensteine)
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer ${
              isNight
                ? "bg-[#1a1738] border-2 border-amber-300 text-amber-200 hover:bg-cosmic-surface-hover"
                : "bg-white border-2 border-amber-450 text-amber-900 hover:bg-amber-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Modal Sub-Header: Progress Dashboard Card */}
        <div
          className={`p-4 border-b shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isNight ? "bg-[#1c173c]/60 border-cosmic-accent/10" : "bg-amber-100/30 border-amber-200"
          }`}
        >
          <div className="w-full sm:w-auto flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-2.5xl shadow-inner select-none shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-xl font-mono font-black ${isNight ? "text-amber-300" : "text-amber-955"}`}
                >
                  {unlockedAchievementsCount}
                </span>
                <span className="text-xs text-gray-400 font-mono font-bold">
                  / {achievements.length}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-400">
                Meilensteine freigeschaltet
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full sm:max-w-xs flex-grow">
            <div className="flex items-center justify-between text-[10px] font-mono font-black mb-1">
              <span className={isNight ? "text-amber-200" : "text-amber-900"}>
                Erfolge-Fortschritt
              </span>
              <span>{Math.round((unlockedAchievementsCount / achievements.length) * 100)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-300/20 overflow-hidden border border-slate-305/30 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 shadow-sm transition-all duration-500"
                style={{ width: `${(unlockedAchievementsCount / achievements.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Container */}
        <div
          className={`p-3 shrink-0 flex flex-col gap-2.5 border-b ${
            isNight ? "bg-[#13102a]/70 border-cosmic-accent/15" : "bg-amber-50 border-amber-200"
          }`}
        >
          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
            {[
              { id: "all", label: "Alle", emoji: "🏆" },
              { id: "life", label: "Leben", emoji: "💖" },
              { id: "clicks", label: "Klicks", emoji: "⚡" },
              { id: "stars", label: "Sterne", emoji: "⭐" },
              { id: "star_clicks", label: "Austro", emoji: "✧" },
              { id: "planet_level", label: "Planeten", emoji: "🪐" },
              { id: "animals", label: "Tiere", emoji: "🐾" },
              { id: "upgrades", label: "Forschung", emoji: "🔬" },
              { id: "time", label: "Zeit", emoji: "⏳" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setAchievementCategoryFilter(tab.id);
                  playUpgrade();
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer select-none shrink-0 active:scale-95 ${
                  achievementCategoryFilter === tab.id
                    ? "bg-amber-500 text-white border-amber-402 shadow-md scale-102"
                    : isNight
                      ? "bg-[#1f1a44] border-cosmic-accent/20 text-cosmic-accent-muted hover:bg-[#282159]"
                      : "bg-white border-amber-300 text-amber-950 hover:bg-amber-100"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search text input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Erfolge durchsuchen..."
              value={achievementSearch}
              onChange={(e) => setAchievementSearch(e.target.value)}
              className={`w-full px-4 py-2 pl-9 rounded-full text-xs font-semibold focus:outline-none border transition-all ${
                isNight
                  ? "bg-[#1a1738] border-cosmic-accent/25 text-cosmic-text focus:border-amber-300"
                  : "bg-white border-amber-300 text-slate-800 focus:border-amber-450"
              }`}
            />
            <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs">🔍</span>
            {achievementSearch && (
              <button
                onClick={() => setAchievementSearch("")}
                className="absolute right-3.5 top-2 text-xs font-black text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Content: Custom grid list */}
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3">
            {achievements
              .filter((ach) => {
                const matchCat =
                  achievementCategoryFilter === "all" || ach.category === achievementCategoryFilter;
                const matchText =
                  ach.title.toLowerCase().includes(achievementSearch.toLowerCase()) ||
                  ach.description.toLowerCase().includes(achievementSearch.toLowerCase());
                return matchCat && matchText;
              })
              .map((ach) => (
                <div
                  key={ach.id}
                  className={`relative overflow-hidden p-3 rounded-2.5xl border-2 flex gap-3 transition-all ${
                    ach.isUnlocked
                      ? isNight
                        ? "bg-gradient-to-br from-[#271f49] to-[#120e2a] border-yellow-401/70 shadow-[3px_3px_0px_rgba(234,179,8,0.7)]"
                        : "bg-gradient-to-br from-amber-50 to-yellow-50/70 border-amber-400 text-amber-950 shadow-[3px_3px_0px_rgba(217,119,6,0.6)]"
                      : isNight
                        ? "bg-[#1a1738]/40 border-cosmic-accent/10 text-slate-500 opacity-60"
                        : "bg-slate-100 border-slate-200 text-slate-400 opacity-70"
                  }`}
                >
                  {/* Emoji Icon Container */}
                  <div
                    className={`p-2 rounded-xl text-2xl flex items-center justify-center select-none shrink-0 w-11 h-11 ${
                      ach.isUnlocked
                        ? "bg-amber-500/10 border border-amber-400"
                        : "bg-slate-500/5 border border-slate-500/20 grayscale"
                    }`}
                  >
                    {ach.isUnlocked ? ach.emoji : "🔒"}
                  </div>

                  {/* Content block */}
                  <div className="min-w-0 flex-grow pr-1">
                    <div className="flex items-center justify-between gap-1">
                      <h5
                        className={`font-sans font-black text-xs uppercase tracking-wide truncate ${
                          ach.isUnlocked ? "text-yellow-400" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {ach.title}
                      </h5>
                      {ach.isUnlocked && (
                        <span className="text-[8px] font-mono font-black uppercase text-[#22c55e] select-none shrink-0">
                          解锁 ✓
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[10px] sm:text-[10.5px] font-semibold mt-0.5 leading-tight ${
                        ach.isUnlocked
                          ? isNight
                            ? "text-cosmic-accent-muted"
                            : "text-amber-800"
                          : "text-slate-500 dark:text-slate-500"
                      }`}
                    >
                      {ach.description}
                    </p>

                    {/* Progress Tracker Slider */}
                    <div className="mt-1.5 text-[8.5px] font-mono font-extrabold flex items-center justify-between">
                      <span className="opacity-80">Fortschritt:</span>
                      <span
                        className={
                          ach.isUnlocked
                            ? "text-emerald-400"
                            : isNight
                              ? "text-indigo-305"
                              : "text-amber-800"
                        }
                      >
                        {formatCompactNumber(ach.progress)} / {formatCompactNumber(ach.target)}
                      </span>
                    </div>
                    <div className="mt-1 w-full h-1 rounded-full bg-slate-300/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ach.isUnlocked
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-amber-500 to-orange-400"
                        }`}
                        style={{ width: `${(ach.progress / ach.target) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3 border-t flex justify-between items-center text-[10px] text-cosmic-accent-muted font-semibold px-5 ${
            isNight
              ? "border-amber-300/40 bg-[#0c0a21]"
              : "border-amber-250 bg-amber-100 text-amber-950"
          }`}
        >
          <span>
            Erfolge freigeschaltet:{" "}
            <b className="text-amber-300 font-extrabold">
              {unlockedAchievementsCount} / {achievements.length}
            </b>
          </span>
          <span>
            Guthaben:{" "}
            <b className="text-cosmic-pink font-extrabold">{formatCompactNumber(life)} 💖</b>
          </span>
        </div>
      </Modal>
    );
  },
);

AchievementsModal.displayName = "AchievementsModal";
