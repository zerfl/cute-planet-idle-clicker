import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFloatingTexts } from "./useFloatingTexts";
import type { FloatingText } from "../types";

const makeText = (
  id: number,
  createdAt: number,
  type: FloatingText["type"] = "click",
): FloatingText => ({
  id,
  x: 0,
  y: 0,
  text: "+1",
  type,
  createdAt,
});

describe("useFloatingTexts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts empty and exposes a monotonically increasing id ref", () => {
    const { result } = renderHook(() => useFloatingTexts());
    expect(result.current.floatingTexts).toEqual([]);
    expect(result.current.nextParticleId.current).toBe(1);
  });

  it("prunes expired particles on the sweep (1.2s for normal, 4s for level)", () => {
    const { result } = renderHook(() => useFloatingTexts());

    act(() => {
      result.current.setFloatingTexts([
        makeText(1, 0, "click"), // expires at 1200ms
        makeText(2, 0, "level"), // expires at 4000ms
      ]);
    });

    // Advance just past the normal-particle lifetime; the level text survives.
    act(() => {
      vi.setSystemTime(1300);
      vi.advanceTimersByTime(200);
    });

    expect(result.current.floatingTexts.map((t) => t.id)).toEqual([2]);

    // Advance past the level-text lifetime; everything is pruned.
    act(() => {
      vi.setSystemTime(4200);
      vi.advanceTimersByTime(200);
    });

    expect(result.current.floatingTexts).toEqual([]);
  });

  it("clears the sweep interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useFloatingTexts());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
