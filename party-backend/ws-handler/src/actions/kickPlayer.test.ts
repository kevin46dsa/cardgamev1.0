import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { kickPlayer } from "./kickPlayer";

test("host kicks: target gets `kicked`, others a roster without them; NOT_HOST for others", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  const [, p2, , p4] = g.bots as [Bot, Bot, Bot, Bot];
  await kickPlayer(g.ctx(p2), { playerId: p4.id });
  expect(p2.errors()).toEqual(["NOT_HOST"]);
  await kickPlayer(g.ctx(g.host), { playerId: p4.id });
  expect(p4.events()).toContain("kicked");
  expect(g.tv!.last("players").players.map((p: any) => p.name)).toEqual(["P1", "P2", "P3"]);
  await kickPlayer(g.ctx(g.host), { playerId: g.host.id });
  await kickPlayer(g.ctx(g.host), {});
  expect(g.host.errors()).toEqual(["BAD_REQUEST", "BAD_REQUEST"]);
});

test("kicking a contestant forfeits the match for everyone", async () => {
  const g = new Game({ n: 5, mode: "phone" });
  await g.setup();
  await g.toWrite();
  const victim = g.contestants.find((b) => b !== g.host)!;
  const other = g.contestants.find((b) => b !== victim)!;
  await kickPlayer(g.ctx(g.host), { playerId: victim.id });
  g.sync();
  expect(g.host.view!.phase).toBe("reveal");
  expect(g.host.view!.match!.result).toMatchObject({ outcome: "forfeit", winner: other.id });
  expect(victim.events()).toContain("kicked");
  expect(victim.inbox().at(-1).event).toBe("kicked"); // no view after the kick
});
