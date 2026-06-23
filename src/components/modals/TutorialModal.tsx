import React from "react";
import { Modal } from "../ui/Modal";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = React.memo(
  ({ isOpen, onClose, isNight }) => {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName={`max-w-md w-full border-3 rounded-3.5xl p-6 sm:p-8 relative flex flex-col items-center text-center gap-5 shadow-2xl transition-all duration-500 selection:bg-transparent ${
          isNight
            ? "bg-[#1b1738]/95 border-cosmic-accent text-cosmic-text shadow-[0_0_30px_rgba(202,165,254,0.15)]"
            : "bg-amber-50/95 border-amber-300 text-slate-800 shadow-[0_0_30px_rgba(217,119,6,0.1)]"
        }`}
      >
        {/* Cute floating icon badge */}
        <div
          className={`w-16 h-16 rounded-2.5xl flex items-center justify-center text-4xl shadow-inner select-none animate-bounce ${
            isNight
              ? "bg-[#252048] border-2 border-cosmic-accent/50"
              : "bg-amber-100 border-2 border-amber-300"
          }`}
        >
          🌸
        </div>

        <div>
          <span
            className={`text-[9px] font-mono font-black uppercase tracking-widest block mb-1.5 ${
              isNight ? "text-amber-350" : "text-amber-700 font-extrabold"
            }`}
          >
            SYSTEM START & EINFÜHRUNG
          </span>
          <h5
            className={`font-sans font-black text-sm uppercase tracking-wide leading-tight ${
              isNight ? "text-white" : "text-amber-950"
            }`}
          >
            Willkommen in deinem niedlichen Pastell-Kosmos!
          </h5>
          <p
            className={`font-sans text-[11px] sm:text-xs mt-3.5 leading-relaxed font-semibold ${
              isNight ? "text-cosmic-accent-muted" : "text-slate-700"
            }`}
          >
            Tippe auf den <b>niedlichen Planeten</b> im Zentrum, um <b>Leben (💖)</b> zu sammeln und
            EXP für seine Evolution zu generieren.
            <br />
            <br />
            Kaufe niedliche, flauschige <b>Tiere</b>, die passiv Leben brüten, und hole leuchtende{" "}
            <b>Sterne</b>, die den Planeten umkreisen und jede Sekunde automatisch für dich klicken!
            <br />
            <br />
            Erforsche neue Upgrades wie den <b>Kosmischen Funken</b>, um deine Effizienz und deinen
            evolutionären EXP-Ertrag ins Unendliche zu steigern!
          </p>
        </div>

        <button
          onClick={onClose}
          className={`w-full sm:w-auto text-xs font-black px-8 py-3 border-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
            isNight
              ? "border-amber-300 bg-amber-400 text-[#251910] hover:bg-amber-305 shadow-[4px_4px_0px_#f59e0b]"
              : "border-amber-400 bg-amber-300 text-[#5c3a00] hover:bg-amber-200 shadow-[4px_4px_0px_#d97706]"
          }`}
        >
          🚀 Loslegen
        </button>
      </Modal>
    );
  },
);

TutorialModal.displayName = "TutorialModal";
