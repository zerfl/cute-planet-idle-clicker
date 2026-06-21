export interface Mission {
  id: string;
  title: string;
  germanTitle: string;
  description: string;
  germanDescription: string;
  type: "clicks" | "animals" | "stars" | "seconds";
  target: number;
  rewardShootingStars: number;
  completed: boolean;
  claimed: boolean;
}

export function generateMissionsForSet(setNumber: number): Mission[] {
  // A simple deterministic pseudo-random generator based on setNumber
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const getRandInRange = (s: number, min: number, max: number) => {
    return Math.floor(seededRandom(s) * (max - min + 1)) + min;
  };

  // Generate 3 unique mission templates using seeded random seeds based on set number
  const seedBase = setNumber * 73 + 19;

  const templates = [
    {
      title: "Kuschel-Klicks",
      description: "Zeige dem Planeten deine Liebe! Klicke den Planeten insgesamt {target}-mal.",
      englishDesc: "Give your planet love by clicking it {target} times in total!",
      type: "clicks",
      minBase: 120,
      maxBase: 320,
      scale: 130, // multiplied by setNumber
    },
    {
      title: "Sternen-Sammelwut",
      description:
        "Sammle funkelndes Orbitallicht! Lasse mindestens {target} Sterne am Himmel kreisen.",
      englishDesc: "Attract cosmic light! Have at least {target} active stars orbiting.",
      type: "stars",
      minBase: 3,
      maxBase: 6,
      scale: 2.2,
    },
    {
      title: "Geborgenes Tierreich",
      description: "Züchte glückliche Gefährten! Besitze insgesamt mindestens {target} Tiere.",
      englishDesc: "Hatch wonderful friends! Own at least {target} animals combined.",
      type: "animals",
      minBase: 3,
      maxBase: 6,
      scale: 2.0,
    },
    {
      title: "Sternenlicht-Erwachen",
      description: "Rufe das Licht heran! Bring mindestens {target} Sterne in deinen Orbit.",
      englishDesc: "Call upon the starlight! Gain at least {target} active stars in your orbit.",
      type: "stars",
      minBase: 4,
      maxBase: 7,
      scale: 2.5,
    },
    {
      title: "Aufstrebende Menagerie",
      description: "Ein Zuhause für alle Kreaturen! Beherberge insgesamt {target} süße Tiere.",
      englishDesc: "A shelter for all creatures! Host at least {target} adorable animals.",
      type: "animals",
      minBase: 4,
      maxBase: 7,
      scale: 2.1,
    },
    {
      title: "Klick-Gewitter",
      description: "Klicke im Rhythmus des Kosmos! Meistere {target} leidenschaftliche Klicks.",
      englishDesc:
        "Click to the rhythm of the cosmos! Achieve at least {target} passionate clicks.",
      type: "clicks",
      minBase: 220,
      maxBase: 420,
      scale: 145,
    },
  ];

  // Pick exactly 3 unique templates
  const chosenIndices: number[] = [];
  let rollSeed = seedBase;
  while (chosenIndices.length < 3) {
    const idx = Math.floor(seededRandom(rollSeed) * templates.length);
    if (!chosenIndices.includes(idx)) {
      chosenIndices.push(idx);
    }
    rollSeed += 1.7;
  }

  return chosenIndices.map((templateIdx, order) => {
    const template = templates[templateIdx];
    const itemSeed = rollSeed + (order + 1) * 37;

    // Calculate randomized scaled target
    const baseVal = getRandInRange(itemSeed, template.minBase, template.maxBase);
    const scaleFactor = getRandInRange(
      itemSeed + 5,
      Math.max(1, Math.floor(template.scale * 0.75)),
      Math.ceil(template.scale * 1.25),
    );
    let target = baseVal + Math.floor(setNumber * scaleFactor);

    // Make click counts clean
    if (template.type === "clicks") {
      target = Math.floor(target / 10) * 10;
    } else {
      target = Math.max(1, target);
    }

    // Scaling star rewards based on level category
    const reward = 1 + Math.floor(setNumber / 3);

    const descGerman = template.description.replace("{target}", target.toString());
    const descEnglish = template.englishDesc.replace("{target}", target.toString());

    return {
      id: `m_${template.type}_s${setNumber}_o${order}_t${target}`,
      title: template.title,
      germanTitle: template.title,
      description: descEnglish,
      germanDescription: descGerman,
      type: template.type as "clicks" | "animals" | "stars",
      target: target,
      rewardShootingStars: reward,
      completed: false,
      claimed: false,
    };
  });
}
