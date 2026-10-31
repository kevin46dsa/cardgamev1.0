import { expect, test } from "vitest";
import { mulberry32, pick, shuffle } from "./rng";

test("mulberry32 is deterministic and in [0,1)", () => {
  const a = mulberry32(7), b = mulberry32(7);
  for (let i = 0; i < 100; i++) {
    const x = a();
    expect(x).toBe(b());
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  }
});

test("shuffle keeps elements and does not mutate; pick handles empty", () => {
  const xs = [1, 2, 3, 4, 5];
  const s = shuffle(xs, mulberry32(1));
  expect([...s].sort()).toEqual(xs);
  expect(xs).toEqual([1, 2, 3, 4, 5]);
  expect(pick([], mulberry32(1))).toBeUndefined();
});
