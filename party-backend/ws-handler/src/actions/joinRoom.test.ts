import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { joinRoom } from "./joinRoom";

const lobby = async (mode: "tv" | "phone" = "tv", n = 3) => {
  const g = new Game({ n, mode });
  await g.setup();
  return g;
};

test("joins: joined + snapshot for the newcomer; in the lobby everyone sees the roster", async () => {
  const g = await lobby();
  const b = await new Bot(g.w, "Zoe").open();
  const before = g.w.sender.log.length;
  await joinRoom(g.ctx(b), { roomCode: g.host.roomCode.toLowerCase(), name: "Zoe" });
  expect(b.events()).toEqual(["joined", "snapshot"]);
  expect(b.last("snapshot").view.players).toHaveLength(4);
  const pushed = g.w.sender.log.slice(before).filter((l) => l.msg.event === "players").map((l) => l.to).sort();
  expect(pushed).toEqual([g.tv!.conn, ...g.bots.map((x) => x.conn)].sort());
});

test.each([
  [{ roomCode: "ZZZZ", name: "Zoe" }, "ROOM_NOT_FOUND"],
  [{ roomCode: "??", name: "Zoe" }, "ROOM_NOT_FOUND"],
  [{ roomCode: 5, name: "Zoe" }, "ROOM_NOT_FOUND"],
  [{ name: "p1" }, "ROOM_NOT_FOUND"],
])("bad code %j -> %s", async (msg, code) => {
  const g = await lobby();
  const b = await new Bot(g.w, "Zoe").open();
  await joinRoom(g.ctx(b), msg as never);
  expect(b.errors()).toEqual([code]);
});

test("name rules: taken (any case), empty, too long, blocked", async () => {
  const g = await lobby();
  for (const [name, code] of [["p2", "NAME_TAKEN"], ["", "NAME_INVALID"], ["x".repeat(13), "NAME_INVALID"], ["fuck", "NAME_BLOCKED"], [undefined, "NAME_INVALID"]] as const) {
    const b = await new Bot(g.w, "Zoe").open();
    await joinRoom(g.ctx(b), { roomCode: g.host.roomCode, name });
    expect(b.errors(), String(name)).toEqual([code]);
  }
});

test("room holds 10", async () => {
  const g = await lobby("phone", 10);
  const b = await new Bot(g.w, "Zoe").open();
  await joinRoom(g.ctx(b), { roomCode: g.host.roomCode, name: "Zoe" });
  expect(b.errors()).toEqual(["ROOM_FULL"]);
});

test("ended room -> ROOM_ENDED", async () => {
  const g = await lobby("phone");
  await g.host.send({ action: "endGame" });
  const b = await new Bot(g.w, "Zoe").open();
  await joinRoom(g.ctx(b), { roomCode: g.host.roomCode, name: "Zoe" });
  expect(b.errors()).toEqual(["ROOM_ENDED"]);
});

test("late join in a running game: crowd (late), and only TV + host hear about it", async () => {
  const g = await lobby("tv", 4);
  await g.toWrite();
  const b = await new Bot(g.w, "Zoe").open();
  const before = g.w.sender.log.length;
  await joinRoom(g.ctx(b), { roomCode: g.host.roomCode, name: "Zoe" });
  b.sync();
  expect(b.view!.you).toMatchObject({ status: "late", role: "crowd" });
  const heard = g.w.sender.log.slice(before).filter((l) => l.to !== b.conn).map((l) => `${l.msg.event}:${l.to}`).sort();
  expect(heard).toEqual([`players:${g.tv!.conn}`, `players:${g.host.conn}`].sort());
});

test("joining during the Finale is refused", async () => {
  const g = await lobby("phone", 3);
  await g.start();
  // push the room straight into act 4 (engine state is plain JSON)
  const db = await import("../testing/fakeDb");
  await db.withRoom<any>(g.host.roomCode, (s) => ({ ...s, act: 4 }));
  const b = await new Bot(g.w, "Zoe").open();
  await joinRoom(g.ctx(b), { roomCode: g.host.roomCode, name: "Zoe" });
  expect(b.errors()).toEqual(["FINALE_IN_PROGRESS"]);
});
