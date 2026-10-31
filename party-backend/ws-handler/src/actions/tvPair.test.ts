import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { tvPair } from "./tvPair";

test("returns a 4-digit code that lives 10 minutes; two TVs never share one", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  const a = await new Bot(g.w, "tv1", true).open();
  const b = await new Bot(g.w, "tv2", true).open();
  await tvPair(g.ctx(a));
  await tvPair(g.ctx(b));
  expect(a.last("pairCode").code).toMatch(/^\d{4}$/);
  expect(a.last("pairCode").expiresAt).toBe(g.w.clock.t + 600_000);
  expect(a.last("pairCode").code).not.toBe(b.last("pairCode").code);
});

test("asking again after expiry gives a fresh code", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  const a = await new Bot(g.w, "tv1", true).open();
  await tvPair(g.ctx(a));
  g.w.clock.t += 601_000;
  await tvPair(g.ctx(a));
  expect(a.inbox().filter((m) => m.event === "pairCode")).toHaveLength(2);
});
