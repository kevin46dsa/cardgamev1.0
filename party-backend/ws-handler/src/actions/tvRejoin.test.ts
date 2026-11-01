import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { tvRejoin } from "./tvRejoin";

test("TV drops: phones hear tvStatus; TV returns with its token and gets its snapshot", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  await g.w.drop(g.tv!.conn);
  expect(g.host.last("tvStatus")).toMatchObject({ connected: false });
  const tv2 = await new Bot(g.w, "TV", true).open();
  await tvRejoin(g.ctx(tv2), { roomCode: g.host.roomCode, tvToken: g.tv!.tvToken });
  expect(tv2.events()).toEqual(["snapshot"]);
  expect(tv2.last("snapshot").view.you).toBeUndefined();
  expect(g.host.inbox().filter((m) => m.event === "tvStatus").map((m) => m.connected)).toEqual([false, true]);
  // the old socket's late $disconnect must not unplug the new one
  await g.w.drop(g.tv!.conn);
  expect(g.host.inbox().filter((m) => m.event === "tvStatus")).toHaveLength(2);
});

test("bad token / room", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  const tv2 = await new Bot(g.w, "TV", true).open();
  await tvRejoin(g.ctx(tv2), { roomCode: g.host.roomCode, tvToken: "nope" });
  await tvRejoin(g.ctx(tv2), { roomCode: "ZZZZ", tvToken: "x" });
  await tvRejoin(g.ctx(tv2), { roomCode: g.host.roomCode });
  expect(tv2.errors()).toEqual(["TOKEN_INVALID", "ROOM_NOT_FOUND", "TOKEN_INVALID"]);
});

test("a phone-only room has no TV token to guess", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  const tv2 = await new Bot(g.w, "TV", true).open();
  await tvRejoin(g.ctx(tv2), { roomCode: g.host.roomCode, tvToken: "" });
  expect(tv2.errors()).toEqual(["TOKEN_INVALID"]);
});
