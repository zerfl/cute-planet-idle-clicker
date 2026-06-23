export interface ZodiacSpec {
  id: string;
  name: string; // German name (e.g., "Katze")
  emoji: string; // e.g., "🐱"
  description: string; // German description
  bonusDesc: string; // Short bonus description
  bonusType:
    | "click_crit"
    | "animals_boost"
    | "offline_boost"
    | "events_boost"
    | "missions_boost"
    | "stars_boost"
    | "click_flat"
    | "glitter_boost"
    | "cosmetic_discount"
    | "all_passive_boost";
}

export const ZODIACS: ZodiacSpec[] = [
  {
    id: "katze",
    name: "Katze",
    emoji: "🐱",
    description: "Kritische Klicks besser: 20% Chance auf 7x Kraft (Standard: 5% Chance auf 3x).",
    bonusDesc: "20% Crit-Chance & 7x Crit-Kraft",
    bonusType: "click_crit",
  },
  {
    id: "biene",
    name: "Biene",
    emoji: "🐝",
    description: "Tiere produzieren mehr: Jedes Tier generiert passiv +35% mehr Energie.",
    bonusDesc: "+35% Tier-Produktion",
    bonusType: "animals_boost",
  },
  {
    id: "mond",
    name: "Mond",
    emoji: "🌙",
    description:
      "Mond-Sturm: Erhöht deine maximale Anzahl an Monden um +1 und verstärkt den Produktionsbonus um +50% absoluten Multiplikator pro Mond.",
    bonusDesc: "+1 Mondlimit & +225% Mondmultiplikator",
    bonusType: "all_passive_boost",
  },
  {
    id: "drache",
    name: "Drache",
    emoji: "🐉",
    description:
      "Events stärker: Alle kosmischen Event-Boni (Meteor, Aurora, Supernova) sind um +40% stärker.",
    bonusDesc: "+40% stärkere Events",
    bonusType: "events_boost",
  },
  {
    id: "frosch",
    name: "Frosch",
    emoji: "🐸",
    description: "Missionen schneller: Verringert Mission-Cooldowns und Zeiten um 35%.",
    bonusDesc: "-35% Missionstimer & Cooldowns",
    bonusType: "missions_boost",
  },
  {
    id: "fuchs",
    name: "Fuchs",
    emoji: "🦊",
    description: "Durchtriebener Clicker: Erhöht deine manuelle Click-Kraft dauerhaft um +40%.",
    bonusDesc: "+40% Klick-Kraft",
    bonusType: "click_flat",
  },
  {
    id: "eule",
    name: "Eule",
    emoji: "🦉",
    description:
      "Nächtliche Weisheit: Erhöht die Energie-Produktion deiner Sterne um +30% mehr LPS.",
    bonusDesc: "+30% Sternen-Produktion",
    bonusType: "stars_boost",
  },
  {
    id: "schildkroete",
    name: "Schildkröte",
    emoji: "🐢",
    description: "Bedächtiges Wachstum: Erhöht dein passives Gesamteinkommen (LPS) um +20%.",
    bonusDesc: "+20% Gesamt-LPS",
    bonusType: "all_passive_boost",
  },
  {
    id: "einhorn",
    name: "Einhorn",
    emoji: "🦄",
    description: "Kosmischer Glanz: Schaltet alle Kosmetik-Upgrades mit einem 20% Rabatt frei.",
    bonusDesc: "-20% Kosmetik-Preise",
    bonusType: "cosmetic_discount",
  },
  {
    id: "phoenix",
    name: "Phönix",
    emoji: "🐦‍🔥",
    description: "Heilige Asche: Erhalte +35% mehr Glitzerstaub aus allen Quellen.",
    bonusDesc: "+35% Glitzerstaub-Ausbeute",
    bonusType: "glitter_boost",
  },
];

export function getZodiac(id?: string): ZodiacSpec {
  if (!id) return ZODIACS[0];
  return ZODIACS.find((z) => z.id === id) || ZODIACS[0];
}
