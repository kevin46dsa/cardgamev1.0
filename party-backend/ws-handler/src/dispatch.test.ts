import { expect, test, vi } from "vitest";
import { dispatch } from "./dispatch";
import { Bot } from "./testing/bot";
import { Game } from "./testing/game";

vi.mock("@party/shared/src/db", () => import("./testing/fakeDb"));

test.each([undefined, null, 5, "ping", [], {}, { action: 5 }, { action: "nope" }, { action: "toString" }, { action: "__proto__" }, { action: "constructor" }, { action: "hasOwnProperty" }])(
  "%j is an unknown action -> BAD_REQUEST",
  async (msg) => {
    const g = new Game({ n: 1, mode: "phone" });
    const b = await new Bot(g.w, "x").open();
    await dispatch(g.ctx(b), msg);
    expect(b.inbox()).toEqual([{ event: "error", code: "BAD_REQUEST", message: "unknown action", serverNow: g.w.clock.t }]);
  },
);

test("routes a known action", async () => {
  const g = new Game({ n: 1, mode: "phone" });
  const b = await new Bot(g.w, "x").open();
  await dispatch(g.ctx(b), { action: "ping" });
  expect(b.events()).toEqual(["pong"]);
});

const miss = { action: "joinRoom", roomCode: "ZZZZ", name: "Zed" };

test("20 wrong guesses from one IP block every guessing action (even correct ones) with RATE_LIMITED; other IPs and other actions are fine", async () => {
  const g = new Game({ n: 1, mode: "phone" });
  await g.setup();
  const b = await new Bot(g.w, "x").open();
  for (let i = 0; i < 20; i++) await dispatch(g.ctx(b, "7.7.7.7"), miss);
  expect(b.errors()).toEqual(Array(20).fill("ROOM_NOT_FOUND"));
  await dispatch(g.ctx(b, "7.7.7.7"), { action: "joinRoom", roomCode: g.host.roomCode, name: "Zoe" });
  await dispatch(g.ctx(b, "7.7.7.7"), { action: "tvPair" });
  expect(b.errors().slice(20)).toEqual(["RATE_LIMITED", "RATE_LIMITED"]);
  await dispatch(g.ctx(b, "7.7.7.7"), { action: "ping" });
  expect(b.events().at(-1)).toBe("pong");
  await dispatch(g.ctx(b, "8.8.8.8"), { action: "joinRoom", roomCode: g.host.roomCode, name: "Zoe" });
  expect(b.events().slice(-2)).toEqual(["joined", "snapshot"]);
});

test("successful joins never count as misses; the block lifts in the next 10-minute window", async () => {
  const g = new Game({ n: 1, mode: "phone" });
  await g.setup();
  for (let i = 0; i < 25; i++) {
    const b = await new Bot(g.w, `p${i}`).open();
    await dispatch(g.ctx(b, "4.4.4.4"), i === 24 ? miss : { action: "rejoin", roomCode: g.host.roomCode, playerId: g.host.id, token: "bad" });
  }
  // 25 misses (24 TOKEN_INVALID + 1 ROOM_NOT_FOUND) -> blocked
  const b = await new Bot(g.w, "late").open();
  await dispatch(g.ctx(b, "4.4.4.4"), miss);
  expect(b.errors()).toEqual(["RATE_LIMITED"]);
  g.w.clock.t += 600_000;
  await dispatch(g.ctx(b, "4.4.4.4"), miss);
  expect(b.errors()).toEqual(["RATE_LIMITED", "ROOM_NOT_FOUND"]);
});

test("tvPair: 20 pairing codes per IP per window", async () => {
  const g = new Game({ n: 1, mode: "phone" });
  const tv = await new Bot(g.w, "TV", true).open();
  for (let i = 0; i < 21; i++) await dispatch(g.ctx(tv, "3.3.3.3"), { action: "tvPair" });
  expect(tv.events().filter((e) => e === "pairCode")).toHaveLength(20);
  expect(tv.errors()).toEqual(["RATE_LIMITED"]);
});
