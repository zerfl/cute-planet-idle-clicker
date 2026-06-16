import React from "react";
import { motion } from "motion/react";
import {
  Volume2,
  VolumeX,
  Settings,
  Cloud,
  Trophy,
  Info,
  RotateCcw,
} from "lucide-react";

interface CosmicHeaderProps {
  isNightStyle: boolean;
  showTutorial: boolean;
  life: number;
  galaxyShards: number;
  isMutedState: boolean;
  user: any;
  handleToggleMute: () => void;
  setShowMusicSettingsModal: (show: boolean) => void;
  setShowCloudSyncModal: (show: boolean) => void;
  setShowLeaderboardModal: (show: boolean) => void;
  setShowTutorial: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetDialog: (show: boolean) => void;
  formatCompactNumber: (num: number) => string;
}

export const CosmicHeader: React.FC<CosmicHeaderProps> = React.memo(({
  isNightStyle,
  showTutorial,
  life,
  galaxyShards,
  isMutedState,
  user,
  handleToggleMute,
  setShowMusicSettingsModal,
  setShowCloudSyncModal,
  setShowLeaderboardModal,
  setShowTutorial,
  setShowResetDialog,
  formatCompactNumber,
}) => {
  return (
    <header className={`sticky top-0 z-20 backdrop-blur-md py-4 px-4 sm:px-6 shadow-md transition-all duration-500 border-b-4 ${
      isNightStyle ? "bg-[#110e26]/85 border-[#caa5fe]/50 text-[#ffeef4]" : ""
    } ${showTutorial ? "blur-md pointer-events-none select-none" : ""}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
        
        {/* Logo Title area */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-2xl sm:text-3xl select-none"
          >
            🪐
          </motion.span>
          <div>
            <h1 className={`font-sans font-black uppercase tracking-[0.12em] text-sm sm:text-base flex items-center gap-2 ${
              isNightStyle ? "text-[#ffeef4]" : ""
            }`}>
              Pastell-Kosmos <span className="text-[#100d23] text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#caa5fe] border-2 border-[#100d23] hidden sm:inline-block leading-none uppercase shadow-[2px_2px_0px_#100d23]">Idle Game</span>
            </h1>
            <p className={`text-[10px] sm:text-xs font-bold mt-0.5 ${
              isNightStyle ? "text-[#ab9fd2]" : ""
            }`}>Belebe deinen süßen Begleiter</p>
          </div>
        </div>

        {/* Core Quick stats & Utility buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Lifepoints summary */}
          <div className={`px-4 py-1.5 rounded-xl flex flex-col items-end shadow-sm border-2 transition-colors duration-500 ${
            isNightStyle ? "bg-[#191533] border-[#ff9db8]/60 text-[#ffeef4]" : ""
          }`}>
            <span className={`text-[9px] uppercase font-mono font-black tracking-wider leading-none ${
              isNightStyle ? "text-[#ff9db8]" : ""
            }`}>Erspieltes Leben</span>
            <span className="font-mono text-xs sm:text-sm font-black mt-0.5" title={Math.floor(life).toLocaleString("de-DE")}>
              {formatCompactNumber(life)} 💖
            </span>
          </div>

          {/* Galaxy Shards (Galaxie-Splitter) summary */}
          {galaxyShards > 0 && (
            <div className={`px-4 py-1.5 rounded-xl flex flex-col items-end shadow-sm border-2 border-fuchsia-400 bg-[#1e1438] text-fuchsia-250 animate-pulse`}>
              <span className="text-[9px] uppercase font-mono font-black tracking-wider leading-none text-fuchsia-300">Galaxie-Splitter</span>
              <span className="font-mono text-xs sm:text-sm font-black mt-0.5 text-[#f5d0fe]" title={galaxyShards.toLocaleString("de-DE")}>
                {galaxyShards} 🌌
              </span>
            </div>
          )}

          {/* Quiet Mute Switch */}
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
            title={isMutedState ? "Ton einschalten" : "Ton stummschalten"}
          >
            {isMutedState ? <VolumeX className="w-4 h-4 text-rose-350" /> : <Volume2 className="w-4 h-4 text-[#ff9db8] animate-pulse" />}
          </button>

          {/* Soundtrack Settings Window trigger */}
          <button
            onClick={() => setShowMusicSettingsModal(true)}
            className="group p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
            title="Sound & Einstellungen öffnen"
            id="header_lofi_music_btn"
          >
            <Settings className="w-4 h-4 text-[#caa5fe] transition-transform duration-500 group-hover:rotate-90" />
          </button>

          {/* Cloud Sync/Storage toggle */}
          <button
            onClick={() => setShowCloudSyncModal(true)}
            className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer relative border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
            title="Cloud Backup & Synchronisation öffnen"
            id="header_cloud_sync_btn"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            {user && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full animate-pulse" />
            )}
          </button>

          {/* Global Leaderboard trigger */}
          <button
            onClick={() => setShowLeaderboardModal(true)}
            className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
            title="Globale Bestenliste öffnen"
            id="header_leaderboard_btn"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick Tutorial drawer toggle */}
          <button
            onClick={() => setShowTutorial((prev) => !prev)}
            className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#caa5fe]/50 bg-[#16132f] hover:bg-[#201b44] text-[#ffeef4]"
            title="Anleitung"
          >
            <Info className="w-4 h-4 text-[#caa5fe]" />
          </button>

          {/* Reset check trigger */}
          <button
            onClick={() => setShowResetDialog(true)}
            className="p-2.5 rounded-xl border-2 active:scale-92 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-[#ff9db8]/50 bg-red-950/40 hover:bg-red-900/40 text-red-300"
            title="Spiel zurücksetzen"
          >
            <RotateCcw className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
});

CosmicHeader.displayName = "CosmicHeader";
