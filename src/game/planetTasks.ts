import { Animal } from "../types";

export interface PlanetTask {
  id: string;
  name: string;
  description: string;
  type: string;
  progress: number;
  target: number;
  targetAnimalId?: string;
  isCumulative?: boolean; // If true, can be calculated instantly from current state
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: (target: number, animalName?: string, animalEmoji?: string) => string;
  type: string;
  minLevel: number;
  targetFormula: (level: number, prestige: number) => number;
  targetAnimalId?: string;
  isCumulative?: boolean;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // --- 1. Total Animals ---
  {
    id: "animals_count_tot",
    name: "Kuscheloase",
    description: (t) => `Erreiche insgesamt ${t} Tiere auf deinem Planeten.`,
    type: "animals_count",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.floor((30 + lv * 20 + lv * lv * 1.5) * (1 + pr * 0.5)),
    isCumulative: true,
  },
  // --- 2. Clicks (Planet Clicking) ---
  {
    id: "clicks_planet",
    name: "Sternenbeben",
    description: (t) => `Klicke ${t}-mal auf den Planeten, um ihn zu stimulieren.`,
    type: "clicks",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.floor((40 + lv * 40 + lv * lv * lv * 0.1) * (1 + pr * 0.5)),
  },
  {
    id: "clicks_planet_rhythm",
    name: "Herzens-Impuls",
    description: (t) => `Führe ${t} rhythmische Klicks auf den Planeten aus.`,
    type: "clicks",
    minLevel: 3,
    targetFormula: (lv, pr) => Math.floor((60 + lv * 50 + lv * lv * 3) * (1 + pr * 0.4)),
  },
  // --- 3. No Click (Idle) ---
  {
    id: "no_click_duration",
    name: "Stille Meditation",
    description: (t) => `Lass den Planeten ${t} Sekunden lang in Ruhe Leben generieren, ohne zu klicken.`,
    type: "no_click_produce",
    minLevel: 1,
    targetFormula: (lv) => Math.min(180, Math.floor(30 + lv * 6)),
  },
  {
    id: "no_click_zen",
    name: "Fließendes Kosmos-Zen",
    description: (t) => `Halte eine Meditationsphase von ${t} Sekunden ein (nicht klicken!).`,
    type: "no_click_produce",
    minLevel: 8,
    targetFormula: (lv) => Math.min(240, Math.floor(45 + lv * 8)),
  },
  // --- 4. Missions Claimed ---
  {
    id: "missions_completed_base",
    name: "Missionsbereitschaft",
    description: (t) => `Schließe ${t} galaktische Missionen über das Funkterminal ab.`,
    type: "missions_completed",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.max(1, Math.floor((1 + lv * 0.7) * (1 + pr * 0.3))),
  },
  {
    id: "missions_completed_master",
    name: "Pioniersarbeit",
    description: (t) => `Erfülle ${t} Funk-Missionsaufträge.`,
    type: "missions_completed",
    minLevel: 10,
    targetFormula: (lv, pr) => Math.floor((3 + lv * 1.1) * (1 + pr * 0.3)),
  },
  // --- 5. Events Won ---
  {
    id: "events_won_explorer",
    name: "Phänomen-Erforscher",
    description: (t) => `Untersuche oder löse ${t} zufällige Weltraum-Events erfolgreich.`,
    type: "events_won",
    minLevel: 2,
    targetFormula: (lv, pr) => Math.max(1, Math.floor((1 + lv * 0.4) * (1 + pr * 0.2))),
  },
  {
    id: "events_won_guardian",
    name: "Kosmischer Wächter",
    description: (t) => `Stelle dich ${t} planetaren Ereignissen (z. B. Metoriten, Auroras).`,
    type: "events_won",
    minLevel: 11,
    targetFormula: (lv, pr) => Math.max(2, Math.floor((2 + lv * 0.6) * (1 + pr * 0.2))),
  },
  // --- 6. Star Clicks ---
  {
    id: "collect_stars_catcher",
    name: "Sternenfänger",
    description: (t) => `Sammle ${t} herabfallende Sterne per Hand auf.`,
    type: "collect_stars",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.floor((5 + lv * 4 + lv * lv * 0.2) * (1 + pr * 0.4)),
  },
  {
    id: "collect_stars_shower",
    name: "Meteoritenschauer",
    description: (t) => `Nutze Sternschnuppen, um ${t} Sterne aufzusammeln.`,
    type: "collect_stars",
    minLevel: 9,
    targetFormula: (lv, pr) => Math.floor((15 + lv * 7 + lv * lv * 0.3) * (1 + pr * 0.4)),
  },
  // --- 7. Alchemy & Crafting ---
  {
    id: "crafting_apprentice",
    name: "Alchemie-Lehrling",
    description: (t) => `Schmiede insgesamt ${t} Gegenstände in der Synthese-Schmiede.`,
    type: "crafting",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.max(1, Math.floor((1 + lv * 0.6) * (1 + pr * 0.3))),
  },
  {
    id: "crafting_blacksmith",
    name: "Kreatorkorona",
    description: (t) => `Kombiniere Ressourcen, um ${t} veredelte Items herzustellen.`,
    type: "crafting",
    minLevel: 10,
    targetFormula: (lv, pr) => Math.floor((3 + lv * 1.2) * (1 + pr * 0.3)),
  },
  // --- 8. Glitter Dust & Moons ---
  {
    id: "glitter_dust_collector",
    name: "Glitzer-Sammler",
    description: (t) => `Sammle ${t} Einheiten magischen Glitzerstaub auf dem Festgelände oder durch Sternzeichen.`,
    type: "glitter_dust",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.floor((10 + lv * 8 + lv * lv * 0.5) * (1 + pr * 0.5)),
  },
  {
    id: "merge_moons_astronomist",
    name: "Satelliten-Verschmelzung",
    description: (t) => `Verschmelze ${t}-mal kleine Monde zu größeren Monden.`,
    type: "merge_moons",
    minLevel: 1,
    targetFormula: (lv, pr) => Math.max(1, Math.floor((1 + lv * 0.5) * (1 + pr * 0.2))),
  },

  // --- 9. Specific Animal Targets (the remaining 35 tasks to reach exactly 50 target tasks!) ---
  {
    id: "spec_bunny",
    name: "Langohr-Treffen",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf dem Planeten.`,
    type: "buy_animal",
    minLevel: 1,
    targetFormula: (lv) => Math.floor(10 + lv * 8),
    targetAnimalId: "bunny",
    isCumulative: true,
  },
  {
    id: "spec_chick",
    name: "Futterzeit",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf dem Planeten.`,
    type: "buy_animal",
    minLevel: 1,
    targetFormula: (lv) => Math.floor(8 + lv * 7),
    targetAnimalId: "chick",
    isCumulative: true,
  },
  {
    id: "spec_cat",
    name: "Schnurrkonzert",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} für kosmische Beruhigung.`,
    type: "buy_animal",
    minLevel: 2,
    targetFormula: (lv) => Math.floor(6 + lv * 6),
    targetAnimalId: "cat",
    isCumulative: true,
  },
  {
    id: "spec_frog",
    name: "Froschkonzert",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e}, um Teiche zu besiedeln.`,
    type: "buy_animal",
    minLevel: 3,
    targetFormula: (lv) => Math.floor(5 + lv * 5),
    targetAnimalId: "frog",
    isCumulative: true,
  },
  {
    id: "spec_koala",
    name: "Eukalyptus-Ernte",
    description: (t, n, e) => `Sorge für ${t}x ${n} ${e}, die genüsslich Blätter knabbern.`,
    type: "buy_animal",
    minLevel: 4,
    targetFormula: (lv) => Math.floor(5 + lv * 4),
    targetAnimalId: "koala",
    isCumulative: true,
  },
  {
    id: "spec_panda",
    name: "Bambushain",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} durch die Sternenwiesen rollen.`,
    type: "buy_animal",
    minLevel: 5,
    targetFormula: (lv) => Math.floor(4 + lv * 3.5),
    targetAnimalId: "panda",
    isCumulative: true,
  },
  {
    id: "spec_unicorn",
    name: "Regenbogen-Glanzen",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} ihre magischen Regenbögen spannen.`,
    type: "buy_animal",
    minLevel: 6,
    targetFormula: (lv) => Math.floor(3 + lv * 3),
    targetAnimalId: "unicorn",
    isCumulative: true,
  },
  {
    id: "spec_hamster",
    name: "Körner-Hamstern",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} im Laufrad.`,
    type: "buy_animal",
    minLevel: 7,
    targetFormula: (lv) => Math.floor(3 + lv * 2.5),
    targetAnimalId: "hamster",
    isCumulative: true,
  },
  {
    id: "spec_fox",
    name: "Schlauer Fuchspfad",
    description: (t, n, e) => `Locke ${t}x ${n} ${e} aus ihren Bauen auf den Planeten.`,
    type: "buy_animal",
    minLevel: 8,
    targetFormula: (lv) => Math.floor(3 + lv * 2.2),
    targetAnimalId: "fox",
    isCumulative: true,
  },
  {
    id: "spec_bear",
    name: "Bärenstark",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} für einen Winterschlaf.`,
    type: "buy_animal",
    minLevel: 9,
    targetFormula: (lv) => Math.floor(2 + lv * 1.8),
    targetAnimalId: "bear",
    isCumulative: true,
  },
  {
    id: "spec_alpaca",
    name: "Flauschparade",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} für die Wollgewinnung.`,
    type: "buy_animal",
    minLevel: 10,
    targetFormula: (lv) => Math.floor(2 + lv * 1.5),
    targetAnimalId: "alpaca",
    isCumulative: true,
  },
  {
    id: "spec_penguin",
    name: "Eisscholle",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} auf dem eisigen Pol des Planeten siedeln.`,
    type: "buy_animal",
    minLevel: 11,
    targetFormula: (lv) => Math.floor(2 + lv * 1.2),
    targetAnimalId: "penguin",
    isCumulative: true,
  },
  {
    id: "spec_sloth",
    name: "Gemütlichkeit",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} in den Sternenästen.`,
    type: "buy_animal",
    minLevel: 12,
    targetFormula: (lv) => Math.floor(1 + lv * 1.1),
    targetAnimalId: "sloth",
    isCumulative: true,
  },
  {
    id: "spec_hedgehog",
    name: "Glitzerstachel",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf deinen Moosflächen.`,
    type: "buy_animal",
    minLevel: 13,
    targetFormula: (lv) => Math.floor(1 + lv * 1.0),
    targetAnimalId: "hedgehog",
    isCumulative: true,
  },
  {
    id: "spec_seal",
    name: "Robben-Klatschen",
    description: (t, n, e) => `Sorge für mindestens ${t}x ${n} ${e} an deinen Küsten.`,
    type: "buy_animal",
    minLevel: 14,
    targetFormula: (lv) => Math.floor(1 + lv * 0.9),
    targetAnimalId: "seal",
    isCumulative: true,
  },
  {
    id: "spec_sheep",
    name: "Wolkenschaf",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf den Flauschweiden.`,
    type: "buy_animal",
    minLevel: 15,
    targetFormula: (lv) => Math.floor(1 + lv * 0.8),
    targetAnimalId: "sheep",
    isCumulative: true,
  },
  {
    id: "spec_otter",
    name: "Otter-Kuscheln",
    description: (t, n, e) => `Führe ${t}x ${n} ${e} auf deinem Planeten ein.`,
    type: "buy_animal",
    minLevel: 16,
    targetFormula: (lv) => Math.floor(1 + lv * 0.7),
    targetAnimalId: "otter",
    isCumulative: true,
  },
  {
    id: "spec_deer",
    name: "Hirschpfad",
    description: (t, n, e) => `Bringe ${t}x ${n} ${e} in die waldigen Lichtungen.`,
    type: "buy_animal",
    minLevel: 17,
    targetFormula: (lv) => Math.floor(1 + lv * 0.6),
    targetAnimalId: "deer",
    isCumulative: true,
  },
  {
    id: "spec_dino",
    name: "Urzeit-Rückkehr",
    description: (t, n, e) => `Züchte mindestens ${t}x ${n} ${e} auf dem Planeten.`,
    type: "buy_animal",
    minLevel: 18,
    targetFormula: (lv) => Math.floor(1 + lv * 0.5),
    targetAnimalId: "dino",
    isCumulative: true,
  },
  {
    id: "spec_duck",
    name: "Quak-Konzert",
    description: (t, n, e) => `Sorge für ein munteres Treiben mit ${t}x ${n} ${e}.`,
    type: "buy_animal",
    minLevel: 19,
    targetFormula: (lv) => Math.floor(1 + lv * 0.4),
    targetAnimalId: "duck",
    isCumulative: true,
  },
  {
    id: "spec_ladybug",
    name: "Glückskäfer",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf Blättern.`,
    type: "buy_animal",
    minLevel: 3,
    targetFormula: (lv) => Math.floor(3 + lv * 4),
    targetAnimalId: "ladybug",
    isCumulative: true,
  },
  {
    id: "spec_bee",
    name: "Honig-Schatztruhe",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} für süßen Planetenhonig.`,
    type: "buy_animal",
    minLevel: 4,
    targetFormula: (lv) => Math.floor(3 + lv * 3.5),
    targetAnimalId: "bee",
    isCumulative: true,
  },
  {
    id: "spec_pig",
    name: "Glückliches Quieken",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} fröhlich im Matsch spielen.`,
    type: "buy_animal",
    minLevel: 5,
    targetFormula: (lv) => Math.floor(2 + lv * 3),
    targetAnimalId: "pig",
    isCumulative: true,
  },
  {
    id: "spec_puppy",
    name: "Tollpatschig",
    description: (t, n, e) => `Bringe ${t}x ${n} ${e} zum Spielen auf den Planeten.`,
    type: "buy_animal",
    minLevel: 6,
    targetFormula: (lv) => Math.floor(2 + lv * 2.8),
    targetAnimalId: "puppy",
    isCumulative: true,
  },
  {
    id: "spec_squirrel",
    name: "Nussvorrat",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} in den Wipfeln.`,
    type: "buy_animal",
    minLevel: 7,
    targetFormula: (lv) => Math.floor(2 + lv * 2.5),
    targetAnimalId: "squirrel",
    isCumulative: true,
  },
  {
    id: "spec_mouse",
    name: "Kornkammer",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf Wiesenflächen.`,
    type: "buy_animal",
    minLevel: 8,
    targetFormula: (lv) => Math.floor(2 + lv * 2.2),
    targetAnimalId: "mouse",
    isCumulative: true,
  },
  {
    id: "spec_turtle",
    name: "Gemächliches Reisen",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} den Planeten in Ruhe erkunden.`,
    type: "buy_animal",
    minLevel: 9,
    targetFormula: (lv) => Math.floor(2 + lv * 2),
    targetAnimalId: "turtle",
    isCumulative: true,
  },
  {
    id: "spec_owl",
    name: "Nachtwache",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} über deinen Planeten wachen.`,
    type: "buy_animal",
    minLevel: 10,
    targetFormula: (lv) => Math.floor(1 + lv * 1.8),
    targetAnimalId: "owl",
    isCumulative: true,
  },
  {
    id: "spec_dolphin",
    name: "Wellenwellen",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} durch kosmische Gewässer springen.`,
    type: "buy_animal",
    minLevel: 11,
    targetFormula: (lv) => Math.floor(1 + lv * 1.5),
    targetAnimalId: "dolphin",
    isCumulative: true,
  },
  {
    id: "spec_whale",
    name: "Tiefseelieder",
    description: (t, n, e) => `Sorge für mindestens ${t}x ${n} ${e} im Ozean des Planeten.`,
    type: "buy_animal",
    minLevel: 12,
    targetFormula: (lv) => Math.floor(1 + lv * 1.3),
    targetAnimalId: "whale",
    isCumulative: true,
  },
  {
    id: "spec_butterfly",
    name: "Farbenprächtig",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} in der Luft.`,
    type: "buy_animal",
    minLevel: 13,
    targetFormula: (lv) => Math.floor(1 + lv * 1.2),
    targetAnimalId: "butterfly",
    isCumulative: true,
  },
  {
    id: "spec_elephant",
    name: "Sanfte Riesen",
    description: (t, n, e) => `Besitze mindestens ${t}x ${n} ${e} auf der weiten Savanne.`,
    type: "buy_animal",
    minLevel: 14,
    targetFormula: (lv) => Math.floor(1 + lv * 1.1),
    targetAnimalId: "elephant",
    isCumulative: true,
  },
  {
    id: "spec_tiger",
    name: "Dschungelkönig",
    description: (t, n, e) => `Sorge für ${t}x ${n} ${e} in den verborgenen Büschen.`,
    type: "buy_animal",
    minLevel: 15,
    targetFormula: (lv) => Math.floor(1 + lv * 1.0),
    targetAnimalId: "tiger",
    isCumulative: true,
  },
  {
    id: "spec_lion",
    name: "Sonnensympathy",
    description: (t, n, e) => `Lass ${t}x ${n} ${e} in der warmen Planetenkrone thronen.`,
    type: "buy_animal",
    minLevel: 16,
    targetFormula: (lv) => Math.floor(1 + lv * 0.9),
    targetAnimalId: "lion",
    isCumulative: true,
  },
  {
    id: "spec_monkey",
    name: "Hangelspiel",
    description: (t, n, e) => `Locke ${t}x ${n} ${e} in die fruchtigen Baumwipfel des Planeten.`,
    type: "buy_animal",
    minLevel: 17,
    targetFormula: (lv) => Math.floor(1 + lv * 0.8),
    targetAnimalId: "monkey",
    isCumulative: true,
  }
];

export function rollTaskForLevel(
  level: number,
  prestige: number,
  currentAnimalsList: Animal[]
): PlanetTask {
  // Filter templates eligible for the current level
  const eligible = TASK_TEMPLATES.filter((t) => level >= t.minLevel);
  if (eligible.length === 0) {
    // Fallback if none found, though animals_count_tot is minLevel: 1
    const fallbackTemplate = TASK_TEMPLATES[0];
    const target = Math.max(1, Math.round(fallbackTemplate.targetFormula(level, prestige)));
    return {
      id: fallbackTemplate.id,
      name: fallbackTemplate.name,
      description: fallbackTemplate.description(target),
      type: fallbackTemplate.type,
      progress: 0,
      target,
    };
  }

  // Draw a completely random one
  const template = eligible[Math.floor(Math.random() * eligible.length)];
  const target = Math.max(1, Math.round(template.targetFormula(level, prestige)));

  let animalName = "";
  let animalEmoji = "";
  if (template.targetAnimalId) {
    const animal = currentAnimalsList.find((a) => a.id === template.targetAnimalId);
    if (animal) {
      animalName = animal.germanName;
      animalEmoji = animal.emoji;
    } else {
      animalName = template.targetAnimalId;
      animalEmoji = "🐾";
    }
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description(target, animalName, animalEmoji),
    type: template.type,
    progress: 0,
    target,
    targetAnimalId: template.targetAnimalId,
    isCumulative: template.isCumulative,
  };
}
