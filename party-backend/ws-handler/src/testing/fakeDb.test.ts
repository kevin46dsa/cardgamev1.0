import { expect, test, vi } from "vitest";
import * as fake from "./fakeDb";

test("the fake exports every function the real db barrel does (except the aws client plumbing)", async () => {
  const real = await vi.importActual<Record<string, unknown>>("@party/shared/src/db");
  const missing = Object.keys(real).filter((k) => !["db", "table"].includes(k) && !(k in fake));
  expect(missing).toEqual([]);
});

test("version conditions, ended tombstone, conditional create", async () => {
  fake.resetDb();
  expect(await fake.createRoom("ABCD", { n: 1 })).toBe(true);
  expect(await fake.createRoom("ABCD", { n: 2 })).toBe(false);
  expect(await fake.saveRoom("ABCD", { n: 2 }, 5)).toBe(false);
  expect(await fake.saveRoom("ABCD", { n: 2 }, 1)).toBe(true);
  expect(await fake.getRoom("ABCD")).toEqual({ status: "active", meta: { n: 2 }, version: 2 });
  await fake.endRoom("ABCD");
  expect(await fake.getRoom("ABCD")).toEqual({ status: "ended" });
  expect(await fake.withRoom("ABCD", (m) => m)).toEqual({ error: "ROOM_ENDED" });
  expect(await fake.createRoom("ABCD", {})).toBe(false);
  expect(await fake.withRoom("ZZZZ", (m) => m)).toEqual({ error: "ROOM_NOT_FOUND" });
});

test("connections: setConnection / clearConnection are conditional on the socket", async () => {
  fake.resetDb();
  await fake.createRoom("ABCD", {});
  await fake.putPlayer("ABCD", "p1", { name: "A", tokenHash: "h", online: true, joinedAt: 1, kicked: false });
  expect(await fake.setConnection("ABCD", "nobody", "c1")).toBe(false);
  expect(await fake.setConnection("ABCD", "p1", "c1")).toBe(true);
  expect(await fake.findByConnection("c1")).toEqual({ code: "ABCD", playerId: "p1" });
  await fake.setConnection("ABCD", "p1", "c2");
  expect(await fake.clearConnection("ABCD", "p1", "c1", 99)).toBe(false);
  expect(await fake.findByConnection("c1")).toBeNull();
  expect(await fake.clearConnection("ABCD", "p1", "c2", 99)).toBe(true);
  expect(await fake.getPlayer("ABCD", "p1")).toMatchObject({ online: false, offlineSince: 99 });
  expect(await fake.listPlayers("ABCD")).toHaveLength(1);
});
