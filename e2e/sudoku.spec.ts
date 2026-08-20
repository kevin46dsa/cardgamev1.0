import { test, expect } from "@playwright/test";

const buildFixture = () => {
  const value = Array.from({ length: 9 }, () => Array(9).fill(0));
  const solution = Array.from({ length: 9 }, () => Array(9).fill(5));
  solution[8][8] = 3; // one cell solves to a different digit
  return { value, solution };
};

test.describe("Sudoku", () => {
  test.beforeEach(async ({ page }) => {
    const { value, solution } = buildFixture();
    await page.route("**/api/dosuku**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          newboard: {
            grids: [{ value, solution, difficulty: "easy" }],
            results: 1,
            message: "All Ok",
          },
        }),
      })
    );

    await page.goto("/sudoku");
    await page.getByRole("button", { name: "Generate Board" }).click();
    await expect(page.getByLabel("Row 1 Column 1")).toBeVisible();
  });

  test("stretches the board close to the viewport edges on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const board = page.getByRole("grid", { name: "Sudoku Board" });
    const box = await board.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(375 * 0.9);
  });

  test("disables a digit's button once it has been placed 9 times", async ({
    page,
  }) => {
    for (let col = 0; col < 9; col++) {
      await page.getByLabel(`Row 1 Column ${col + 1}`).click();
      await page.getByRole("button", { name: "5", exact: true }).click();
    }

    // Select another blank cell so the number pad isn't disabled wholesale.
    await page.getByLabel("Row 9 Column 9").click();

    await expect(
      page.getByRole("button", { name: "5", exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "3", exact: true })
    ).toBeEnabled();
  });
});
