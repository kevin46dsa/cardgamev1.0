import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { withRoom } from "./withRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());
const future = Math.floor(Date.now() / 1000) + 100;
const conflict = Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" });
const room = (n: number, version: number) => ({ Item: { status: "active", meta: { n }, version, ttl: future } });

test("applies fn and saves with the loaded version", async () => {
  m.on(GetCommand).resolves(room(1, 7));
  m.on(UpdateCommand).resolves({});
  const r = await withRoom<{ n: number }>("KQXM", (x) => ({ n: x.n + 1 }));
  expect(r).toEqual({ ok: true, meta: { n: 2 } });
  expect(m.commandCalls(UpdateCommand)[0]!.args[0].input.ExpressionAttributeValues).toMatchObject({ ":exp": 7, ":next": 8 });
});

test("retries on conflict, reloading and rerunning fn", async () => {
  m.on(GetCommand).resolvesOnce(room(1, 1)).resolvesOnce(room(10, 2));
  m.on(UpdateCommand).rejectsOnce(conflict).resolves({});
  const r = await withRoom<{ n: number }>("KQXM", (x) => ({ n: x.n + 1 }));
  expect(r).toEqual({ ok: true, meta: { n: 11 } });
  expect(m.commandCalls(GetCommand)).toHaveLength(2);
});

test("gives up with CONFLICT after 5 tries", async () => {
  m.on(GetCommand).resolves(room(1, 1));
  m.on(UpdateCommand).rejects(conflict);
  expect(await withRoom("KQXM", (x) => x)).toEqual({ error: "CONFLICT" });
  expect(m.commandCalls(UpdateCommand)).toHaveLength(5);
});

test("fn error is returned without saving; missing/ended rooms are distinguished", async () => {
  m.on(GetCommand).resolvesOnce(room(1, 1)).resolvesOnce({}).resolvesOnce({ Item: { status: "ended", ttl: future } });
  expect(await withRoom("KQXM", () => ({ error: "ROOM_FULL" }))).toEqual({ error: "ROOM_FULL" });
  expect(m.commandCalls(UpdateCommand)).toHaveLength(0);
  expect(await withRoom("KQXM", (x) => x)).toEqual({ error: "ROOM_NOT_FOUND" });
  expect(await withRoom("KQXM", (x) => x)).toEqual({ error: "ROOM_ENDED" });
});
