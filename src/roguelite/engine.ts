import {
  ROGUELITE_BOSSES,
  ROGUELITE_BOSS_MUTATIONS,
  ROGUELITE_BOON_PREVIEWS,
  ROGUELITE_BOONS,
  ROGUELITE_EVENT_POOL,
  ROGUELITE_NODE_LABELS,
  ROGUELITE_PLANET_SKINS,
  ROGUELITE_RELICS,
  ROGUELITE_RUN_ARCHETYPES,
  ROGUELITE_RUN_MODIFIERS,
} from "./data";
import type {
  ActiveRogueliteRun,
  RogueliteBoss,
  RogueliteBossStage,
  RogueliteBoon,
  RogueliteChoice,
  RogueliteChoicePreview,
  RogueliteEncounter,
  RogueliteFinalizeResult,
  RogueliteMetaState,
  RogueliteNode,
  RogueliteNodeType,
  RoguelitePathChoice,
  RoguelitePlanetSkin,
  RogueliteRelic,
  RogueliteRewardPackage,
  RogueliteRunArchetype,
  RogueliteRunModifier,
  RogueliteRunRewardState,
  RogueliteRunStats,
} from "./types";

export const ROGUELITE_STATIONS_PER_ACT = 10;
export const ROGUELITE_TOTAL_ACTS = 3;
export const ROGUELITE_TOTAL_STATIONS = ROGUELITE_STATIONS_PER_ACT * ROGUELITE_TOTAL_ACTS;
export const ROGUELITE_ACT_BOSS_STATIONS = [10, 20] as const;

export function getActForStation(station: number): 1 | 2 | 3 {
  if (station <= ROGUELITE_STATIONS_PER_ACT) return 1;
  if (station <= ROGUELITE_STATIONS_PER_ACT * 2) return 2;
  return 3;
}

export function hasRenderableRoguelitePrimaryState(run: ActiveRogueliteRun | null): boolean {
  if (!run) return false;
  if (run.phase === "victory_rewards") return Boolean(run.rewardPackage);
  if (run.phase === "defeat") return true;
  if (run.phase === "path") return run.pathChoices.length > 0;
  return Boolean(run.currentEncounter);
}

function getBossStageForStation(station: number): RogueliteBossStage {
  if (station >= ROGUELITE_TOTAL_STATIONS) return "final";
  if (station >= ROGUELITE_ACT_BOSS_STATIONS[1]) return "act_2";
  return "act_1";
}

const ARCHETYPE_NODE_BIAS: Record<string, RogueliteNodeType[]> = {
  anomaly_weaver: ["anomaly", "echo", "meteor"],
  elite_hunter: ["elite", "combat", "boss_omen"],
  merchant_orbit: ["merchant", "relic_vault", "rest"],
  event_bloom: ["boon", "anomaly", "rest"],
  bulwark_spiral: ["rest", "merchant", "boss_omen"],
  glass_comet: ["combat", "elite", "sacrifice"],
};

const MODIFIER_NODE_BIAS: Record<string, RogueliteNodeType[]> = {
  glitter_surge: ["merchant", "meteor"],
  omen_lens: ["boss_omen", "combat"],
  soft_shell: ["rest", "boon"],
  cruel_blossom: ["elite", "sacrifice"],
};

function generateSeed(seedOverride?: number): number {
  if (typeof seedOverride === "number" && Number.isFinite(seedOverride)) {
    return seedOverride >>> 0;
  }
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const seedBuffer = new Uint32Array(1);
    cryptoObj.getRandomValues(seedBuffer);
    return seedBuffer[0] ?? Date.now() >>> 0;
  }
  return Date.now() >>> 0;
}

function preview(
  gains: string[],
  costs: string[] = [],
  risks: string[] = [],
  synergyHint?: string,
  rewardPreview?: string,
): RogueliteChoicePreview {
  return { gains, costs, risks, synergyHint, rewardPreview };
}

function chooseSeededArchetype(seed: number): RogueliteRunArchetype {
  return (
    ROGUELITE_RUN_ARCHETYPES[seed % ROGUELITE_RUN_ARCHETYPES.length] ?? ROGUELITE_RUN_ARCHETYPES[0]
  );
}

function chooseSeededModifiers(seed: number): RogueliteRunModifier[] {
  const first = ROGUELITE_RUN_MODIFIERS[(seed >>> 3) % ROGUELITE_RUN_MODIFIERS.length];
  const second = ROGUELITE_RUN_MODIFIERS[(seed >>> 7) % ROGUELITE_RUN_MODIFIERS.length];
  return uniqueById([first, second].filter(Boolean) as RogueliteRunModifier[]);
}

function applyRunIdentityStartBonuses(
  stats: RogueliteRunStats,
  runArchetype: RogueliteRunArchetype,
  runModifiers: RogueliteRunModifier[],
): RogueliteRunStats {
  const next = { ...stats };
  switch (runArchetype.id) {
    case "anomaly_weaver":
      next.eventChance += 0.08;
      next.crystalDust += 4;
      break;
    case "elite_hunter":
      next.runClicks += 3;
      next.bossDamage += 4;
      break;
    case "merchant_orbit":
      next.crystalDust += 10;
      next.researchDiscount += 0.1;
      break;
    case "event_bloom":
      next.eventChance += 0.12;
      next.healCharges += 1;
      break;
    case "bulwark_spiral":
      next.runShield += 18;
      next.maxLife += 8;
      next.runLife += 8;
      break;
    case "glass_comet":
      next.runClicks += 8;
      next.runShield = Math.max(0, next.runShield - 8);
      break;
    default:
      break;
  }

  for (const modifier of runModifiers) {
    switch (modifier.id) {
      case "glitter_surge":
        next.crystalDust += 6;
        break;
      case "omen_lens":
        next.bossDamage += 6;
        break;
      case "soft_shell":
        next.runShield += 12;
        break;
      case "cruel_blossom":
        next.runLife = Math.max(1, next.runLife - 6);
        next.runClicks += 4;
        break;
      default:
        break;
    }
  }

  return next;
}

function estimateNodeValue(node: RogueliteNode): {
  rewardPreview: string;
  riskPreview: string;
  routeHint: string;
} {
  switch (node.type) {
    case "elite":
      return {
        rewardPreview: "Mehr Splitter, mehr Dust, bessere Endtruhe",
        riskPreview: "Harter Lebensverlust moeglich",
        routeHint: "Gut fuer aggressive Reward-Runs",
      };
    case "merchant":
      return {
        rewardPreview: "Gezielte Stats oder Truhenwert",
        riskPreview: "Braucht genug Kristallstaub",
        routeHint: "Stark, wenn dein Run schon Dust produziert",
      };
    case "relic_vault":
      return {
        rewardPreview: "Starker Endtruhe-Boost",
        riskPreview: "Fast keine Sofortkraft",
        routeHint: "Wertvoll, wenn du den Run sicher tragen kannst",
      };
    case "sacrifice":
      return {
        rewardPreview: "Extrem hoher Reward-Peak",
        riskPreview: "Echter Lebens- oder Schildpreis",
        routeHint: "Nur anpacken, wenn dein Run Puffer hat",
      };
    case "anomaly":
      return {
        rewardPreview: "Hybride Mischboni und Dust",
        riskPreview: "Mehr Druck und Swing",
        routeHint: "Flexibler Pivot fuer schiefe Builds",
      };
    case "rest":
      return {
        rewardPreview: "Heilung, Shield, Cleanup",
        riskPreview: "Weniger roher Reward",
        routeHint: "Ideal vor Elite oder Boss-Vorzeichen",
      };
    case "boss_omen":
      return {
        rewardPreview: "Bosswissen oder Bossburst",
        riskPreview: "Mehr Druck, wenn du greedest",
        routeHint: "Perfekt vor dem spaeten Finale",
      };
    case "meteor":
      return {
        rewardPreview: "Viel Dust und Bossschaden",
        riskPreview: "Rueckstoss und Kometendruck",
        routeHint: "Kurzfristiger Spike fuer schnelle Runs",
      };
    case "echo":
      return {
        rewardPreview: "Repariert oder verstaerkt deinen Build",
        riskPreview: "Weniger direkt als Kampfknoten",
        routeHint: "Stark, wenn der letzte Pick schon gut war",
      };
    case "boon":
      return {
        rewardPreview: "Drei klare Build-Picks",
        riskPreview: "Niedriges Risiko",
        routeHint: "Sicherer Formgeber fuer fast jeden Run",
      };
    default:
      return {
        rewardPreview: "Solider Wert",
        riskPreview: "Mittleres Risiko",
        routeHint: "Ausgewogene Route",
      };
  }
}

function maybeAddModifierReward(run: ActiveRogueliteRun, baseDust: number, baseDamage: number) {
  let rewardDust = baseDust;
  let rewardBossDamage = baseDamage;
  let extraPressure = 0;
  if (run.runModifiers.some((modifier) => modifier.id === "glitter_surge")) rewardDust += 4;
  if (run.runModifiers.some((modifier) => modifier.id === "omen_lens")) rewardBossDamage += 3;
  if (
    run.runModifiers.some((modifier) => modifier.id === "soft_shell") &&
    run.completedStations >= 5
  )
    extraPressure += 4;
  if (run.runModifiers.some((modifier) => modifier.id === "cruel_blossom")) {
    rewardDust += 3;
    rewardBossDamage += 2;
    extraPressure += 2;
  }
  return { rewardDust, rewardBossDamage, extraPressure };
}

function nextRng(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function rollFloat(run: ActiveRogueliteRun): [ActiveRogueliteRun, number] {
  const rngState = nextRng(run.rngState);
  return [{ ...run, rngState }, rngState / 0xffffffff];
}

function rollInt(run: ActiveRogueliteRun, max: number): [ActiveRogueliteRun, number] {
  const [nextRun, val] = rollFloat(run);
  return [nextRun, Math.floor(val * max)];
}

function randomId(prefix: string, seed: number): string {
  return `${prefix}_${seed.toString(36)}`;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function getRelic(id: string): RogueliteRelic {
  return ROGUELITE_RELICS.find((relic) => relic.id === id) ?? ROGUELITE_RELICS[0];
}

function getSkin(id: string): RoguelitePlanetSkin {
  return ROGUELITE_PLANET_SKINS.find((skin) => skin.id === id) ?? ROGUELITE_PLANET_SKINS[0];
}

function getBoss(id: string): RogueliteBoss {
  return ROGUELITE_BOSSES.find((boss) => boss.id === id) ?? ROGUELITE_BOSSES[0];
}

function dangerForStation(station: number, type: RogueliteNodeType) {
  if (type === "elite") return station >= 24 ? "extreme" : station >= 12 ? "high" : "medium";
  if (type === "boss_omen") return "high";
  if (type === "combat" || type === "meteor")
    return station >= 22 ? "high" : station >= 10 ? "medium" : "low";
  if (type === "sacrifice" || type === "anomaly")
    return station >= 20 ? "high" : station >= 8 ? "medium" : "low";
  return station >= 18 ? "medium" : "low";
}

function actForStation(station: number): 1 | 2 | 3 {
  return getActForStation(station);
}

function weightedNodePool(station: number, meta: RogueliteMetaState, run: ActiveRogueliteRun) {
  const hasNebelglas = run.activeRelicIds.includes("nebelglas");
  const pool: RogueliteNodeType[] = [
    "boon",
    "combat",
    "combat",
    "anomaly",
    hasNebelglas ? "anomaly" : "merchant",
    "rest",
    "meteor",
    "echo",
    "sacrifice",
    "boss_omen",
  ];
  if (station >= 4) pool.push("elite");
  if (station >= 5) pool.push("merchant");
  if (station >= 7) pool.push("relic_vault");
  if (meta.wins > 0 && station >= 10) pool.push("elite");
  if (station >= 12) pool.push("elite", "anomaly");
  if (station >= 18) pool.push("meteor", "boss_omen");
  if (station >= 24) pool.push("sacrifice", "relic_vault");
  pool.push(...(ARCHETYPE_NODE_BIAS[run.runArchetype.id] ?? []));
  run.runModifiers.forEach((modifier) => pool.push(...(MODIFIER_NODE_BIAS[modifier.id] ?? [])));
  return pool;
}

function makeNode(
  run: ActiveRogueliteRun,
  station: number,
  type?: RogueliteNodeType,
): [ActiveRogueliteRun, RogueliteNode] {
  let nextRun = run;
  let chosenType = type;
  if (!chosenType) {
    const pool = weightedNodePool(station, createRogueliteMetaState(), run);
    let chosenIndex = 0;
    [nextRun, chosenIndex] = rollInt(nextRun, pool.length);
    chosenType = pool[chosenIndex]!;
  }

  const meta = ROGUELITE_NODE_LABELS[chosenType];
  const node: RogueliteNode = {
    id: randomId(chosenType, nextRun.rngState + station),
    station,
    act: actForStation(station),
    type: chosenType,
    danger: dangerForStation(station, chosenType),
    label: meta.label,
    description: meta.description,
  };
  return [nextRun, node];
}

function applyRelicStartBonuses(stats: RogueliteRunStats, relicIds: string[]): RogueliteRunStats {
  const next = { ...stats };
  if (relicIds.includes("kometenherz")) next.runShield += 30;
  if (relicIds.includes("funkelzahn")) {
    next.runCritChance += 0.06;
    next.runCritPower += 0.45;
  }
  if (relicIds.includes("mondfaden")) next.healCharges += 1;
  if (relicIds.includes("sternennaht")) next.rerolls += 1;
  return next;
}

function createBaseStats(meta: RogueliteMetaState): RogueliteRunStats {
  return {
    runLife: 120,
    maxLife: 120,
    runShield: 18,
    runClicks: 16,
    runPassive: 9,
    runCritChance: 0.08,
    runCritPower: 1.75,
    eventChance: 0.2,
    researchDiscount: 0,
    bossDamage: 0,
    healCharges: 1,
    rerolls: meta.bonusRerolls,
    purges: 0,
    cometPressure: 0,
    crystalDust: 12,
  };
}

function createRewardState(): RogueliteRunRewardState {
  return {
    bonusShards: 0,
    bonusSkinRolls: 0,
    guaranteedRareRelic: false,
    guaranteedSkin: false,
    trostRewardPending: false,
    eliteClears: 0,
    flawlessEligible: true,
    cursesTaken: 0,
    rewardMultiplier: 1,
  };
}

function createBossState(
  run: ActiveRogueliteRun,
): [ActiveRogueliteRun, ActiveRogueliteRun["boss"]] {
  let nextRun = run;
  let bossIndex = 0;
  [nextRun, bossIndex] = rollInt(nextRun, ROGUELITE_BOSSES.length);
  const boss = ROGUELITE_BOSSES[bossIndex] ?? ROGUELITE_BOSSES[0];
  const mutationIds: string[] = [];
  while (mutationIds.length < 2) {
    let idx = 0;
    [nextRun, idx] = rollInt(nextRun, ROGUELITE_BOSS_MUTATIONS.length);
    const mutation = ROGUELITE_BOSS_MUTATIONS[idx];
    if (mutation && !mutationIds.includes(mutation.id)) mutationIds.push(mutation.id);
  }
  return [
    nextRun,
    {
      bossId: boss.id,
      mutationIds,
      telegraphRevealed: run.activeRelicIds.includes("pfotenkompass"),
      stage: "final",
    },
  ];
}

function getBoonPreview(boon: RogueliteBoon): RogueliteChoicePreview {
  return (
    ROGUELITE_BOON_PREVIEWS[boon.id] ??
    preview([], [], [], "Formt deinen Run subtil weiter.", "Mittelfristiger Build-Wert")
  );
}

function makeBoonChoices(run: ActiveRogueliteRun): [ActiveRogueliteRun, RogueliteChoice[]] {
  const usedCategories = new Set<string>();
  const choices: RogueliteChoice[] = [];
  let nextRun = run;
  let attempts = 0;
  while (choices.length < 3 && attempts < 40) {
    attempts++;
    let idx = 0;
    [nextRun, idx] = rollInt(nextRun, ROGUELITE_BOONS.length);
    const boon = ROGUELITE_BOONS[idx];
    if (!boon) continue;
    if (usedCategories.has(boon.category) && choices.length < 2) continue;
    if (run.boons.some((owned) => owned.id === boon.id)) continue;
    usedCategories.add(boon.category);
    choices.push({
      id: boon.id,
      title: boon.title,
      description: boon.description,
      kind: "boon",
      effectLabel: `${boon.category} • ${boon.rarity}`,
      preview: getBoonPreview(boon),
      boonId: boon.id,
    });
  }

  if (choices.length < 3) {
    const fallback = uniqueById(ROGUELITE_BOONS).slice(0, 3 - choices.length);
    fallback.forEach((boon) =>
      choices.push({
        id: boon.id,
        title: boon.title,
        description: boon.description,
        kind: "boon",
        effectLabel: `${boon.category} • ${boon.rarity}`,
        preview: getBoonPreview(boon),
        boonId: boon.id,
      }),
    );
  }

  return [nextRun, choices];
}

function makeEncounterChoicesForNode(
  run: ActiveRogueliteRun,
  node: RogueliteNode,
): [ActiveRogueliteRun, RogueliteChoice[]] {
  switch (node.type) {
    case "boon":
      return makeBoonChoices(run);
    case "rest":
      return [
        run,
        [
          {
            id: "rest_heal",
            title: "Sternenbad",
            description:
              "Heile dich spuerbar hoch und druecke den Kometendruck herunter. Das ist der sichere Reset-Pick.",
            kind: "rest",
            preview: preview(
              ["+18 Leben", "-6 Kometendruck"],
              [],
              [],
              "Am besten, wenn du vor Elite oder Boss-Vorzeichen weich geworden bist.",
              "Erhoeht die Chance, spaetere Rewards noch zu erreichen.",
            ),
          },
          {
            id: "rest_shield",
            title: "Barrieren flechten",
            description:
              "Verwandelt den Rastplatz in eine defensive Investment-Station mit etwas Dust obendrauf.",
            kind: "rest",
            preview: preview(
              ["+24 Schild", "+8 Kristallstaub"],
              [],
              [],
              "Stark fuer Shield-Skalierung und sichere Hard-Path-Followups.",
              "Macht riskante Folgepfade stabiler.",
            ),
          },
          {
            id: "rest_purge",
            title: "Flimmer reinigen",
            description:
              "Hol dir Utility statt roher Werte: Purge, oder falls schon sauber, eine Heilcharge.",
            kind: "rest",
            preview: preview(
              ["+1 Purge oder +1 Heilcharge"],
              [],
              [],
              "Besser in laengeren Runs mit viel Druck oder Event-Volatilitaet.",
              "Hilft spaet gegen Collapse statt frueh gegen Schaden.",
            ),
          },
        ],
      ];
    case "merchant":
      return [
        run,
        [
          {
            id: "merchant_click",
            title: "Klick-Kapsel",
            description:
              "Ein sauberer Offensivkauf: Dust rein, direkter Tempo- und Burst-Schub raus.",
            kind: "merchant",
            preview: preview(
              ["+8 Klicks", "+2 Passiv"],
              ["Kostet 16 Staub vor Rabatten"],
              [],
              "Perfekt, wenn dein Run kaempferisch oder crit-lastig wird.",
              "Hilft sofort gegen normale Kaempfe und Eliten.",
            ),
          },
          {
            id: "merchant_shield",
            title: "Schutz-Saft",
            description:
              "Der Stabilitaetskauf fuer Runs, die schon Schaden haben, aber noch keine Haut.",
            kind: "merchant",
            preview: preview(
              ["+24 Schild", "+14 Leben"],
              ["Kostet 14 Staub vor Rabatten"],
              [],
              "Stark fuer weiche Runs vor harten Folgeknoten.",
              "Erhoeht die Chance, wertvolle spaete Routen zu ueberleben.",
            ),
          },
          {
            id: "merchant_luck",
            title: "Relikt-Katalog",
            description:
              "Weniger Sofortwert, dafuer ein gezielter Eingriff in die Qualitaet deiner Endtruhe.",
            kind: "merchant",
            preview: preview(
              [
                "+1 Bonus-Splitter",
                "+0.08 Reward-Multiplikator",
                "seltene Relikte wahrscheinlicher",
              ],
              ["Kostet 18 Staub vor Rabatten"],
              [],
              "Greed-Pick fuer stabile Runs mit genug Dust-Reserve.",
              "Starker Siegspayoff statt Midfight-Power.",
            ),
          },
        ],
      ];
    case "anomaly":
      return [
        run,
        [
          {
            id: "anomaly_merge",
            title: "Boni verschmelzen",
            description:
              "Ein fetter Hybrid-Pick, der mehrere Werte gleichzeitig anschiebt, aber den Run nervoeser macht.",
            kind: "event",
            preview: preview(
              ["+6 Klicks", "+6 Passiv", "+8 Schild", "+0.08 Reward-Multiplikator"],
              [],
              ["+5 Kometendruck"],
              "Super fuer schiefe Builds, die sofort runder werden muessen.",
              "Wertet spaetere Siege sichtbar auf.",
            ),
          },
          {
            id: "anomaly_stabilize",
            title: "Riss stabilisieren",
            description:
              "Die sichere Raumfalten-Linie: nimm Dust, Schild und senke die innere Unruhe.",
            kind: "event",
            preview: preview(
              ["+16 Schild", "+12 Kristallstaub", "-3 Kometendruck"],
              [],
              [],
              "Ideal, wenn du vor einer harten Pfadwahl wieder auf Null kommen willst.",
              "Baut Ressourcen statt Snowball-Risiko auf.",
            ),
          },
        ],
      ];
    case "sacrifice":
      return [
        run,
        [
          {
            id: "sacrifice_life",
            title: "Herzfunken opfern",
            description:
              "Der klassische High-Roll: du blutest jetzt, aber deine Endtruhe kann dafuer absurd werden.",
            kind: "sacrifice",
            preview: preview(
              ["+0.08 Reward-Multiplikator", "seltene Relikte wahrscheinlicher"],
              ["20% aktuelles Leben"],
              ["Erhoeht Fluch-Risiko"],
              "Nur stark, wenn dein Run noch genug Puffer oder Revive-Potenzial hat.",
              "Einer der groessten Endreward-Picks im Modus.",
            ),
          },
          {
            id: "sacrifice_shield",
            title: "Schutz zerschneiden",
            description:
              "Wandle sofortige Defensive in brutale Angriffskraft um. Klar, hart, direkt.",
            kind: "sacrifice",
            preview: preview(
              ["+10 Klicks"],
              ["-20 Schild"],
              [],
              "Perfekt, wenn du gerade genug Leben, aber zu wenig Schaden hast.",
              "Beschleunigt den Run sofort, nicht erst am Ende.",
            ),
          },
          {
            id: "sacrifice_skip",
            title: "Mitternachts-Kniebeuge",
            description:
              "Du duckst dich vor dem grossen Schmerz und nimmst nur eine kleine, sichere Belohnung mit.",
            kind: "sacrifice",
            preview: preview(
              ["+14 Kristallstaub", "+10 Schild"],
              [],
              [],
              "Das defensive Ausweichmanoever, wenn der Run schon genug zittert.",
              "Weniger Ceiling, aber kaum Throw-Gefahr.",
            ),
          },
        ],
      ];
    case "echo":
      return [
        run,
        [
          {
            id: "echo_repeat",
            title: "Letzten Bonus halb kopieren",
            description:
              "Verdichtet deinen letzten guten Pick und macht starke Linien noch konsequenter.",
            kind: "echo",
            preview: preview(
              ["Kopiert deinen letzten Boon-Effekt erneut"],
              [],
              [],
              "Am staerksten, wenn dein letzter Pick schon ein Volltreffer war.",
              "Kann dein aktuelles Build-Thema extrem festziehen.",
            ),
          },
          {
            id: "echo_balance",
            title: "Hoechsten Wert umleiten",
            description:
              "Nimmt deinem Build etwas Spitze und gibt dafuer der schwaechsten Stelle Luft.",
            kind: "echo",
            preview: preview(
              ["Staerkster Kernwert speist den schwaechsten"],
              [],
              [],
              "Der beste Pick, wenn dein Run zu einseitig oder fragil geworden ist.",
              "Mehr Balance vor dem Boss statt mehr Spitze.",
            ),
          },
        ],
      ];
    case "boss_omen":
      return [
        run,
        [
          {
            id: "omen_read",
            title: "Vorzeichen lesen",
            description:
              "Trading clarity for tempo: du lernst den Boss kennen und nimmst etwas Dust mit.",
            kind: "event",
            preview: preview(
              ["Boss-Mutationen sichtbar", "+10 Kristallstaub"],
              [],
              [],
              "Stark fuer vorsichtige Runs oder knappe Endphasen.",
              "Reduziert Blindflug im Finale deutlich.",
            ),
          },
          {
            id: "omen_rush",
            title: "Durchstuerzen",
            description:
              "Du ignorierst Sicherheit und zwingst den Run in eine schnellere, gefaehrlichere Endkurve.",
            kind: "event",
            preview: preview(
              ["+18 Bossschaden"],
              [],
              ["+6 Kometendruck"],
              "Perfekt fuer Tempo- und Burst-Runs, die das Finale abkuerzen wollen.",
              "Wertet deinen Bosskill stark auf, wenn du nicht vorher kollabierst.",
            ),
          },
          {
            id: "omen_hide",
            title: "Im Nebel warten",
            description: "Ein kleiner Sicherheitsanker, wenn der Run zu hektisch geworden ist.",
            kind: "event",
            preview: preview(
              ["+14 Leben", "-5 Kometendruck"],
              [],
              [],
              "Gut nach harten Kampffolgen oder vor riskanten Endpfaden.",
              "Mehr Stabilitaet statt Final-Burst.",
            ),
          },
        ],
      ];
    case "relic_vault":
      return [
        run,
        [
          {
            id: "vault_shards",
            title: "Splitter versiegeln",
            description:
              "Die konservative Value-Line: sichere Endbeute, wenig Spektakel, viel Garantiewert.",
            kind: "event",
            preview: preview(
              ["+2 Bonus-Splitter", "+0.05 Reward-Multiplikator"],
              [],
              [],
              "Top fuer Runs, die einfach ihre Truhe sicher nach Hause bringen wollen.",
              "Konstanter Siegspayoff.",
            ),
          },
          {
            id: "vault_skin",
            title: "Truhenlinse polieren",
            description:
              "Schiebt mehr Rohwert in die Endtruhe und macht den Sieg direkt profitabler.",
            kind: "event",
            preview: preview(
              ["+1 Bonus-Splitter", "+0.12 Reward-Multiplikator"],
              [],
              [],
              "Stark fuer lange Meta-Farm-Runs mit bereits stabilem Bosskill.",
              "Mehr Rohwert in der Endtruhe.",
            ),
          },
          {
            id: "vault_relic",
            title: "Reliktfenster erweitern",
            description:
              "Greed auf Meta-Power: deine Endtruhe wird enger auf starke Relikte ausgerichtet.",
            kind: "event",
            preview: preview(
              ["Seltene Relikte wahrscheinlicher", "+0.10 Reward-Multiplikator"],
              [],
              [],
              "Am besten, wenn dir der Sieg bereits realistisch wirkt.",
              "Hoehere Reliktqualitaet statt frueher Kampfkraft.",
            ),
          },
        ],
      ];
    default:
      return [
        run,
        [
          {
            id: "tactic_aggressive",
            title: "Herzsturm",
            description:
              "Die rote Linie: mehr Tempo, mehr Dust, mehr Bossschaden und dafuer deutlich mehr Rueckschlag.",
            kind: "tactic",
            preview: preview(
              ["+4 Klicks", "+2 Passiv", "mehr Dust", "mehr Bossschaden"],
              [],
              ["Hoeherer erlittener Schaden"],
              "Stark fuer offensive Seeds und Runs mit Reserve.",
              "Erhoeht sowohl Midrun- als auch Endfight-Tempo.",
            ),
          },
          {
            id: "tactic_balanced",
            title: "Pfotenrhythmus",
            description: "Die klare Mitte: etwas mehr Schild, etwas mehr Dust, kein grosses Drama.",
            kind: "tactic",
            preview: preview(
              ["+8 Schild", "etwas mehr Dust", "solider Bossschub"],
              [],
              [],
              "Gut, wenn dein Build weder hart snowballt noch stark wackelt.",
              "Stetiger Fortschritt ohne Spezialrisiko.",
            ),
          },
          {
            id: "tactic_guarded",
            title: "Flauschschild",
            description:
              "Die defensive Route: deutlich weniger Rueckschlag, aber auch weniger explosiver Reward.",
            kind: "tactic",
            preview: preview(
              ["+16 Schild", "weniger erlittener Schaden"],
              [],
              ["Weniger Bossschub als Aggro-Linie"],
              "Sehr gut fuer fragile oder long-value Runs.",
              "Hilft dir, spaetere Reward-Knoten ueberhaupt zu erreichen.",
            ),
          },
        ],
      ];
  }
}

function makeEncounter(
  run: ActiveRogueliteRun,
  node: RogueliteNode,
): [ActiveRogueliteRun, RogueliteEncounter] {
  const [nextRun, choices] = makeEncounterChoicesForNode(run, node);
  const nodeValue = estimateNodeValue(node);
  return [
    nextRun,
    {
      id: randomId("encounter", nextRun.rngState + node.station),
      title: `${node.label} • Station ${node.station}`,
      description: node.description,
      nodeType: node.type,
      danger: node.danger,
      rewardHint: `${nodeValue.rewardPreview} • ${nodeValue.riskPreview}`,
      choices,
    },
  ];
}

function makePathChoices(run: ActiveRogueliteRun): [ActiveRogueliteRun, RoguelitePathChoice[]] {
  let nextRun = run;
  const station = run.completedStations + 1;
  const choices: RoguelitePathChoice[] = [];
  while (choices.length < 2) {
    let node: RogueliteNode;
    [nextRun, node] = makeNode(nextRun, station);
    const nodeValue = estimateNodeValue(node);
    choices.push({
      id: `${node.id}_path`,
      node,
      rewardPreview: nodeValue.rewardPreview,
      riskPreview: nodeValue.riskPreview,
      routeHint: nodeValue.routeHint,
    });
  }
  return [nextRun, choices];
}

function getBoon(id: string): RogueliteBoon {
  return ROGUELITE_BOONS.find((boon) => boon.id === id) ?? ROGUELITE_BOONS[0];
}

function applyBoon(run: ActiveRogueliteRun, boon: RogueliteBoon): ActiveRogueliteRun {
  const stats = { ...run.stats };
  const rewardState = { ...run.rewardState };
  switch (boon.id) {
    case "click_plus_50":
      stats.runClicks = Math.round(stats.runClicks * 1.5);
      break;
    case "first_five_double":
      stats.bossDamage += 6;
      break;
    case "combo_after_ten":
      stats.runClicks += 7;
      stats.cometPressure += 1;
      break;
    case "crit_chance_8":
      stats.runCritChance += 0.08;
      break;
    case "crit_power_125":
      stats.runCritPower += 1.25;
      break;
    case "every_third_splitter":
      stats.bossDamage += 10;
      break;
    case "clicks_scale_shield":
      stats.runClicks += Math.floor(stats.runShield / 6);
      break;
    case "clicks_heal_life":
      stats.runLife = Math.min(stats.maxLife, stats.runLife + 8);
      break;
    case "animals_x2":
      stats.runPassive = Math.round(stats.runPassive * 2);
      break;
    case "animals_each_station":
      stats.runPassive += 3;
      break;
    case "elite_passive_double":
      rewardState.rewardMultiplier += 0.12;
      break;
    case "new_animal_shield":
      stats.runShield += 18;
      break;
    case "animal_boost_per_relic":
      stats.runPassive += run.activeRelicIds.length * 6;
      break;
    case "idle_stack_patience":
      stats.runPassive += 8;
      stats.crystalDust += 6;
      break;
    case "moon_animals_boss_damage":
      stats.bossDamage += Math.ceil(stats.runPassive / 4);
      break;
    case "events_more_often":
      stats.eventChance += 0.15;
      break;
    case "event_duration_50":
      stats.eventChance += 0.1;
      stats.crystalDust += 5;
      break;
    case "anomalies_double_choice":
      rewardState.rewardMultiplier += 0.05;
      break;
    case "reroll_every_third":
      stats.rerolls += 1;
      break;
    case "route_preview_plus_one":
      stats.purges += 1;
      break;
    case "elite_relic_bonus":
      rewardState.guaranteedRareRelic = true;
      break;
    case "boss_telegraph":
      run.boss.telegraphRevealed = true;
      break;
    case "research_cheaper":
    case "shop_costs_25":
      stats.researchDiscount += 0.25;
      break;
    case "first_shop_free":
      stats.crystalDust += 10;
      break;
    case "skip_bonus_purge":
      stats.purges += 1;
      break;
    case "rest_bonus_shard":
      rewardState.bonusShards += 1;
      break;
    case "duplicates_to_dust":
      stats.crystalDust += 12;
      break;
    case "starting_shield_30":
      stats.runShield += 30;
      break;
    case "shield_each_station":
      stats.runShield += 12;
      break;
    case "shield_burst_aoe":
      stats.bossDamage += Math.floor(stats.runShield / 8);
      break;
    case "boss_damage_minus_20":
      stats.runShield += 8;
      break;
    case "revive_once":
      stats.runLife += 16;
      stats.maxLife += 16;
      break;
    case "heal_rest_double":
      stats.healCharges += 1;
      break;
    case "curse_barrier":
      stats.runShield += 20;
      break;
    case "low_life_crit":
      stats.runCritChance += 0.06;
      break;
    case "double_shards_boss_mutation":
      rewardState.bonusShards += 2;
      rewardState.cursesTaken += 1;
      stats.cometPressure += 6;
      break;
    case "sacrifice_shield_power":
      stats.runClicks += 10;
      stats.runShield = Math.max(0, stats.runShield - 12);
      break;
    case "lose_life_legendary":
      stats.runLife = Math.max(1, Math.round(stats.runLife * 0.8));
      rewardState.guaranteedRareRelic = true;
      rewardState.rewardMultiplier += 0.08;
      break;
    case "take_curse_skin_roll":
      rewardState.cursesTaken += 1;
      rewardState.bonusShards += 1;
      rewardState.rewardMultiplier += 0.05;
      break;
    case "starrain_autoclick":
      stats.runClicks += 12;
      stats.runPassive += 4;
      break;
    case "even_station_copy":
      stats.runClicks += 5;
      stats.runPassive += 5;
      break;
    case "highest_feeds_lowest": {
      const pairs = [
        ["click", stats.runClicks],
        ["passive", stats.runPassive],
        ["shield", stats.runShield],
      ] as const;
      const sorted = [...pairs].sort((a, b) => a[1] - b[1]);
      const delta = Math.floor(sorted[2][1] * 0.2);
      if (sorted[0][0] === "click") stats.runClicks += delta;
      if (sorted[0][0] === "passive") stats.runPassive += delta;
      if (sorted[0][0] === "shield") stats.runShield += delta;
      break;
    }
    case "freeze_boss_phase":
      stats.bossDamage += 18;
      break;
    case "triad_set_bonus": {
      const categories = new Set(run.boons.map((owned) => owned.category));
      categories.add(boon.category);
      if (categories.size >= 3) {
        stats.runClicks += 6;
        stats.runPassive += 6;
        stats.runShield += 10;
      }
      break;
    }
    default:
      break;
  }

  const boons = [...run.boons, boon];
  return {
    ...run,
    stats,
    rewardState,
    boons,
    lastBoonId: boon.id,
  };
}

function applyDamage(stats: RogueliteRunStats, amount: number) {
  let remaining = amount;
  let shield = stats.runShield;
  let life = stats.runLife;
  if (shield > 0) {
    const blocked = Math.min(shield, remaining);
    shield -= blocked;
    remaining -= blocked;
  }
  if (remaining > 0) {
    life = Math.max(0, life - remaining);
  }
  return { ...stats, runShield: shield, runLife: life };
}

function rollEventEncounter(
  run: ActiveRogueliteRun,
): [ActiveRogueliteRun, RogueliteEncounter | null] {
  if (run.completedStations === 0 || run.completedStations % 2 !== 0) {
    return [run, null];
  }
  const chance = Math.min(0.9, run.stats.eventChance);
  let nextRun = run;
  let roll = 0;
  [nextRun, roll] = rollInt(nextRun, 100);
  if (roll >= chance * 100) return [nextRun, null];
  let eventIndex = 0;
  [nextRun, eventIndex] = rollInt(nextRun, ROGUELITE_EVENT_POOL.length);
  const eventDef = ROGUELITE_EVENT_POOL[eventIndex] ?? ROGUELITE_EVENT_POOL[0];
  const eventChoicePreviews: Record<string, RogueliteChoicePreview> = {
    wormhole_hasten: preview(
      ["+1 Reroll", "+12 Klicks"],
      [],
      ["+6 Kometendruck"],
      "Top fuer Runs, die noch mehr Auswahlkontrolle und Tempo wollen.",
      "Beschleunigt den naechsten Kampfbogen spuerbar.",
    ),
    wormhole_anchor: preview(
      ["+16 Schild", "-4 Kometendruck"],
      [],
      [],
      "Gut fuer fragile oder defensive Seeds.",
      "Mehr Ruhe vor der naechsten Weggabelung.",
    ),
    petals_heal: preview(
      ["+22 Leben", "+5% Event-Chance"],
      [],
      [],
      "Stark, wenn du mehr Zwischenevents verwerten kannst.",
      "Sustain jetzt, Value spaeter.",
    ),
    petals_trade: preview(
      ["+18 Kristallstaub", "+1 Purge"],
      [],
      [],
      "Wunderbar fuer Shop- oder Cleanup-Runs.",
      "Staerkt Utility und Kaufkraft gleichzeitig.",
    ),
    kittens_crit: preview(
      ["+10% Crit-Chance"],
      ["-8 Leben"],
      ["Erhoeht Fluch-Naehe"],
      "Stark fuer Klick- und Burst-Builds mit genug Reserve.",
      "Mehr Kill-Potenzial, weniger Fehlerraum.",
    ),
    kittens_guard: preview(
      ["+24 Schild", "+1 Heilcharge"],
      [],
      [],
      "Der defensive Volltreffer fuer laengere Runs.",
      "Sichert spaetere Reward-Lines ab.",
    ),
  };
  return [
    nextRun,
    {
      id: randomId("event", nextRun.rngState + run.completedStations),
      title: eventDef.title,
      description: eventDef.description,
      nodeType: "event",
      danger: "medium",
      choices: eventDef.choices.map((choice) => ({
        id: choice.id,
        title: choice.title,
        description: choice.description,
        kind: "event",
        preview: eventChoicePreviews[choice.id],
      })),
    },
  ];
}

function buildBossEncounter(run: ActiveRogueliteRun): RogueliteEncounter {
  const boss = getBoss(run.boss.bossId);
  const isFinalBoss = run.boss.stage === "final";
  const title =
    run.boss.stage === "act_1"
      ? `${boss.name} • Akt 1 Pruefung`
      : run.boss.stage === "act_2"
        ? `${boss.name} • Akt 2 Pruefung`
        : `${boss.name} • Finale Kollision`;
  return {
    id: `${boss.id}_boss`,
    title,
    description: isFinalBoss
      ? boss.description
      : "Ein Zwischenboss prueft, ob dein Build den naechsten Akt wirklich traegt.",
    nodeType: isFinalBoss ? "boss" : "act_boss",
    danger: "extreme",
    rewardHint: run.boss.telegraphRevealed
      ? `Mutationen: ${run.boss.mutationIds
          .map((id) => ROGUELITE_BOSS_MUTATIONS.find((mutation) => mutation.id === id)?.name ?? id)
          .join(", ")}`
      : "Der Boss knistert noch im Nebel.",
    choices: [
      {
        id: "boss_aggressive",
        title: "Splitterchor",
        description: "Volle Offensive mit hohem Risiko und hoher Belohnung.",
        kind: "boss",
        preview: preview(
          ["Sehr hoher Bossschaden", "hoher Siegspayoff"],
          [],
          ["Groesster Rueckschlag im Bosskampf"],
          "Nur ideal, wenn dein Run bereits wie ein Gewinner aussieht.",
          "Maximiert einen schnellen, rewardstarken Kill.",
        ),
      },
      {
        id: "boss_balanced",
        title: "Orbittanz",
        description: "Ausgewogenes Duell zwischen Sicherheit und Druck.",
        kind: "boss",
        preview: preview(
          ["Solider Bossschaden", "solider Schutz"],
          [],
          [],
          "Die Standardlinie, wenn du nichts Unnoetiges wegwerfen willst.",
          "Guter Allround-Abschluss.",
        ),
      },
      {
        id: "boss_guarded",
        title: "Herzschale",
        description: "Sichere Kollision mit weniger Bonuspotenzial.",
        kind: "boss",
        preview: preview(
          ["Niedrigster Rueckschlag", "mehr Ueberlebenssicherheit"],
          [],
          ["Weniger Bonuspotenzial"],
          "Stark fuer knappe Siege und fragile Reward-Runs.",
          "Minimiert die Chance, einen fast gewonnenen Run noch zu verlieren.",
        ),
      },
    ],
  };
}

function afterEncounterResolved(run: ActiveRogueliteRun): ActiveRogueliteRun {
  if (run.stats.runLife <= 0) {
    return {
      ...run,
      phase: "defeat",
      status: "lost",
      rewardPackage: null,
      rewardState: { ...run.rewardState, trostRewardPending: true },
    };
  }
  if (
    run.completedStations >= ROGUELITE_STATIONS_PER_ACT &&
    run.completedStations < ROGUELITE_TOTAL_STATIONS &&
    run.completedStations % ROGUELITE_STATIONS_PER_ACT === 0
  ) {
    return {
      ...run,
      currentAct: getActForStation(run.completedStations + 1),
      phase: "boss",
      currentNode: null,
      currentEncounter: buildBossEncounter({
        ...run,
        boss: { ...run.boss, stage: getBossStageForStation(run.completedStations) },
      }),
      pathChoices: [],
      boss: { ...run.boss, stage: getBossStageForStation(run.completedStations) },
    };
  }
  if (run.completedStations >= ROGUELITE_TOTAL_STATIONS) {
    return {
      ...run,
      phase: "boss",
      currentNode: null,
      currentEncounter: buildBossEncounter({
        ...run,
        boss: { ...run.boss, stage: "final" },
      }),
      pathChoices: [],
      boss: { ...run.boss, stage: "final" },
    };
  }
  const [withEventRoll, eventEncounter] = rollEventEncounter(run);
  if (eventEncounter) {
    return {
      ...withEventRoll,
      phase: "event",
      currentEncounter: eventEncounter,
      currentNode: null,
      pathChoices: [],
    };
  }

  const [withPaths, pathChoices] = makePathChoices(withEventRoll);
  return {
    ...withPaths,
    phase: "path",
    currentEncounter: null,
    currentNode: null,
    pathChoices,
  };
}

export function createRogueliteMetaState(): RogueliteMetaState {
  return {
    totalRuns: 0,
    wins: 0,
    losses: 0,
    highestStation: 0,
    unlockedRelics: ["kometenherz", "pfotenkompass"],
    unlockedPlanetSkins: [],
    seenBosses: [],
    shardRewardsClaimed: 0,
    bonusRerolls: 0,
    lastRunSummary: null,
  };
}

export function createNewRun(
  meta: RogueliteMetaState,
  selectedRelicIds: string[],
  seedOverride?: number,
): ActiveRogueliteRun {
  const seed = generateSeed(seedOverride);
  const runArchetype = chooseSeededArchetype(seed);
  const runModifiers = chooseSeededModifiers(seed);
  const startRelics = uniqueById(
    selectedRelicIds.filter((id) => meta.unlockedRelics.includes(id)).map((id) => getRelic(id)),
  )
    .slice(0, 3)
    .map((relic) => relic.id);
  let run: ActiveRogueliteRun = {
    id: randomId("roguerun", seed),
    seed,
    rngState: seed >>> 0,
    runArchetype,
    runModifiers,
    currentAct: 1,
    phase: "node",
    status: "active",
    startedAt: Date.now(),
    completedStations: 0,
    currentNode: null,
    currentEncounter: null,
    currentEventLabel: null,
    pathChoices: [],
    boss: {
      bossId: ROGUELITE_BOSSES[0].id,
      mutationIds: [],
      telegraphRevealed: false,
      stage: "final",
    },
    stats: applyRunIdentityStartBonuses(
      applyRelicStartBonuses(createBaseStats(meta), startRelics),
      runArchetype,
      runModifiers,
    ),
    boons: [],
    activeRelicIds: startRelics,
    history: [],
    rewardState: createRewardState(),
    rewardPackage: null,
    bonusRerollsConsumed: meta.bonusRerolls,
    choiceCount: 0,
  };

  [run, run.boss] = createBossState(run);
  const firstNodeResult = makeNode(run, 1, "boon");
  run = firstNodeResult[0];
  const firstNode = firstNodeResult[1];
  const encounterResult = makeEncounter(run, firstNode);
  run = encounterResult[0];
  const encounter = encounterResult[1];
  run.currentNode = firstNode;
  run.currentEncounter = encounter;
  if (
    !hasRenderableRoguelitePrimaryState(run) ||
    (run.currentEncounter?.choices.length ?? 0) === 0
  ) {
    const fallbackNodeResult = makeNode(run, 1, "boon");
    run = fallbackNodeResult[0];
    const fallbackNode = fallbackNodeResult[1];
    const fallbackEncounterResult = makeEncounter(run, fallbackNode);
    run = fallbackEncounterResult[0];
    run.currentNode = fallbackNode;
    run.currentEncounter = fallbackEncounterResult[1];
    run.phase = "node";
    run.pathChoices = [];
    run.currentAct = 1;
  }
  return run;
}

export function pickPath(run: ActiveRogueliteRun, pathId: string): ActiveRogueliteRun {
  const choice = run.pathChoices.find((pathChoice) => pathChoice.id === pathId);
  if (!choice) return run;
  const nextRun: ActiveRogueliteRun = {
    ...run,
    phase: "node",
    pathChoices: [],
    currentNode: choice.node,
  };
  const [resolvedRun, encounter] = makeEncounter(nextRun, choice.node);
  return {
    ...resolvedRun,
    currentEncounter: encounter,
  };
}

function resolveCombatLikeNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const stats = { ...run.stats };
  const rewardState = { ...run.rewardState };
  const stationPressure = node.station * 4;
  const dangerBonus =
    node.danger === "extreme" ? 20 : node.danger === "high" ? 14 : node.danger === "medium" ? 9 : 5;
  let rewardDust = 8 + node.station;
  let rewardBossDamage = 4 + node.station;
  let damage = stationPressure + dangerBonus;
  const modifierRewards = maybeAddModifierReward(run, rewardDust, rewardBossDamage);
  rewardDust = modifierRewards.rewardDust;
  rewardBossDamage = modifierRewards.rewardBossDamage;
  damage += modifierRewards.extraPressure;

  if (choiceId === "tactic_aggressive") {
    stats.runClicks += 4;
    stats.runPassive += 2;
    rewardDust += 8;
    rewardBossDamage += 7;
    damage += 8;
  } else if (choiceId === "tactic_guarded") {
    stats.runShield += 16;
    rewardBossDamage += 2;
    damage -= 7;
  } else {
    stats.runShield += 8;
    rewardDust += 4;
  }

  if (node.type === "elite") {
    rewardState.bonusShards += 1;
    rewardState.eliteClears += 1;
    rewardState.rewardMultiplier += 0.08;
    damage += 8;
    rewardDust += 10;
  }

  if (node.type === "meteor") {
    rewardDust += 10;
    stats.cometPressure += 2;
  }

  if (run.runArchetype.id === "glass_comet") {
    rewardBossDamage += 3;
    damage += 4;
  } else if (run.runArchetype.id === "bulwark_spiral") {
    damage = Math.max(1, damage - 3);
    stats.runShield += 4;
  }

  if (node.type === "boss_omen" && run.boss.telegraphRevealed) {
    rewardBossDamage += 6;
  }

  const afterDamage = applyDamage(stats, Math.max(1, damage - Math.floor(stats.runPassive / 8)));
  const finalStats = {
    ...afterDamage,
    bossDamage: afterDamage.bossDamage + rewardBossDamage,
    crystalDust: afterDamage.crystalDust + rewardDust,
  };

  return afterEncounterResolved({
    ...run,
    stats: finalStats,
    rewardState,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: node ? [...run.history, node] : run.history,
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveRestNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const stats = { ...run.stats };
  if (choiceId === "rest_heal") {
    const amount = 18 + (run.boons.some((boon) => boon.id === "heal_rest_double") ? 18 : 0);
    stats.runLife = Math.min(stats.maxLife, stats.runLife + amount);
    stats.cometPressure = Math.max(0, stats.cometPressure - 6);
  } else if (choiceId === "rest_shield") {
    stats.runShield += 24;
    stats.crystalDust += 8;
  } else {
    if (stats.purges > 0) {
      stats.purges += 1;
    } else {
      stats.healCharges += 1;
    }
  }
  return afterEncounterResolved({
    ...run,
    stats,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveMerchantNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const stats = { ...run.stats };
  const discount = 1 - Math.min(0.75, stats.researchDiscount);
  const spend = (base: number) => {
    const cost = Math.max(0, Math.round(base * discount));
    if (stats.crystalDust < cost) return false;
    stats.crystalDust -= cost;
    return true;
  };

  if (choiceId === "merchant_click" && spend(16)) {
    stats.runClicks += 8;
    stats.runPassive += 2;
  } else if (choiceId === "merchant_shield" && spend(14)) {
    stats.runShield += 24;
    stats.runLife = Math.min(stats.maxLife, stats.runLife + 14);
  } else if (choiceId === "merchant_luck" && spend(18)) {
    run.rewardState = {
      ...run.rewardState,
      bonusShards: run.rewardState.bonusShards + 1,
      bonusSkinRolls: run.rewardState.bonusSkinRolls + 1,
      guaranteedRareRelic: true,
    };
  } else {
    stats.crystalDust += 4;
  }

  return afterEncounterResolved({
    ...run,
    stats,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveAnomalyNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const stats = { ...run.stats };
  const rewardState = { ...run.rewardState };
  if (choiceId === "anomaly_merge") {
    stats.runClicks += 6;
    stats.runPassive += 6;
    stats.runShield += 8;
    stats.cometPressure += 5;
    rewardState.rewardMultiplier += 0.08;
  } else {
    stats.runShield += 16;
    stats.crystalDust += 12;
    stats.cometPressure = Math.max(0, stats.cometPressure - 3);
  }

  return afterEncounterResolved({
    ...run,
    stats,
    rewardState,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveSacrificeNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  let nextRun = run;
  const stats = { ...run.stats };
  const rewardState = { ...run.rewardState };
  if (choiceId === "sacrifice_life") {
    stats.runLife = Math.max(1, Math.round(stats.runLife * 0.8));
    rewardState.cursesTaken += 1;
    rewardState.bonusSkinRolls += 1;
    nextRun = applyBoon({ ...nextRun, stats, rewardState }, getBoon("lose_life_legendary"));
  } else if (choiceId === "sacrifice_shield") {
    stats.runShield = Math.max(0, stats.runShield - 20);
    nextRun = applyBoon({ ...nextRun, stats, rewardState }, getBoon("sacrifice_shield_power"));
  } else {
    stats.crystalDust += 14;
    stats.runShield += 10;
  }

  return afterEncounterResolved({
    ...nextRun,
    stats: nextRun.stats,
    rewardState: nextRun.rewardState,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveEchoNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  let nextRun = { ...run };
  if (choiceId === "echo_repeat" && run.lastBoonId) {
    nextRun = applyBoon(nextRun, getBoon(run.lastBoonId));
  } else {
    nextRun = applyBoon(nextRun, getBoon("highest_feeds_lowest"));
  }

  return afterEncounterResolved({
    ...nextRun,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveBossOmenNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const stats = { ...run.stats };
  if (choiceId === "omen_read") {
    stats.crystalDust += 10;
    run.boss.telegraphRevealed = true;
  } else if (choiceId === "omen_rush") {
    stats.bossDamage += 18;
    stats.cometPressure += 6;
  } else {
    stats.runLife = Math.min(stats.maxLife, stats.runLife + 14);
    stats.cometPressure = Math.max(0, stats.cometPressure - 5);
  }
  return afterEncounterResolved({
    ...run,
    stats,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveRelicVaultNode(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const rewardState = { ...run.rewardState };
  if (choiceId === "vault_shards") {
    rewardState.bonusShards += 2;
    rewardState.rewardMultiplier += 0.05;
  } else if (choiceId === "vault_skin") {
    rewardState.bonusShards += 1;
    rewardState.rewardMultiplier += 0.12;
  } else {
    rewardState.guaranteedRareRelic = true;
    rewardState.rewardMultiplier += 0.1;
  }
  return afterEncounterResolved({
    ...run,
    rewardState,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveBoonNode(run: ActiveRogueliteRun, boonId: string): ActiveRogueliteRun {
  const node = run.currentNode;
  if (!node) return run;
  const nextRun = applyBoon(run, getBoon(boonId));
  return afterEncounterResolved({
    ...nextRun,
    completedStations: run.completedStations + 1,
    currentEncounter: null,
    history: [...run.history, node],
    currentNode: null,
    choiceCount: run.choiceCount + 1,
  });
}

function resolveEventChoice(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const stats = { ...run.stats };
  const rewardState = { ...run.rewardState };

  switch (choiceId) {
    case "wormhole_hasten":
      stats.rerolls += 1;
      stats.runClicks += 12;
      stats.cometPressure += 6;
      break;
    case "wormhole_anchor":
      stats.runShield += 16;
      stats.cometPressure = Math.max(0, stats.cometPressure - 4);
      break;
    case "petals_heal":
      stats.runLife = Math.min(stats.maxLife, stats.runLife + 22);
      stats.eventChance += 0.05;
      break;
    case "petals_trade":
      stats.crystalDust += 18;
      stats.purges += 1;
      break;
    case "kittens_crit":
      stats.runLife = Math.max(1, stats.runLife - 8);
      stats.runCritChance += 0.1;
      rewardState.cursesTaken += 1;
      break;
    case "kittens_guard":
      stats.runShield += 24;
      stats.healCharges += 1;
      break;
    default:
      break;
  }

  const [withPaths, pathChoices] = makePathChoices({ ...run, stats, rewardState });
  return {
    ...withPaths,
    stats,
    rewardState,
    phase: "path",
    currentEncounter: null,
    currentNode: null,
    pathChoices,
    choiceCount: run.choiceCount + 1,
  };
}

function buildRewardPackage(run: ActiveRogueliteRun): RogueliteRewardPackage {
  const boss = getBoss(run.boss.bossId);
  const flawless =
    run.rewardState.flawlessEligible && run.stats.runLife >= Math.floor(run.stats.maxLife * 0.8);
  const cursed = run.rewardState.cursesTaken > 0;
  const speedClear = run.choiceCount <= 34;

  const victoryType = flawless
    ? "flawless"
    : cursed
      ? "cursed"
      : speedClear
        ? "speed_clear"
        : "normal";

  let shards = 6 + Math.min(7, Math.floor(run.completedStations / 4)) + run.rewardState.bonusShards;
  if (victoryType === "flawless") shards += 1;
  if (run.activeRelicIds.includes("splitterbeutel")) shards += 1;
  if (run.boons.some((boon) => boon.id === "double_shards_boss_mutation")) shards += 1;
  if (run.runArchetype.id === "elite_hunter") shards += Math.min(2, run.rewardState.eliteClears);
  if (run.runModifiers.some((modifier) => modifier.id === "cruel_blossom")) shards += 1;

  const glitterDust =
    70 + run.rewardState.eliteClears * 14 + Math.floor(run.stats.crystalDust / 2.5);
  const relicChoices: string[] = [];
  const unlockedSet = new Set<string>(run.activeRelicIds);
  const sortedRelics = [...ROGUELITE_RELICS].sort(
    (a, b) => Number(unlockedSet.has(a.id)) - Number(unlockedSet.has(b.id)),
  );
  for (const relic of sortedRelics) {
    if (!relicChoices.includes(relic.id)) relicChoices.push(relic.id);
    if (relicChoices.length >= 3) break;
  }

  return {
    shards,
    glitterDust:
      glitterDust +
      (run.runArchetype.id === "merchant_orbit" ? 8 : 0) +
      (run.runArchetype.id === "event_bloom" ? 4 : 0),
    relicChoiceIds: relicChoices,
    victoryType,
    rewardLabel: `${boss.name} besiegt • ${victoryType.replace("_", " ")} • ${run.runArchetype.title}`,
  };
}

function resolveBoss(run: ActiveRogueliteRun, choiceId: string): ActiveRogueliteRun {
  const boss = getBoss(run.boss.bossId);
  const stats = { ...run.stats };
  const bossStage = run.boss.stage;
  const isFinalBoss = bossStage === "final";
  let score =
    stats.runClicks * 1.8 +
    stats.runPassive * 1.6 +
    stats.runShield * 0.7 +
    stats.runCritChance * 100 * stats.runCritPower +
    stats.bossDamage * 1.9 -
    stats.cometPressure * 2.4;

  if (choiceId === "boss_aggressive") score += 28;
  if (choiceId === "boss_balanced") score += 12;
  if (choiceId === "boss_guarded") score += 5;
  if (run.runArchetype.id === "glass_comet") score += 12;
  if (run.runArchetype.id === "bulwark_spiral") score += 8;
  if (run.runModifiers.some((modifier) => modifier.id === "omen_lens")) score += 10;

  for (const mutationId of run.boss.mutationIds) {
    switch (mutationId) {
      case "shield_break":
        score -= 12;
        stats.runShield = Math.max(0, stats.runShield - 20);
        break;
      case "crit_resist":
        score -= stats.runCritPower * 12;
        break;
      case "event_silence":
        score -= stats.eventChance * 50;
        break;
      case "healing_lock":
        score -= stats.healCharges * 8;
        break;
      case "splitterregen":
        score -= 6;
        break;
      case "spiegelphase":
        score -= Math.max(stats.runClicks, stats.runPassive) * 0.3;
        break;
      default:
        break;
    }
  }

  if (run.activeRelicIds.includes("leerefeder")) score += 14;
  if (run.boons.some((boon) => boon.id === "freeze_boss_phase")) score += 24;

  const threshold =
    boss.baseDifficulty +
    (bossStage === "act_1" ? -30 : bossStage === "act_2" ? -12 : 8) +
    run.rewardState.cursesTaken * 8;
  if (score >= threshold) {
    if (!isFinalBoss) {
      const nextStats = {
        ...stats,
        runLife: Math.min(stats.maxLife, stats.runLife + (bossStage === "act_1" ? 18 : 14)),
        runShield: stats.runShield + (bossStage === "act_1" ? 16 : 20),
        rerolls: stats.rerolls + 1,
        crystalDust: stats.crystalDust + (bossStage === "act_1" ? 18 : 28),
        bossDamage: stats.bossDamage + (bossStage === "act_1" ? 8 : 14),
      };
      const nextRun = {
        ...run,
        stats: nextStats,
        boss: { ...run.boss, stage: "final" as const },
        choiceCount: run.choiceCount + 1,
      };
      const [withPaths, pathChoices] = makePathChoices(nextRun);
      return {
        ...withPaths,
        currentAct: bossStage === "act_1" ? 2 : 3,
        phase: "path",
        currentNode: null,
        currentEncounter: null,
        pathChoices,
      };
    }

    return {
      ...run,
      stats,
      status: "won",
      phase: "victory_rewards",
      rewardPackage: buildRewardPackage({ ...run, stats }),
      currentEncounter: {
        id: "victory_reward",
        title: "Siegestruhe",
        description: "Waehle dein Relikt fuer den Hauptkosmos und sichere deine Ressourcen.",
        nodeType: "reward",
        danger: "low",
        choices: [],
      },
      choiceCount: run.choiceCount + 1,
    };
  }

  return {
    ...run,
    stats: applyDamage(stats, 18 + run.rewardState.cursesTaken * 4),
    status: "lost",
    phase: "defeat",
    rewardPackage: null,
    rewardState: { ...run.rewardState, trostRewardPending: true },
    choiceCount: run.choiceCount + 1,
  };
}

export function chooseEncounterOption(
  run: ActiveRogueliteRun,
  optionId: string,
): ActiveRogueliteRun {
  if (run.phase === "event") {
    return resolveEventChoice(run, optionId);
  }
  if (run.phase === "boss") {
    return resolveBoss(run, optionId);
  }
  if (!run.currentNode) return run;
  switch (run.currentNode.type) {
    case "boon":
      return resolveBoonNode(run, optionId);
    case "rest":
      return resolveRestNode(run, optionId);
    case "merchant":
      return resolveMerchantNode(run, optionId);
    case "anomaly":
      return resolveAnomalyNode(run, optionId);
    case "sacrifice":
      return resolveSacrificeNode(run, optionId);
    case "echo":
      return resolveEchoNode(run, optionId);
    case "boss_omen":
      return resolveBossOmenNode(run, optionId);
    case "relic_vault":
      return resolveRelicVaultNode(run, optionId);
    default:
      return resolveCombatLikeNode(run, optionId);
  }
}

export function rerollCurrentEncounter(run: ActiveRogueliteRun): ActiveRogueliteRun {
  if (run.stats.rerolls <= 0 || !run.currentNode) return run;
  const nextRun = {
    ...run,
    stats: { ...run.stats, rerolls: run.stats.rerolls - 1 },
  };
  const [resolvedRun, encounter] = makeEncounter(nextRun, run.currentNode);
  return {
    ...resolvedRun,
    currentEncounter: encounter,
  };
}

export function selectVictoryRewards(
  run: ActiveRogueliteRun,
  selectedRelicId: string,
): ActiveRogueliteRun {
  if (run.phase !== "victory_rewards" || !run.rewardPackage) return run;
  return {
    ...run,
    selectedRewardRelicId: selectedRelicId,
    phase: "completed",
    status: "completed",
  };
}

export function finalizeRun(
  meta: RogueliteMetaState,
  run: ActiveRogueliteRun,
): RogueliteFinalizeResult {
  if (run.status === "won" || (run.status === "completed" && run.rewardPackage)) {
    const rewardPackage = run.rewardPackage ?? buildRewardPackage(run);
    const selectedRelicId = run.selectedRewardRelicId ?? rewardPackage.relicChoiceIds[0];
    const nextMeta: RogueliteMetaState = {
      ...meta,
      totalRuns: meta.totalRuns + 1,
      wins: meta.wins + 1,
      highestStation: Math.max(meta.highestStation, ROGUELITE_TOTAL_STATIONS),
      unlockedRelics: uniqueById([
        ...meta.unlockedRelics.map((id) => getRelic(id)),
        getRelic(selectedRelicId),
      ]).map((relic) => relic.id),
      seenBosses: Array.from(new Set([...meta.seenBosses, run.boss.bossId])),
      shardRewardsClaimed: meta.shardRewardsClaimed + rewardPackage.shards,
      bonusRerolls: 0,
      lastRunSummary: {
        outcome: "victory",
        bossId: run.boss.bossId,
        bossName: getBoss(run.boss.bossId).name,
        shardsGained: rewardPackage.shards,
        glitterDustGained: rewardPackage.glitterDust,
        selectedRelicId,
        rewardLabel: rewardPackage.rewardLabel,
        stationReached: ROGUELITE_TOTAL_STATIONS,
        victoryType: rewardPackage.victoryType,
      },
    };

    return {
      meta: nextMeta,
      summary: nextMeta.lastRunSummary!,
      grantedShards: rewardPackage.shards,
      grantedGlitterDust: rewardPackage.glitterDust,
    };
  }

  let glitterDust = 24;
  let shards = 0;
  let bonusRerolls = meta.bonusRerolls;
  if (run.completedStations >= 10) {
    glitterDust += 18;
    shards = 1;
  }
  if (run.completedStations >= 20) {
    glitterDust += 22;
    shards = 2;
  }
  if (run.completedStations < 10) bonusRerolls += 1;

  const nextMeta: RogueliteMetaState = {
    ...meta,
    totalRuns: meta.totalRuns + 1,
    losses: meta.losses + 1,
    highestStation: Math.max(meta.highestStation, run.completedStations),
    seenBosses: Array.from(new Set([...meta.seenBosses, run.boss.bossId])),
    bonusRerolls,
    lastRunSummary: {
      outcome: "defeat",
      bossId: run.boss.bossId,
      bossName: getBoss(run.boss.bossId).name,
      shardsGained: shards,
      glitterDustGained: glitterDust,
      rewardLabel:
        run.completedStations >= 20
          ? "Tiefe Trosttruhe"
          : run.completedStations >= 10
            ? "Mittlere Trosttruhe"
            : "Kleine Trosttruhe",
      stationReached: run.completedStations,
    },
  };

  return {
    meta: nextMeta,
    summary: nextMeta.lastRunSummary!,
    grantedShards: shards,
    grantedGlitterDust: glitterDust,
  };
}

export function getSkinPreviewName(id: string) {
  return getSkin(id).name;
}
