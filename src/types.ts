export interface Animal {
  id: string;
  name: string;
  germanName: string;
  emoji: string;
  image?: string;
  baseCost: number;
  costMultiplier: number;
  baseLps: number; // Life Per Second
  count: number;
  description: string;
  germanDescription: string;
  color: string; // Pastel background color
}

export interface StarUpgrade {
  id: string;
  name: string;
  germanName: string;
  baseCost: number;
  costMultiplier: number;
  count: number;
  multiplier: number; // Click multiplier or LPS from stars
  description: string;
  germanDescription: string;
}

export interface Upgrade {
  id: string;
  name: string;
  germanName: string;
  cost: number;
  purchased: boolean;
  effect: (state: any) => any;
  effectDescription: string;
  germanEffectDescription: string;
  category: "click" | "animals" | "stars" | "special";
  emoji: string;
  costResource?: "life" | "glitterDust";
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  type: "click" | "star-click" | "level" | "heart" | "star" | "moon-click";
  createdAt?: number;
}

export interface PlanetTask {
  id: string;
  name: string;
  description: string;
  type: string;
  progress: number;
  target: number;
  targetAnimalId?: string;
  isCumulative?: boolean;
}

export interface GameState {
  life: number;
  totalLifeEarned: number;
  clickPower: number;
  animals: Record<string, number>; // animalId -> count
  starsCount: number;
  starLevel: number; // Star level determines clicking power per star
  purchasedUpgrades: string[]; // upgradeIds
  planetLevel: number;
  planetExp: number;
  planetExpNeeded: number;
  planetTask?: PlanetTask;
  unlockedCosmetics?: string[];
  activeStarColor?: string;
  activeAccessory?: string;
  activeFrame?: string;
  shootingStarsCount?: number;
  missionSetNumber?: number;
  claimedMissionIds?: string[];
  missionsCooldownEnd?: number | null;
  prestigeCount?: number;
  moonsCount?: number;
  constellations?: Record<string, number>; // constellationId -> level (0 if unpurchased)
  glitterDust?: number;
  blackHoleSize?: number;
  zodiac?: string;
  galaxyShards?: number;
  zodiacLevels?: Record<string, number>;
  slummerGlassLevel?: number;
  catalystLevel?: number;
  doubleStellarLevel?: number;
  activeEvent?: string | null;
  activeEventDecision?: string | null;
  eventTimeRemaining?: number;
  activeEventDetails?: ActiveCosmicEvent | null;
}

export interface CosmicEventOption {
  id: string;
  name: string;
  description: string;
  effectType: string;
  bonusLife?: number;
  bonusStars?: number;
  bonusDust?: number;
  bonusMoons?: number;
}

export interface ActiveCosmicEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  options: CosmicEventOption[];
}

