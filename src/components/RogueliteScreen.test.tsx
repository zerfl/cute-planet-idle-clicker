import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RogueliteScreen } from "./RogueliteScreen";
import { createNewRun, createRogueliteMetaState } from "../roguelite/engine";

function makeProps() {
  return {
    isOpen: true,
    viewState: "run" as const,
    meta: createRogueliteMetaState(),
    onClose: vi.fn(),
    onBeginRunSetup: vi.fn(),
    onBackToIntro: vi.fn(),
    onOpenArchive: vi.fn(),
    onCloseArchive: vi.fn(),
    onStartRun: vi.fn(),
    onChooseEncounter: vi.fn(),
    onChoosePath: vi.fn(),
    onRerollEncounter: vi.fn(),
    onClaimVictory: vi.fn(),
    onClaimDefeat: vi.fn(),
  };
}

describe("RogueliteScreen", () => {
  it("renders the victory reward panel with chest, resources, and relic choices", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    let activeRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 42);
    activeRun = {
      ...activeRun,
      phase: "victory_rewards",
      status: "won",
      completedStations: 30,
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
    let activeRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 99);
    activeRun = {
      ...activeRun,
      phase: "defeat",
      status: "lost",
      completedStations: 20,
      currentEncounter: null,
    };

    render(<RogueliteScreen {...props} activeRun={activeRun} />);

    expect(screen.getByText("Tiefe Trosttruhe")).toBeInTheDocument();
    expect(screen.getByAltText("Roguelite Trosttruhe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trostbelohnung einsammeln/i })).toBeInTheDocument();
  });

  it("opens on the intro step and only starts a run after relic confirmation", async () => {
    const user = userEvent.setup();
    const props = { ...makeProps(), viewState: "intro" as const, activeRun: null };

    render(<RogueliteScreen {...props} />);

    expect(screen.getByText(/30 Stationen\. 3 Akte\./i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^start$/i }));
    expect(props.onBeginRunSetup).toHaveBeenCalled();
  });

  it("allows a new player with two unlocked relics to start the run", async () => {
    const user = userEvent.setup();
    const props = { ...makeProps(), viewState: "relic_select" as const, activeRun: null };
    props.meta.unlockedRelics = ["kometenherz", "pfotenkompass"];

    render(<RogueliteScreen {...props} />);

    expect(screen.getByText(/waehle bis zu 3 start-relikte/i)).toBeInTheDocument();
    const startButton = screen.getByRole("button", { name: /run starten/i });
    expect(startButton).toBeEnabled();

    await user.click(startButton);

    expect(props.onStartRun).toHaveBeenCalledWith(["kometenherz", "pfotenkompass"]);
  });

  it("allows a new player with one unlocked relic to start the run", async () => {
    const user = userEvent.setup();
    const props = { ...makeProps(), viewState: "relic_select" as const, activeRun: null };
    props.meta.unlockedRelics = ["kometenherz"];

    render(<RogueliteScreen {...props} />);

    const startButton = screen.getByRole("button", { name: /run starten/i });
    expect(startButton).toBeEnabled();

    await user.click(startButton);

    expect(props.onStartRun).toHaveBeenCalledWith(["kometenherz"]);
  });

  it("shows a visible recovery state instead of a blank panel when the run content payload is missing", () => {
    const props = makeProps();
    let activeRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 123);
    activeRun = {
      ...activeRun,
      phase: "node",
      currentEncounter: null,
    };

    render(<RogueliteScreen {...props} activeRun={activeRun} />);

    expect(screen.getByText(/run wird vorbereitet/i)).toBeInTheDocument();
    expect(screen.getByText(/phase: node/i)).toBeInTheDocument();
    expect(screen.getByText(/akt 1 von 3/i)).toBeInTheDocument();
  });

  it("shows a visible preparing state if the UI is already on run but no run object is mounted yet", () => {
    const props = { ...makeProps(), activeRun: null };

    render(<RogueliteScreen {...props} />);

    expect(screen.getByText(/run wird vorbereitet/i)).toBeInTheDocument();
  });

  it("keeps run choices clear while the info panel starts closed and toggles open on demand", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const activeRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 444);

    render(<RogueliteScreen {...props} activeRun={activeRun} />);

    expect(screen.getByText(/akt 1 von 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/run wird vorbereitet/i)).not.toBeInTheDocument();
    expect(activeRun.currentEncounter?.choices[0]?.title).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: new RegExp(activeRun.currentEncounter!.choices[0]!.title, "i"),
      }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("roguelite-run-info-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("roguelite-primary-content")).toBeInTheDocument();

    await user.click(screen.getByTestId("roguelite-drawer-toggle"));

    expect(screen.getByTestId("roguelite-run-info-panel")).toBeInTheDocument();
    expect(screen.getAllByText(/bossblick/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/buildform/i)).toBeInTheDocument();
    expect(screen.getByText(/letzte stationen/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("roguelite-drawer-toggle"));

    await waitFor(() => {
      expect(screen.queryByTestId("roguelite-run-info-panel")).not.toBeInTheDocument();
    });
  });

  it("hides the info panel toggle in victory and defeat reward states", () => {
    const props = makeProps();
    let victoryRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 17);
    victoryRun = {
      ...victoryRun,
      phase: "victory_rewards",
      status: "won",
      completedStations: 30,
      rewardPackage: {
        shards: 5,
        glitterDust: 44,
        relicChoiceIds: ["nebelglas", "mondfaden", "sternennaht"],
        victoryType: "normal",
        rewardLabel: "Boss gefallen",
      },
    };

    const { rerender } = render(<RogueliteScreen {...props} activeRun={victoryRun} />);

    expect(screen.queryByRole("button", { name: /details/i })).not.toBeInTheDocument();

    let defeatRun = createNewRun(props.meta, props.meta.unlockedRelics.slice(0, 2), 18);
    defeatRun = {
      ...defeatRun,
      phase: "defeat",
      status: "lost",
      completedStations: 20,
      currentEncounter: null,
    };

    rerender(<RogueliteScreen {...props} activeRun={defeatRun} />);

    expect(screen.queryByRole("button", { name: /details/i })).not.toBeInTheDocument();
  });
});
