import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  Settings,
  Cloud,
  Trophy,
  Info,
  RotateCcw,
  X,
  Swords,
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
  prestigeCount: number;
  onOpenGalaxyShardsShop: () => void;
  onOpenRoguelite: () => void;
  hasActiveRogueliteRun: boolean;
  rogueliteRunStatus?: string;
  inGlitchGalaxy?: boolean;
}

export const CosmicHeader: React.FC<CosmicHeaderProps> = React.memo(
  ({
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
    prestigeCount,
    onOpenGalaxyShardsShop,
    onOpenRoguelite,
    hasActiveRogueliteRun,
    rogueliteRunStatus,
    inGlitchGalaxy = false,
  }) => {
    const [secretInput, setSecretInput] = React.useState("");
    const [showVideo, setShowVideo] = React.useState(false);
    const [videoVolume, setVideoVolume] = React.useState(0.8);
    const [videoMuted, setVideoMuted] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (showVideo && e.code === "Space") {
          e.preventDefault();
        }
      };
      if (showVideo) {
        window.addEventListener("keydown", handleGlobalKeyDown);
      }
      return () => {
        window.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }, [showVideo]);

    React.useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = videoVolume;
        videoRef.current.muted = videoMuted;
      }
    }, [videoVolume, videoMuted, showVideo]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (secretInput.trim() === "hallodugeilesau") {
          setShowVideo(true);
        }
        setSecretInput("");
      }
    };

    return (
      <>
        <header
          className={`sticky top-0 z-20 backdrop-blur-md py-4 px-4 sm:px-6 shadow-md transition-all duration-500 border-b-4 ${
            isNightStyle ? "bg-[#110e26]/85 border-cosmic-accent/50 text-cosmic-text" : ""
          } ${showTutorial ? "blur-md pointer-events-none select-none" : ""}`}
        >
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
                <h1
                  className={`font-sans font-black uppercase tracking-[0.12em] text-sm sm:text-base flex items-center gap-2 ${
                    isNightStyle ? "text-cosmic-text" : ""
                  }`}
                >
                  Pastell-Kosmos{" "}
                  <span className="text-cosmic-bg text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cosmic-accent border-2 border-cosmic-bg hidden sm:inline-block leading-none uppercase shadow-[2px_2px_0px_var(--color-cosmic-bg)]">
                    Idle Game
                  </span>
                </h1>
                <p
                  className={`text-[10px] sm:text-xs font-bold mt-0.5 ${
                    isNightStyle ? "text-cosmic-accent-muted" : ""
                  }`}
                >
                  Belebe deinen suessen Begleiter
                </p>
              </div>
            </div>

            {/* Core Quick stats & Utility buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={onOpenRoguelite}
                className={`group relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all shadow-sm cursor-pointer ${
                  hasActiveRogueliteRun
                    ? "border-fuchsia-300/70 bg-gradient-to-r from-[#261343] via-[#1b1539] to-[#152a44] text-white shadow-[0_0_30px_rgba(202,165,254,0.22)]"
                    : "border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                }`}
                title="Galaxie-Roguelite oeffnen"
              >
                <Swords
                  className={`h-4 w-4 ${hasActiveRogueliteRun ? "text-fuchsia-200" : "text-cosmic-pink"} ${hasActiveRogueliteRun ? "animate-pulse" : ""}`}
                />
                <div className="hidden text-left sm:block">
                  <div className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-cosmic-accent-muted">
                    Rogue-Lite
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em]">
                    {hasActiveRogueliteRun ? (rogueliteRunStatus ?? "Run aktiv") : "Start"}
                  </div>
                </div>
                {hasActiveRogueliteRun && (
                  <span className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full border border-white/30 bg-fuchsia-400 animate-pulse" />
                )}
              </button>

              {/* Secret code input field */}
              <input
                type="text"
                placeholder="UWU"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2.5 py-1.5 w-24 sm:w-32 text-xs font-mono font-black border-2 border-cosmic-pink/40 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text placeholder-cosmic-pink/30 rounded-xl focus:outline-none focus:border-cosmic-pink/90 transition-all duration-300 shadow-sm text-center"
                title="Geheimer Text eingeben"
                id="secret-code-input"
              />

              {/* Lifepoints summary */}
              <div
                className={`px-4 py-1.5 rounded-xl flex flex-col items-end shadow-sm border-2 transition-colors duration-500 ${
                  isNightStyle ? "bg-[#191533] border-cosmic-pink/60 text-cosmic-text" : ""
                }`}
              >
                <span
                  className={`text-[9px] uppercase font-mono font-black tracking-wider leading-none ${
                    isNightStyle ? "text-cosmic-pink" : ""
                  }`}
                >
                  Erspieltes Leben
                </span>
                <span
                  className="font-mono text-xs sm:text-sm font-black mt-0.5"
                  title={Math.floor(life).toLocaleString("de-DE")}
                >
                  {formatCompactNumber(life)} 💖
                </span>
              </div>

              {/* Galaxy Shards (Galaxie-Splitter) summary */}
              {(galaxyShards > 0 || prestigeCount > 0) && (
                <button
                  onClick={onOpenGalaxyShardsShop}
                  className={`px-4 py-1.5 rounded-xl flex flex-col items-end shadow-md border-2 border-fuchsia-400 bg-[#1e1438] text-fuchsia-250 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden`}
                  title="Galaktischen Splitter-Shop oeffnen 🌌"
                >
                  <span className="text-[9px] uppercase font-mono font-black tracking-wider leading-none text-fuchsia-300 group-hover:text-fuchsia-200 transition-colors">
                    Galaxie-Splitter
                  </span>
                  <span
                    className="font-mono text-xs sm:text-sm font-black mt-0.5 text-[#f5d0fe] flex items-center gap-1 group-hover:text-white transition-colors"
                    title={galaxyShards.toLocaleString("de-DE")}
                  >
                    {galaxyShards} 🌌
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {/* Quiet Mute Switch */}
              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                title={isMutedState ? "Ton einschalten" : "Ton stummschalten"}
              >
                {isMutedState ? (
                  <VolumeX className="w-4 h-4 text-rose-350" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cosmic-pink animate-pulse" />
                )}
              </button>

              {/* Soundtrack Settings Window trigger */}
              <button
                onClick={() => setShowMusicSettingsModal(true)}
                className="group p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                title="Sound & Einstellungen oeffnen"
                id="header_lofi_music_btn"
              >
                <Settings className="w-4 h-4 text-cosmic-accent transition-transform duration-500 group-hover:rotate-90" />
              </button>

              {/* Cloud Sync/Storage toggle */}
              <button
                onClick={() => setShowCloudSyncModal(true)}
                className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer relative border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                title="Cloud Backup & Synchronisation oeffnen"
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
                className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                title="Globale Bestenliste oeffnen"
                id="header_leaderboard_btn"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
              </button>

              {/* Quick Tutorial drawer toggle */}
              <button
                onClick={() => setShowTutorial((prev) => !prev)}
                className="p-2.5 rounded-xl border-2 active:scale-95 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-cosmic-accent/50 bg-[#16132f] hover:bg-[#201b44] text-cosmic-text"
                title="Anleitung"
              >
                <Info className="w-4 h-4 text-cosmic-accent" />
              </button>

              {/* Reset check trigger */}
              {!inGlitchGalaxy ? (
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="p-2.5 rounded-xl border-2 active:scale-92 active:translate-y-[1px] transition-all shadow-sm cursor-pointer border-cosmic-pink/50 bg-red-950/40 hover:bg-red-900/40 text-red-300"
                  title="Spiel zuruecksetzen"
                >
                  <RotateCcw className="w-4 h-4 text-red-400" />
                </button>
              ) : (
                <button
                  disabled
                  className="p-2.5 rounded-xl border-2 transition-all shadow-sm border-gray-700/60 bg-gray-950/60 text-gray-500 cursor-not-allowed opacity-50"
                  title="Zuruecksetzen blockiert in instabiler Galaxie"
                >
                  <RotateCcw
                    className="w-4 h-4 text-gray-550 animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent pointer-events-none select-none"
            >
              {/* Close button with interactive state */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(false);
                }}
                className="absolute top-6 right-6 z-[10000] p-3 rounded-full bg-black/65 border border-white/20 text-white hover:bg-black/85 hover:scale-105 active:scale-95 transition-all shadow-lg pointer-events-auto cursor-pointer flex items-center justify-center animate-bounce"
                title="Schliessen"
                style={{ animationDuration: "3s" }}
                id="close-secret-video"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Immersive Video frame container */}
              <div
                className="relative w-full h-full max-w-full max-h-full flex items-center justify-center p-4 md:p-8 pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  ref={videoRef}
                  src="/assets/stuff/hihihi.webm"
                  autoPlay
                  playsInline
                  onEnded={() => setShowVideo(false)}
                  onPause={() => {
                    if (showVideo && videoRef.current) {
                      videoRef.current.play().catch(() => {});
                    }
                  }}
                  className="max-w-full max-h-full rounded-2xl shadow-2xl pointer-events-none bg-transparent"
                  id="secret-video-player"
                />

                {/* Custom volume controller locked from pausing/seeking */}
                <div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-4 py-2 bg-black/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg pointer-events-auto"
                  id="custom-video-volume-controls"
                >
                  <button
                    onClick={() => setVideoMuted((prev) => !prev)}
                    className="p-1.5 rounded-lg hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer"
                    title={videoMuted ? "Ton einschalten" : "Ton stummschalten"}
                  >
                    {videoMuted || videoVolume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-cosmic-pink animate-pulse" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={videoMuted ? 0 : videoVolume}
                    onChange={(e) => {
                      setVideoVolume(parseFloat(e.target.value));
                      setVideoMuted(false);
                    }}
                    className="w-24 sm:w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cosmic-pink hover:accent-fuchsia-400 transition-all"
                    title="Lautstaerke einstellen"
                  />
                  <span className="text-[10px] font-mono font-bold text-white/80 select-none w-8 text-right">
                    {Math.round((videoMuted ? 0 : videoVolume) * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  },
);

CosmicHeader.displayName = "CosmicHeader";
