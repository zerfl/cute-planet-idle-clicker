import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Sparkles, Heart, Moon } from "lucide-react";
import { FloatingText } from "../types";

export interface PurchasedAnimalInfo {
  id: string;
  emoji: string;
  germanName: string;
}

interface PlanetProps {
  level: number;
  life: number;
  planetExp: number;
  planetExpNeeded: number;
  starsCount: number;
  starPowerMultiplier: number;
  onPlanetClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  floatingTexts: FloatingText[];
  purchasedAnimalsList?: PurchasedAnimalInfo[];
  isNight?: boolean;
  activeStarColor?: string;
  activeAccessory?: string;
  isLowMemory?: boolean;
  moonsCount?: number;
  activeMoonSkin?: string;
}

const STAR_STYLES: Record<string, { fill: string; border: string; glow: string; ping: string; extraClass?: string }> = {
  default: { fill: "fill-yellow-250", border: "text-amber-400", glow: "rgba(253, 224, 71, 0.5)", ping: "bg-yellow-300" },
  pink: { fill: "fill-pink-200", border: "text-pink-400", glow: "rgba(244, 143, 177, 0.6)", ping: "bg-pink-300" },
  purple: { fill: "fill-purple-200", border: "text-purple-400", glow: "rgba(168, 85, 247, 0.6)", ping: "bg-purple-300" },
  cyber: { fill: "fill-cyan-200", border: "text-cyan-400", glow: "rgba(6, 182, 212, 0.6)", ping: "bg-cyan-300" },
  gold: { fill: "fill-amber-300", border: "text-amber-500", glow: "rgba(245, 158, 11, 0.6)", ping: "bg-amber-400" },
  mint: { fill: "fill-emerald-200", border: "text-emerald-400", glow: "rgba(16, 185, 129, 0.5)", ping: "bg-emerald-300" },
  ruby: { fill: "fill-red-200", border: "text-red-400", glow: "rgba(239, 68, 68, 0.6)", ping: "bg-red-400" },
  rainbow: { fill: "", border: "", glow: "rgba(236, 72, 153, 0.7)", ping: "bg-pink-400", extraClass: "animate-rainbow-star" },
  emerald: { fill: "fill-emerald-300", border: "text-emerald-500", glow: "rgba(16, 185, 129, 0.6)", ping: "bg-emerald-400" },
  sunset: { fill: "fill-orange-300", border: "text-orange-500", glow: "rgba(249, 115, 22, 0.6)", ping: "bg-orange-400" },
  silver: { fill: "fill-slate-200", border: "text-slate-400", glow: "rgba(148, 163, 184, 0.5)", ping: "bg-slate-300" },
  ocean: { fill: "fill-sky-200", border: "text-blue-500", glow: "rgba(14, 165, 233, 0.6)", ping: "bg-sky-400" },
  cosmic_black: { fill: "fill-violet-950", border: "text-violet-800", glow: "rgba(139, 92, 246, 0.8)", ping: "bg-violet-900", extraClass: "brightness-75" },
  sakura_petals: { fill: "fill-rose-200", border: "text-rose-400", glow: "rgba(251, 113, 133, 0.5)", ping: "bg-rose-300" },
  ghostly: { fill: "fill-indigo-200", border: "text-indigo-400", glow: "rgba(129, 140, 248, 0.6)", ping: "bg-indigo-300", extraClass: "opacity-80 animate-pulse" },
  toxic: { fill: "fill-lime-300", border: "text-lime-500", glow: "rgba(132, 204, 22, 0.6)", ping: "bg-lime-400" },
  lava: { fill: "fill-orange-400", border: "text-red-500", glow: "rgba(239, 68, 68, 0.7)", ping: "bg-orange-500", extraClass: "animate-pulse" },
  candy: { fill: "fill-fuchsia-200", border: "text-pink-400", glow: "rgba(232, 121, 249, 0.6)", ping: "bg-pink-300" }
};

// Visual themes for the planet according to level
export const PLANET_THEMES = [
  {
    levelRange: [1, 1],
    name: "Pastell-Eierchen-Planet",
    subName: "Ein junger, unberührter Planet voll sanfter Liebe.",
    image: "/assets/planets/01_pastell_eierchen_planet.png",
    bgColor: "from-pink-200 to-rose-300",
    continents: "rgba(255, 235, 235, 0.4)",
    cheekColor: "rgba(251, 113, 133, 0.6)",
    hasClouds: false,
    hasRings: false,
    hasFlowers: false,
    eyeStyle: "wink",
    stops: ["#ffd1dc", "#fca5a5", "#f43f5e"],
  },
  {
    levelRange: [2, 2],
    name: "Moos-Blüten-Welt",
    subName: "Kleine weiche Grasinseln und zarte Knospen erwachen.",
    image: "/assets/planets/02_moos_blueten_welt.png",
    bgColor: "from-emerald-100 to-teal-200",
    continents: "rgba(209, 250, 229, 0.6)",
    cheekColor: "rgba(20, 184, 166, 0.4)",
    hasClouds: false,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "sparkle",
    stops: ["#ecfdf5", "#a7f3d0", "#0d9488"],
  },
  {
    levelRange: [3, 3],
    name: "Ozean-Wölkchen-Garten",
    subName: "Sanfte Wölkchen gleiten über himmelblaue Ozeane.",
    image: "/assets/planets/03_ozean_woelkchen_garten.png",
    bgColor: "from-sky-200 to-blue-300",
    continents: "rgba(255, 255, 255, 0.35)",
    cheekColor: "rgba(96, 165, 250, 0.6)",
    hasClouds: true,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#e0f2fe", "#bae6fd", "#2563eb"],
  },
  {
    levelRange: [4, 4],
    name: "Sternenlicht-Reich",
    subName: "Prachtvolle Glitzerringe verzieren die Kosmos-Kugel.",
    image: "/assets/planets/04_sternenlicht_reich.png",
    bgColor: "from-violet-200 to-fuchsia-300",
    continents: "rgba(245, 243, 255, 0.4)",
    cheekColor: "rgba(217, 70, 239, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: false,
    eyeStyle: "star",
    stops: ["#fae8ff", "#f0abfc", "#c084fc"],
  },
  {
    levelRange: [5, 5],
    name: "Lollipop-Süßwald",
    subName: "Kandierte Ozeane und Wälder aus bunter Zuckerwatte.",
    image: "/assets/planets/05_lollipop_suesswald.png",
    bgColor: "from-[#fef08a] via-[#fbcfe8] to-[#f472b6]",
    continents: "rgba(253, 242, 248, 0.5)",
    cheekColor: "rgba(244, 114, 182, 0.5)",
    hasClouds: true,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#fef08a", "#fbcfe8", "#f472b6"],
  },
  {
    levelRange: [6, 6],
    name: "Cyber-Neon-Oase",
    subName: "Ein digitaler Traum aus flüssigem Licht und glühendem Neon-Raster.",
    image: "/assets/planets/06_cyber_neon_oase.png",
    bgColor: "from-[#06b6d4] to-[#1e1b4b]",
    continents: "rgba(6, 182, 212, 0.25)",
    cheekColor: "rgba(6, 182, 212, 0.5)",
    hasClouds: false,
    hasRings: true,
    hasFlowers: false,
    eyeStyle: "sparkle",
    stops: ["#06b6d4", "#3b82f6", "#1e1b4b"],
  },
  {
    levelRange: [7, 7],
    name: "Amethyst-Zitadelle",
    subName: "Geheimnisvolle Kristalle pulsieren mit magischer Energie.",
    image: "/assets/planets/07_amethyst_zitadelle.png",
    bgColor: "from-[#c084fc] via-[#5b21b6] to-[#2e1065]",
    continents: "rgba(196, 181, 253, 0.3)",
    cheekColor: "rgba(168, 85, 247, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: false,
    eyeStyle: "star",
    stops: ["#c084fc", "#6b21a8", "#3b0764"],
  },
  {
    levelRange: [8, 8],
    name: "Lava-Karit-Grotte",
    subName: "Feuriges flüssiges Gestein glimmt harmonisch in der Nacht.",
    image: "/assets/planets/08_lava_karit_grotte.png",
    bgColor: "from-[#f97316] via-[#ef4444] to-[#451a03]",
    continents: "rgba(254, 215, 170, 0.3)",
    cheekColor: "rgba(239, 68, 68, 0.6)",
    hasClouds: false,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "wink",
    stops: ["#f97316", "#ef4444", "#7c2d12"],
  },
  {
    levelRange: [9, 9],
    name: "Auroras Goldene Krone",
    subName: "Königliches Schimmern umgibt den von Sternenwind umwehten Götterplaneten.",
    image: "/assets/planets/09_auroras_goldene_krone.png",
    bgColor: "from-[#fef08a] via-[#fbbf24] to-[#78350f]",
    continents: "rgba(254, 243, 199, 0.5)",
    cheekColor: "rgba(245, 158, 11, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#fef08a", "#fbbf24", "#b45309"],
  },
  {
    levelRange: [10, Infinity],
    name: "Kuschel-Utopia",
    subName: "Die ultimative Komfort-Zone voll Glück, Sternenstaub und Harmonie.",
    image: "/assets/planets/10_kuschel_utopia.png",
    bgColor: "from-[#fef3c7] via-[#fecdd3] to-[#ec4899] animate-pulse",
    continents: "rgba(254, 243, 199, 0.5)",
    cheekColor: "rgba(244, 63, 94, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "angel",
    stops: ["#fef3c7", "#fecdd3", "#cbd5e1", "#ec4899"],
  },
];

const getMoonSkinGraphic = (skin: string) => {
  switch (skin) {
    case "blood":
      return {
        element: <Moon className="w-4 h-4 fill-red-500 text-red-600 stroke-[1.2] animate-pulse" />,
        shadow: "0 0 7px rgba(239, 68, 68, 0.9)",
        pingBg: "bg-red-500/30"
      };
    case "cheese":
      return {
        element: <span className="text-sm select-none">🧀</span>,
        shadow: "0 0 6px rgba(251, 191, 36, 0.8)",
        pingBg: "bg-amber-300/30"
      };
    case "neon":
      return {
        element: <Moon className="w-4 h-4 fill-cyan-400 text-cyan-300 stroke-[1.2] brightness-125" />,
        shadow: "0 0 8px rgba(6, 182, 212, 0.9)",
        pingBg: "bg-cyan-400/30"
      };
    case "gold":
      return {
        element: <Moon className="w-4 h-4 fill-amber-300 text-amber-500 stroke-[1.5] brightness-110" />,
        shadow: "0 0 8px rgba(245, 158, 11, 0.9)",
        pingBg: "bg-amber-400/35"
      };
    case "crystal":
      return {
        element: <span className="text-sm select-none">💎</span>,
        shadow: "0 0 8px rgba(147, 197, 253, 0.9)",
        pingBg: "bg-sky-300/30"
      };
    case "cat":
      return {
        element: <span className="text-sm select-none">🐱</span>,
        shadow: "0 0 6px rgba(253, 186, 116, 0.8)",
        pingBg: "bg-orange-300/25"
      };
    case "lavender":
      return {
        element: <Moon className="w-4 h-4 fill-fuchsia-300 text-[#caa5fe] stroke-[1.2]" />,
        shadow: "0 0 6px rgba(217, 70, 239, 0.8)",
        pingBg: "bg-purple-400/30"
      };
    case "cyber":
      return {
        element: <span className="text-[11px] font-mono text-emerald-400 select-none animate-pulse">01</span>,
        shadow: "0 0 7px rgba(34, 197, 94, 0.9)",
        pingBg: "bg-emerald-400/30"
      };
    case "prism":
      return {
        element: <Moon className="w-4 h-4 fill-transparent text-[#ff9db8] stroke-[2] animate-rainbow-star" />,
        shadow: "0 0 8px rgba(236, 72, 153, 0.8)",
        pingBg: "bg-pink-400/30"
      };
    case "cotton":
      return {
        element: <span className="text-sm select-none">🍬</span>,
        shadow: "0 0 6px rgba(244, 114, 182, 0.8)",
        pingBg: "bg-pink-300/30"
      };
    case "abyss":
      return {
        element: <span className="text-sm select-none">👁️</span>,
        shadow: "0 0 8px rgba(99, 102, 241, 0.9)",
        pingBg: "bg-indigo-500/30"
      };
    case "sakura":
      return {
        element: <span className="text-sm select-none">🌸</span>,
        shadow: "0 0 8px rgba(251, 113, 133, 0.9)",
        pingBg: "bg-rose-400/30"
      };
    case "galaxy":
      return {
        element: <span className="text-sm select-none">🌌</span>,
        shadow: "0 0 8px rgba(139, 92, 246, 0.9)",
        pingBg: "bg-violet-400/30"
      };
    case "cookie":
      return {
        element: <span className="text-sm select-none">🍪</span>,
        shadow: "0 0 5px rgba(180, 83, 9, 0.6)",
        pingBg: "bg-amber-700/20"
      };
    case "bubble":
      return {
        element: <span className="text-sm select-none">🫧</span>,
        shadow: "0 0 6px rgba(56, 189, 248, 0.8)",
        pingBg: "bg-sky-400/25"
      };
    case "clock":
      return {
        element: <span className="text-sm select-none">🕰️</span>,
        shadow: "0 0 6px rgba(217, 119, 6, 0.8)",
        pingBg: "bg-amber-500/25"
      };
    case "frost":
      return {
        element: <span className="text-sm select-none">❄️</span>,
        shadow: "0 0 8px rgba(186, 230, 253, 0.9)",
        pingBg: "bg-sky-200/30"
      };
    case "phoenix":
      return {
        element: <span className="text-sm select-none animate-pulse">🔥</span>,
        shadow: "0 0 8px rgba(239, 68, 68, 0.9)",
        pingBg: "bg-red-400/30"
      };
    case "ghost":
      return {
        element: <span className="text-sm select-none animate-bounce">👻</span>,
        shadow: "0 0 6px rgba(241, 245, 249, 0.8)",
        pingBg: "bg-slate-300/25"
      };
    case "classic":
    default:
      return {
        element: <Moon className="w-4 h-4 fill-purple-200 text-purple-300 stroke-[1.2]" />,
        shadow: "0 0 5px rgba(212, 195, 255, 0.8)",
        pingBg: "bg-purple-400/30"
      };
  }
};

export const Planet: React.FC<PlanetProps> = ({
  level,
  planetExp,
  planetExpNeeded,
  starsCount,
  starPowerMultiplier,
  onPlanetClick,
  floatingTexts,
  purchasedAnimalsList = [],
  isNight = true,
  activeStarColor = "default",
  activeAccessory = "none",
  isLowMemory = false,
  moonsCount = 0,
  activeMoonSkin = "default",
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [level]);

  // Select theme based on level
  const theme = useMemo(() => {
    return (
      PLANET_THEMES.find(
        (t) => level >= t.levelRange[0] && level <= t.levelRange[1]
      ) || PLANET_THEMES[PLANET_THEMES.length - 1]
    );
  }, [level]);

  // Generate orbit arrays for stars
  const orbits = useMemo(() => {
    const arr = [];
    // Cap visual stars to at most 20 to prevent severe mobile rendering lag on high star counts, or 4 in low-memory mode
    const maxRenderedStars = Math.min(starsCount, isLowMemory ? 4 : 20);
    for (let i = 0; i < maxRenderedStars; i++) {
      // Calculate randomized paths for orbit effect
      const distance = 132 + (i % 5) * 16; // concentric circles closer to planet
      const duration = 10 + (i % 4) * 5 + Math.random() * 2; // timing in seconds
      const delay = -(i * 2.1); // stagger starting points
      const reverse = i % 2 === 0;
      arr.push({ id: i, distance, duration, delay, reverse });
    }
    return arr;
  }, [starsCount, isLowMemory]);

  // Generate moon orbits (outer orbits, max 10, or max 2 in low memory mode)
  const moonOrbits = useMemo(() => {
    const arr = [];
    const maxRenderedMoons = Math.min(moonsCount, isLowMemory ? 2 : 10);
    for (let i = 0; i < maxRenderedMoons; i++) {
      const distance = 216 + i * 18; // concentric orbits closer to each other to pack 10 nicely
      const duration = 24 + i * 6; // slightly staggered speeds
      const delay = -(i * 5.2); // stagger delays
      const reverse = i % 2 !== 0;
      arr.push({ id: i, distance, duration, delay, reverse });
    }
    return arr;
  }, [moonsCount, isLowMemory]);

  // Helper inside SVG to render active accessory
  const renderAccessory = () => {
    switch (activeAccessory) {
      case "cat_ears":
        return (
          <g id="accessory-cat-ears" className="pointer-events-none">
            {/* Left Ear */}
            <path d="M 42,24 L 64,5 L 76,28 Z" fill="#ffd1dc" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 48,22 L 62,9 L 70,24 Z" fill="#fca5a5" />
            {/* Right Ear */}
            <path d="M 158,24 L 136,5 L 124,28 Z" fill="#ffd1dc" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 152,22 L 138,9 L 130,24 Z" fill="#fca5a5" />
          </g>
        );
      case "chef_hat":
        return (
          <g id="accessory-chef-hat" className="pointer-events-none">
            {/* Puffy chef hat sitting centered on top of head */}
            <path d="M 75,25 Q 70,5 90,8 Q 100,-8 110,8 Q 130,5 125,25 Z" fill="#ffffff" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            <rect x="80" y="22" width="40" height="8" rx="2" fill="#e2e8f0" stroke="#2d1e38" strokeWidth="2.5" />
          </g>
        );
      case "wizard_hat":
        return (
          <g id="accessory-wizard-hat" className="pointer-events-none" transform="rotate(-10 100 20)">
            {/* Magic Hat */}
            <path d="M 65,22 L 100,-15 L 135,22 Z" fill="#3b82f6" stroke="#1d1e2e" strokeWidth="3" strokeLinejoin="round" />
            {/* Brim */}
            <ellipse cx="100" cy="22" rx="42" ry="6" fill="#1d4ed8" stroke="#1d1e2e" strokeWidth="3" />
            {/* Embedded glowing wizard stars */}
            <path d="M 95,2 L 100,5 Q 100,2 105,2 Q 100,2 100,-1 Z" fill="#fef08a" transform="scale(0.8) translate(15, 10)" />
            <path d="M 95,2 L 100,5 Q 100,2 105,2 Q 100,2 100,-1 Z" fill="#fef08a" transform="scale(0.6) translate(50, 15)" />
          </g>
        );
      case "angel_halo":
        return (
          <g id="accessory-angel-halo" className="pointer-events-none animate-bounce" style={{ animationDelay: "0s" }}>
            {/* Golden glowing halo hoop */}
            <ellipse cx="100" cy="-2" rx="35" ry="8" fill="none" stroke="#fbbf24" strokeWidth="4.5" filter="drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))" />
            <ellipse cx="100" cy="-2" rx="35" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" />
          </g>
        );
      case "space_glasses":
        return (
          <g id="accessory-space-glasses" className="pointer-events-none">
            {/* Left glasses star */}
            <path d="M 45,74 L 58,74 L 62,62 L 67,74 L 80,74 L 70,82 L 74,94 L 62,86 L 51,94 L 55,82 Z" fill="rgba(6, 182, 212, 0.85)" stroke="#1d1e2e" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 52,78 L 58,78 L 62,72 L 64,78 L 60,82 Z" fill="#fff" opacity="0.6" />
            {/* Right glasses star */}
            <path d="M 120,74 L 133,74 L 137,62 L 142,74 L 155,74 L 145,82 L 149,94 L 137,86 L 126,94 L 130,82 Z" fill="rgba(6, 182, 212, 0.85)" stroke="#1d1e2e" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 127,78 L 133,78 L 137,72 L 139,78 L 135,82 Z" fill="#fff" opacity="0.6" />
            {/* Bridging bar */}
            <path d="M 80,74 Q 100,70 120,74" fill="none" stroke="#1d1e2e" strokeWidth="3" />
          </g>
        );
      case "star_crown":
        return (
          <g id="accessory-star-crown" className="pointer-events-none" transform="translate(0, 3)">
            {/* Gold crown with high-contrast jewels */}
            <path d="M 75,22 L 80,8 L 92,15 L 100,3 L 108,15 L 120,8 L 125,22 Z" fill="#fbbf24" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="80" cy="7" r="2.5" fill="#f43f5e" stroke="#2d1e38" strokeWidth="1" />
            <circle cx="100" cy="2" r="2.5" fill="#3b82f6" stroke="#2d1e38" strokeWidth="1" />
            <circle cx="120" cy="7" r="2.5" fill="#10b981" stroke="#2d1e38" strokeWidth="1" />
            <rect x="83" y="17" width="34" height="3" rx="1" fill="#fff" opacity="0.7" />
          </g>
        );
      case "detective_hat":
        return (
          <g id="accessory-detective-hat" className="pointer-events-none" transform="translate(0, 1)">
            {/* Main brown hat dome */}
            <path d="M 65,22 C 65,2 135,2 135,22 Z" fill="#855843" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            {/* Front visor / peak */}
            <path d="M 115,22 C 122,22 138,18 142,24 C 130,28 115,24 115,22 Z" fill="#694132" stroke="#2d1e38" strokeWidth="2.5" />
            {/* Back visor / peak */}
            <path d="M 85,22 C 78,22 62,18 58,24 C 70,28 85,24 85,22 Z" fill="#694132" stroke="#2d1e38" strokeWidth="2.5" />
            {/* Detective tie ribbon */}
            <rect x="94" y="10" width="12" height="13" fill="#e2e8f0" stroke="#2d1e38" strokeWidth="2" rx="1" />
            <path d="M 97,23 L 94,32 L 106,32 L 103,23 Z" fill="#cbd5e1" stroke="#2d1e38" strokeWidth="2" />
          </g>
        );
      case "flower_crown":
        return (
          <g id="accessory-flower-crown" className="pointer-events-none" transform="translate(0, 2)">
            {/* Leaf / branch crown */}
            <path d="M 55,24 Q 100,10 145,24" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
            {/* Flower 1 - Left */}
            <g transform="translate(68, 20) scale(0.65)">
              <circle cx="0" cy="-5" r="4" fill="#f472b6" />
              <circle cx="0" cy="5" r="4" fill="#f472b6" />
              <circle cx="-5" cy="0" r="4" fill="#f472b6" />
              <circle cx="5" cy="0" r="4" fill="#f472b6" />
              <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
            </g>
            {/* Flower 2 - Middle Left */}
            <g transform="translate(86, 17) scale(0.75)">
              <circle cx="0" cy="-5" r="4" fill="#fff" />
              <circle cx="0" cy="5" r="4" fill="#fff" />
              <circle cx="-5" cy="0" r="4" fill="#fff" />
              <circle cx="5" cy="0" r="4" fill="#fff" />
              <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
            </g>
            {/* Flower 3 - Center */}
            <g transform="translate(100, 16) scale(0.85)">
              <circle cx="0" cy="-5" r="4" fill="#c084fc" />
              <circle cx="0" cy="5" r="4" fill="#c084fc" />
              <circle cx="-5" cy="0" r="4" fill="#c084fc" />
              <circle cx="5" cy="0" r="4" fill="#c084fc" />
              <circle cx="0" cy="0" r="2.5" fill="#fde047" />
            </g>
            {/* Flower 4 - Middle Right */}
            <g transform="translate(114, 17) scale(0.75)">
              <circle cx="0" cy="-5" r="4" fill="#fff" />
              <circle cx="0" cy="5" r="4" fill="#fff" />
              <circle cx="-5" cy="0" r="4" fill="#fff" />
              <circle cx="5" cy="0" r="4" fill="#fff" />
              <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
            </g>
            {/* Flower 5 - Right */}
            <g transform="translate(132, 20) scale(0.65)">
              <circle cx="0" cy="-5" r="4" fill="#f472b6" />
              <circle cx="0" cy="5" r="4" fill="#f472b6" />
              <circle cx="-5" cy="0" r="4" fill="#f472b6" />
              <circle cx="5" cy="0" r="4" fill="#f472b6" />
              <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
            </g>
          </g>
        );
      case "frog_hat":
        return (
          <g id="accessory-frog-hat" className="pointer-events-none" transform="translate(0, 1)">
            {/* Green Dome */}
            <path d="M 68,23 C 68,0 132,0 132,23 Z" fill="#4ade80" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            {/* Frog Left Eye */}
            <circle cx="82" cy="7" r="10" fill="#4ade80" stroke="#2d1e38" strokeWidth="2.5" />
            <circle cx="82" cy="7" r="6" fill="#fff" />
            <circle cx="80" cy="8" r="3.5" fill="#000" />
            {/* Frog Right Eye */}
            <circle cx="118" cy="7" r="10" fill="#4ade80" stroke="#2d1e38" strokeWidth="2.5" />
            <circle cx="118" cy="7" r="6" fill="#fff" />
            <circle cx="120" cy="8" r="3.5" fill="#000" />
            {/* Cute Frog Cheeks */}
            <circle cx="78" cy="18" r="3" fill="#f43f5e" opacity="0.6" />
            <circle cx="122" cy="18" r="3" fill="#f43f5e" opacity="0.6" />
          </g>
        );
      case "cowboy_hat":
        return (
          <g id="accessory-cowboy-hat" className="pointer-events-none" transform="translate(0, -6)">
            {/* Cowboy hat top crown */}
            <path d="M 75,20 C 72,2 88,4 100,5 C 112,4 128,2 125,20 Z" fill="#b45309" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            {/* Hat ribbon/band */}
            <path d="M 75,19 Q 100,21 125,19" fill="none" stroke="#fef08a" strokeWidth="3.5" />
            {/* Brim: beautifully curved upturned cowboy brim */}
            <path d="M 54,23 Q 100,10 146,23 C 158,26 142,20 130,19 C 112,17 88,17 70,19 C 58,20 42,26 54,23 Z" fill="#92400e" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
          </g>
        );
      case "straw_hat":
        return (
          <g id="accessory-straw-hat" className="pointer-events-none" transform="translate(0, 1)">
            {/* Hat crown */}
            <path d="M 75,22 Q 74,5 100,5 Q 126,5 125,22 Z" fill="#fde047" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            {/* Red band */}
            <rect x="76" y="16" width="48" height="6" fill="#f43f5e" stroke="#2d1e38" strokeWidth="2" />
            {/* Straw brim */}
            <ellipse cx="100" cy="22" rx="46" ry="6" fill="#facc15" stroke="#2d1e38" strokeWidth="3" />
          </g>
        );
      case "sleep_cap":
        return (
          <g id="accessory-sleep-cap" className="pointer-events-none" transform="translate(0, 1)">
            {/* Flowing floppy nightcap body */}
            <path d="M 75,23 C 70,10 80,-5 105,-8 C 118,-9 132,-5 130,5 C 128,15 135,18 135,23 Z" fill="#3b82f6" stroke="#2d1e38" strokeWidth="3" strokeLinejoin="round" />
            {/* Falling tip to the side */}
            <path d="M 124,0 C 138,0 152,15 145,26 C 142,28 136,22 132,18 Z" fill="#2563eb" stroke="#2d1e38" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Fluffy white pompom on the tip */}
            <circle cx="146" cy="28" r="7.5" fill="#ffffff" stroke="#2d1e38" strokeWidth="2.5" />
            {/* Star details on nightcap */}
            <path d="M 90,4 L 92,7 L 95,7 L 93,9 L 94,12 L 91,10 L 88,12 L 89,9 L 87,7 L 90,7 Z" fill="#fde047" transform="scale(0.7) translate(25, 5)" />
            <path d="M 90,4 L 92,7 L 95,7 L 93,9 L 94,12 L 91,10 L 88,12 L 89,9 L 87,7 L 90,7 Z" fill="#fde047" transform="scale(0.6) translate(85, -2)" />
            {/* White rim band on planet forehead */}
            <rect x="73" y="19" width="54" height="6" rx="2.5" fill="#f1f5f9" stroke="#2d1e38" strokeWidth="2.5" />
          </g>
        );
      case "pirate_hat":
        return (
          <g id="accessory-pirate-hat" className="pointer-events-none" transform="translate(0, -2)">
            {/* High-quality tricorn black hat shapes */}
            <path d="M 60,22 Q 100,5 140,22 C 160,5 140,-4 100,-4 C 60,-4 40,5 60,22 Z" fill="#1e293b" stroke="#100d23" strokeWidth="3.5" strokeLinejoin="round" />
            {/* Golden brim border */}
            <path d="M 56,22 Q 100,3 144,22" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
            {/* Skull and Crossbones Jolly Roger Emblem */}
            <g transform="translate(100, 7) scale(0.55)">
              <rect x="-6" y="-6" width="12" height="10" rx="4" fill="#ffffff" stroke="#100d23" strokeWidth="1.5" />
              <rect x="-3" y="2" width="6" height="5" fill="#ffffff" stroke="#100d23" strokeWidth="1.5" />
              <circle cx="-2.5" cy="-2" r="1.5" fill="#000" />
              <circle cx="2.5" cy="-2" r="1.5" fill="#000" />
              <line x1="-10" y1="-8" x2="10" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="-8" x2="-10" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        );
      case "reindeer_horns":
        return (
          <g id="accessory-reindeer-horns" className="pointer-events-none" transform="translate(0, 1)">
            {/* Left antler */}
            <path d="M 54,23 L 42,-5 M 46,12 L 32,8 M 44,4 L 30,-2" fill="none" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
            {/* Right antler */}
            <path d="M 146,23 L 158,-5 M 154,12 L 168,8 M 156,4 L 170,-2" fill="none" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
            {/* Red bow in the center of the head */}
            <g transform="translate(100, 18) scale(0.7)">
              <path d="M -8,-4 L 8,4 L 8,-4 L -8,4 Z" fill="#ef4444" stroke="#2d1e38" strokeWidth="2" />
              <circle cx="0" cy="0" r="3.5" fill="#facc15" stroke="#2d1e38" strokeWidth="1.5" />
            </g>
          </g>
        );
      case "slime_blob":
        return (
          <g id="accessory-slime-blob" className="pointer-events-none animate-bounce" style={{ animationDuration: "1.8s" }}>
            {/* Jelly green round body on top center */}
            <path d="M 86,22 C 84,8 116,8 114,22 Z" fill="#22c55e" stroke="#155e75" strokeWidth="2.5" opacity="0.92" />
            {/* Mini shiny highlight */}
            <ellipse cx="94" cy="14" rx="3" ry="1.5" fill="#fff" opacity="0.65" transform="rotate(-20 94 14)" />
            {/* Mini face for the slime */}
            <circle cx="96" cy="18" r="1.5" fill="#155e75" />
            <circle cx="104" cy="18" r="1.5" fill="#155e75" />
            <path d="M 98,20 Q 100,22 102,20" fill="none" stroke="#155e75" strokeWidth="1" strokeLinecap="round" />
          </g>
        );
      case "top_hat":
        return (
          <g id="accessory-top-hat" className="pointer-events-none" transform="translate(0, -6)">
            {/* Tall top cylinder hat body */}
            <path d="M 78,21 L 82,1 L 118,1 L 122,21 Z" fill="#1e293b" stroke="#100d23" strokeWidth="3" strokeLinejoin="round" />
            {/* Red silken band */}
            <rect x="78" y="15" width="44" height="6" fill="#ef4444" stroke="#100d23" strokeWidth="2" />
            {/* Brim flat base */}
            <ellipse cx="100" cy="22" rx="42" ry="5.5" fill="#0f172a" stroke="#100d23" strokeWidth="3" />
          </g>
        );
      case "devil_horns":
        return (
          <g id="accessory-devil-horns" className="pointer-events-none animate-pulse">
            {/* Left glowing neon red horn */}
            <path d="M 52,24 C 44,20 40,5 28,10 C 34,22 45,28 50,28" fill="#f43f5e" stroke="#881337" strokeWidth="3" strokeLinejoin="round" filter="drop-shadow(0 0 3px rgba(244, 63, 94, 0.8))" />
            {/* Right glowing neon red horn */}
            <path d="M 148,24 C 156,20 160,5 172,10 C 166,22 155,28 150,28" fill="#f43f5e" stroke="#881337" strokeWidth="3" strokeLinejoin="round" filter="drop-shadow(0 0 3px rgba(244, 63, 94, 0.8))" />
          </g>
        );
      default:
        return null;
    }
  };

  // Helper inside SVG to render face expression
  const renderFace = () => {
    switch (theme.eyeStyle) {
      case "wink":
        return (
          <>
            {/* Eye Left: wink */}
            <path
              d="M 50,75 Q 60,65 70,75"
              fill="none"
              stroke="#5c4452"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Eye Right: Cute dot */}
            <circle cx="130" cy="73" r="7" fill="#5c4452" />
            <circle cx="128" cy="70" r="2.5" fill="white" />
            {/* Cheek blush */}
            <ellipse cx="45" cy="88" rx="14" ry="7" fill={theme.cheekColor} />
            <ellipse cx="135" cy="86" rx="14" ry="7" fill={theme.cheekColor} />
            {/* Happy cat smile mouth 3 */}
            <path
              d="M 85,90 Q 92,97 95,91 Q 98,97 105,90"
              fill="none"
              stroke="#5c4452"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        );
      case "sparkle":
        return (
          <>
            {/* Eye Left */}
            <path
              d="M 55,67 L 65,77 M 65,67 L 55,77"
              stroke="#3a4d46"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Eye Right */}
            <path
              d="M 125,67 L 135,77 M 135,67 L 125,77"
              stroke="#3a4d46"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Cute cheeks */}
            <ellipse cx="45" cy="85" rx="13" ry="6" fill={theme.cheekColor} />
            <ellipse cx="135" cy="85" rx="13" ry="6" fill={theme.cheekColor} />
            {/* Tiny open mouth */}
            <path
              d="M 88,88 Q 95,95 102,88 Z"
              fill="#f8a3b9"
              stroke="#3a4d46"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </>
        );
      case "happy":
        return (
          <>
            {/* Eyes: Happy arches */}
            <path
              d="M 45,77 Q 55,62 65,77"
              fill="none"
              stroke="#333"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 125,77 Q 135,62 145,77"
              fill="none"
              stroke="#333"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <ellipse cx="40" cy="86" rx="15" ry="8" fill={theme.cheekColor} />
            <ellipse cx="150" cy="86" rx="15" ry="8" fill={theme.cheekColor} />
            {/* Big smiling mouth */}
            <path
              d="M 85,88 Q 95,104 105,88 Z"
              fill="#fb7185"
              stroke="#333"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </>
        );
      case "star":
        return (
          <>
            {/* Eyes: Shiny anime eyes with heart highlights */}
            <g transform="translate(45, 62)">
              <rect x="0" y="0" width="18" height="24" rx="9" fill="#2d1e38" />
              <circle cx="5" cy="6" r="4.5" fill="white" />
              <circle cx="12" cy="16" r="2.5" fill="white" />
            </g>
            <g transform="translate(115, 62)">
              <rect x="0" y="0" width="18" height="24" rx="9" fill="#2d1e38" />
              <circle cx="5" cy="6" r="4.5" fill="white" />
              <circle cx="12" cy="16" r="2.5" fill="white" />
            </g>
            <ellipse cx="40" cy="88" rx="16" ry="9" fill={theme.cheekColor} />
            <ellipse cx="140" cy="88" rx="16" ry="9" fill={theme.cheekColor} />
            {/* Kitten W-mouth */}
            <path
              d="M 82,88 Q 88,94 92,89 Q 96,94 102,88"
              fill="none"
              stroke="#2d1e38"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        );
      case "angel":
        return (
          <>
            {/* Sleepy contented eyes */}
            <path
              d="M 45,74 Q 55,84 65,74"
              fill="none"
              stroke="#4a2040"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 125,74 Q 135,84 145,74"
              fill="none"
              stroke="#4a2040"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <ellipse cx="40" cy="82" rx="16" ry="9" fill={theme.cheekColor} />
            <ellipse cx="150" cy="82" rx="16" ry="9" fill={theme.cheekColor} />
            {/* Shy delicate smile */}
            <path
              d="M 90,87 Q 95,91 100,87"
              fill="none"
              stroke="#4a2040"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none py-6 px-4">
      {/* Visual background atmospheric glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-pink-200/40 via-purple-200/30 to-teal-200/40 blur-3xl opacity-90 -z-10" />

      {/* Central Cosmic System Wrapper: perfectly binds everything to the exact same center anchor point */}
      <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">

        {/* Orbit Rings Container */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[660px] h-[660px] flex items-center justify-center z-20">
          {/* Render Concentric Orbits if Stars exist */}
          {orbits.map((val) => {
            const starStyle = STAR_STYLES[activeStarColor] || STAR_STYLES.default;
            return (
              <div
                key={val.id}
                className="absolute border border-dashed border-sky-200/15 rounded-full"
                style={{
                  width: `${val.distance * 2}px`,
                  height: `${val.distance * 2}px`,
                  transform: `rotate(${val.id * 15}deg)`,
                }}
              >
                {/* Spinning Star Wrapper */}
                <div
                  className="absolute w-full h-full animate-spin"
                  style={{
                    animationDuration: `${val.duration}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDirection: val.reverse ? "reverse" : "normal",
                  }}
                >
                  {/* Real physical orbiting star */}
                  <div
                    className="absolute left-1/2 -top-1.5 w-3 h-3 flex items-center justify-center -translate-x-1/2"
                    style={{
                      filter: `drop-shadow(0 0 2px ${starStyle.glow})`,
                    }}
                  >
                    <Star className={`w-2.5 h-2.5 ${starStyle.fill} ${starStyle.border} stroke-[1.5] ${starStyle.extraClass || ""}`} />
                    {/* Subtle emission pulse radiating from the star occasionally */}
                    <span className={`absolute animate-ping inline-flex h-full w-full rounded-full ${starStyle.ping} opacity-20 pointer-events-none`} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Render Moons if Moons exist */}
          {moonOrbits.map((val) => {
            const skinGraphic = getMoonSkinGraphic(activeMoonSkin);
            return (
              <div
                key={val.id}
                className={`absolute rounded-full ${isLowMemory ? "" : "border border-dashed border-purple-400/20"}`}
                style={{
                  width: `${val.distance * 2}px`,
                  height: `${val.distance * 2}px`,
                  transform: `rotate(${val.id * 40}deg)`,
                }}
              >
                {/* Spinning Moon Wrapper */}
                <div
                  className="absolute w-full h-full animate-spin"
                  style={{
                    animationDuration: `${val.duration}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDirection: val.reverse ? "reverse" : "normal",
                  }}
                >
                  {/* Glowing physical orbiting moon */}
                  <div
                    className="absolute left-1/2 -top-2.5 w-5 h-5 flex items-center justify-center -translate-x-1/2 rotate-45"
                    style={{
                      filter: isLowMemory ? "" : `drop-shadow(${skinGraphic.shadow})`,
                    }}
                  >
                    {skinGraphic.element}
                    {/* Ping radiant aura */}
                    {!isLowMemory && (
                      <span className={`absolute animate-ping inline-flex h-full w-full rounded-full ${skinGraphic.pingBg} opacity-25 pointer-events-none`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Interactive Planet Wrapper */}
        <motion.div
          id="planet-container"
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 450, damping: 15 }}
          onClick={onPlanetClick}
          className="cursor-pointer relative z-10 w-full h-full rounded-full flex items-center justify-center filter drop-shadow-[0_8px_24px_rgba(244,143,177,0.3)] touch-manipulation"
        >
          {/* Level Up Flash / Glow Aura */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

          {/* Planet SVG representation */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
          {/* Definitions for Gradients and Filters */}
          <defs>
            <radialGradient id="planetGrad" cx="40%" cy="40%" r="65%">
              <stop offset="0%" className="stop-color-white" stopColor="#fff" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#fff" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.06} />
            </radialGradient>
            
            {/* Custom linear gradient using theme styling dynamically */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {(theme.stops || ["#ffd1dc", "#fca5a5", "#f43f5e"]).map((stopColor, idx) => {
                const stopsCount = (theme.stops || ["#ffd1dc", "#fca5a5", "#f43f5e"]).length;
                const offset = stopsCount > 1
                  ? `${Math.round((idx / (stopsCount - 1)) * 100)}%`
                  : "0%";
                return <stop key={idx} offset={offset} stopColor={stopColor} />;
              })}
            </linearGradient>

            {/* Perfect circular mask/clip path for custom PNG assets */}
            <clipPath id="planetClip">
              <circle cx="100" cy="100" r="90" />
            </clipPath>
          </defs>

          {theme.image && !imageError ? (
            <image
              href={theme.image}
              x="10"
              y="10"
              width="180"
              height="180"
              clipPath="url(#planetClip)"
              onError={() => setImageError(true)}
            />
          ) : (
            <>
              {/* Base color Sphere */}
              <circle cx="100" cy="100" r="90" fill="url(#bodyGrad)" />

              {/* Continent shapes with custom translucent continents */}
              <g fill={theme.continents}>
                {/* Heart-shaped continent / patch */}
                <path
                  d="M 50,45 C 50,37 60,37 65,42 C 70,37 80,37 80,45 C 80,55 65,65 65,65 C 65,65 50,55 50,45 Z"
                  transform="rotate(-15 65 51)"
                />
                {/* Rounded blobs */}
                <path d="M 115,25 Q 130,10 145,28 Q 160,45 140,55 Q 120,65 115,45 Z" />
                <path d="M 30,110 Q 15,120 25,138 Q 35,155 50,145 Q 65,135 55,120 Z" />
                
                {/* Small circular continents for sweet texture */}
                <circle cx="155" cy="115" r="10" />
                <circle cx="110" cy="155" r="15" />
                {theme.hasFlowers && (
                  <circle cx="165" cy="85" r="6" />
                )}
              </g>

              {/* Shading/Lighting overlay */}
              <circle cx="100" cy="100" r="90" fill="url(#planetGrad)" />

              {/* Extra Level-Specific Elements drawn nested in standard SVG space */}
              {/* Cute Flowers for Level 2,3,5+ */}
              {theme.hasFlowers && (
                <g transform="translate(10, 0)">
                  {/* Flower 1 */}
                  <g transform="translate(130, 40) scale(0.7)">
                    <circle cx="0" cy="-6" r="4.5" fill="#fef08a" />
                    <circle cx="0" cy="6" r="4.5" fill="#fef08a" />
                    <circle cx="-6" cy="0" r="4.5" fill="#fef08a" />
                    <circle cx="6" cy="0" r="4.5" fill="#fef08a" />
                    <circle cx="0" cy="0" r="3" fill="#fb923c" />
                  </g>
                  {/* Flower 2 */}
                  <g transform="translate(40, 120) scale(0.6)">
                    <circle cx="0" cy="-5" r="4" fill="#ffedd5" />
                    <circle cx="0" cy="5" r="4" fill="#ffedd5" />
                    <circle cx="-5" cy="0" r="4" fill="#ffedd5" />
                    <circle cx="5" cy="0" r="4" fill="#ffedd5" />
                    <circle cx="0" cy="0" r="2.5" fill="#fb7185" />
                  </g>
                </g>
              )}

              {/* Clouds for Level 3,4,5+ */}
              {theme.hasClouds && (
                <g opacity="0.85" className="animate-pulse">
                  {/* Custom floating cloud paths */}
                  <path
                    d="M 25,50 Q 30,42 38,45 Q 45,35 55,42 Q 62,45 61,52 Q 65,60 55,60 L 30,60"
                    fill="#ffffff"
                    opacity="0.8"
                    transform="translate(10, -5)"
                  />
                  <path
                    d="M 120,135 Q 125,127 133,130 Q 140,120 150,127 Q 157,130 156,137 L 120,137"
                    fill="#ffffff"
                    opacity="0.9"
                    transform="translate(-5, 0)"
                  />
                </g>
              )}
            </>
          )}

          {/* The face itself */}
          <g transform="translate(0, 5)">{renderFace()}</g>

          {/* Render Active Cosmetic Accessory */}
          {renderAccessory()}

          {/* Sparkles or halo */}
          {level >= 5 && (
            <g transform="translate(100,20) scale(0.85)" className="animate-bounce">
              <path d="M 0,-15 L 3,-5 L 13,-5 L 5,2 L 8,12 L 0,6 L -8,12 L -5,2 L -13,-5 L -3,-5 Z" fill="#fef08a" />
            </g>
          )}

          {/* Glowing Planetary Rings for Theme 4, 5+ */}
          {theme.hasRings && (
            <path
              d="M -15,100 C -15,125 215,125 215,100 C 215,90 200,85 170,82 C 145,80 55,80 30,82 C 0,85 -15,90 -15,100 Z"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.75"
              transform="rotate(-12 100 100)"
              className="pointer-events-none"
            />
          )}
        </svg>
      </motion.div>
    </div>

      {/* Floating Sparkly Text Particles */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <AnimatePresence>
          {(isLowMemory ? floatingTexts.slice(-3) : floatingTexts).map((item) => (
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
                  <Heart className="w-5 h-5 fill-[#FFD1DC] stroke-[#f15e75] stroke-[2.5] inline animate-bounce" /> {item.text}
                </div>
              )}
              {item.type === "star-click" && (() => {
                const sStyle = STAR_STYLES[activeStarColor] || STAR_STYLES.default;
                return (
                  <div 
                    className="font-mono text-sm leading-none font-bold flex items-center gap-0.5 filter"
                    style={{ filter: `drop-shadow(0 1px 4px ${sStyle.glow})` }}
                  >
                    <Star className={`w-4 h-4 inline stroke-[2] ${sStyle.fill} ${sStyle.border} ${sStyle.extraClass || ""}`} />
                    <span className={isNight ? "text-amber-200 font-black" : "text-amber-950 font-black"}>{item.text}</span>
                  </div>
                );
              })()}
              {item.type === "moon-click" && (
                <div 
                  className="font-mono text-sm leading-none font-bold flex items-center gap-1 filter"
                  style={{ filter: "drop-shadow(0 1px 6px rgba(192, 132, 252, 0.8))" }}
                >
                  <Moon className="w-4 h-4 inline stroke-[1.5] fill-purple-200 text-purple-400" />
                  <span className={isNight ? "text-purple-250 font-black" : "text-purple-950 font-black"}>{item.text}</span>
                </div>
              )}
              {item.type === "level" && (
                <div className={`font-sans font-black text-base rounded-full px-4 py-1.5 flex items-center gap-1.5 border-3 ${
                  isNight 
                    ? "text-teal-300 bg-[#14122d]/95 border-teal-300 shadow-[4px_4px_0px_rgba(20,184,166,0.6)]" 
                    : "text-[#6D4C41] bg-[#FFF9C4] border-[#6D4C41] shadow-[4px_4px_0px_#6D4C41]"
                }`}>
                  <Sparkles className={`w-4 h-4 ${isNight ? "text-teal-300" : "text-[#6D4C41]"}`} /> {item.text}
                </div>
              )}
              {(item.type === "heart" || item.type === "star") && (
                <span className="text-xl animate-ping">{item.text}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Planet Info Display & Level-Bar */}
      <div className={`mt-6 flex flex-col items-center w-full max-w-sm relative z-10 rounded-2.5xl p-5 border-3 transition-colors duration-500 shadow-md ${
        isNight 
          ? "bg-[#130f2c]/95 border-[#caa5fe]/60 text-[#ffeef4]" 
          : "bg-[#fffdf2]/95 border-amber-300 text-slate-800"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-sans text-xs font-black px-2.5 py-0.5 rounded-full border-2 transition-colors duration-500 ${
            isNight 
              ? "bg-[#caa5fe] border-[#100d23] text-[#100d23]" 
              : "bg-amber-200 border-amber-500 text-amber-950"
          }`}>
            Lv. {level}
          </span>
          <h2 className={`font-sans font-black uppercase text-sm sm:text-base tracking-wide ${
            isNight ? "text-[#ffeef4]" : "text-amber-950"
          }`}>
            {theme.name}
          </h2>
        </div>
        <p className={`font-sans text-[11px] text-center mt-2 leading-relaxed font-semibold transition-colors duration-500 ${
          isNight ? "text-[#ab9fd2]" : "text-slate-600"
        }`}>
          {theme.subName}
        </p>

        {/* Level EXP Progress bar */}
        <div className="w-full mt-3">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 transition-colors duration-500">
            <span className={`uppercase font-bold tracking-wider ${
              isNight ? "text-[#ab9fd2]" : "text-amber-800"
            }`}>Evolution</span>
            <span className={isNight ? "text-[#ffeef4]" : "text-amber-950"}>
              {Math.floor(planetExp)} / {planetExpNeeded} EXP
            </span>
          </div>
          <div className={`w-full h-3.5 border-2 rounded-full overflow-hidden p-[1px] transition-colors duration-500 ${
            isNight ? "border-[#caa5fe]/45 bg-[#090715]" : "border-amber-305 bg-amber-50"
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (planetExp / planetExpNeeded) * 100)}%` }}
              transition={{ type: "tween", duration: 0.3 }}
              className={`h-full rounded-full border-r ${
                isNight 
                  ? "bg-gradient-to-r from-[#caa5fe] to-[#ff9db8] border-[#100d23]" 
                  : "bg-gradient-to-r from-yellow-405 to-amber-500 border-amber-950"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
