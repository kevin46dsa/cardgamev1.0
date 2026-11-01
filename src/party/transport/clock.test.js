import { describe, expect, it } from "vitest";
import { createClock } from "./clock";

describe("clock offset", () => {
  it("computes offset from serverNow and converts deadlines", () => {
    let local = 1_000;
    const clock = createClock(() => local);
    clock.sync(11_000); // server is 10s ahead
    expect(clock.now()).toBe(11_000);
    expect(clock.toLocal(16_000)).toBe(6_000);
    local = 3_000;
    expect(clock.remaining(16_000)).toBe(3_000);
  });

  it("never reports negative remaining time and ignores bad input", () => {
    const clock = createClock(() => 0);
    clock.sync(undefined);
    expect(clock.now()).toBe(0);
    expect(clock.remaining(-5)).toBe(0);
  });
});
