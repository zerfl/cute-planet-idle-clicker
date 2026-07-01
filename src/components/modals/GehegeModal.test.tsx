import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GehegeModal } from "./GehegeModal";
import type { Animal, PlacedAnimal } from "../../types";

vi.mock("../../utils/audio", () => ({
  playPop: vi.fn(),
}));

const baseAnimal: Animal = {
  id: "bunny",
  name: "Bunny",
  germanName: "Hasi",
  emoji: "🐰",
  image: "/assets/animals/bunny.webp",
  sheetSrc: "/assets/animals/animated/bunny.webp",
  frameWidth: 160,
  frameHeight: 160,
  columns: 6,
  walkFrames: 6,
  liftFrames: 6,
  baseCost: 1,
  costMultiplier: 1.1,
  baseLps: 1,
  count: 0,
  description: "cute",
  germanDescription: "suess",
  color: "bg-pink-50",
};

const placedAnimal: PlacedAnimal = {
  id: "placed-1",
  animalId: "bunny",
  x: 40,
  y: 50,
};

function mockPointerCapture() {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: vi.fn(() => false),
  });
}

function renderModal(overrides?: Partial<ComponentProps<typeof GehegeModal>>) {
  const onUpdatePlacedAnimals = vi.fn();
  const onUpdateAnimalLove = vi.fn();
  const onUpdateAnimalLastPet = vi.fn();

  const view = render(
    <GehegeModal
      isOpen
      onClose={vi.fn()}
      isNight={false}
      purchasedAnimals={{ bunny: 1 }}
      animalDefs={[baseAnimal]}
      placedAnimals={[placedAnimal]}
      onUpdatePlacedAnimals={onUpdatePlacedAnimals}
      animalLove={{}}
      onUpdateAnimalLove={onUpdateAnimalLove}
      animalLastPet={{}}
      onUpdateAnimalLastPet={onUpdateAnimalLastPet}
      bowlLastFed={0}
      onUpdateBowlLastFed={vi.fn()}
      bowlFedMinutesCredited={0}
      onUpdateBowlFedMinutesCredited={vi.fn()}
      {...overrides}
    />,
  );

  const landscape = view.container.querySelector(
    '[style*="aspect-ratio"]',
  ) as HTMLDivElement | null;
  if (!landscape) {
    throw new Error("landscape element not found");
  }

  Object.defineProperty(landscape, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 600,
      width: 1000,
      height: 600,
      toJSON: () => ({}),
    }),
  });

  const petTarget = view.container.querySelector(
    'div[title^="Streicheln"]',
  ) as HTMLDivElement | null;
  if (!petTarget) {
    throw new Error("pet target not found");
  }

  return {
    ...view,
    landscape,
    petTarget,
    onUpdatePlacedAnimals,
    onUpdateAnimalLove,
    onUpdateAnimalLastPet,
  };
}

describe("GehegeModal sprite interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00.000Z"));
    mockPointerCapture();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps short taps as petting", () => {
    const { petTarget, onUpdateAnimalLove, onUpdateAnimalLastPet, onUpdatePlacedAnimals } =
      renderModal();

    fireEvent.pointerDown(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });
    fireEvent.pointerUp(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });
    fireEvent.click(petTarget);

    expect(onUpdateAnimalLove).toHaveBeenCalledWith({ bunny: 1 });
    expect(onUpdateAnimalLastPet).toHaveBeenCalledWith({
      bunny: new Date("2026-06-25T12:00:00.000Z").getTime(),
    });
    expect(onUpdatePlacedAnimals).not.toHaveBeenCalled();
  });

  it("long-press arms lift mode without petting", () => {
    const { petTarget, onUpdateAnimalLove, onUpdateAnimalLastPet } = renderModal();

    fireEvent.pointerDown(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });
    act(() => {
      vi.advanceTimersByTime(281);
    });

    fireEvent.pointerUp(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });

    expect(onUpdateAnimalLove).not.toHaveBeenCalled();
    expect(onUpdateAnimalLastPet).not.toHaveBeenCalled();
  });

  it("pointer cancel exits the held state back to walking", () => {
    const { petTarget, onUpdatePlacedAnimals, onUpdateAnimalLove } = renderModal();

    fireEvent.pointerDown(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });
    act(() => {
      vi.advanceTimersByTime(281);
    });
    fireEvent.pointerCancel(petTarget, { pointerId: 1, button: 0, clientX: 400, clientY: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onUpdatePlacedAnimals).not.toHaveBeenCalled();
    expect(onUpdateAnimalLove).not.toHaveBeenCalled();
    expect(petTarget.className).toContain("animate-bounce");
  });
});
