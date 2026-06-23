import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Modal } from "../ui/Modal";
import { useGameState } from "../../contexts/GameStateContext";
import {
  Cloud,
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  Clock,
  CloudUpload,
  CloudDownload,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Monitor,
} from "lucide-react";
import { formatCompactNumber } from "../../data";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // User | null
  authLoading: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  onLogin: () => void;
  onLogout: () => void;
  onForceSave: () => void;
  onForceLoad: () => void;
  purchasedUpgrades: string[];
  cloudStats: any; // CloudSaveData | null
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

export const CloudSyncModal: React.FC<CloudSyncModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    user,
    authLoading,
    syncing,
    lastSynced,
    onLogin,
    onLogout,
    onForceSave,
    onForceLoad,
    purchasedUpgrades,
    cloudStats,
  }) => {
    const { life, planetLevel, secondsPlayed, prestigeCount, moonsCount } = useGameState();

    const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) return `${hours} Std. ${minutes} Min.`;
      return `${minutes} Min.`;
    };

    const getSyncTimeString = () => {
      if (!lastSynced) return "Noch nicht synchronisiert";
      try {
        const date = lastSynced instanceof Date ? lastSynced : new Date(lastSynced as any);
        if (isNaN(date.getTime())) {
          return "Noch nicht synchronisiert";
        }
        return date.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        return String(lastSynced);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-[#181236]/95 border-3 border-cosmic-accent rounded-3.5xl p-6.5 max-w-lg w-full shadow-2xl text-cosmic-text relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4.5 right-4.5 p-2 rounded-xl hover:bg-white/5 text-cosmic-accent-muted hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5 select-none">
          <Cloud className="w-5 h-5 text-sky-400 shrink-0" />
          <h2 className="font-sans font-black text-sm uppercase tracking-widest text-[#ffcbdc]">
            Pastell-Cloud Sicherung
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {authLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCcw className="w-8 h-8 text-cosmic-accent animate-spin" />
              <p className="text-cosmic-accent-muted text-xs font-semibold uppercase tracking-wider">
                Verbindung prüfen...
              </p>
            </div>
          ) : !user ? (
            /* NOT LOGGED IN VIEW */
            <motion.div
              key="logged-out"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="p-4.5 rounded-2.5xl bg-[#0d0a22]/85 border-2 border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-[#ffcbdc]">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  <h3 className="font-sans text-xs font-black uppercase tracking-wide">
                    Warum in der Cloud sichern?
                  </h3>
                </div>
                <ul className="text-[11px] font-semibold text-cosmic-accent-muted space-y-2 leading-relaxed text-left pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-305 mt-0.5">•</span>
                    <span>Speichere deine Spielfortschritte dauerhaft in Cloud-Datenbanken.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-305 mt-0.5">•</span>
                    <span>
                      Synchronisiere deinen Spielstand nahtlos auf mehreren Computern, Smartphones
                      oder Tabs.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-305 mt-0.5">•</span>
                    <span>
                      Automatisches Backup im Hintergrund alle 20 Sekunden und nach großen
                      Einkäufen.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Safe storage notice */}
              <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-500/10 border border-emerald-550/20 rounded-xl text-[10px] text-emerald-300 font-bold leading-snug">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Zero-Trust Security: Deine Daten werden verschlüsselt gespeichert und sind nur für
                  dich zugänglich.
                </span>
              </div>

              {/* Login Button */}
              <button
                onClick={onLogin}
                disabled={syncing}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 hover:from-sky-550 to-indigo-600 hover:to-indigo-650 disabled:from-sky-700 disabled:to-indigo-850 text-white border-2 border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-98 cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4.5 h-4.5" />
                )}
                Mit Google anmelden
              </button>
            </motion.div>
          ) : (
            /* LOGGED IN VIEW */
            <motion.div
              key="logged-in"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* User Profile Badge */}
              <div className="p-4.5 rounded-2.5xl bg-[#0d0a22]/85 border-2 border-cosmic-accent/25 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      className="w-11 h-11 rounded-full border-2 border-cosmic-accent shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border-2 border-cosmic-accent bg-[#1a123d] flex items-center justify-center text-xl shadow-sm">
                      🪐
                    </div>
                  )}
                  <div>
                    <h4 className="font-sans font-black text-xs uppercase text-[#ffcbdc]">
                      {user.displayName || "Kosmischer Wanderer"}
                    </h4>
                    <p className="text-[10px] text-cosmic-accent-muted font-semibold font-mono truncate max-w-[200px] sm:max-w-[240px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Log Out */}
                <button
                  onClick={onLogout}
                  title="Abmelden"
                  className="p-2.5 rounded-xl border border-red-500/35 hover:bg-red-500/10 text-red-400 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Sync status section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#090616]/70 border border-white/5 text-left flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-mono font-black text-cosmic-accent-muted block leading-none">
                    Letzter Sync
                  </span>
                  <span className="text-[10.5px] font-black text-sky-405 mt-1 animate-pulse flex items-center gap-1.5 leading-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {getSyncTimeString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#090616]/70 border border-white/5 text-left flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-mono font-black text-cosmic-accent-muted block leading-none">
                    Sync-Netzwerk
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 mt-1 flex items-center gap-1.5 leading-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aktiv & Sicher
                  </span>
                </div>
              </div>

              {/* Cloud vs Local saves layout summary */}
              <div className="grid grid-cols-2 gap-3.5 mt-2">
                <div className="p-3.5 rounded-2xl bg-[#090616]/70 border border-slate-500/15 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] text-sky-305 font-bold mb-1.5">
                    <Monitor className="w-3.5 h-3.5 text-sky-400" />
                    <span>Lokal am Gerät</span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] font-black text-slate-350">
                    <div className="flex justify-between">
                      <span>Stufe:</span>
                      <span className="text-white">Lv. {planetLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prestige:</span>
                      <span className="text-amber-300">St. {prestigeCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monde:</span>
                      <span className="text-purple-300">
                        {moonsCount || 0}/{getMaxMoonsForList(purchasedUpgrades)} 🌙
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leben:</span>
                      <span className="text-white">{formatCompactNumber(life)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spielzeit:</span>
                      <span className="text-white">{formatTime(secondsPlayed)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#090616]/70 border border-cosmic-accent/15 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] text-cosmic-accent font-bold mb-1.5">
                    <Cloud className="w-3.5 h-3.5 text-cosmic-accent" />
                    <span>In der Cloud</span>
                  </div>
                  {cloudStats ? (
                    <div className="space-y-1 font-mono text-[10px] font-black text-slate-350">
                      <div className="flex justify-between">
                        <span>Stufe:</span>
                        <span className="text-white">Lv. {cloudStats.planetLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prestige:</span>
                        <span className="text-amber-300">St. {cloudStats.prestigeCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monde:</span>
                        <span className="text-purple-300">
                          {cloudStats.moonsCount || 0}/
                          {getMaxMoonsForList(cloudStats.purchasedUpgrades)} 🌙
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leben:</span>
                        <span className="text-white">{formatCompactNumber(cloudStats.life)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spielzeit:</span>
                        <span className="text-white">{formatTime(cloudStats.secondsPlayed)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 h-[38px] flex items-center">
                      Keine Sicherung gefunden
                    </div>
                  )}
                </div>
              </div>

              {/* Override controls */}
              <div className="pt-2 flex gap-3 font-black">
                <button
                  onClick={onForceSave}
                  disabled={syncing}
                  className="flex-1 py-3 px-3 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white border-2 border-cosmic-accent/45 rounded-xl text-[10.5px] font-black tracking-wide uppercase transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CloudUpload className="w-4 h-4 text-sky-305 shrink-0" />
                  Sichern
                </button>
                <button
                  onClick={onForceLoad}
                  disabled={syncing || !cloudStats}
                  className="flex-1 py-3 px-3 bg-[#1d173d] hover:bg-[#2e265c] disabled:opacity-30 border-2 border-slate-500/35 rounded-xl text-[10.5px] text-cosmic-accent font-black tracking-wide uppercase transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CloudDownload className="w-4 h-4 text-emerald-355 shrink-0" />
                  Laden
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    );
  },
);

CloudSyncModal.displayName = "CloudSyncModal";
