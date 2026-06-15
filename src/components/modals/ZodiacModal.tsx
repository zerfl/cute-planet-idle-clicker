import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { ZODIACS, getZodiac } from "../../data/zodiacs";

interface ZodiacModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  activeZodiacId: string;
}

// Map the internal zodiac ID to the actual file name created by the user
function getZodiacImage(id: string): string {
  const mapping: Record<string, string> = {
    katze: "zodiaccat",
    einhorn: "zodiacunicorn",
    phoenix: "zodiacphoenix",
    biene: "zodiacbee",
    mond: "zodiacmoon",
    drache: "zodiacdragon",
    frosch: "zodiacfrog",
    fuchs: "zodiacfox",
    eule: "zodiacowl",
    schildkroete: "zodiacturtle"
  };
  const fileName = mapping[id] || `zodiac${id}`;
  return `/assets/zodiac/${fileName}.png`;
}

export const ZodiacModal: React.FC<ZodiacModalProps> = ({
  isOpen,
  onClose,
  isNight,
  activeZodiacId,
}) => {
  if (!isOpen) return null;

  const zodiac = getZodiac(activeZodiacId);
  const imageSrc = getZodiacImage(zodiac.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/65 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative w-full max-w-md overflow-hidden rounded-3.5xl border-3 shadow-2xl p-6 ${
          isNight
            ? "bg-[#181333]/95 border-[#caa5fe]/70 text-[#ffeef4]"
            : "bg-amber-50/98 border-amber-300 text-slate-800"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full border transition-transform active:scale-90 hover:rotate-90 cursor-pointer ${
            isNight
              ? "border-[#caa5fe]/20 hover:border-[#caa5fe] text-purple-200"
              : "border-amber-300 hover:border-amber-500 text-amber-950"
          }`}
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className={`p-1.5 rounded-full bg-gradient-to-tr ${isNight ? "from-purple-800 to-indigo-950" : "from-amber-100 to-yellow-50"} mb-4`}>
            <span className="text-4xl filter drop-shadow-md select-none">{zodiac.emoji}</span>
          </div>

          <h4 className={`font-sans font-black text-xl tracking-tight leading-none ${
            isNight ? "bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent" : "text-amber-950"
          }`}>
            Sternzeichen {zodiac.name}
          </h4>

          {/* Zodiac Image block */}
          <div className="mt-5 mb-5 relative group">
            <div className={`absolute -inset-1 rounded-3.5xl bg-gradient-to-r ${isNight ? "from-purple-500 to-[#caa5fe]" : "from-amber-400 to-amber-500"} opacity-35 blur-md`}></div>
            <div className={`relative p-3.5 rounded-3.5xl border-2 overflow-hidden flex items-center justify-center ${
              isNight ? "bg-[#0b081a]/90 border-purple-500/20" : "bg-white border-amber-200"
            }`}>
              <img
                src={imageSrc}
                alt={`Sternzeichen ${zodiac.name}`}
                className="w-48 h-48 sm:w-56 h-56 object-contain rounded-2.5xl transition-transform duration-700 hover:rotate-3 select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if the file fails to fetch
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>

          {/* In-depth description */}
          <div className={`w-full p-4 rounded-2.5xl border-2 text-left mb-6 relative overflow-hidden ${
            isNight
              ? "bg-[#1f1a3f]/75 border-purple-500/30 text-purple-100"
              : "bg-white border-amber-100 text-amber-950"
          }`}>
            <span className={`block text-[10px] uppercase font-black tracking-widest ${isNight ? "text-purple-300" : "text-amber-800"} mb-1`}>
              Kosmische Aura
            </span>
            <p className="font-sans font-bold text-xs leading-relaxed">
              {zodiac.description}
            </p>

            <div className={`h-px my-3 ${isNight ? "bg-purple-800/45" : "bg-amber-100"}`} />

            <div className="flex items-center gap-1.5 font-sans font-black text-xs">
              <Sparkles className={`w-4 h-4 ${isNight ? "text-[#caa5fe] animate-pulse" : "text-amber-600"}`} />
              <span>Abrechnungs-Effekt:</span>
              <span className={isNight ? "text-amber-300 font-extrabold" : "text-amber-900 font-extrabold"}>
                {zodiac.bonusDesc}
              </span>
            </div>
          </div>

          {/* Close Action Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer shadow-lg hover:shadow-xl ${
              isNight
                ? "bg-gradient-to-r from-purple-550 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 text-white border-2 border-purple-400/40"
                : "bg-amber-500 hover:bg-amber-600 text-amber-950 border-2 border-amber-400"
            }`}
          >
            Süß, verstanden! 🌌
          </button>
        </div>
      </motion.div>
    </div>
  );
};
