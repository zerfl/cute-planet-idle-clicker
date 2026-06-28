import { describe, expect, it } from "vitest";

import {
  createNewRun,
  createRogueliteMetaState,
  finalizeRun,
  pickPath,
  selectVictoryRewards,
} from "./engine";

describe("roguelite engine", () => {
  it("creates a fresh run with a node encounter and two or fewer equipped relics", () => {
    const meta = createRogueliteMetaState();
    meta.equippedRelicIds = ["kometenherz", "pfotenkompass", "sternennaht"];
    const run = createNewRun(meta, 123456);

    expect(run.phase).toBe("node");
    expect(run.currentNode).not.toBeNull();
    expect(run.currentEncounter?.choices.length).toBeGreaterThanOrEqual(2);
    expect(run.activeRelicIds.length).toBeLessThanOrEqual(2);
    expect(run.runArchetype.title.length).toBeGreaterThan(0);
    expect(run.runModifiers.length).toBeGreaterThan(0);
  });

  it("can move from a path choice into the next node encounter", () => {
    const meta = createRogueliteMetaState();
    let run = createNewRun(meta, 77);
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
    let run = createNewRun(meta, 404);

    run = {
      ...run,
      status: "won",
      phase: "victory_rewards",
      completedStations: 10,
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
    const runA = createNewRun(meta, 9001);
    const runB = createNewRun(meta, 9001);

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
    const run = createNewRun(meta, 31415);
    const choice = run.currentEncounter?.choices[0];

    expect(choice?.preview?.gains.length ?? 0).toBeGreaterThan(0);
    expect(choice?.preview?.synergyHint).toBeTruthy();
  });
});
