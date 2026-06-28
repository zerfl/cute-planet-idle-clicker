import { describe, expect, it } from "vitest";

import {
  chooseEncounterOption,
  createNewRun,
  createRogueliteMetaState,
  finalizeRun,
  hasRenderableRoguelitePrimaryState,
  pickPath,
  selectVictoryRewards,
} from "./engine";

describe("roguelite engine", () => {
  it("creates a fresh run with a node encounter and the selected three start relics", () => {
    const meta = createRogueliteMetaState();
    meta.unlockedRelics = ["kometenherz", "pfotenkompass", "sternennaht", "mondfaden"];
    const run = createNewRun(meta, ["kometenherz", "pfotenkompass", "sternennaht"], 123456);

    expect(run.phase).toBe("node");
    expect(run.currentNode).not.toBeNull();
    expect(run.currentEncounter?.choices.length).toBeGreaterThanOrEqual(2);
    expect(run.activeRelicIds).toEqual(["kometenherz", "pfotenkompass", "sternennaht"]);
    expect(run.currentAct).toBe(1);
    expect(run.runArchetype.title.length).toBeGreaterThan(0);
    expect(run.runModifiers.length).toBeGreaterThan(0);
  });

  it("can move from a path choice into the next node encounter", () => {
    const meta = createRogueliteMetaState();
    let run = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 77);
    run = {
      ...run,
      phase: "path",
      currentNode: null,
      currentEncounter: null,
      pathChoices: [
        {
          id: "path_a",
          node: {
            id: "node_a",
            station: 2,
            act: 1,
            type: "merchant",
            danger: "low",
            label: "Sternen-Haendler",
            description: "A tiny shop test.",
          },
          rewardPreview: "Gezielte Stats oder Truhenwert",
          riskPreview: "Braucht genug Kristallstaub",
          routeHint: "Stark, wenn dein Run schon Dust produziert",
        },
      ],
    };

    run = pickPath(run, "path_a");

    expect(run.phase).toBe("node");
    expect(run.currentNode?.type).toBe("merchant");
    expect(run.currentEncounter?.choices.length).toBe(3);
  });

  it("finalizes a won run into permanent rewards", () => {
    const meta = createRogueliteMetaState();
    let run = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 404);

    run = {
      ...run,
      status: "won",
      phase: "victory_rewards",
      completedStations: 30,
      rewardPackage: {
        shards: 5,
        glitterDust: 44,
        relicChoiceIds: ["nebelglas", "mondfaden", "sternennaht"],
        victoryType: "normal",
        rewardLabel: "Boss gefallen",
      },
    };

    run = selectVictoryRewards(run, "nebelglas");
    const result = finalizeRun(meta, run);

    expect(result.grantedShards).toBe(5);
    expect(result.grantedGlitterDust).toBe(44);
    expect(result.meta.wins).toBe(1);
    expect(result.meta.unlockedRelics).toContain("nebelglas");
    expect(result.meta.unlockedPlanetSkins).toEqual([]);
  });

  it("uses the same seed to create the same boss and run identity", () => {
    const meta = createRogueliteMetaState();
    const runA = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 9001);
    const runB = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 9001);

    expect(runA.seed).toBe(runB.seed);
    expect(runA.runArchetype.id).toBe(runB.runArchetype.id);
    expect(runA.runModifiers.map((modifier) => modifier.id)).toEqual(
      runB.runModifiers.map((modifier) => modifier.id),
    );
    expect(runA.boss).toEqual(runB.boss);
    expect(runA.currentEncounter?.choices.map((choice) => choice.id)).toEqual(
      runB.currentEncounter?.choices.map((choice) => choice.id),
    );
  });

  it("attaches structured previews to encounter choices", () => {
    const meta = createRogueliteMetaState();
    const run = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 31415);
    const choice = run.currentEncounter?.choices[0];

    expect(choice?.preview?.gains.length ?? 0).toBeGreaterThan(0);
    expect(choice?.preview?.synergyHint).toBeTruthy();
  });

  it("creates a run whose first frame is immediately renderable", () => {
    const meta = createRogueliteMetaState();
    const run = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 2222);

    expect(run.phase).toBe("node");
    expect(hasRenderableRoguelitePrimaryState(run)).toBe(true);
    expect(run.currentEncounter?.choices.length ?? 0).toBeGreaterThan(0);
  });

  it("allows onboarding runs with fewer than three unlocked relics", () => {
    const meta = createRogueliteMetaState();
    meta.unlockedRelics = ["kometenherz"];

    const run = createNewRun(meta, ["kometenherz"], 3333);

    expect(run.activeRelicIds).toEqual(["kometenherz"]);
    expect(hasRenderableRoguelitePrimaryState(run)).toBe(true);
    expect(run.currentEncounter?.choices.length ?? 0).toBeGreaterThan(0);
  });

  it("spawns an act boss after station 10 and resumes the run on success", () => {
    const meta = createRogueliteMetaState();
    let run = createNewRun(meta, meta.unlockedRelics.slice(0, 2), 5150);
    run = {
      ...run,
      phase: "boss",
      completedStations: 10,
      currentAct: 2,
      boss: { ...run.boss, stage: "act_1" },
    };

    run = {
      ...run,
      stats: {
        ...run.stats,
        runClicks: 140,
        runPassive: 110,
        runShield: 90,
        bossDamage: 95,
      },
    };
    const next = chooseEncounterOption(run, "boss_aggressive");

    expect(next.phase).toBe("path");
    expect(next.currentAct).toBe(2);
  });
});
