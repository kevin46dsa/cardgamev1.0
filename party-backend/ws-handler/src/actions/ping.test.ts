import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { ping } from "./ping";

test("pong with serverNow, for a bound and an unbound socket", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  const stranger = await new Bot(g.w, "x").open();
  await ping(g.ctx(stranger));
  await ping(g.ctx(g.host));
  expect(stranger.inbox()).toEqual([{ event: "pong", serverNow: g.w.clock.t }]);
  expect(g.host.last("pong").serverNow).toBe(g.w.clock.t);
});
