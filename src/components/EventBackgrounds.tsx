import React from "react";
import { motion } from "motion/react";

interface EventBackgroundsProps {
  activeEvent: string | null;
  isLowMemory: boolean;
}

export const EventBackgrounds: React.FC<EventBackgroundsProps> = React.memo(({
  activeEvent,
  isLowMemory,
}) => {
  if (!activeEvent) return null;

  return (
    <>
      {(activeEvent === "meteors" || activeEvent === "comet_tail") && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" id="bg-effect-comet-tail">
          {[...Array(isLowMemory ? 3 : 12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "100vw", y: "-20vh", opacity: 0 }}
              animate={{
                x: ["110vw", "-20vw"],
                y: ["-20vh", "110vh"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 4 + (i % 4) * 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.7,
              }}
              className="absolute w-36 h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-450 to-transparent blur-[1.5px] rotate-[-45deg]"
              style={{ left: `${(i * 10) - 20}%`, top: `${(i % 3) * 15}%` }}
            />
          ))}
        </div>
      )}

      {(activeEvent === "aurora" || activeEvent === "nebula_cloud") && !isLowMemory && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-t from-teal-500/10 via-purple-500/10 to-transparent" id="bg-effect-nebula-cloud">
          <motion.div
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cosmic-pink/15 to-emerald-400/20 blur-3xl mix-blend-screen"
            style={{ backgroundSize: "300% 300%" }}
          />
        </div>
      )}

      {(activeEvent === "shooting_stars" || activeEvent === "stella_nursery") && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" id="bg-effect-stella-nursery">
          {[...Array(isLowMemory ? 3 : 12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "-10vw", y: `${10 + i * 8}%`, opacity: 0 }}
              animate={{
                x: ["-10vw", "110vw"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.8 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              className="absolute w-28 h-[3px] bg-gradient-to-l from-white via-cyan-200 to-transparent blur-[0.5px]"
              style={{ top: `${(i * 9) % 100}%` }}
            />
          ))}
        </div>
      )}

      {(activeEvent === "supernova" || activeEvent === "hyper_star") && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center" id="bg-effect-hyper-star">
          {[...Array(isLowMemory ? 2 : 6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{
                scale: [0.2, 5.0],
                opacity: [0, 0.45, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 1.0,
              }}
              className="absolute rounded-full border-4 border-dashed border-amber-300/40 w-[400px] h-[400px] blur-[1px]"
            />
          ))}
        </div>
      )}
    </>
  );
});
EventBackgrounds.displayName = "EventBackgrounds";
