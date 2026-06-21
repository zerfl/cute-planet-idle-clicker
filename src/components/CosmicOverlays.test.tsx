import type { ComponentProps } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CosmicOverlays } from "./CosmicOverlays";

// Audio has browser-only side effects; stub it so a button click stays pure.
vi.mock("../utils/audio", () => ({
  playUpgrade: vi.fn(),
}));

function setup(overrides: Partial<ComponentProps<typeof CosmicOverlays>> = {}) {
  const props = {
    planetLevel: 20,
    inGlitchGalaxy: false,
    glitchPending: false,
    showRepairDialog: false,
    setShowRepairDialog: vi.fn(),
    setShowVoyageModal: vi.fn(),
    handleEnterGlitchGalaxy: vi.fn(),
    handleRepairGlitchGalaxy: vi.fn(),
    ...overrides,
  };
  render(<CosmicOverlays {...props} />);
  return props;
}

describe("CosmicOverlays — level 20 voyage trigger", () => {
  it("opens the Galaxy Voyage modal in the normal galaxy (not the worker-owned glitchPending flag)", async () => {
    // Regression: this button used to call setGlitchPending(true) locally, which
    // the worker's next state echo immediately reset to false — making the modal
    // flash open and close. It must open showVoyageModal instead.
    const props = setup({ inGlitchGalaxy: false });

    await userEvent.click(screen.getByRole("button", { name: /Galaxiereise Antreten/i }));

    expect(props.setShowVoyageModal).toHaveBeenCalledWith(true);
  });

  it("opens the voyage modal in the glitch galaxy too", async () => {
    const props = setup({ inGlitchGalaxy: true });

    await userEvent.click(screen.getByRole("button", { name: /SYSTEM REPAIR & TRAVEL/i }));

    expect(props.setShowVoyageModal).toHaveBeenCalledWith(true);
  });

  it("does not show the level-20 prompt before planet level 20", () => {
    setup({ planetLevel: 19 });

    expect(screen.queryByRole("button", { name: /Galaxiereise Antreten/i })).toBeNull();
  });

  it("still enters the glitch galaxy via the worker-driven purge overlay", async () => {
    // The glitch event is owned by the worker (it sets glitchPending); the purge
    // overlay path must remain intact.
    const props = setup({ glitchPending: true });

    await userEvent.click(screen.getByRole("button", { name: /PURGE & BETRETEN/i }));

    expect(props.handleEnterGlitchGalaxy).toHaveBeenCalledTimes(1);
  });
});
