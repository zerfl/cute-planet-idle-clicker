import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RogueliteScreen } from "./RogueliteScreen";
import { createNewRun, createRogueliteMetaState } from "../roguelite/engine";

function makeProps() {
  return {
    isOpen: true,
    meta: createRogueliteMetaState(),
    onClose: vi.fn(),
    onStartRun: vi.fn(),
    onChooseEncounter: vi.fn(),
    onChoosePath: vi.fn(),
    onRerollEncounter: vi.fn(),
    onToggleEquipRelic: vi.fn(),
    onClaimVictory: vi.fn(),
    onClaimDefeat: vi.fn(),
  };
}

describe("RogueliteScreen", () => {
  it("renders the victory reward panel with chest, resources, and relic choices", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    let activeRun = createNewRun(props.meta, 42);
    activeRun = {
      ...activeRun,
      phase: "victory_rewards",
      status: "won",
      completedStations: 10,
      rewardPackage: {
        shards: 5,
        glitterDust: 44,
        relicChoiceIds: ["nebelglas", "mondfaden", "sternennaht"],
        victoryType: "normal",
        rewardLabel: "Boss gefallen",
      },
    };

    render(<RogueliteScreen {...props} activeRun={activeRun} />);

    expect(screen.getByText("Boss gefallen")).toBeInTheDocument();
    expect(screen.getByAltText("Roguelite Siegestruhe")).toBeInTheDocument();
    expect(screen.getByText("Reliktwahl")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /nebelglas/i }));
    await user.click(screen.getByRole("button", { name: /belohnungen sichern/i }));

    expect(props.onClaimVictory).toHaveBeenCalledWith("nebelglas");
  });

  it("renders the defeat reward panel with the consolation chest", () => {
    const props = makeProps();
    let activeRun = createNewRun(props.meta, 99);
    activeRun = {
      ...activeRun,
      phase: "defeat",
      status: "lost",
      completedStations: 8,
      currentEncounter: null,
    };

    render(<RogueliteScreen {...props} activeRun={activeRun} />);

    expect(screen.getByText("Grosse Trosttruhe")).toBeInTheDocument();
    expect(screen.getByAltText("Roguelite Trosttruhe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trostbelohnung einsammeln/i })).toBeInTheDocument();
  });
});
