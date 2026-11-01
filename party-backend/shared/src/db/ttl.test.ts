import { afterEach, expect, test, vi } from "vitest";
import { ttlIn } from "./ttl";

afterEach(() => vi.useRealTimers());

test("ttlIn is epoch seconds from now", () => {
  vi.useFakeTimers().setSystemTime(1_000_000_000);
  expect(ttlIn(60)).toBe(1_000_000 + 60);
});
