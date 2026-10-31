import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { makeHost } from "./makeHost";

test("host hands over: hostChanged to everyone, old host is a normal player now", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  const p2 = g.bots[1]!;
  await makeHost(g.ctx(g.host), { playerId: p2.id });
  for (const b of g.everyone) expect(b.last("hostChanged").hostId).toBe(p2.id);
  await makeHost(g.ctx(g.host), { playerId: g.host.id });
  expect(g.host.errors()).toEqual(["NOT_HOST"]);
  await makeHost(g.ctx(p2), { playerId: "ghost" });
  await makeHost(g.ctx(p2), {});
  expect(p2.errors()).toEqual(["BAD_REQUEST", "BAD_REQUEST"]);
});
