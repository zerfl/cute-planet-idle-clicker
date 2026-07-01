import { test, expect, type Page } from "@playwright/test";

const SAVE_KEY = "cute_planet_save_guest";

// Pixel-7-ish phone: the game breakpoint (900px) puts this firmly in mobile layout.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function bootGame(page: Page) {
  await page.goto("/");
  const planet = page.locator("#planet-container");
  await expect(planet).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Loslegen/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return planet;
}

test.describe("mobile main screen", () => {
  test("clicks round-trip through the worker and reach the save", async ({ page }) => {
    const planet = await bootGame(page);

    for (let i = 0; i < 5; i++) {
      await planet.click();
    }

    // Autosave runs every 5s; the click life must land in localStorage.
    await page.waitForFunction(
      (key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        try {
          return (JSON.parse(raw).life ?? 0) > 0;
        } catch {
          return false;
        }
      },
      SAVE_KEY,
      { timeout: 15_000 },
    );
  });

  test("bottom action bar is reachable and opens the animals sheet", async ({ page }) => {
    await bootGame(page);
    const viewport = page.viewportSize()!;

    const animalsButton = page.getByRole("button", { name: /Tiere zuechten/i });
    await expect(animalsButton).toBeVisible();

    const box = (await animalsButton.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(40);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.y).toBeGreaterThan(viewport.height / 2); // actually anchored at the bottom

    await animalsButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Sheet presentation: the panel hugs the bottom edge of the viewport.
    const panel = dialog.locator(".modal-frame-target").first();
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.y + panelBox.height).toBeGreaterThanOrEqual(viewport.height - 2);
    expect(panelBox.width).toBeGreaterThanOrEqual(viewport.width - 2);

    // Tapping the exposed backdrop above the sheet closes it.
    await dialog.click({ position: { x: 12, y: 12 } });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the browser back button closes an open sheet instead of leaving the game", async ({
    page,
  }) => {
    await bootGame(page);

    await page.getByRole("button", { name: /Forschung/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("#planet-container")).toBeVisible();
  });
});
