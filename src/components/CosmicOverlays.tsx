import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { playUpgrade } from "../utils/audio";

interface CosmicOverlaysProps {
  planetLevel: number;
  inGlitchGalaxy: boolean;
  glitchPending: boolean;
  showRepairDialog: boolean;
  setShowRepairDialog: (val: boolean) => void;
  setShowVoyageModal: (val: boolean) => void;
  handleEnterGlitchGalaxy: () => void;
  handleRepairGlitchGalaxy: () => void;
}

export const CosmicOverlays: React.FC<CosmicOverlaysProps> = ({
  planetLevel,
  inGlitchGalaxy,
  glitchPending,
  showRepairDialog,
  setShowRepairDialog,
  setShowVoyageModal,
  handleEnterGlitchGalaxy,
  handleRepairGlitchGalaxy,
}) => {
  // Local two-step entry: the bottom button opens this confirmation dialog
  // instead of instantly blocking the whole screen (mirrors the normal voyage).
  const [showGlitchEnterDialog, setShowGlitchEnterDialog] = React.useState(false);

  // The bottom-anchored level-20 gate has three mutually exclusive states:
  //  - glitchEntry   : a requirement is met → offer ENTERING the glitch galaxy
  //  - inGlitchGalaxy: currently inside a glitch galaxy → offer REPAIRING it
  //  - normal        : the regular galaxy voyage
  const glitchEntry = glitchPending;
  const glitchStyle = glitchPending || inGlitchGalaxy;

  return (
    <>
      {/* Level 20: Block game interactions with a clean transparent click-absorbing overlay, and show the flashing button.
          The glitch galaxy is offered here too (when glitchPending) instead of an instant full-screen block, so the
          planet stays visible and the player taps a bottom button — exactly like the normal galaxy voyage. */}
      {planetLevel >= 20 && (
        <div className="fixed inset-0 z-40 bg-black/5 pointer-events-auto flex flex-col items-center justify-end pb-24 sm:pb-32 leading-none">
          {/* Cute prompt box floating above the flashy button */}
          <div
            className={`mb-6 px-5 py-3.5 rounded-2xl text-center text-white max-w-sm shadow-2xl backdrop-blur-md animate-bounce border-2 ${
              glitchEntry
                ? "bg-black/95 border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                : inGlitchGalaxy
                  ? "bg-black/95 border-cyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                  : "bg-cosmic-bg/95 border-brand-pink/45"
            }`}
          >
            <span
              className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest block mb-1 ${glitchStyle ? (glitchEntry ? "text-rose-400 glitch-chromatic-text" : "text-cyan-400 glitch-chromatic-text") : "text-brand-pink"}`}
            >
              {glitchEntry
                ? "⚠️ INSTABILER SEKTOR ERKANNT ⚠️"
                : inGlitchGalaxy
                  ? "☄️ QUANTUM_REALITY LEVEL 20 COMPLETED ☄️"
                  : "🌠 Planet Level 20 Erreicht! 🌠"}
            </span>
            <p
              className={`font-sans font-semibold text-xs/normal  ${glitchStyle ? "text-rose-200" : "text-rose-100"}`}
            >
              {glitchEntry
                ? "Ein schwerwiegender Glitch hat deinen Sektor befallen! Du kannst die instabile Glitch-Galaxie betreten — klicke unten, um das Purge-Protokoll zu starten."
                : inGlitchGalaxy
                  ? "Die systemweite Anomalie hat ihr Maximum erreicht! Initiiere das Quanten-Repair-Protokoll, um diese Galaxie zu heilen und fortzufahren."
                  : "Bewundere deinen vollendeten Planeten! Wenn du so weit bist, klicke auf die Schaltflaeche unten, um deine kosmische Galaxiereise anzutreten."}
            </p>
          </div>

          <motion.button
            animate={
              glitchEntry
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 15px rgba(244, 63, 94, 0.4)",
                      "0 0 35px rgba(6, 182, 212, 0.8)",
                      "0 0 15px rgba(244, 63, 94, 0.4)",
                    ],
                    borderColor: ["#f43f5e", "#0aefd4", "#f43f5e"],
                  }
                : inGlitchGalaxy
                  ? {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 15px rgba(6, 182, 212, 0.4)",
                        "0 0 35px rgba(244, 63, 94, 0.8)",
                        "0 0 15px rgba(6, 182, 212, 0.4)",
                      ],
                      borderColor: ["#06b6d4", "#f43f5e", "#06b6d4"],
                    }
                  : {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 15px rgba(255, 120, 170, 0.4)",
                        "0 0 35px rgba(255, 120, 170, 0.8)",
                        "0 0 15px rgba(255, 120, 170, 0.4)",
                      ],
                      borderColor: ["#ffcbdc", "#cac5fe", "#ffcbdc"],
                    }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              playUpgrade();
              // Glitch entry opens its own confirmation popup; otherwise open the
              // (forced) Galaxy Voyage confirmation modal. The pastel vs. glitch
              // styling is driven by `inGlitchGalaxy` inside the modal.
              // NOTE: `glitchPending` is owned by the worker (it broadcasts it on
              // every tick), so setting it locally here used to get instantly
              // overwritten back to false — the modal flashed open and closed.
              if (glitchEntry) {
                setShowGlitchEnterDialog(true);
              } else {
                setShowVoyageModal(true);
              }
            }}
            className={`px-8 py-4 rounded-3xl font-sans font-black text-sm uppercase tracking-[0.2em] border-4 cursor-pointer select-none pointer-events-auto shadow-2xl ${
              glitchEntry
                ? "bg-linear-to-r from-red-600 via-fuchsia-600 to-cosmic-bg text-white"
                : inGlitchGalaxy
                  ? "bg-linear-to-r from-cyan-500 via-rose-500 to-cosmic-bg text-white"
                  : "bg-linear-to-r from-cosmic-pink via-cosmic-accent to-cosmic-pink text-cosmic-bg-deep"
            }`}
          >
            {glitchEntry
              ? "GLITCH-SEKTOR BETRETEN 🌌"
              : inGlitchGalaxy
                ? "SYSTEM REPAIR & TRAVEL 🛠️"
                : "Galaxiereise Antreten 🚀"}
          </motion.button>
        </div>
      )}

      {/* Glitch entry confirmation popup — opened by the bottom button above, so
          the screen is never instantly blocked the moment a requirement is met. */}
      <AnimatePresence>
        {showGlitchEnterDialog && glitchPending && (
          <div className="fixed inset-0 z-100 bg-black/95 pointer-events-auto flex flex-col items-center justify-center p-4 select-none glitch-bg">
            <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
            <div className="relative max-w-md w-full rounded-2xl bg-black border-4 border-rose-500/80 p-6 text-center text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]">
              <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-[0.2em] text-red-500 block mb-2 animate-pulse glitch-chromatic-text">
                ⚠️ INTERNAL CRITICAL_ERROR DETECTED ⚠️
              </span>
              <h1 className="font-mono text-xl sm:text-2xl font-black text-rose-300 leading-none mb-4 uppercase tracking-wider glitch-text-anim">
                GLI_TCH_G_ALAX_Y.EXE
              </h1>
              <p className="font-mono text-xs/relaxed text-rose-100  mb-6 border border-rose-500/30 p-3 bg-red-950/20 rounded-md">
                Die Realitaet bricht zusammen! Ein schwerwiegender Glitch hat deinen Sektor
                befallen. Standardoperationen sind eingefroren. Starte den Quantum-Purge, um die
                instabile Galaxie zu infiltrieren.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowGlitchEnterDialog(false)}
                  className="px-5 py-4 rounded-xl border-2 border-rose-500/50 hover:border-rose-400 text-rose-300 font-mono font-black text-sm uppercase tracking-[0.15em] hover:bg-rose-950/30 transition-all cursor-pointer select-none active:scale-95"
                >
                  Abbrechen
                </button>
                <motion.button
                  animate={{
                    scale: [1, 1.03, 1],
                    borderColor: ["#f43f5e", "#0aefd4", "#f43f5e"],
                    boxShadow: [
                      "0 0 10px rgba(244, 63, 94, 0.4)",
                      "0 0 25px rgba(6, 182, 212, 0.8)",
                      "0 0 10px rgba(244, 63, 94, 0.4)",
                    ],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleEnterGlitchGalaxy();
                    setShowGlitchEnterDialog(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-xl bg-linear-to-r from-red-600 to-fuchsia-600 text-white font-mono font-black text-sm uppercase tracking-[0.15em] border-2 cursor-pointer select-none shadow-2xl"
                >
                  PURGE & BETRETEN 🌌
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Repair Glitch Galaxy confirmation modal */}
      <AnimatePresence>
        {showRepairDialog && (
          <div className="fixed inset-0 z-100 bg-cosmic-bg-deep/95 backdrop-blur-md pointer-events-auto flex items-center justify-center p-4">
            <div
              className="relative max-w-md w-full rounded-[2.5rem] overflow-hidden border-4 select-none text-white p-6 sm:p-10 flex flex-col justify-end border-cyan-500 shadow-[0_0_55px_rgba(6,182,212,0.45)] min-h-[420px]"
              style={{
                backgroundImage: "url('/assets/stuff/glitch_galaxie.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Overlays and screen effect scanlines */}
              <div className="absolute inset-0 bg-black/65 pointer-events-none" />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-zinc-950/25 pointer-events-none" />
              <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />

              {/* Content area */}
              <div className="relative z-10 text-center flex flex-col justify-end h-full">
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] mb-4 mx-auto max-w-sm">
                  <img
                    src="/assets/stuff/glitch_galaxie.webp"
                    alt="Glitch Galaxie"
                    className="size-full  object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-[0.2em] text-cyan-400 block mb-2 animate-pulse glitch-chromatic-text">
                  ✦ QUANTUM_REPAIR ✦
                </span>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-white mb-3">
                  Galaxie reparieren?
                </h2>
                <p className="text-xs/relaxed text-rose-100/90  mb-6">
                  Durch die kosmische Reparatur des instabilen Kerns kehrst du in die
                  Standard-Realitaet zurueck. Alle Ressourcen des aktuellen Durchlaufs werden
                  zurueckgesetzt.
                  <br />
                  <br />
                  Du erhaeltst permanent:
                  <br />
                  <span className="font-extrabold text-cyan-300 font-mono text-base block mt-2">
                    🏺 +2 Galaxie-Splitter
                  </span>
                  <span className="font-extrabold text-fuchsia-300 font-mono text-base block mt-1">
                    ✨ +77 Glitzerstaub
                  </span>
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowRepairDialog(false)}
                    className="px-6 py-3 border-2 border-cyan-550/60 hover:border-cyan-400 text-cyan-300 rounded-2xl text-xs font-bold font-mono tracking-wider hover:bg-cyan-950/40 transition-all cursor-pointer active:scale-95"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      handleRepairGlitchGalaxy();
                      setShowRepairDialog(false);
                    }}
                    className="px-8 py-3 bg-linear-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-450 hover:to-fuchsia-450 text-white font-black rounded-2xl text-xs font-mono tracking-wider shadow-lg shadow-cyan-500/30 border-2 border-cyan-300 active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    STABILISIEREN 🛠️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
