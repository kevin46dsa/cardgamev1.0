import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { getRoom } from "./getRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());
const future = Math.floor(Date.now() / 1000) + 100;

test("reads META with a strongly consistent get", async () => {
  m.on(GetCommand).resolves({ Item: { status: "active", meta: { x: 1 }, version: 4, ttl: future } });
  expect(await getRoom("KQXM")).toEqual({ status: "active", meta: { x: 1 }, version: 4 });
  const i = m.commandCalls(GetCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "ROOM#KQXM", sk: "META" });
  expect(i.ConsistentRead).toBe(true);
});

test("missing or expired is null, tombstone is ended", async () => {
  m.on(GetCommand).resolvesOnce({}).resolvesOnce({ Item: { status: "active", meta: {}, version: 1, ttl: 1 } })
    .resolvesOnce({ Item: { status: "ended", ttl: future } });
  expect(await getRoom("AAAA")).toBeNull();
  expect(await getRoom("AAAA")).toBeNull();
  expect(await getRoom("AAAA")).toEqual({ status: "ended" });
});
