import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { mulberry32 } from "@party/shared/src/rules";
import { createRoom } from "./createRoom";
import { tvPair } from "./tvPair";

const fresh = () => new Game({ n: 1, mode: "phone" });

test("phone room: roomCreated + snapshot with the creator as host", async () => {
  const g = fresh();
  const b = await new Bot(g.w, "Ann").open();
  await createRoom(g.ctx(b), { name: " Ann ", mode: "phone", settings: { rounds: 2 } });
  expect(b.events()).toEqual(["roomCreated", "snapshot"]);
  const [created, snap] = b.inbox();
  expect(created.roomCode).toMatch(/^[A-HJ-NP-Z]{4}$/);
  expect(created.token.length).toBeGreaterThan(10);
  expect(snap.view.you).toMatchObject({ id: created.playerId, isHost: true });
  expect(snap.view.settings.rounds).toBe(2);
  expect(snap.view.players.map((p: any) => p.name)).toEqual(["Ann"]);
  expect(snap.nextDeadline).toBeNull();
  expect(snap.view.code).toBe(created.roomCode);
});

test("tv room: the paired TV gets paired + its own snapshot (no `you`), the pair code is used up", async () => {
  const g = fresh();
  const tv = await new Bot(g.w, "TV", true).open();
  await tvPair(g.ctx(tv));
  const pairCode = tv.last("pairCode").code;
  const b = await new Bot(g.w, "Ann").open();
  await createRoom(g.ctx(b), { name: "Ann", mode: "tv", pairCode });
  expect(tv.events()).toEqual(["pairCode", "paired", "snapshot"]);
  expect(tv.last("paired")).toMatchObject({ roomCode: b.last("roomCreated").roomCode });
  expect(tv.last("paired").tvToken.length).toBeGreaterThan(10);
  expect(tv.last("snapshot").view.you).toBeUndefined();
  const c = await new Bot(g.w, "Bob").open();
  await createRoom(g.ctx(c), { name: "Bob", mode: "tv", pairCode });
  expect(c.errors()).toEqual(["PAIR_INVALID"]);
});

test.each([
  [{ name: "", mode: "phone" }, "NAME_INVALID"],
  [{ name: "a".repeat(13), mode: "phone" }, "NAME_INVALID"],
  [{ name: 7, mode: "phone" }, "NAME_INVALID"],
  [{ name: "fuck", mode: "phone" }, "NAME_BLOCKED"],
  [{ name: "Ann", mode: "both" }, "BAD_REQUEST"],
  [{ name: "Ann", mode: "tv", pairCode: "12" }, "PAIR_INVALID"],
  [{ name: "Ann", mode: "tv", pairCode: "0000" }, "PAIR_INVALID"],
  [{ name: "Ann", mode: "phone", settings: { rounds: 9 } }, "BAD_REQUEST"],
])("rejects %j with %s", async (msg, code) => {
  const g = fresh();
  const b = await new Bot(g.w, "Ann").open();
  await createRoom(g.ctx(b), msg as never);
  expect(b.errors()).toEqual([code]);
  expect(b.events()).toEqual(["error"]);
});

test("a taken room code is retried with another one", async () => {
  const g = fresh();
  const a = await new Bot(g.w, "Ann").open();
  const b = await new Bot(g.w, "Bob").open();
  await createRoom({ ...g.ctx(a), rng: mulberry32(5) }, { name: "Ann", mode: "phone" });
  await createRoom({ ...g.ctx(b), rng: mulberry32(5) }, { name: "Bob", mode: "phone" });
  expect(a.last("roomCreated").roomCode).not.toBe(b.last("roomCreated").roomCode);
});

test("per-IP limit: 10 rooms an hour, the 11th is RATE_LIMITED", async () => {
  const g = fresh();
  for (let i = 0; i < 11; i++) {
    const b = await new Bot(g.w, "Ann").open();
    await createRoom(g.ctx(b, "5.5.5.5"), { name: "Ann", mode: "phone" });
    expect(b.errors()).toEqual(i < 10 ? [] : ["RATE_LIMITED"]);
  }
  const other = await new Bot(g.w, "Zed").open();
  await createRoom(g.ctx(other, "6.6.6.6"), { name: "Zed", mode: "phone" });
  expect(other.errors()).toEqual([]);
});
