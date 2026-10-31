import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import * as db from "../testing/fakeDb";
import { advance } from "./advance";

test("drop: only TV + host + the current opponent hear it, with a grace deadline", async () => {
  const g = new Game({ n: 5, mode: "tv" });
  await g.setup();
  await g.toWrite();
  const c = g.contestants.find((b) => b !== g.host)!;
  const opp = g.contestants.find((b) => b !== c)!;
  const bystander = g.crowd.find((b) => b !== g.host)!;
  const before = g.w.sender.log.length;
  await g.w.drop(c.conn);
  const heard = g.w.sender.log.slice(before).map((l) => l.to);
  expect(new Set(heard)).toEqual(new Set([g.tv!.conn, g.host.conn, opp.conn].filter((x) => x !== c.conn)));
  expect(heard).not.toContain(bystander.conn);
  const row = g.tv!.last("players").players.find((p: any) => p.id === c.id);
  expect(row).toMatchObject({ online: false, offlineSince: g.w.clock.t, graceEndsAt: g.w.clock.t + 15_000 });
  expect(g.tv!.last("players").nextDeadline).toBe(g.w.clock.t + 15_000);
});

test("contestant gone for 15 s forfeits when the deadline fires", async () => {
  const g = new Game({ n: 5, mode: "phone" });
  await g.setup();
  await g.toWrite();
  const c = g.contestants.find((b) => b !== g.host)!;
  const opp = g.contestants.find((b) => b !== c)!;
  await g.w.drop(c.conn);
  g.sync();
  expect(g.phase).toBe("write"); // not yet
  g.w.clock.t += 15_000;
  await advance(g.ctx(opp), { phaseId: opp.view!.phaseId });
  g.sync();
  expect(g.host.view!.phase).toBe("reveal");
  expect(g.host.view!.match!.result).toMatchObject({ outcome: "forfeit", winner: opp.id });
});

test("host away 30 s: next settle hands the host role over and tells everyone", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await g.w.drop(g.host.conn);
  g.w.clock.t += 31_000;
  await advance(g.ctx(g.bots[1]!), { phaseId: g.bots[1]!.view!.phaseId });
  const next = g.tv!.last("hostChanged").hostId;
  expect(next).not.toBe(g.host.id);
  expect(g.bots[1]!.last("hostChanged").hostId).toBe(next);
});

test("a late $disconnect of an old socket does not unplug a player who came back", async () => {
  const g = new Game({ n: 4, mode: "phone" });
  await g.setup();
  const p2 = g.bots[1]!;
  const nb = await new Bot(g.w, "P2").open();
  await nb.send({ action: "rejoin", roomCode: g.host.roomCode, playerId: p2.id, token: p2.token });
  await g.w.drop(p2.conn); // the old socket finally closes
  const room = (await db.getRoom<any>(g.host.roomCode)) as { meta: any };
  expect(room.meta.players.find((p: any) => p.id === p2.id).online).toBe(true);
  expect((await db.getPlayer(g.host.roomCode, p2.id))!.connectionId).toBe(nb.conn);
});

test("TV socket dropping tells the phones; unknown sockets are ignored", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  const stranger = await new Bot(g.w, "s").open();
  await g.w.drop(stranger.conn);
  await g.w.drop(g.tv!.conn);
  for (const b of g.bots) expect(b.last("tvStatus")).toMatchObject({ connected: false });
});

test("an old TV socket closing late does not wipe the TV that already reconnected", async () => {
  const g = new Game({ n: 2, mode: "tv" });
  await g.setup();
  const old = g.tv!;
  const tvToken = (await db.getTv(g.host.roomCode))!.tvTokenHash;
  const nt = await new Bot(g.w, "TV2", true).open();
  await db.setTvConnection(g.host.roomCode, nt.conn);
  await g.w.drop(old.conn);
  expect((await db.getTv(g.host.roomCode))!.connectionId).toBe(nt.conn);
  expect((await db.getTv(g.host.roomCode))!.tvTokenHash).toBe(tvToken);
  expect(g.host.events()).not.toContain("tvStatus");
  await g.w.drop(nt.conn);
  expect((await db.getTv(g.host.roomCode))!.connectionId).toBeUndefined();
  expect(g.host.last("tvStatus")).toMatchObject({ connected: false });
});

test("everybody dropping from a running 3-player game pauses, and the pause ends in the lobby after 60 s", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  await g.toWrite();
  await g.w.drop(g.bots[2]!.conn);
  expect(g.host.last("paused")).toBeDefined();
  g.w.clock.t += 61_000;
  await advance(g.ctx(g.host), { phaseId: g.host.view!.phaseId });
  g.sync();
  expect(g.host.view!.phase).toBe("lobby");
});
