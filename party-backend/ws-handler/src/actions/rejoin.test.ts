import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { rejoin } from "./rejoin";

const lobby = async (mode: "tv" | "phone", n: number) => {
  const g = new Game({ n, mode });
  await g.setup();
  return g;
};
const back = async (g: Game, b: Bot, over: object = {}) => {
  const nb = await new Bot(g.w, b.name).open();
  await rejoin(g.ctx(nb), { roomCode: g.host.roomCode, playerId: b.id, token: b.token, ...over });
  nb.sync();
  return nb;
};

test("wrong token / unknown player -> TOKEN_INVALID, unknown room -> ROOM_NOT_FOUND", async () => {
  const g = await lobby("phone", 3);
  const p2 = g.bots[1]!;
  expect((await back(g, p2, { token: "nope" })).errors()).toEqual(["TOKEN_INVALID"]);
  expect((await back(g, p2, { playerId: "ghost" })).errors()).toEqual(["TOKEN_INVALID"]);
  expect((await back(g, p2, { token: 5 })).errors()).toEqual(["TOKEN_INVALID"]);
  expect((await back(g, p2, { roomCode: "ZZZZ" })).errors()).toEqual(["ROOM_NOT_FOUND"]);
});

test("drop and come back: snapshot to the player, presence to TV + host only", async () => {
  const g = await lobby("tv", 4);
  await g.toWrite();
  const crowd = g.crowd.find((b) => b !== g.host)!;
  await g.w.drop(crowd.conn);
  expect(g.ref.view).toBeDefined();
  const before = g.w.sender.log.length;
  const nb = await back(g, crowd);
  expect(nb.events()).toEqual(["snapshot"]);
  expect(nb.view!.you!.id).toBe(crowd.id);
  expect(nb.view!.phase).toBe("write");
  const heard = g.w.sender.log.slice(before).filter((l) => l.to !== nb.conn).map((l) => l.to).sort();
  expect(heard).toEqual([g.tv!.conn, g.host.conn].sort());
});

test("a contestant gets their own answer back in the snapshot", async () => {
  const g = await lobby("phone", 3);
  await g.toWrite();
  const c = g.contestants[0]!;
  await c.send({ action: "submitAnswer", text: "my secret answer" });
  await g.w.drop(c.conn);
  const nb = await back(g, c);
  expect(nb.view!.match!.yourAnswer).toBe("my secret answer");
  expect(JSON.stringify(nb.inbox())).not.toContain("ans P"); // nothing of the opponent
});

test("away past the 15 s grace: the overdue forfeit is settled BEFORE they come back", async () => {
  const g = await lobby("phone", 4); // with 3 players any drop pauses the game instead (engine rule)
  await g.toWrite();
  const [c, other] = g.contestants as [Bot, Bot];
  await g.w.drop(c.conn);
  g.w.clock.t += 16_000;
  const nb = await back(g, c);
  expect(nb.view!.phase).toBe("reveal");
  expect(nb.view!.match!.result).toMatchObject({ outcome: "forfeit", winner: other.id });
  expect(nb.view!.you!.forfeited).toBe(true);
});

test("a kicked player cannot come back", async () => {
  const g = await lobby("phone", 4);
  const p4 = g.bots[3]!;
  await g.host.send({ action: "kickPlayer", playerId: p4.id });
  expect((await back(g, p4)).errors()).toEqual(["KICKED"]);
});
