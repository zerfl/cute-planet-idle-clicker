import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncConflictDialog } from "./SyncConflictDialog";
import { GameStateProvider, type GameStateValue } from "../../contexts/GameStateContext";

const gameState: GameStateValue = {
  life: 1000,
  totalLifeEarned: 5000,
  secondsPlayed: 240,
  planetExp: 10,
  planetLevel: 8,
  prestigeCount: 2,
  glitterDust: 0,
  starsCount: 12,
  moonsCount: 3,
  shootingStarsCount: 1,
  clicksCount: 30,
  starClicksTriggered: 4,
  activeZodiacId: "katze",
  totalLps: 25,
  totalStarsLps: 5,
  totalAnimalsLps: 20,
  starPowerPerStar: 1,
  totalAnimalsCount: 6,
  unlockedAchievementsCount: 4,
  starCost: 100,
  maxMoons: 3,
};

describe("SyncConflictDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modal-root"></div>';
  });

  it("renders the account-switch comparison and routes both actions", async () => {
    const user = userEvent.setup();
    const keepCurrent = vi.fn();
    const adoptPrevious = vi.fn();

    render(
      <GameStateProvider value={gameState}>
        <SyncConflictDialog
          isOpen
          mode="account-switch"
          previousLocalSave={{
            version: 2,
            ownerId: null,
            lastSavedAt: 123,
            lastCloudUpdatedAt: null,
            life: 321,
            totalLifeEarned: 654,
            secondsPlayed: 120,
            planetLevel: 6,
            prestigeCount: 1,
            moonsCount: 2,
            purchasedUpgrades: [],
          }}
          purchasedUpgrades={[]}
          onKeepCurrentAccount={keepCurrent}
          onAdoptPreviousLocalSave={adoptPrevious}
        />
      </GameStateProvider>,
    );

    expect(screen.getByText(/anderer lokaler spielstand erkannt/i)).toBeInTheDocument();
    expect(screen.getByText("AKTUELLER ACCOUNT")).toBeInTheDocument();
    expect(screen.getByText("VORHERIGER LOKALER STAND")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /aktuellen account fortsetzen/i }));
    expect(keepCurrent).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /vorherigen lokalen stand uebernehmen/i }));
    expect(adoptPrevious).toHaveBeenCalledTimes(1);
  });
});
