import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { leaveRoom } from "./leaveRoom";

test("lobby: leaver gets `left`, TV + host + lobby see the shorter roster; they cannot rejoin", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  const p3 = g.bots[2]!;
  await leaveRoom(g.ctx(p3));
  expect(p3.last("left")).toBeDefined();
  expect(g.tv!.last("players").players.map((p: any) => p.name)).toEqual(["P1", "P2", "P4"]);
  await p3.send({ action: "rejoin", roomCode: g.host.roomCode, playerId: p3.id, token: p3.token });
  expect(p3.errors()).toEqual(["TOKEN_INVALID"]);
});

test("in a match: a contestant who leaves forfeits at once and may rejoin as crowd", async () => {
  const g = new Game({ n: 4, mode: "phone" });
  await g.setup();
  await g.toWrite();
  const [c, other] = g.contestants as [Bot, Bot];
  await leaveRoom(g.ctx(c));
  other.sync();
  expect(other.view!.phase).toBe("reveal");
  expect(other.view!.match!.result).toMatchObject({ outcome: "forfeit", winner: other.id });
  const nb = await new Bot(g.w, c.name).open();
  await nb.send({ action: "rejoin", roomCode: g.host.roomCode, playerId: c.id, token: c.token });
  nb.sync();
  expect(nb.view!.you!.status).not.toBe("playing");
});

test("the TV and unbound sockets cannot leave", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  await leaveRoom(g.ctx(g.tv!));
  const s = await new Bot(g.w, "s").open();
  await leaveRoom(g.ctx(s));
  expect(g.tv!.errors()).toEqual(["BAD_REQUEST"]);
  expect(s.errors()).toEqual(["TOKEN_INVALID"]);
});
