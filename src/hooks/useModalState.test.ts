import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useModalState } from "./useModalState";

describe("useModalState", () => {
  it("defaults the tutorial open and every other flag closed", () => {
    const { result } = renderHook(() => useModalState());
    expect(result.current.showTutorial).toBe(true);
    expect(result.current.showAnimalsModal).toBe(false);
    expect(result.current.showPrestigeModal).toBe(false);
    expect(result.current.showResetDialog).toBe(false);
  });

  it("opens a modal via its open* helper without touching the others", () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.openAnimalsModal());

    expect(result.current.showAnimalsModal).toBe(true);
    // Independent flags: opening one must not open another.
    expect(result.current.showStarsModal).toBe(false);
    expect(result.current.showCraftingModal).toBe(false);
  });

  it("keeps flags independent so overlays can stack", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.setShowCloudSyncModal(true);
      result.current.setShowResetDialog(true);
    });

    expect(result.current.showCloudSyncModal).toBe(true);
    expect(result.current.showResetDialog).toBe(true);

    act(() => result.current.setShowCloudSyncModal(false));

    expect(result.current.showCloudSyncModal).toBe(false);
    expect(result.current.showResetDialog).toBe(true);
  });
});
