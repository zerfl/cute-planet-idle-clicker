import { test, expect } from "@playwright/test";

const SAVE_KEY = "cute_planet_save";

test.describe("cute planet smoke", () => {
  // Each test gets a fresh browser context, so localStorage already starts empty
  // and survives an in-test reload (which is exactly what we assert below).
  test("boots, round-trips clicks through the worker, and rehydrates on reload", async ({
    page,
  }) => {
    await page.goto("/");

    // Boot: #planet-container only renders once the worker has hydrated React
    // state (INIT -> STATE_UPDATE -> isLoaded), so this proves the worker booted.
    const planet = page.locator("#planet-container");
    await expect(planet).toBeVisible({ timeout: 30_000 });

    // First load shows the tutorial overlay (showTutorial defaults to true); close
    // it via its "Loslegen" button so it doesn't intercept planet clicks.
    await page.getByRole("button", { name: /Loslegen/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Each click round-trips through the worker (CLICK -> state.clicksCount++ ->
    // STATE_UPDATE -> setClicksCount).
    for (let i = 0; i < 12; i++) {
      await planet.click({ position: { x: 20, y: 20 } });
    }

    // The 5s autosave interval persists the new clicksCount; poll for it.
    await expect
      .poll(
        async () =>
          page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            if (!raw) return 0;
            try {
              return JSON.parse(raw).clicksCount ?? 0;
            } catch {
              return 0;
            }
          }, SAVE_KEY),
        { timeout: 20_000, intervals: [500, 1000, 2000] },
      )
      .toBeGreaterThan(0);

    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, SAVE_KEY);
    expect(saved).not.toBeNull();
    expect(saved.version).toBe(1); // client-localstorage-schema versioning
    const clicksBefore: number = saved.clicksCount;
    expect(clicksBefore).toBeGreaterThan(0);

    // Reload: the worker must rehydrate from the save, not reset.
    await page.reload();
    await expect(planet).toBeVisible({ timeout: 30_000 });

    const clicksAfter = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw).clicksCount ?? 0) : 0;
    }, SAVE_KEY);
    expect(clicksAfter).toBeGreaterThanOrEqual(clicksBefore);
  });
});
