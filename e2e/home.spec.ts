import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("shows a single-column layout on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /pick a game/i })).toBeVisible();

    const cards = page.getByRole("button", { name: /let'?s play/i });
    await expect(cards.first()).toBeVisible();

    const first = await cards.first().boundingBox();
    const second = await cards.nth(1).boundingBox();
    // stacked, not side-by-side: second card starts below the first
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 5);
  });

  test("tap targets meet a 44px minimum", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const box = await page
      .getByRole("button", { name: /let'?s play/i })
      .first()
      .boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("clicking a game card navigates away from home", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /let'?s play/i })
      .first()
      .click();
    await expect(page).not.toHaveURL("/");
  });
});
