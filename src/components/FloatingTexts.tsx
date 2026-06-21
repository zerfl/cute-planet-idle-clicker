import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles, Star, Moon } from "lucide-react";
import { FloatingText } from "../types";

const STAR_STYLES: Record<
  string,
  { fill: string; border: string; glow: string; extraClass?: string }
> = {
  default: { fill: "fill-yellow-250", border: "text-amber-400", glow: "rgba(253, 224, 71, 0.5)" },
  pink: { fill: "fill-pink-200", border: "text-pink-400", glow: "rgba(244, 143, 177, 0.6)" },
  purple: { fill: "fill-purple-200", border: "text-purple-400", glow: "rgba(168, 85, 247, 0.6)" },
  cyber: { fill: "fill-cyan-200", border: "text-cyan-400", glow: "rgba(6, 182, 212, 0.6)" },
  gold: { fill: "fill-amber-300", border: "text-amber-500", glow: "rgba(245, 158, 11, 0.6)" },
  mint: { fill: "fill-emerald-200", border: "text-emerald-400", glow: "rgba(16, 185, 129, 0.5)" },
  ruby: { fill: "fill-red-200", border: "text-red-400", glow: "rgba(239, 68, 68, 0.6)" },
  rainbow: {
    fill: "",
    border: "",
    glow: "rgba(236, 72, 153, 0.7)",
    extraClass: "animate-rainbow-star",
  },
  emerald: {
    fill: "fill-emerald-300",
    border: "text-emerald-500",
    glow: "rgba(16, 185, 129, 0.6)",
  },
  sunset: { fill: "fill-orange-300", border: "text-orange-500", glow: "rgba(249, 115, 22, 0.6)" },
  silver: { fill: "fill-slate-200", border: "text-slate-400", glow: "rgba(148, 163, 184, 0.5)" },
  ocean: { fill: "fill-sky-200", border: "text-blue-500", glow: "rgba(14, 165, 233, 0.6)" },
  cosmic_black: {
    fill: "fill-violet-950",
    border: "text-violet-800",
    glow: "rgba(139, 92, 246, 0.8)",
    extraClass: "brightness-75",
  },
  sakura_petals: {
    fill: "fill-rose-200",
    border: "text-rose-400",
    glow: "rgba(251, 113, 133, 0.5)",
  },
  ghostly: {
    fill: "fill-indigo-200",
    border: "text-indigo-400",
    glow: "rgba(129, 140, 248, 0.6)",
    extraClass: "opacity-80 animate-pulse",
  },
  toxic: { fill: "fill-lime-300", border: "text-lime-500", glow: "rgba(132, 204, 22, 0.6)" },
  lava: {
    fill: "fill-orange-400",
    border: "text-red-500",
    glow: "rgba(239, 68, 68, 0.7)",
    extraClass: "animate-pulse",
  },
  candy: { fill: "fill-fuchsia-200", border: "text-pink-400", glow: "rgba(232, 121, 249, 0.6)" },
  butterfly: {
    fill: "fill-pink-350",
    border: "text-amber-300",
    glow: "rgba(232, 121, 249, 0.7)",
    extraClass: "animate-pulse",
  },
};

interface FloatingTextsProps {
  floatingTexts: FloatingText[];
  isLowMemory?: boolean;
  isNight?: boolean;
  activeStarColor?: string;
}

export const FloatingTexts: React.FC<FloatingTextsProps> = React.memo(
  ({ floatingTexts, isLowMemory = false, isNight = true, activeStarColor = "default" }) => {
    const visible = isLowMemory ? floatingTexts.slice(-3) : floatingTexts;

    return (
      <div className="absolute inset-0 pointer-events-none z-30">
        <AnimatePresence>
          {visible.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: item.y, x: item.x, scale: 0.8 }}
              animate={{
                opacity: 0,
                y: item.y - 85,
                x: item.x + (Math.random() * 40 - 20),
                scale: [1, 1.2, 0.9],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute pointer-events-none whitespace-nowrap"
            >
              {item.type === "click" && (
                <div className="font-sans font-black text-2.5xl text-[#f15e75] flex items-center gap-1 filter drop-shadow-[0_2px_4px_rgba(241,94,117,0.3)]">
                  <Heart className="w-5 h-5 fill-[#FFD1DC] stroke-[#f15e75] stroke-[2.5] inline animate-bounce" />{" "}
                  {item.text}
                </div>
              )}
              {item.type === "crit-click" && (
                <div className="font-sans font-black text-3xl text-amber-500 flex items-center gap-1.5 filter drop-shadow-[0_3px_6px_rgba(245,158,11,0.5)] scale-110">
                  <Sparkles className="w-5.5 h-5.5 text-amber-300 fill-amber-100 inline animate-[spin_3s_linear_infinite]" />{" "}
                  {item.text}
                </div>
              )}
              {item.type === "star-click" &&
                (() => {
                  const sStyle = STAR_STYLES[activeStarColor] || STAR_STYLES.default;
                  return (
                    <div
                      className="font-mono text-sm leading-none font-bold flex items-center gap-0.5 filter"
                      style={{ filter: `drop-shadow(0 1px 4px ${sStyle.glow})` }}
                    >
                      <Star
                        className={`w-4 h-4 inline stroke-[2] ${sStyle.fill} ${sStyle.border} ${sStyle.extraClass || ""}`}
                      />
                      <span
                        className={
                          isNight ? "text-amber-200 font-black" : "text-amber-950 font-black"
                        }
                      >
                        {item.text}
                      </span>
                    </div>
                  );
                })()}
              {item.type === "moon-click" && (
                <div
                  className="font-mono text-sm leading-none font-bold flex items-center gap-1 filter"
                  style={{ filter: "drop-shadow(0 1px 6px rgba(192, 132, 252, 0.8))" }}
                >
                  <Moon className="w-4 h-4 inline stroke-[1.5] fill-purple-200 text-purple-400" />
                  <span
                    className={
                      isNight ? "text-purple-250 font-black" : "text-purple-950 font-black"
                    }
                  >
                    {item.text}
                  </span>
                </div>
              )}
              {item.type === "level" && (
                <div
                  className={`font-sans font-black text-base rounded-full px-4 py-1.5 flex items-center gap-1.5 border-3 ${
                    isNight
                      ? "text-teal-300 bg-[#14122d]/95 border-teal-300 shadow-[4px_4px_0px_rgba(20,184,166,0.6)]"
                      : "text-[#6D4C41] bg-[#FFF9C4] border-[#6D4C41] shadow-[4px_4px_0px_#6D4C41]"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isNight ? "text-teal-300" : "text-[#6D4C41]"}`} />{" "}
                  {item.text}
                </div>
              )}
              {(item.type === "heart" || item.type === "star") && (
                <span className="text-xl animate-ping">{item.text}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);
FloatingTexts.displayName = "FloatingTexts";
