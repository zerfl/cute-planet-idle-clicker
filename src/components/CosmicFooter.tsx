import React from "react";

export const CosmicFooter: React.FC = () => {
  return (
    <footer className="border-t-4 py-5 px-4 text-center text-[11px] mt-10 transition-colors duration-500 bg-cosmic-bg/95 border-cosmic-accent/50 text-cosmic-accent-muted">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold relative z-10">
        <p>
          Mit viel Liebe gemacht in Pastellfarben. Spielstand speichert sich automatisch im Browser.
        </p>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md border-2 font-mono font-black text-[10px] bg-cosmic-surface-mid border-cosmic-accent text-white">
            Ver. 1.0.6
          </span>
          <span className="text-[#f15e75] animate-pulse">💖</span>
        </div>
      </div>
    </footer>
  );
};
