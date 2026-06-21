import { getLpsAndStats } from "./statsCalculator";
import { formatCompactNumber } from "../utils/format";

// ROMAN NUMERAL LIST for Achievements
export const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
];

// Re-exported so existing importers (game.worker.ts, workerActions.ts) keep working.
export { formatCompactNumber };

/**
 * Recreation of state-independent achievements generation. Recalculates in Worker thread
 */
export function generateAchievements(state: any) {
  const stats = getLpsAndStats(state);
  const totalLifeEarned = state.totalLifeEarned || 0;
  const clicksCount = state.clicksCount || 0;
  const starsCount = state.starsCount || 0;
  const starClicksTriggered = state.starClicksTriggered || 0;
  const planetLevel = state.planetLevel || 1;
  const totalAnimalsCount = stats.totalAnimalsCount || 0;
  const researchedUpgradesCount = stats.researchedUpgradesCount || 0;
  const secondsPlayed = state.secondsPlayed || 0;

  const families = [
    {
      category: "life",
      emoji: "💖",
      titlePrefix: "Lebensmeister",
      desc: (target: number) => `Sammle insgesamt ${formatCompactNumber(target)} Leben`,
      currentValue: totalLifeEarned,
      targets: [
        100, 500, 2500, 10000, 50000, 250000, 1000000, 5000000, 25000000, 100000000, 500000000,
        2500000000, 10000000000, 50000000000, 100000000000,
      ],
    },
    {
      category: "clicks",
      emoji: "⚡",
      titlePrefix: "Kosmischer Klicker",
      desc: (target: number) =>
        `Klicke insgesamt ${target.toLocaleString()} Mal manuell auf den Planeten`,
      currentValue: clicksCount,
      targets: [
        5, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000, 50000, 100000, 250000, 500000,
      ],
    },
    {
      category: "stars",
      emoji: "⭐",
      titlePrefix: "Sternenrufer",
      desc: (target: number) => `Besitze insgesamt ${target} fliegende Sterne`,
      currentValue: starsCount,
      targets: [1, 2, 3, 4, 5, 8, 12, 16, 20, 25, 30, 35, 40, 45, 50],
    },
    {
      category: "star_clicks",
      emoji: "✧",
      titlePrefix: "Sternenstaub-Sammler",
      desc: (target: number) =>
        `Sterne brüten und klicken ${target.toLocaleString()} Mal automatisch`,
      currentValue: starClicksTriggered,
      targets: [
        10, 50, 200, 1000, 5000, 20000, 100000, 500000, 2000000, 10000000, 50000000, 200000000,
        1000000000, 5000000000, 10000000000,
      ],
    },
    {
      category: "planet_level",
      emoji: "🪐",
      titlePrefix: "Welten-Evolutionär",
      desc: (target: number) => `Entwickle deinen niedlichen Planeten bis auf Stufe ${target}`,
      currentValue: planetLevel,
      targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 20],
    },
    {
      category: "animals",
      emoji: "🐾",
      titlePrefix: "Tierfreund",
      desc: (target: number) => `Besitze insgesamt ${target} niedliche Tiere`,
      currentValue: totalAnimalsCount,
      targets: [1, 5, 10, 20, 35, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400],
    },
    {
      category: "upgrades",
      emoji: "🔬",
      titlePrefix: "Forschungs-Doktor",
      desc: (target: number) => `Erforsche insgesamt ${target} Technologien`,
      currentValue: researchedUpgradesCount,
      targets: [1, 2, 3, 4, 5, 7, 10, 12, 15, 18, 20, 22, 24, 26, 28],
    },
    {
      category: "time",
      emoji: "⏳",
      titlePrefix: "Zeit-Reisender",
      desc: (target: number) =>
        `Spielzeit insgesamt im gemütlichen Kosmos: ${target >= 3600 ? Math.floor(target / 3600) + " Std." : Math.floor(target / 60) + " Min."}`,
      currentValue: secondsPlayed,
      targets: [
        10, 30, 60, 120, 300, 600, 1200, 2400, 3600, 7200, 14400, 28800, 57600, 86400, 172800,
      ],
    },
  ];

  const list: any[] = [];
  families.forEach((fam) => {
    fam.targets.forEach((target, idx) => {
      const roman = ROMAN_NUMERALS[idx] || (idx + 1).toString();
      const value = fam.currentValue;
      list.push({
        id: `ach-${fam.category}-${target}`,
        title: `${fam.titlePrefix} ${roman}`,
        description: fam.desc(target),
        category: fam.category,
        progress: Math.min(value, target),
        target: target,
        isUnlocked: value >= target,
        emoji: fam.emoji,
      });
    });
  });

  return list;
}
