import type { GlitchBenchmarks } from "./protocol";

/**
 * Default first-time glitch-galaxy milestones.
 *
 * These are fixed, reachable targets: the player accumulates toward them across
 * normal prestige runs. They are only escalated once, when a glitch galaxy is
 * actually repaired (see the REPAIR_GLITCH_GALAXY action) — a normal prestige
 * must NOT move them, otherwise the targets forever stay ahead of the player and
 * the glitch galaxy can never trigger.
 */
export const DEFAULT_GLITCH_BENCHMARKS: GlitchBenchmarks = {
  prestigeTarget: 10,
  stardustTarget: 150,
  shardsTarget: 10,
  phoenixTarget: 5,
  glitterTarget: 150,
};

/** The subset of worker state the milestone check reads. */
interface GlitchMilestoneState {
  prestigeCount?: number;
  craftedItems?: Record<string, number>;
  galaxyShards?: number;
  spentGalaxyShards?: number;
  purchasedAnimals?: Record<string, number>;
  glitterDust?: number;
  glitchBenchmarks?: GlitchBenchmarks;
}

/**
 * Has the player reached ANY single glitch-galaxy milestone?
 *
 * Eligibility is OR, not AND: meeting one target (e.g. enough total galaxy
 * shards) is enough. Requiring all five at once made the feature effectively
 * unreachable — especially the prestige and shard targets, which can only grow
 * by prestiging.
 *
 * `galaxyShards` are counted together with `spentGalaxyShards` so spending
 * shards in the shop never sets the player back below the threshold.
 */
export function hasReachedGlitchMilestone(state: GlitchMilestoneState): boolean {
  const b = state.glitchBenchmarks ?? DEFAULT_GLITCH_BENCHMARKS;
  const totalShards = (state.galaxyShards || 0) + (state.spentGalaxyShards || 0);

  return (
    (state.prestigeCount || 0) >= b.prestigeTarget ||
    (state.craftedItems?.["mat_stardust"] || 0) >= b.stardustTarget ||
    totalShards >= b.shardsTarget ||
    (state.purchasedAnimals?.["phoenix"] || 0) >= b.phoenixTarget ||
    (state.glitterDust || 0) >= b.glitterTarget
  );
}
