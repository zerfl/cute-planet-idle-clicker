import { test, expect, type Page } from "@playwright/test";

const SAVE_KEY = "cute_planet_save_guest";

async function dismissTutorial(page: Page) {
  // Fresh-profile tutorial overlays the UI. click() auto-waits for the button to be actionable
  // (avoiding a race with the modal's mount), then wait for its backdrop to fully exit so a later
  // header click (e.g. open-roguelite) isn't intercepted by the lingering #modal-root dialog.
  await page.getByRole("button", { name: /Loslegen/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function openRogueliteAndStartRun(page: Page) {
  await page.getByTestId("open-roguelite-button").click();
  await expect(page.getByText(/30 Stationen\. 3 Akte\./)).toBeVisible();
  await page.getByRole("button", { name: /^Start$/ }).click();
  await expect(page.getByText(/Waehle bis zu 3 Start-Relikte/i)).toBeVisible();
  await page.getByRole("button", { name: /Run starten/i }).click();
  await expect(page.getByTestId("roguelite-primary-content")).toBeVisible();
}

// On a fresh profile the first-run coach overlay appears over the encounter.
async function dismissCoachIfPresent(page: Page) {
  const coach = page.getByTestId("roguelite-coach");
  if (await coach.isVisible().catch(() => false)) {
    const skip = coach.getByRole("button", { name: /berspringen/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
    } else {
      await coach.getByRole("button", { name: /Los geht/i }).click();
    }
    await expect(coach).toHaveCount(0);
  }
}

async function expectCoachButtonsInsideViewport(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const boxes = await page
    .getByTestId("roguelite-coach")
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          height: rect.height,
          label: button.textContent?.trim() ?? "",
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        };
      }),
    );

  for (const box of boxes) {
    expect(box.width, `${box.label} has width`).toBeGreaterThan(0);
    expect(box.height, `${box.label} has height`).toBeGreaterThan(0);
    expect(box.left, `${box.label} left edge`).toBeGreaterThanOrEqual(0);
    expect(box.top, `${box.label} top edge`).toBeGreaterThanOrEqual(0);
    expect(box.right, `${box.label} right edge`).toBeLessThanOrEqual(viewport!.width);
    expect(box.bottom, `${box.label} bottom edge`).toBeLessThanOrEqual(viewport!.height);
  }
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

  test("roguelite intro hub and relic draft read clearly", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
    await dismissTutorial(page);

    await page.getByTestId("open-roguelite-button").click();
    await expect(page.getByText(/30 Stationen\. 3 Akte\./)).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: "test-results/roguelite-intro.png" });

    await page.getByRole("button", { name: /^Start$/ }).click();
    await expect(page.getByText(/Waehle bis zu 3 Start-Relikte/i)).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: "test-results/roguelite-draft.png" });

    // The persistent help legend is reachable from the shell header on any screen.
    await page.getByTestId("roguelite-help-button").click();
    await expect(page.getByText(/Hilfe & Legende/i)).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: "test-results/roguelite-help.png" });
  });

  test("first-run coach guides the player, then dismisses", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
    await dismissTutorial(page);

    await openRogueliteAndStartRun(page);

    const coach = page.getByTestId("roguelite-coach");
    await expect(coach).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/roguelite-coach.png" });

    // Scope to the coach overlay: the encounter cards behind it carry randomized German text
    // that can contain "weiter", which would make a page-wide /Weiter/i match two buttons.
    await coach.getByRole("button", { name: /Weiter/i }).click();
    await coach.getByRole("button", { name: /Weiter/i }).click();
    await coach.getByRole("button", { name: /Los geht/i }).click();
    await expect(coach).toHaveCount(0);
  });

  for (const viewport of [
    { height: 568, width: 320 },
    { height: 480, width: 280 },
  ]) {
    test(`roguelite coach stays reachable at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
      await dismissTutorial(page);

      await openRogueliteAndStartRun(page);

      const coach = page.getByTestId("roguelite-coach");
      await expect(coach).toBeVisible();
      await expectCoachButtonsInsideViewport(page);

      await coach.getByRole("button", { name: /Weiter/i }).click();
      await expectCoachButtonsInsideViewport(page);

      await coach.getByRole("button", { name: /Weiter/i }).click();
      await expectCoachButtonsInsideViewport(page);

      await coach.getByRole("button", { name: /Los geht/i }).click();
      await expect(coach).toHaveCount(0);

      const primaryContent = page.getByTestId("roguelite-primary-content");
      const firstChoice = primaryContent.getByTestId("roguelite-choice-card").first();
      await expect(firstChoice).toBeVisible();
      await firstChoice.click();
      await expect(primaryContent).toBeVisible();
    });
  }

  test("desktop roguelite run keeps the choices clickable with the details rail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
    await dismissTutorial(page);

    await openRogueliteAndStartRun(page);
    await dismissCoachIfPresent(page);

    const primaryContent = page.getByTestId("roguelite-primary-content");
    const firstChoice = primaryContent.getByTestId("roguelite-choice-card").first();
    await expect(firstChoice).toBeVisible();

    // On desktop the build rail is open by default and sits beside (not over) the stage.
    await expect(page.getByTestId("roguelite-run-info-panel")).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/roguelite-desktop-run.png" });

    // Collapsing the rail keeps the stage usable.
    await page.getByTestId("roguelite-drawer-toggle").click();
    await expect(page.getByTestId("roguelite-run-info-panel")).toHaveCount(0);
    await expect(primaryContent).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/roguelite-desktop-rail-closed.png" });

    await firstChoice.click();
    await expect(page.getByText(/Akt \d von 3/i)).toBeVisible();
    await expect(primaryContent).toBeVisible();
  });

  test.describe("roguelite details sheet mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("opens as a right sheet and closes back to the run cleanly", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("#planet-container")).toBeVisible({ timeout: 30_000 });
      await dismissTutorial(page);

      await openRogueliteAndStartRun(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: "test-results/roguelite-mobile-coach.png" });
      await dismissCoachIfPresent(page);

      // On mobile the details panel starts closed.
      await expect(page.getByTestId("roguelite-run-info-panel")).toHaveCount(0);
      await page.screenshot({ path: "test-results/roguelite-mobile-run.png" });

      await page.getByTestId("roguelite-drawer-toggle").click();
      const sheet = page.getByTestId("roguelite-run-info-panel");
      await expect(sheet).toBeVisible();
      await expect(sheet).toContainText(/Bossblick/i);
      await page.waitForTimeout(300);
      await page.screenshot({ path: "test-results/roguelite-mobile-drawer-open.png" });

      await page.getByRole("button", { name: /Info-Panel schliessen/i }).click();
      await expect(sheet).toHaveCount(0);
      await expect(page.getByTestId("roguelite-primary-content")).toBeVisible();
    });
  });
});
