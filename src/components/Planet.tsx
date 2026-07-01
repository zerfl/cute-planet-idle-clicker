import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Star, Moon } from "lucide-react";
import { ZODIACS } from "../data/zodiacs";
import { PlanetAccessory } from "./PlanetAccessory";
import { PlanetTask } from "../types";
import { ROGUELITE_PLANET_SKINS } from "../roguelite/data";

interface PlanetProps {
  level: number;
  planetExp: number;
  planetExpNeeded: number;
  planetTask?: PlanetTask;
  starsCount: number;
  starPowerMultiplier: number;
  onPlanetClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isNight?: boolean;
  activeStarColor?: string;
  activeAccessory?: string;
  isLowMemory?: boolean;
  moonsCount?: number;
  activeMoonSkin?: string;
  activePlanetSkin?: string;
  activeZodiacId?: string;
  onOpenZodiacModal?: () => void;
}

const STAR_STYLES: Record<
  string,
  { fill: string; border: string; glow: string; ping: string; extraClass?: string }
> = {
  default: {
    fill: "fill-yellow-250",
    border: "text-amber-400",
    glow: "rgba(253, 224, 71, 0.5)",
    ping: "bg-yellow-300",
  },
  pink: {
    fill: "fill-pink-200",
    border: "text-pink-400",
    glow: "rgba(244, 143, 177, 0.6)",
    ping: "bg-pink-300",
  },
  purple: {
    fill: "fill-purple-200",
    border: "text-purple-400",
    glow: "rgba(168, 85, 247, 0.6)",
    ping: "bg-purple-300",
  },
  cyber: {
    fill: "fill-cyan-200",
    border: "text-cyan-400",
    glow: "rgba(6, 182, 212, 0.6)",
    ping: "bg-cyan-300",
  },
  gold: {
    fill: "fill-amber-300",
    border: "text-amber-500",
    glow: "rgba(245, 158, 11, 0.6)",
    ping: "bg-amber-400",
  },
  mint: {
    fill: "fill-emerald-200",
    border: "text-emerald-400",
    glow: "rgba(16, 185, 129, 0.5)",
    ping: "bg-emerald-300",
  },
  ruby: {
    fill: "fill-red-200",
    border: "text-red-400",
    glow: "rgba(239, 68, 68, 0.6)",
    ping: "bg-red-400",
  },
  rainbow: {
    fill: "",
    border: "",
    glow: "rgba(236, 72, 153, 0.7)",
    ping: "bg-pink-400",
    extraClass: "animate-rainbow-star",
  },
  emerald: {
    fill: "fill-emerald-300",
    border: "text-emerald-500",
    glow: "rgba(16, 185, 129, 0.6)",
    ping: "bg-emerald-400",
  },
  sunset: {
    fill: "fill-orange-300",
    border: "text-orange-500",
    glow: "rgba(249, 115, 22, 0.6)",
    ping: "bg-orange-400",
  },
  silver: {
    fill: "fill-slate-200",
    border: "text-slate-400",
    glow: "rgba(148, 163, 184, 0.5)",
    ping: "bg-slate-300",
  },
  ocean: {
    fill: "fill-sky-200",
    border: "text-blue-500",
    glow: "rgba(14, 165, 233, 0.6)",
    ping: "bg-sky-400",
  },
  cosmic_black: {
    fill: "fill-violet-950",
    border: "text-violet-800",
    glow: "rgba(139, 92, 246, 0.8)",
    ping: "bg-violet-900",
    extraClass: "brightness-75",
  },
  sakura_petals: {
    fill: "fill-rose-200",
    border: "text-rose-400",
    glow: "rgba(251, 113, 133, 0.5)",
    ping: "bg-rose-300",
  },
  ghostly: {
    fill: "fill-indigo-200",
    border: "text-indigo-400",
    glow: "rgba(129, 140, 248, 0.6)",
    ping: "bg-indigo-300",
    extraClass: "opacity-80 animate-pulse",
  },
  toxic: {
    fill: "fill-lime-300",
    border: "text-lime-500",
    glow: "rgba(132, 204, 22, 0.6)",
    ping: "bg-lime-400",
  },
  lava: {
    fill: "fill-orange-400",
    border: "text-red-500",
    glow: "rgba(239, 68, 68, 0.7)",
    ping: "bg-orange-500",
    extraClass: "animate-pulse",
  },
  candy: {
    fill: "fill-fuchsia-200",
    border: "text-pink-400",
    glow: "rgba(232, 121, 249, 0.6)",
    ping: "bg-pink-300",
  },
  butterfly: {
    fill: "fill-pink-350",
    border: "text-amber-300",
    glow: "rgba(232, 121, 249, 0.7)",
    ping: "bg-fuchsia-400",
    extraClass: "animate-pulse",
  },
};

// Visual themes for the planet according to level
export const PLANET_THEMES = [
  {
    levelRange: [1, 1],
    name: "Pastell-Eierchen-Planet",
    subName: "Ein junger, unberuehrter Planet voll sanfter Liebe.",
    image: "/assets/planets/01_pastell_eierchen_planet.webp",
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
    name: "Moos-Blueten-Welt",
    subName: "Kleine weiche Grasinseln und zarte Knospen erwachen.",
    image: "/assets/planets/02_moos_blueten_welt.webp",
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
    name: "Ozean-Woelkchen-Garten",
    subName: "Sanfte Woelkchen gleiten ueber himmelblaue Ozeane.",
    image: "/assets/planets/03_ozean_woelkchen_garten.webp",
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
    image: "/assets/planets/04_sternenlicht_reich.webp",
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
    name: "Lollipop-Suesswald",
    subName: "Kandierte Ozeane und Waelder aus bunter Zuckerwatte.",
    image: "/assets/planets/05_lollipop_suesswald.webp",
    bgColor: "from-cosmic-yellow via-pink-200 to-pink-400",
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
    subName: "Ein digitaler Traum aus fluessigem Licht und gluehendem Neon-Raster.",
    image: "/assets/planets/06_cyber_neon_oase.webp",
    bgColor: "from-cyan-500 to-cosmic-surface-mid",
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
    image: "/assets/planets/07_amethyst_zitadelle.webp",
    bgColor: "from-purple-400 via-violet-800 to-violet-950",
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
    subName: "Feuriges fluessiges Gestein glimmt harmonisch in der Nacht.",
    image: "/assets/planets/08_lava_karit_grotte.webp",
    bgColor: "from-orange-500 via-red-500 to-amber-950",
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
    subName: "Koenigliches Schimmern umgibt den von Sternenwind umwehten Goetterplaneten.",
    image: "/assets/planets/09_auroras_goldene_krone.webp",
    bgColor: "from-cosmic-yellow via-warning to-amber-900",
    continents: "rgba(254, 243, 199, 0.5)",
    cheekColor: "rgba(245, 158, 11, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#fef08a", "#fbbf24", "#b45309"],
  },
  {
    levelRange: [10, 10],
    name: "Kuschel-Utopia",
    subName: "Die ultimative Komfort-Zone voll Glueck, Sternenstaub und Harmonie.",
    image: "/assets/planets/10_kuschel_utopia.webp",
    bgColor: "from-amber-100 via-rose-200 to-pink-500 animate-pulse",
    continents: "rgba(254, 243, 199, 0.5)",
    cheekColor: "rgba(244, 63, 94, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "angel",
    stops: ["#fef3c7", "#fecdd3", "#cbd5e1", "#ec4899"],
  },
  {
    levelRange: [11, 11],
    name: "Sternenwatte-Planet",
    subName: "Flauschige Wolken aus reinem Sternenzucker schweben sanft um den Kern.",
    image: "/assets/planets/11_sternenwatte_planet.webp",
    bgColor: "from-sky-100 via-pink-100 to-indigo-200",
    continents: "rgba(255, 255, 255, 0.45)",
    cheekColor: "rgba(244, 114, 182, 0.5)",
    hasClouds: true,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#e0f2fe", "#fbcfe8", "#c7d2fe"],
  },
  {
    levelRange: [12, 12],
    name: "Kirschmond-Planet",
    subName: "Zarte Kirschbluetenblaetter glitzern im ewigen Schein des roten Begleiters.",
    image: "/assets/planets/12_kirschmond_planet.webp",
    bgColor: "from-rose-100 via-pink-200 to-red-300",
    continents: "rgba(254, 226, 226, 0.4)",
    cheekColor: "rgba(225, 29, 72, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "wink",
    stops: ["#ffe4e6", "#fbcfe8", "#f43f5e"],
  },
  {
    levelRange: [13, 13],
    name: "Glitzerpfoten-Planet",
    subName: "Ein magischer Kosmos, geformt wie die weichste aller Pfoetchen.",
    image: "/assets/planets/13_glitzerpfoten_planet.webp",
    bgColor: "from-purple-100 via-fuchsia-200 to-indigo-300",
    continents: "rgba(245, 243, 255, 0.45)",
    cheekColor: "rgba(168, 85, 247, 0.5)",
    hasClouds: false,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "sparkle",
    stops: ["#faf5ff", "#f5d0fe", "#6366f1"],
  },
  {
    levelRange: [14, 14],
    name: "Traumblasen-Planet",
    subName: "Irisierende schillernde Blasen platzen friedlich und verstreuen suesse Traeume.",
    image: "/assets/planets/14_traumblasen_planet.webp",
    bgColor: "from-teal-100 via-sky-100 to-cosmic-accent",
    continents: "rgba(204, 251, 241, 0.4)",
    cheekColor: "rgba(20, 184, 166, 0.45)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: false,
    eyeStyle: "happy",
    stops: ["#ccfbf1", "#bae6fd", "#c084fc"],
  },
  {
    levelRange: [15, 15],
    name: "Honigstern-Planet",
    subName: "Klebrig-suesser goldener Nektar fliesst durch schillernde Honigwaben.",
    image: "/assets/planets/15_honigstern_planet.webp",
    bgColor: "from-amber-100 via-amber-200 to-amber-600",
    continents: "rgba(254, 243, 199, 0.5)",
    cheekColor: "rgba(245, 158, 11, 0.6)",
    hasClouds: true,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#fffbeb", "#fde68a", "#b45309"],
  },
  {
    levelRange: [16, 16],
    name: "Lavendellicht-Planet",
    subName: "Ein beruhigendes, weiches Feld voll duftender lila Sternen-Lavendel.",
    image: "/assets/planets/16_lavendellicht_planet.webp",
    bgColor: "from-purple-50 via-cosmic-accent to-violet-900",
    continents: "rgba(243, 232, 255, 0.35)",
    cheekColor: "rgba(168, 85, 247, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "angel",
    stops: ["#faf5ff", "#d8b4fe", "#5b21b6"],
  },
  {
    levelRange: [17, 17],
    name: "Kuschelkomet-Planet",
    subName: "Ein kometenhafter Schweif aus bunten Pluesch-Kristallen tanzt am Horizont.",
    image: "/assets/planets/17_kuschelkomet_planet.webp",
    bgColor: "from-pink-50 via-pink-200 to-pink-800",
    continents: "rgba(253, 242, 248, 0.45)",
    cheekColor: "rgba(236, 72, 153, 0.5)",
    hasClouds: false,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "star",
    stops: ["#fdf2f8", "#fbcfe8", "#db2777"],
  },
  {
    levelRange: [18, 18],
    name: "Zuckerstern-Garten",
    subName: "Pastellene Pfade fuehren durch spielerisch gewachsene Zuckerbaum-Kapriolen.",
    image: "/assets/planets/18_zuckerstern_garten.webp",
    bgColor: "from-orange-50 via-orange-100 to-orange-600",
    continents: "rgba(255, 247, 237, 0.5)",
    cheekColor: "rgba(249, 115, 22, 0.5)",
    hasClouds: true,
    hasRings: false,
    hasFlowers: true,
    eyeStyle: "happy",
    stops: ["#ffedd5", "#fed7aa", "#ea580c"],
  },
  {
    levelRange: [19, 19],
    name: "Aurora-Flausch-Planet",
    subName: "Die magischsten Polarfarben huellen diesen ultra-weichen Kuschelkern ein.",
    image: "/assets/planets/19_aurora_flausch_planet.webp",
    bgColor: "from-cyan-50 via-indigo-50 to-[#ab47bc]",
    continents: "rgba(224, 242, 241, 0.45)",
    cheekColor: "rgba(186, 104, 200, 0.5)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "sparkle",
    stops: ["#e0f7fa", "#e8eaf6", "#ab47bc"],
  },
  {
    levelRange: [20, Infinity],
    name: "Herzgalaxie-Planet",
    subName: "Das pulsierende Liebes-Zentrum der gesamten Galaxie – ewiges Glueck ist vollendet.",
    image: "/assets/planets/20_herzgalaxie_planet.webp",
    bgColor: "from-rose-50 via-rose-200 to-rose-600 animate-pulse",
    continents: "rgba(255, 241, 242, 0.55)",
    cheekColor: "rgba(244, 63, 94, 0.65)",
    hasClouds: true,
    hasRings: true,
    hasFlowers: true,
    eyeStyle: "angel",
    stops: ["#fff1f2", "#fecdd3", "#f43f5e", "#be123c"],
  },
];

const getMoonSkinGraphic = (skin: string) => {
  switch (skin) {
    case "blood":
      return {
        element: <Moon className="size-4  fill-red-500 text-red-600 stroke-[1.2] animate-pulse" />,
        shadow: "0 0 7px rgba(239, 68, 68, 0.9)",
        pingBg: "bg-red-500/30",
      };
    case "cheese":
      return {
        element: <span className="text-sm select-none">🧀</span>,
        shadow: "0 0 6px rgba(251, 191, 36, 0.8)",
        pingBg: "bg-amber-300/30",
      };
    case "neon":
      return {
        element: (
          <Moon className="size-4  fill-cyan-400 text-cyan-300 stroke-[1.2] brightness-125" />
        ),
        shadow: "0 0 8px rgba(6, 182, 212, 0.9)",
        pingBg: "bg-cyan-400/30",
      };
    case "gold":
      return {
        element: (
          <Moon className="size-4  fill-amber-300 text-amber-500 stroke-[1.5] brightness-110" />
        ),
        shadow: "0 0 8px rgba(245, 158, 11, 0.9)",
        pingBg: "bg-amber-400/35",
      };
    case "crystal":
      return {
        element: <span className="text-sm select-none">💎</span>,
        shadow: "0 0 8px rgba(147, 197, 253, 0.9)",
        pingBg: "bg-sky-300/30",
      };
    case "cat":
      return {
        element: <span className="text-sm select-none">🐱</span>,
        shadow: "0 0 6px rgba(253, 186, 116, 0.8)",
        pingBg: "bg-orange-300/25",
      };
    case "lavender":
      return {
        element: <Moon className="size-4  fill-fuchsia-300 text-cosmic-accent stroke-[1.2]" />,
        shadow: "0 0 6px rgba(217, 70, 239, 0.8)",
        pingBg: "bg-purple-400/30",
      };
    case "cyber":
      return {
        element: (
          <span className="text-[11px] font-mono text-emerald-400 select-none animate-pulse">
            01
          </span>
        ),
        shadow: "0 0 7px rgba(34, 197, 94, 0.9)",
        pingBg: "bg-emerald-400/30",
      };
    case "prism":
      return {
        element: (
          <Moon className="size-4  fill-transparent text-cosmic-pink stroke-2 animate-rainbow-star" />
        ),
        shadow: "0 0 8px rgba(236, 72, 153, 0.8)",
        pingBg: "bg-pink-400/30",
      };
    case "cotton":
      return {
        element: <span className="text-sm select-none">🍬</span>,
        shadow: "0 0 6px rgba(244, 114, 182, 0.8)",
        pingBg: "bg-pink-300/30",
      };
    case "abyss":
      return {
        element: <span className="text-sm select-none">👁️</span>,
        shadow: "0 0 8px rgba(99, 102, 241, 0.9)",
        pingBg: "bg-indigo-500/30",
      };
    case "sakura":
      return {
        element: <span className="text-sm select-none">🌸</span>,
        shadow: "0 0 8px rgba(251, 113, 133, 0.9)",
        pingBg: "bg-rose-400/30",
      };
    case "galaxy":
      return {
        element: <span className="text-sm select-none">🌌</span>,
        shadow: "0 0 8px rgba(139, 92, 246, 0.9)",
        pingBg: "bg-violet-400/30",
      };
    case "cookie":
      return {
        element: <span className="text-sm select-none">🍪</span>,
        shadow: "0 0 5px rgba(180, 83, 9, 0.6)",
        pingBg: "bg-amber-700/20",
      };
    case "bubble":
      return {
        element: <span className="text-sm select-none">🫧</span>,
        shadow: "0 0 6px rgba(56, 189, 248, 0.8)",
        pingBg: "bg-sky-400/25",
      };
    case "clock":
      return {
        element: <span className="text-sm select-none">🕰️</span>,
        shadow: "0 0 6px rgba(217, 119, 6, 0.8)",
        pingBg: "bg-amber-500/25",
      };
    case "frost":
      return {
        element: <span className="text-sm select-none">❄️</span>,
        shadow: "0 0 8px rgba(186, 230, 253, 0.9)",
        pingBg: "bg-sky-200/30",
      };
    case "phoenix":
      return {
        element: <span className="text-sm select-none animate-pulse">🔥</span>,
        shadow: "0 0 8px rgba(239, 68, 68, 0.9)",
        pingBg: "bg-red-400/30",
      };
    case "ghost":
      return {
        element: <span className="text-sm select-none animate-bounce">👻</span>,
        shadow: "0 0 6px rgba(241, 245, 249, 0.8)",
        pingBg: "bg-slate-300/25",
      };
    case "butterfly":
      return {
        element: <span className="text-sm select-none animate-pulse">🦋</span>,
        shadow: "0 0 8px rgba(244, 114, 182, 0.9)",
        pingBg: "bg-pink-400/35",
      };
    case "classic":
    default:
      return {
        element: <Moon className="size-4  fill-purple-200 text-purple-300 stroke-[1.2]" />,
        shadow: "0 0 5px rgba(212, 195, 255, 0.8)",
        pingBg: "bg-purple-400/30",
      };
  }
};

export const Planet: React.FC<PlanetProps> = React.memo(
  ({
    level,
    planetExp,
    planetExpNeeded,
    planetTask,
    starsCount,
    starPowerMultiplier,
    onPlanetClick,
    isNight = true,
    activeStarColor = "default",
    activeAccessory = "none",
    isLowMemory = false,
    moonsCount = 0,
    activeMoonSkin = "default",
    activePlanetSkin = "default",
    activeZodiacId,
    onOpenZodiacModal,
  }) => {
    // Select theme based on level
    const theme = useMemo(() => {
      return (
        PLANET_THEMES.find((t) => level >= t.levelRange[0] && level <= t.levelRange[1]) ||
        PLANET_THEMES[PLANET_THEMES.length - 1]
      );
    }, [level]);

    const activePlanetImage = useMemo(() => {
      if (activePlanetSkin === "default") return theme.image;
      const skin = ROGUELITE_PLANET_SKINS.find((entry) => entry.id === activePlanetSkin);
      return skin?.previewImage ?? theme.image;
    }, [activePlanetSkin, theme.image]);

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

    return (
      <div className="relative flex flex-col items-center select-none py-6 px-4">
        {/* Visual background atmospheric glow */}
        <div className="absolute -inset-4 rounded-full bg-linear-to-tr from-pink-200/40 via-purple-200/30 to-teal-200/40 blur-3xl opacity-90 -z-10" />

        {/* Central Cosmic System Wrapper: perfectly binds everything to the exact same center anchor point */}
        <div className="relative size-44  sm:size-56  flex items-center justify-center">
          {/* Orbit Rings Container */}
          <div className="absolute left-1/2 top-1/2 -translate-1/2  pointer-events-none size-[660px]  flex items-center justify-center z-20">
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
                    className="absolute size-full  animate-spin"
                    style={{
                      animationDuration: `${val.duration}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                      animationDirection: val.reverse ? "reverse" : "normal",
                    }}
                  >
                    {/* Real physical orbiting star */}
                    <div
                      className="absolute left-1/2 -top-1.5 size-3  flex items-center justify-center -translate-x-1/2"
                      style={{
                        filter: `drop-shadow(0 0 2px ${starStyle.glow})`,
                      }}
                    >
                      <Star
                        className={`size-2.5  ${starStyle.fill} ${starStyle.border} stroke-[1.5] ${starStyle.extraClass || ""}`}
                      />
                      {/* Subtle emission pulse radiating from the star occasionally */}
                      <span
                        className={`absolute animate-ping inline-flex size-full  rounded-full ${starStyle.ping} opacity-20 pointer-events-none`}
                      />
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
                    className="absolute size-full  animate-spin"
                    style={{
                      animationDuration: `${val.duration}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                      animationDirection: val.reverse ? "reverse" : "normal",
                    }}
                  >
                    {/* Glowing physical orbiting moon */}
                    <div
                      className="absolute left-1/2 -top-2.5 size-5  flex items-center justify-center -translate-x-1/2 rotate-45"
                      style={{
                        filter: isLowMemory ? "" : `drop-shadow(${skinGraphic.shadow})`,
                      }}
                    >
                      {skinGraphic.element}
                      {/* Ping radiant aura */}
                      {!isLowMemory && (
                        <span
                          className={`absolute animate-ping inline-flex size-full  rounded-full ${skinGraphic.pingBg} opacity-25 pointer-events-none`}
                        />
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
            className="cursor-pointer relative z-10 size-full  rounded-full flex items-center justify-center filter drop-shadow-[0_8px_24px_rgba(244,143,177,0.3)] touch-manipulation"
          >
            {/* Level Up Flash / Glow Aura */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

            {/* Planet SVG representation */}
            <svg
              viewBox="0 0 200 200"
              className="size-full  select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id="planetClip">
                  <circle cx="100" cy="100" r="90" />
                </clipPath>
              </defs>

              <image
                href={activePlanetImage}
                x="10"
                y="10"
                width="180"
                height="180"
                clipPath="url(#planetClip)"
              />

              {/* Render Active Cosmetic Accessory */}
              <PlanetAccessory activeAccessory={activeAccessory} />
            </svg>
          </motion.div>
        </div>

        {/* Planet Info Display & Level-Bar */}
        <div
          className={`mt-6 flex flex-col items-center w-full max-w-md relative z-10 rounded-2.5xl p-6 border-3 transition-colors duration-500 shadow-md ${
            isNight
              ? "bg-cosmic-bg/95 border-cosmic-accent/60 text-cosmic-text"
              : "bg-amber-50/95 border-amber-300 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`font-sans text-xs font-black px-2.5 py-0.5 rounded-full border-2 transition-colors duration-500 ${
                isNight
                  ? "bg-cosmic-accent border-cosmic-bg text-cosmic-bg"
                  : "bg-amber-200 border-amber-500 text-amber-950"
              }`}
            >
              Lv. {level}
            </span>
            <h2
              className={`font-sans font-black uppercase text-sm sm:text-base tracking-wide ${
                isNight ? "text-cosmic-text" : "text-amber-950"
              }`}
            >
              {theme.name}
            </h2>
          </div>
          <p
            className={`font-sans text-[11px] text-center mt-2 leading-relaxed font-semibold transition-colors duration-500 ${
              isNight ? "text-cosmic-accent-muted" : "text-slate-600"
            }`}
          >
            {theme.subName}
          </p>

          {/* Planet level task container instead of legacy EXP bar */}
          <div className="w-full mt-3 flex flex-col">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1 transition-colors duration-500">
              <span
                className={`uppercase font-black text-xs tracking-wider flex items-center gap-1 ${
                  isNight ? "text-cosmic-pink" : "text-amber-805"
                }`}
              >
                🎯 LEVELAUFGABE
              </span>
              <span
                className={`font-black text-xs ${isNight ? "text-violet-200" : "text-amber-950"}`}
              >
                {planetTask ? `${planetTask.progress} / ${planetTask.target}` : "0 / 0"}
              </span>
            </div>

            <p
              className={`font-sans text-xs/relaxed font-semibold mb-2 mt-0.5 transition-colors  ${
                isNight ? "text-purple-200" : "text-slate-800"
              }`}
            >
              {planetTask ? planetTask.description : "Galaktische Aufgabe wird generiert..."}
            </p>

            <div
              className={`w-full h-4 border-2 rounded-full overflow-hidden p-px transition-colors duration-500 ${
                isNight
                  ? "border-cosmic-accent/45 bg-cosmic-bg-deep"
                  : "border-amber-305 bg-amber-50"
              }`}
            >
              <motion.div
                initial={{ width: 1 }}
                animate={{
                  width: `${planetTask ? Math.min(100, (planetTask.progress / planetTask.target) * 100) : 0}%`,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className={`h-full rounded-full border-r ${
                  isNight
                    ? "bg-linear-to-r from-cosmic-accent via-violet-400 to-cosmic-pink border-cosmic-bg"
                    : "bg-linear-to-r from-yellow-300 to-amber-500 border-amber-950"
                }`}
              />
            </div>
          </div>

          {(() => {
            const resolvedZodiacId = activeZodiacId || "katze";
            const zodiacObj = ZODIACS.find((z) => z.id === resolvedZodiacId);
            if (!zodiacObj) return null;
            return (
              <button
                onClick={onOpenZodiacModal}
                title="Klicke fuer Details"
                className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold border shadow-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer ${
                  isNight
                    ? // eslint-disable-next-line better-tailwindcss/no-restricted-classes
                      "bg-cosmic-surface-hover/85 hover:bg-[#322769] text-purple-200 border-purple-500/30 hover:border-purple-400/50"
                    : "bg-amber-50/90 hover:bg-amber-100/90 text-amber-900 border-amber-200 hover:border-amber-300"
                }`}
              >
                <span className="text-xs">{zodiacObj.emoji}</span>
                <span
                  className={
                    isNight ? "text-purple-300 font-semibold" : "text-amber-800 font-semibold"
                  }
                >
                  Sternzeichen {zodiacObj.name}:
                </span>
                <span
                  className={isNight ? "text-amber-200 font-black" : "text-amber-950 font-black"}
                >
                  {zodiacObj.bonusDesc}
                </span>
                <span
                  className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ml-1 animate-pulse ${
                    isNight ? "bg-purple-500/20 text-purple-300" : "bg-amber-100 text-orange-900"
                  }`}
                >
                  ℹ️ Info
                </span>
              </button>
            );
          })()}
        </div>
      </div>
    );
  },
);
Planet.displayName = "Planet";
