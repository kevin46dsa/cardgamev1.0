import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { findByConnection } from "./findByConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("gets CONN#<id> (consistent read) and returns code + playerId", async () => {
  m.on(GetCommand).resolves({ Item: { pk: "CONN#c1", sk: "CONN", code: "KQXM", playerId: "p1" } });
  expect(await findByConnection("c1")).toEqual({ code: "KQXM", playerId: "p1" });
  const i = m.commandCalls(GetCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "CONN#c1", sk: "CONN" });
  expect(i.ConsistentRead).toBe(true);
});

test("TV connection has playerId null; unknown is null", async () => {
  m.on(GetCommand).resolvesOnce({ Item: { code: "KQXM", playerId: null } }).resolvesOnce({});
  expect(await findByConnection("tv")).toEqual({ code: "KQXM", playerId: null });
  expect(await findByConnection("zzz")).toBeNull();
});
