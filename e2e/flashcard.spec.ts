import { test, expect } from "@playwright/test";

test.describe("Flash card game", () => {
  test("drawing a card updates the visible content", async ({ page }) => {
    await page.goto("/WhoIsMostLikely");
    const generate = page.getByRole("button", { name: /generate/i });
    await expect(generate).toBeVisible();
    await generate.click();
    await expect(page.locator(".card-face-message")).not.toBeEmpty();
  });

  test("no horizontal overflow on a 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/WhoIsMostLikely");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });
});
