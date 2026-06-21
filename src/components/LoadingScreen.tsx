import React from "react";
import { motion } from "motion/react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-cosmic-bg flex flex-col items-center justify-center text-cosmic-text z-50 overflow-hidden select-none">
      {/* Soft elegant ambient background nebula */}
      <div className="absolute inset-0 bg-radial-gradient from-[#22174d]/40 via-transparent to-transparent opacity-80 pointer-events-none" />

      {/* Animated planet logo outline in pastel glow */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 15, ease: "linear" },
            scale: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          }}
          className="w-24 h-24 rounded-full border-4 border-dashed border-cosmic-accent/50 flex items-center justify-center relative shadow-[0_0_40px_rgba(202,165,254,0.15)]"
        >
          <span className="text-4xl">🪐</span>
        </motion.div>

        {/* Circling cosmic particle */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute -top-1 left-1/2 -ml-2.5 w-5 h-5 rounded-full bg-cosmic-pink border-2 border-cosmic-bg shadow-[0_0_12px_var(--color-cosmic-pink)]" />
        </motion.div>
      </div>

      {/* Loading text typography with beautiful tracking and sizes */}
      <h2 className="font-sans font-black uppercase tracking-[0.25em] text-sm text-cosmic-accent leading-none mb-2">
        Pastell-Kosmos
      </h2>
      <div className="flex items-center gap-1.5 text-xs text-cosmic-accent-muted font-semibold font-mono">
        <span>Sterne werden geordnet</span>
        <span className="flex gap-0.5">
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            className="w-1.5 h-1.5 bg-cosmic-accent rounded-full"
          />
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
            className="w-1.5 h-1.5 bg-cosmic-accent rounded-full"
          />
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
            className="w-1.5 h-1.5 bg-cosmic-accent rounded-full"
          />
        </span>
      </div>
    </div>
  );
};
