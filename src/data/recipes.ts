export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "materials" | "consumables";
  ingredients: {
    life?: number;
    stars?: number;
    moons?: number;
    glitter?: number;
    lootboxes?: number;
    items?: Record<string, number>;
  };
  result: {
    id: string; // Crafted item ID
    name: string;
    emoji: string;
    description: string;
    quantity: number;
  };
}

// Complete list of 52 recipes
export const CRAFTING_RECIPES: Recipe[] = [
  // ==================== MATERIALS (ROH- & ZWISCHENPRODUKTE) ====================
  {
    id: "rec_stardust_1",
    name: "Sternenstaub-Synthese A",
    emoji: "✨",
    category: "materials",
    description: "Kondensiere pure Lebensenergie zu schillerndem Sternenstaub.",
    ingredients: { life: 50000 },
    result: { id: "mat_stardust", name: "Sternenstaub", emoji: "✨", description: "Feiner, glitzernder kosmischer Staub. Grundzutat für fast alles.", quantity: 1 }
  },
  {
    id: "rec_stardust_2",
    name: "Sternenstaub-Synthese B",
    emoji: "✨",
    category: "materials",
    description: "Zersetze 5 Sterne direkt in ergiebigen Sternenstaub.",
    ingredients: { stars: 5 },
    result: { id: "mat_stardust", name: "Sternenstaub", emoji: "✨", description: "Feiner, glitzernder kosmischer Staub. Grundzutat für fast alles.", quantity: 4 }
  },
  {
    id: "rec_meteor_splitter",
    name: "Meteoriten-Zertrümmerung",
    emoji: "☄️",
    category: "materials",
    description: "Schmiede einen glühenden Meteoritensplitter aus Staub und Sternenenergie.",
    ingredients: { life: 100000, stars: 2, items: { "mat_stardust": 2 } },
    result: { id: "mat_meteor_splitter", name: "Meteoriten-Splitter", emoji: "☄️", description: "Ein heißer, glühender Metallsplitter mit magnetischen Eigenschaften.", quantity: 1 }
  },
  {
    id: "rec_aurora_particle",
    name: "Polarlicht-Extraktion",
    emoji: "🌌",
    category: "materials",
    description: "Fange die weich schwingenden Frequenzen des Polarlichts ein.",
    ingredients: { life: 250000, stars: 3, items: { "mat_stardust": 3 } },
    result: { id: "mat_aurora_particle", name: "Aurora-Partikel", emoji: "🌌", description: "Ein fluidisierter Lichtpartikel, der in grün-violetten Farben schimmert.", quantity: 1 }
  },
  {
    id: "rec_supernova_core",
    name: "Supernova-Kernschmelze",
    emoji: "💥",
    category: "materials",
    description: "Verdichte glühenden Sternenstaub und Lebensenergie zu einem instabilen Kern.",
    ingredients: { life: 1500000, stars: 8, items: { "mat_meteor_splitter": 2 } },
    result: { id: "mat_supernova_core", name: "Supernova-Kern", emoji: "💥", description: "Ein hochenergetischer, strahlender Kern mit immenser thermischer Energie.", quantity: 1 }
  },
  {
    id: "rec_nebula_gas",
    name: "Nebelgas-Kompression",
    emoji: "☁️",
    category: "materials",
    description: "Ernte das flüchtige Gas eines kosmischen Nebels unter Mondlicht.",
    ingredients: { life: 500000, moons: 1 },
    result: { id: "mat_nebula_gas", name: "Nebelgas", emoji: "☁️", description: "Dichtes kosmisches Nebelgas, das weich glüht und Energien speichert.", quantity: 2 }
  },
  {
    id: "rec_dark_matter",
    name: "Dunkle-Materie-Filterung",
    emoji: "🌑",
    category: "materials",
    description: "Extrahiere die verborgene dunkle Masse mithilfe eines Mond-Gravitationskeils.",
    ingredients: { life: 4000000, moons: 1, items: { "mat_stardust": 10 } },
    result: { id: "mat_dark_matter", name: "Dunkle Materie", emoji: "🌑", description: "Schwere, unsichtbare Substanz, die Licht krümmt.", quantity: 1 }
  },
  {
    id: "rec_quantum_graviton",
    name: "Graviton-Beschleunigung",
    emoji: "🚀",
    category: "materials",
    description: "Erschaffe ein hocheffizientes Graviton für experimentelle Krümmungen.",
    ingredients: { life: 20000000, moons: 1, stars: 10, items: { "mat_dark_matter": 1 } },
    result: { id: "mat_quantum_graviton", name: "Quanten-Graviton", emoji: "🚀", description: "Ein subatomares Teilchen, das die Gravitationskraft vermittelt.", quantity: 2 }
  },
  {
    id: "rec_astral_seed",
    name: "Astral-Saat-Zucht",
    emoji: "🌾",
    category: "materials",
    description: "Züchte aus Leben und Staub einen spirituellen planetaren Keimling.",
    ingredients: { life: 2500000, items: { "mat_stardust": 5 } },
    result: { id: "mat_astral_seed", name: "Astrale Saat", emoji: "🌾", description: "Ein glühender Samen, aus dem reichhaltiges Leben sprießen kann.", quantity: 1 }
  },
  {
    id: "rec_pure_essence",
    name: "Sternen-Essenz-Destillat",
    emoji: "🧪",
    category: "materials",
    description: "Konzentriere 15 Sterne und pure Energie zu reiner Alchemie-Essenz.",
    ingredients: { life: 200000, stars: 15 },
    result: { id: "mat_pure_essence", name: "Reine Sternenessenz", emoji: "🧪", description: "Kristallklare Flüssigkeit, die pure Astralkraft verströmt.", quantity: 1 }
  },
  {
    id: "rec_moon_crystal",
    name: "Mond-Kristallisation",
    emoji: "💎",
    category: "materials",
    description: "Verdichte die kühle Energie eines Trabanten zu einem harten Halbedelstein.",
    ingredients: { moons: 1, items: { "mat_stardust": 15 } },
    result: { id: "mat_moon_crystal", name: "Mond-Kristall", emoji: "💎", description: "Ein eiskalter, silbern schimmernder Kristall von extrem hoher Dichte.", quantity: 2 }
  },
  {
    id: "rec_cosmic_magnet",
    name: "Kosmischer Magnet-Schnitt",
    emoji: "🧲",
    category: "materials",
    description: "Verbinde Meteoritensplitter zu einem stark rotierenden Anziehungs-Werkzeug.",
    ingredients: { life: 300000, items: { "mat_meteor_splitter": 3 } },
    result: { id: "mat_cosmic_magnet", name: "Astral-Magnet", emoji: "🧲", description: "Zieht herabstürzende kosmische Gesteine mühelos an.", quantity: 1 }
  },
  {
    id: "rec_warp_sharder",
    name: "Warp-Scherben-Schleifung",
    emoji: "🔮",
    category: "materials",
    description: "Bündele Dunkle Materie zu einer optischen Linse für Dimensionssprünge.",
    ingredients: { items: { "mat_dark_matter": 2, "mat_moon_crystal": 1 } },
    result: { id: "mat_warp_shard", name: "Warp-Scherbe", emoji: "🔮", description: "Bricht das Raum-Zeit-Gefüge in winzigen Clustern.", quantity: 1 }
  },
  {
    id: "rec_solar_flare_fuel",
    name: "Solarer Brennstoff",
    emoji: "🔥",
    category: "materials",
    description: "Sammle hochenergetische Teilchen für explosive Reaktionen.",
    ingredients: { life: 800000, items: { "mat_supernova_core": 1, "mat_stardust": 5 } },
    result: { id: "mat_solar_fuel", name: "Solar-Brennstoff", emoji: "🔥", description: "Flüssiges Plasma, das extreme Hitze erzeugt.", quantity: 2 }
  },
  {
    id: "rec_plasma_rod",
    name: "Plasma-Kondensationsstab",
    emoji: "⚡",
    category: "materials",
    description: "Schmiede einen leitfähigen Stab für Energietransporte.",
    ingredients: { life: 1200000, stars: 5, items: { "mat_aurora_particle": 3 } },
    result: { id: "mat_plasma_rod", name: "Plasma-Leitstab", emoji: "⚡", description: "Ein Stab, der Milliarden Volt kosmisches Plasma bündeln kann.", quantity: 1 }
  },
  {
    id: "rec_comet_trail",
    name: "Kometenschweif-Mischung",
    emoji: "❄️",
    category: "materials",
    description: "Destilliere eisiges Gas mit Meteoritenstaub.",
    ingredients: { life: 600000, items: { "mat_nebula_gas": 2, "mat_meteor_splitter": 2 } },
    result: { id: "mat_comet_trail", name: "Kometenschweif-Asche", emoji: "❄️", description: "Feiner, tiefgekühlter Staub, der einen hellen Streifen hinterlässt.", quantity: 1 }
  },
  {
    id: "rec_slumber_crystal",
    name: "Schlummer-Matrix",
    emoji: "🏺",
    category: "materials",
    description: "Konserviere schwebenden Zeitstaub für passive Puffer.",
    ingredients: { life: 1000000, items: { "mat_stardust": 20, "mat_moon_crystal": 1 } },
    result: { id: "mat_slumber_crystal", name: "Traumglas-Scherbe", emoji: "🏺", description: "Ein gläsernes Relikt, das ein Gefühl von Tiefschlaf vermittelt.", quantity: 1 }
  },
  {
    id: "rec_nebula_dust_mix",
    name: "Nebel-Puder",
    emoji: "🫧",
    category: "materials",
    description: "Kombiniere Sternenstaub und weiches Nebelgas.",
    ingredients: { items: { "mat_stardust": 15, "mat_nebula_gas": 1 } },
    result: { id: "mat_nebula_dust", name: "Nebelstaub-Puder", emoji: "🫧", description: "Sehr leichtes, violett schäumendes Material.", quantity: 3 }
  },
  {
    id: "rec_gravitational_anchor",
    name: "Anker-Stabilisierung",
    emoji: "⚓",
    category: "materials",
    description: "Schwere Dunkle Materie stabilisiert mit Planeten-Gravitonen.",
    ingredients: { moons: 2, items: { "mat_quantum_graviton": 1, "mat_dark_matter": 2 } },
    result: { id: "mat_grav_anchor", name: "Schwere-Anker", emoji: "⚓", description: "Bietet unerschütterliche Standfestigkeit im Raum-Zeit-Fluss.", quantity: 1 }
  },
  {
    id: "rec_cosmic_glue",
    name: "Äther-Kleber",
    emoji: "🍯",
    category: "materials",
    description: "Zäher kosmischer Sirup, perfekt zum Binden von Splittern.",
    ingredients: { life: 150000, items: { "mat_stardust": 4 } },
    result: { id: "mat_cosmic_glue", name: "Äther-Kleber", emoji: "🍯", description: "Extrem klebrige Astralsubstanz zum Fixieren von Kernen.", quantity: 1 }
  },

  // ==================== CONSUMABLES / ACTIVATABLES (AKTIVIERBARES) ====================
  {
    id: "rec_silver_shooting_star",
    name: "Silberne Sternschnuppe",
    emoji: "☄️",
    category: "consumables",
    description: "Kombiniere Ressourcen zu einer kostbaren silbernen Sternschnuppe.",
    ingredients: { lootboxes: 1, items: { "mat_stardust": 10 } },
    result: { id: "use_silver_schnuppe", name: "Silberne Sternschnuppe", emoji: "☄️", description: "Aktivierung gibt dir +6 Lootboxen (Sternschnuppen) gratis!", quantity: 1 }
  },
  {
    id: "rec_deko_box",
    name: "Deko-Schatulle",
    emoji: "📦",
    category: "consumables",
    description: "Schmiede eine reichhaltige Truhe für exzellente kosmetische Überraschungen.",
    ingredients: { life: 100000, glitter: 5 },
    result: { id: "use_deko_box", name: "Deko-Schatulle", emoji: "📦", description: "Schaltet ein zufälliges kosmetisches Item frei (oder gibt +35 Glitzerstaub).", quantity: 1 }
  },
  {
    id: "rec_moon_blessing",
    name: "Kosmischer Mondsegen",
    emoji: "🌌",
    category: "consumables",
    description: "Erschaffe einen gigantischen Segen aus einem Mond und deiner Sternenpracht.",
    ingredients: { moons: 1, stars: 50 },
    result: { id: "use_moon_blessing", name: "Mondsegen", emoji: "🌌", description: "Aktivierung schenkt dir +120 Glitzerstaub, +25M Leben und +5 Sterne!", quantity: 1 }
  },
  {
    id: "rec_gold_shooting_star",
    name: "Goldene Sternschnuppe",
    emoji: "💫",
    category: "consumables",
    description: "Veredelung von 3 silbernen Schnuppen unter extremem Druck.",
    ingredients: { stars: 25, items: { "use_silver_schnuppe": 3 } },
    result: { id: "use_gold_schnuppe", name: "Goldene Sternschnuppe", emoji: "💫", description: "Aktivierung lässt +15 Lootboxen & +200 Glitzerstaub herabregnen!", quantity: 1 }
  },
  {
    id: "rec_trigger_supernova",
    name: "Supernova-Katalysator",
    emoji: "🔥",
    category: "consumables",
    description: "Entzünde die instabilen Kerne für ein künstliches Superevent.",
    ingredients: { items: { "mat_supernova_core": 3, "mat_stardust": 10 } },
    result: { id: "use_trig_supernova", name: "Supernova-Katastrophe (Event)", emoji: "🔥", description: "Löst sofort das kosmische Event 'Goldene Supernova' am Himmel aus!", quantity: 1 }
  },
  {
    id: "rec_trigger_aurora",
    name: "Polarlicht-Emitter",
    emoji: "🔮",
    category: "consumables",
    description: "Lade eine Plasma-Spule mit Aurora-Partikeln auf.",
    ingredients: { items: { "mat_aurora_particle": 3, "mat_stardust": 10 } },
    result: { id: "use_trig_aurora", name: "Polarlicht-Vaporisator (Event)", emoji: "🔮", description: "Löst sofort das kosmische Event 'Aurora Borealis' am Himmel aus!", quantity: 1 }
  },
  {
    id: "rec_trigger_meteor",
    name: "Kometen-Fokus-Linse",
    emoji: "☄️",
    category: "consumables",
    description: "Fokussiere die Anziehungskraft auf herabfliegende Meteoroid-Gürtel.",
    ingredients: { items: { "mat_meteor_splitter": 3, "mat_stardust": 10 } },
    result: { id: "use_trig_meteor", name: "Meteoriten-Fokus-Linse (Event)", emoji: "☄️", description: "Löst sofort das kosmische Event 'Meteoritenschauer' am Himmel aus!", quantity: 1 }
  },
  {
    id: "rec_trigger_stars",
    name: "Sternenregen-Zünder",
    emoji: "💫",
    category: "consumables",
    description: "Führe reine Sternen-Essenzen zusammen, um den Himmel tanzen zu lassen.",
    ingredients: { items: { "mat_pure_essence": 3, "mat_stardust": 10 } },
    result: { id: "use_trig_stars", name: "Sternenregen-Zünder (Event)", emoji: "💫", description: "Löst sofort ein 'Mondnacht-Sternschnuppen' Event am Himmel aus!", quantity: 1 }
  },
  {
    id: "rec_trigger_blackhole",
    name: "Singulärer Impuls-Injektor",
    emoji: "🕳️",
    category: "consumables",
    description: "Verzere die Metrik der Raumzeit mit Quanten-Gravitonen und Dunkler Materie.",
    ingredients: { items: { "mat_quantum_graviton": 2, "mat_dark_matter": 2 } },
    result: { id: "use_trig_blackhole", name: "Schwarzes Loch Generator (Event)", emoji: "🕳️", description: "Beschwört sofort das riskante 'Schwarze Loch' zum Gamblen!", quantity: 1 }
  },
  {
    id: "rec_magical_prism",
    name: "Magisches Prisma (Glitzerumwandlung)",
    emoji: "💎",
    category: "consumables",
    description: "Schmelze wertvollen Staub zu wunderschönen Lootboxen zusammen.",
    ingredients: { glitter: 15 },
    result: { id: "use_prisma_boxes", name: "Magisches Prisma", emoji: "💎", description: "Aktivierung zerbricht das Prisma in +3 Lootboxen (Sternschnuppen)!", quantity: 1 }
  },
  {
    id: "rec_prestige_amulet",
    name: "Prestige-Phönix-Amulett",
    emoji: "👑",
    category: "consumables",
    description: "Transzendiere die Zeitlinien ohne deine aktuellen Ressourcen zurückzusetzen.",
    ingredients: { items: { "mat_dark_matter": 10, "mat_moon_crystal": 3 } },
    result: { id: "use_prestige_amulet", name: "Prestige-Phönix-Amulett", emoji: "👑", description: "Aktivierung gewährt dir sofort +1 Prestige ohne Ressourcenverlust!", quantity: 1 }
  },
  {
    id: "rec_giga_life_ potion",
    name: "Giga-Zell-Lebensessenz",
    emoji: "🧪",
    category: "consumables",
    description: "Lasse saftiges Leben aus planetaren Saaten explodieren.",
    ingredients: { stars: 100, items: { "mat_astral_seed": 5 } },
    result: { id: "use_giga_life", name: "Giga-Zell-Lebensessenz", emoji: "🧪", description: "Aktivierung schenkt dir sagenhafte +150.000.000 Leben!", quantity: 1 }
  },
  {
    id: "rec_peachy_blessing",
    name: "Ätherischer Kirschblüten-Segen",
    emoji: "🌸",
    category: "consumables",
    description: "Ein Segen, der das Herz deines Planeten erwärmt.",
    ingredients: { life: 100000, items: { "mat_stardust": 50 } },
    result: { id: "use_peach_bless", name: "Kirschblüten-Segen", emoji: "🌸", description: "Aktivierung gewährt dir +5.000.000 Leben und +15 Sterne gratis!", quantity: 1 }
  },
  {
    id: "rec_animal_cookies",
    name: "Kosmisches Premium-Tierfutter",
    emoji: "🍪",
    category: "consumables",
    description: "Ein proteinreicher Snack aus Astralen Saaten und glühendem Gas.",
    ingredients: { items: { "mat_astral_seed": 2, "mat_nebula_gas": 5 } },
    result: { id: "use_animal_cookies", name: "Premium-Tierfutter", emoji: "🍪", description: "Spawnt sofort +1 Tier von JEDEM deiner freigeschalteten Haustiere!", quantity: 1 }
  },
  {
    id: "rec_nebula_coffer",
    name: "Nebel-Schatulle",
    emoji: "☁️",
    category: "consumables",
    description: "Ein schwebender Behälter aus dichtem kondensiertem Nebelgas.",
    ingredients: { stars: 10, items: { "mat_nebula_gas": 2 } },
    result: { id: "use_nebula_coffer", name: "Nebel-Schatulle", emoji: "☁️", description: "Schenkt dir +2 Lootboxen und +120.000 Leben.", quantity: 1 }
  },
  {
    id: "rec_star_shard_crate",
    name: "Sonnensplitter-Kiste",
    emoji: "☀️",
    category: "consumables",
    description: "Wuchtige Gesteinsbox gefüllt mit kosmischen Zündkristallen.",
    ingredients: { items: { "mat_meteor_splitter": 5, "mat_aurora_particle": 2 } },
    result: { id: "use_star_shards", name: "Sonnensplitter-Kiste", emoji: "☀️", description: "Sprengt die Kiste und ruft sofort +12 Sterne gratis herbei!", quantity: 1 }
  },
  {
    id: "rec_sparkle_ fountain",
    name: "Ewiger Glitzer-Brunnen",
    emoji: "⛲",
    category: "consumables",
    description: "Schöpfe flüssigen Glitzerstaub aus Supernova-Energiewellen.",
    ingredients: { items: { "mat_supernova_core": 1, "mat_moon_crystal": 5 } },
    result: { id: "use_glitter_fountain", name: "Glitzer-Quell", emoji: "⛲", description: "Füllt dein Glitzerstaub-Konto sofort um +85 Glitzerstaub ✨ auf!", quantity: 1 }
  },
  {
    id: "rec_planet_xp_capsule",
    name: "Planetare EP-Kapsel",
    emoji: "💊",
    category: "consumables",
    description: "Pures Entwicklungskonzentrat für deinen Himmelskörper.",
    ingredients: { life: 500000, items: { "mat_pure_essence": 3 } },
    result: { id: "use_xp_capsule", name: "Planetare EP-Kapsel", emoji: "💊", description: "Verleiht deinem Planeten sofort +15.000 feste EP!", quantity: 1 }
  },
  {
    id: "rec_solar_flare_chest",
    name: "Solar-Eruptions-Box",
    emoji: "📦",
    category: "consumables",
    description: "Vulkanisches Gestein geformt aus heißen Supernova-Kernen.",
    ingredients: { stars: 20, items: { "mat_supernova_core": 5 } },
    result: { id: "use_solar_flare_box", name: "Solar-Eruptions-Box", emoji: "📦", description: "Gewährt dir +30.000.000 Leben und +4 Lootboxen!", quantity: 1 }
  },
  {
    id: "rec_gravity_shifter_item",
    name: "Schwerkraft-Umleiter",
    emoji: "🌀",
    category: "consumables",
    description: "Lenkt Gravitationsfelder um, um lose Satelliten einzufangen.",
    ingredients: { life: 500000, items: { "mat_quantum_graviton": 2 } },
    result: { id: "use_grav_shifter", name: "Schwerkraft-Umleiter", emoji: "🌀", description: "Generiert sofort +30 kreisende Sterne am Himmel!", quantity: 1 }
  },
  {
    id: "rec_time_booster",
    name: "Tempus-Segen (Zeitsprung)",
    emoji: "⏳",
    category: "consumables",
    description: "Krümme Zeitlinien positiv zusammen, um die nächte Ernte einzuleiten.",
    ingredients: { items: { "mat_quantum_graviton": 1, "mat_nebula_gas": 5 } },
    result: { id: "use_time_booster", name: "Tempus-Segen", emoji: "⏳", description: "Schüttet sofort den Ertrag von 2 Stunden Offline-Ruhe aus (LPS x 7200)!", quantity: 1 }
  },
  {
    id: "rec_super_luck_amulet",
    name: "Smaragd-Glücks-Amulett",
    emoji: "🧿",
    category: "consumables",
    description: "Astraler Abwehrkristall gegen kosmische Pechsträhnen.",
    ingredients: { glitter: 30, items: { "mat_moon_crystal": 2 } },
    result: { id: "use_luck_amulet", name: "Smaragd-Amulett", emoji: "🧿", description: "Schaltet ein zufälliges Episches oder Legendäres Kosmetikteil frei!", quantity: 1 }
  },
  {
    id: "rec_starlight_elixir",
    name: "Sternenlicht-Elixier",
    emoji: "🍹",
    category: "consumables",
    description: "Ein süßes Gebräu, das deine Handgelenke stärkt.",
    ingredients: { life: 50000, items: { "mat_comet_trail": 1, "mat_stardust": 10 } },
    result: { id: "use_starlight_elixir", name: "Sternenlicht-Elixier", emoji: "🍹", description: "Gewährt dir sofort +1.000.000 Leben und +5 Sterne!", quantity: 1 }
  },
  {
    id: "rec_moon_dust_bag",
    name: "Mondstaub-Säckchen",
    emoji: "💰",
    category: "consumables",
    description: "Eine kleine Tasche gefüllt mit staubigen Resten der Umlaufbahnen.",
    ingredients: { life: 80000, items: { "mat_nebula_dust": 2 } },
    result: { id: "use_moon_dust_bag", name: "Mondstaub-Säckchen", emoji: "💰", description: "Öffnen bringt dir +30.000 Leben und +15 Glitzerstaub!", quantity: 1 }
  },
  {
    id: "rec_deep_core_drill",
    name: "Kern-Katalysator",
    emoji: "🌋",
    category: "consumables",
    description: "Ein Gesteinsbohrer, der flüssige vulkanische Mineralien spaltet.",
    ingredients: { items: { "mat_grav_anchor": 1, "mat_solar_fuel": 2 } },
    result: { id: "use_core_drill", name: "Kern-Katalysator", emoji: "🌋", description: "Schenkt dir +50.000.000 Leben und +3 Lootboxen!", quantity: 1 }
  },
  {
    id: "rec_glitter_bomb",
    name: "Kosmische Glitzerbombe",
    emoji: "💣",
    category: "consumables",
    description: "Schlagartige Zerstreuung von geballter Plasma-Energie.",
    ingredients: { life: 1500000, items: { "mat_plasma_rod": 2, "mat_comet_trail": 1 } },
    result: { id: "use_glitter_bomb", name: "Glitzerbombe", emoji: "💣", description: "Explodiert und verleiht dir +50 Glitzerstaub ✨!", quantity: 1 }
  },
  {
    id: "rec_phoenix_feather",
    name: "Phönixfeder-Schatulle",
    emoji: "🪶",
    category: "consumables",
    description: "Eine flammende Kiste aus reinem Solar-Brennstoff.",
    ingredients: { stars: 10, items: { "mat_solar_fuel": 3 } },
    result: { id: "use_phoenix_feather", name: "Phönixfeder-Kiste", emoji: "🪶", description: "Gibt dir +10.000.000 Leben und +25 Glitzerstaub!", quantity: 1 }
  },
  {
    id: "rec_cosmic_compass",
    name: "Kosmischer Äther-Kompass",
    emoji: "🧭",
    category: "consumables",
    description: "Richtungsweiser im endlosen Hyperraum-Gefüge.",
    ingredients: { life: 1000000, items: { "mat_warp_shard": 1, "mat_nebula_dust": 2 } },
    result: { id: "use_cosmic_compass", name: "Äther-Kompass", emoji: "🧭", description: "Ortet verborgene Beute: +8 Lootboxen (Sternschnuppen)!", quantity: 1 }
  },
  {
    id: "rec_gravity_well_drink",
    name: "Gravitations-Tee",
    emoji: "🍵",
    category: "consumables",
    description: "Tee angerührt mit frischem Nebelgas und schweren Ankern.",
    ingredients: { moons: 1, items: { "mat_grav_anchor": 1, "mat_nebula_dust": 3 } },
    result: { id: "use_gravity_tea", name: "Gravitations-Tee", emoji: "🍵", description: "Verleiht dir +15 Sterne und +15.000.000 Leben!", quantity: 1 }
  },
  {
    id: "rec_wormhole_drive",
    name: "Ersatz-Wurmlochantrieb",
    emoji: "⚙️",
    category: "consumables",
    description: "Riesige technische Spule betrieben mit Warp-Scherben.",
    ingredients: { stars: 40, items: { "mat_warp_shard": 3, "mat_plasma_rod": 1 } },
    result: { id: "use_wormhole_drive", name: "Wurmloch-Treiber", emoji: "⚙️", description: "Ruft eine Anomalie hervor: Gibt +12 Lootboxen und +50 Glitzerstaub!", quantity: 1 }
  },
  {
    id: "rec_nebula_honey",
    name: "Nebel-Waben-Sirup",
    emoji: "🍯",
    category: "consumables",
    description: "Sehr lecker und hochgradig energetisierend für alle Klick-Aktivitäten.",
    ingredients: { life: 200000, items: { "mat_cosmic_glue": 2, "mat_stardust": 15 } },
    result: { id: "use_nebula_honey", name: "Nebel-Waben-Sirup", emoji: "🍯", description: "Schenkt dir +2.500.000 Leben und +10 Sterne!", quantity: 1 }
  },
  {
    id: "rec_chrono_pendant",
    name: "Chronos-Zeittranszender",
    emoji: "⏱️",
    category: "consumables",
    description: "Präzises Zahnradwerk gefüllt mit Warp-Energie.",
    ingredients: { stars: 30, items: { "mat_warp_shard": 1, "mat_slumber_crystal": 2 } },
    result: { id: "use_chrono_pendant", name: "Chronos-Transzender", emoji: "⏱️", description: "Führt einen kleinen Zeitsprung aus: Erhalte +5 Stunden LPS-Ertrag direkt!", quantity: 1 }
  }
];
