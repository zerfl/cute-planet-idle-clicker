import { test, expect, type Page } from "@playwright/test";

const SAVE_KEY = "cute_planet_save_guest";

async function dismissTutorial(page: Page) {
  const loslegenButton = page.getByRole("button", { name: /Loslegen/ });
  if (await loslegenButton.isVisible()) {
    await loslegenButton.click();
  }
}

async function openRogueliteAndStartRun(page: Page) {
  await page.getByTestId("open-roguelite-button").click();
  await expect(page.getByText(/30 Stationen\. 3 Akte\./)).toBeVisible();
  await page.getByRole("button", { name: /^Start$/ }).click();
  await expect(page.getByText(/Waehle bis zu 3 Start-Relikte/i)).toBeVisible();
  await page.getByRole("button", { name: /Run starten/i }).click();
  await expect(page.getByTestId("roguelite-primary-content")).toBeVisible();
}

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
    await dismissTutorial(page);
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
    expect(saved.version).toBe(3); // client-localstorage-schema versioning
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

  test("desktop roguelite drawer keeps the run actions clickable", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
    await dismissTutorial(page);

    await openRogueliteAndStartRun(page);

    const primaryContent = page.getByTestId("roguelite-primary-content");
    const firstChoice = primaryContent.getByTestId("roguelite-choice-card").first();

    await expect(firstChoice).toBeVisible();
    await expect(page.getByTestId("roguelite-run-info-panel")).toHaveCount(0);
    await page.screenshot({ path: "test-results/roguelite-desktop-run.png" });

    await page.getByTestId("roguelite-drawer-toggle").click();
    await expect(page.getByTestId("roguelite-run-info-panel")).toBeVisible();
    await expect(primaryContent).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/roguelite-desktop-drawer-open.png" });

    await firstChoice.click();
    await expect(primaryContent).toContainText(/Station|Route|Weggabelung|Run wird vorbereitet/i);
  });

  test.describe("roguelite drawer mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("opens as a right drawer and closes back to the run cleanly", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
      await dismissTutorial(page);

      await openRogueliteAndStartRun(page);

      const drawerToggle = page.getByTestId("roguelite-drawer-toggle");
      await page.screenshot({ path: "test-results/roguelite-mobile-run.png" });
      await drawerToggle.click();

      const drawer = page.getByTestId("roguelite-run-info-panel");
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText(/Bossblick/i);
      await page.waitForTimeout(300);
      await page.screenshot({ path: "test-results/roguelite-mobile-drawer-open.png" });

      await page.getByRole("button", { name: /Info-Panel schliessen/i }).click();
      await expect(drawer).toHaveCount(0);
      await expect(page.getByTestId("roguelite-primary-content")).toBeVisible();
    });
  });
});
