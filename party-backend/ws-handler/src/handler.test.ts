import { expect, test, vi } from "vitest";
import { Bot } from "./testing/bot";
import * as db from "./testing/fakeDb";
import { Game } from "./testing/game";

vi.mock("@party/shared/src/db", () => import("./testing/fakeDb"));

const setup = async () => {
  const g = new Game({ n: 1, mode: "phone" });
  const b = await new Bot(g.w, "x").open();
  return { g, b };
};

test("$connect answers 200 and does nothing", async () => {
  const { g } = await setup();
  const r = await g.w.handler(g.w.ev("$connect", "zzz"));
  expect(r).toEqual({ statusCode: 200 });
  expect(g.w.sender.log).toHaveLength(0);
});

test("bad JSON, empty body, non-object JSON, unknown action: an error frame each, always 200", async () => {
  const { g, b } = await setup();
  for (const body of ["nope", "{", "", "null", "[]", '{"action":"toString"}', '{"action":"__proto__"}', '{"nothing":1}'] as const)
    expect(await b.send(body)).toEqual({ statusCode: 200 });
  expect(await g.w.handler(g.w.ev("$default", b.conn, undefined))).toEqual({ statusCode: 200 });
  expect(b.errors()).toEqual(Array(9).fill("BAD_REQUEST"));
});

test("a frame over 2 KB is rejected before any db work", async () => {
  const { g, b } = await setup();
  const calls = db.calls.n;
  await b.send(JSON.stringify({ action: "ping", pad: "x".repeat(2100) }));
  expect(b.inbox()).toHaveLength(1);
  expect(b.errors()).toEqual(["BAD_REQUEST"]);
  expect(db.calls.n).toBe(calls);
  await b.send(JSON.stringify({ action: "ping", pad: "x".repeat(1900) }));
  expect(b.events()).toEqual(["error", "pong"]);
  void g;
});

test("10 messages a second per connection: the 11th gets ONE RATE_LIMITED, the rest are dropped silently; next second is fine", async () => {
  const { g, b } = await setup();
  for (let i = 0; i < 25; i++) await b.send({ action: "ping" });
  expect(b.events().filter((e) => e === "pong")).toHaveLength(10);
  expect(b.errors()).toEqual(["RATE_LIMITED"]);
  g.w.clock.t += 1000;
  await b.send({ action: "ping" });
  expect(b.events().filter((e) => e === "pong")).toHaveLength(11);
  const other = await new Bot(g.w, "y").open();
  await other.send({ action: "ping" });
  expect(other.events()).toEqual(["pong"]); // limits are per connection
});

test("createRoom: 10 an hour per source IP through the public handler", async () => {
  const { g } = await setup();
  const outcomes: string[] = [];
  for (let i = 0; i < 12; i++) {
    const b = await new Bot(g.w, "x").open();
    await g.w.send(b.conn, { action: "createRoom", name: "Ann", mode: "phone" }, "7.7.7.7");
    outcomes.push(b.events()[0]!);
  }
  expect(outcomes.filter((e) => e === "roomCreated")).toHaveLength(10);
  expect(outcomes.slice(10)).toEqual(["error", "error"]);
  g.w.clock.t += 3600_000;
  const b = await new Bot(g.w, "x").open();
  await g.w.send(b.conn, { action: "createRoom", name: "Ann", mode: "phone" }, "7.7.7.7");
  expect(b.events()[0]).toBe("roomCreated");
});

test("an internal failure becomes BAD_REQUEST with a generic message and never leaks the cause", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.hooks.beforeSave = () => { throw new Error("secret table arn:aws:dynamodb:..."); };
  await g.host.send({ action: "updateSettings", rounds: 2 });
  db.hooks.beforeSave = undefined;
  const e = g.host.last("error");
  expect(e).toMatchObject({ code: "BAD_REQUEST", message: "something went wrong" });
  expect(JSON.stringify(g.host.inbox())).not.toMatch(/secret|arn:/);
  expect(await g.host.send({ action: "ping" })).toEqual({ statusCode: 200 });
});

test("a version conflict is retried; side effects happen once", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  let n = 0;
  db.hooks.beforeSave = async () => {
    if (n++ > 0) return;
    const r = (await db.getRoom<any>(g.host.roomCode)) as { meta: unknown; version: number };
    await db.saveRoom(g.host.roomCode, r.meta, r.version); // somebody else saved first
  };
  await g.host.send({ action: "updateSettings", rounds: 3 });
  db.hooks.beforeSave = undefined;
  expect(g.host.inbox().filter((m) => m.event === "settings")).toHaveLength(1);
  expect(g.host.errors()).toEqual([]);
});

test("conflicts that never clear -> BAD_REQUEST 'room is busy'", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  db.hooks.beforeSave = async () => {
    const r = (await db.getRoom<any>(g.host.roomCode)) as { meta: unknown; version: number };
    await db.saveRoom(g.host.roomCode, r.meta, r.version);
  };
  await g.host.send({ action: "updateSettings", rounds: 3 });
  db.hooks.beforeSave = undefined;
  expect(g.host.last("error")).toMatchObject({ code: "BAD_REQUEST", message: "room is busy, try again" });
});

test("a dead socket (410) found while sending marks that player offline and the request still succeeds", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  const p4 = g.bots[3]!;
  g.w.sender.closed.add(p4.conn); // API Gateway would answer 410; $disconnect has not arrived yet
  await g.host.send({ action: "updateSettings", rounds: 2 });
  expect(g.host.errors()).toEqual([]);
  expect(g.host.last("settings").settings.rounds).toBe(2);
  const room = (await db.getRoom<any>(g.host.roomCode)) as { meta: any };
  expect(room.meta.players.find((p: any) => p.id === p4.id).online).toBe(false);
  expect(g.tv!.last("players").players.find((p: any) => p.id === p4.id).online).toBe(false);
  expect((await db.getPlayer(g.host.roomCode, p4.id))!.connectionId).toBeUndefined();
});

test("serverNow is on every frame", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  await g.start();
  expect(g.w.sender.log.every((l) => l.msg.serverNow === g.w.clock.t)).toBe(true);
});
