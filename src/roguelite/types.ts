export type RoguelitePhase =
  | "node"
  | "event"
  | "path"
  | "boss"
  | "victory_rewards"
  | "defeat"
  | "completed";

export type RogueliteNodeType =
  | "boon"
  | "combat"
  | "elite"
  | "anomaly"
  | "rest"
  | "merchant"
  | "relic_vault"
  | "sacrifice"
  | "echo"
  | "meteor"
  | "boss_omen";

export type RogueliteDanger = "low" | "medium" | "high" | "extreme";

export type RogueliteBoonCategory =
  | "click"
  | "animals"
  | "tempo"
  | "economy"
  | "defense"
  | "risk"
  | "exotic";

export type RogueliteRarity = "common" | "rare" | "epic" | "legendary";

export type RogueliteChoiceKind =
  | "boon"
  | "tactic"
  | "event"
  | "rest"
  | "merchant"
  | "sacrifice"
  | "echo"
  | "path"
  | "boss"
  | "reward";

export interface RogueliteChoicePreview {
  gains: string[];
  costs: string[];
  risks: string[];
  synergyHint?: string;
  rewardPreview?: string;
}

export interface RogueliteRunArchetype {
  id: string;
  title: string;
  description: string;
  playstyle: string;
}

export interface RogueliteRunModifier {
  id: string;
  title: string;
  description: string;
  effectLabel: string;
}

export interface RogueliteBoon {
  id: string;
  title: string;
  description: string;
  category: RogueliteBoonCategory;
  rarity: RogueliteRarity;
  tags?: string[];
}

export interface RogueliteRelic {
  id: string;
  name: string;
  description: string;
  rarity: RogueliteRarity;
  shortLabel: string;
}

export interface RoguelitePlanetSkin {
  id: string;
  name: string;
  description: string;
  previewImage: string;
}

export interface RogueliteBossMutation {
  id: string;
  name: string;
  description: string;
}

export interface RogueliteBoss {
  id: string;
  name: string;
  title: string;
  description: string;
  baseDifficulty: number;
}

export interface RogueliteNode {
  id: string;
  station: number;
  act: 1 | 2 | 3;
  type: RogueliteNodeType;
  danger: RogueliteDanger;
  label: string;
  description: string;
}

export interface RoguelitePathChoice {
  id: string;
  node: RogueliteNode;
  rewardPreview: string;
  riskPreview: string;
  routeHint: string;
}

export interface RogueliteChoice {
  id: string;
  title: string;
  description: string;
  kind: RogueliteChoiceKind;
  effectLabel?: string;
  preview?: RogueliteChoicePreview;
  boonId?: string;
  payload?: string;
}

export interface RogueliteEncounter {
  id: string;
  title: string;
  description: string;
  nodeType: RogueliteNodeType | "event" | "boss" | "reward";
  danger: RogueliteDanger;
  rewardHint?: string;
  choices: RogueliteChoice[];
}

export interface RogueliteRunStats {
  runLife: number;
  maxLife: number;
  runShield: number;
  runClicks: number;
  runPassive: number;
  runCritChance: number;
  runCritPower: number;
  eventChance: number;
  researchDiscount: number;
  bossDamage: number;
  healCharges: number;
  rerolls: number;
  purges: number;
  cometPressure: number;
  crystalDust: number;
}

export interface RogueliteRunRewardState {
  bonusShards: number;
  bonusSkinRolls: number;
  guaranteedRareRelic: boolean;
  guaranteedSkin: boolean;
  trostRewardPending: boolean;
  eliteClears: number;
  flawlessEligible: boolean;
  cursesTaken: number;
  rewardMultiplier: number;
}

export interface RogueliteBossState {
  bossId: string;
  mutationIds: string[];
  telegraphRevealed: boolean;
}

export interface RogueliteRunSummary {
  outcome: "victory" | "defeat";
  bossId: string;
  bossName: string;
  shardsGained: number;
  glitterDustGained: number;
  selectedRelicId?: string;
  selectedSkinId?: string;
  rewardLabel: string;
  stationReached: number;
  victoryType?: "normal" | "flawless" | "cursed" | "speed_clear";
}

export interface RogueliteRewardPackage {
  shards: number;
  glitterDust: number;
  relicChoiceIds: string[];
  victoryType?: "normal" | "flawless" | "cursed" | "speed_clear";
  rewardLabel: string;
}

export interface ActiveRogueliteRun {
  id: string;
  seed: number;
  rngState: number;
  runArchetype: RogueliteRunArchetype;
  runModifiers: RogueliteRunModifier[];
  phase: RoguelitePhase;
  status: "active" | "won" | "lost" | "completed";
  startedAt: number;
  completedStations: number;
  currentNode: RogueliteNode | null;
  currentEncounter: RogueliteEncounter | null;
  currentEventLabel?: string | null;
  pathChoices: RoguelitePathChoice[];
  boss: RogueliteBossState;
  stats: RogueliteRunStats;
  boons: RogueliteBoon[];
  activeRelicIds: string[];
  history: RogueliteNode[];
  rewardState: RogueliteRunRewardState;
  rewardPackage: RogueliteRewardPackage | null;
  selectedRewardRelicId?: string;
  selectedRewardSkinId?: string;
  bonusRerollsConsumed: number;
  choiceCount: number;
  lastBoonId?: string;
}

export interface RogueliteMetaState {
  totalRuns: number;
  wins: number;
  losses: number;
  highestStation: number;
  unlockedRelics: string[];
  equippedRelicIds: string[];
  unlockedPlanetSkins: string[];
  seenBosses: string[];
  shardRewardsClaimed: number;
  bonusRerolls: number;
  lastRunSummary: RogueliteRunSummary | null;
}

export interface RogueliteFinalizeResult {
  meta: RogueliteMetaState;
  summary: RogueliteRunSummary;
  grantedShards: number;
  grantedGlitterDust: number;
  unlockedSkinId?: string;
}
