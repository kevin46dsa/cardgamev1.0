import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import * as db from "../testing/fakeDb";
import { advance } from "./advance";

const started = async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await g.start();
  return g;
};

test("deadline passed: the phase moves and everyone gets their `state`", async () => {
  const g = await started();
  g.w.clock.t = g.ref.view!.endsAt;
  await advance(g.ctx(g.tv!), { phaseId: g.tv!.view!.phaseId });
  g.sync();
  expect(g.phase).toBe("write");
  expect(g.host.view!.phase).toBe("write");
  expect(g.tv!.nd).toBeNull(); // write has no timer
});

test("too early and stale are SILENT: no frames, no database write", async () => {
  const g = await started();
  const id = g.tv!.view!.phaseId;
  const version = async () => ((await db.getRoom(g.host.roomCode)) as { version: number }).version;
  const v0 = await version();
  const before = g.w.sender.log.length;
  await advance(g.ctx(g.tv!), { phaseId: id }); // too early
  await advance(g.ctx(g.host), { phaseId: id - 1 }); // stale
  await advance(g.ctx(g.host), { phaseId: id + 5 }); // from the future
  expect(g.w.sender.log.length).toBe(before);
  expect(await version()).toBe(v0);
});

test("everyone firing at once moves the phase exactly once", async () => {
  const g = await started();
  g.w.clock.t = g.ref.view!.endsAt;
  const id = g.tv!.view!.phaseId;
  await Promise.all([g.tv!, ...g.bots].map((b) => advance(g.ctx(b), { phaseId: id })));
  g.sync();
  expect(g.phase).toBe("write");
  expect(g.host.view!.phaseId).toBe(id + 1);
  expect(g.host.inbox().filter((m) => m.event === "state" && m.view.phase === "write")).toHaveLength(1);
});

test("bad phaseId -> BAD_REQUEST; unbound socket -> TOKEN_INVALID", async () => {
  const g = await started();
  await advance(g.ctx(g.host), { phaseId: "3" });
  await advance(g.ctx(g.host), {});
  const s = await new Bot(g.w, "s").open();
  await advance(g.ctx(s), { phaseId: 1 });
  expect(g.host.errors()).toEqual(["BAD_REQUEST", "BAD_REQUEST"]);
  expect(s.errors()).toEqual(["TOKEN_INVALID"]);
});

test("a write phase nobody answers never ends on its own (no timer)", async () => {
  const g = await started();
  await g.tick();
  expect(g.phase).toBe("write");
  g.w.clock.t += 60 * 60 * 1000;
  await advance(g.ctx(g.tv!), { phaseId: g.tv!.view!.phaseId });
  g.sync();
  expect(g.phase).toBe("write");
});
