import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { findByConnection } from "./findByConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("queries the GSI and returns code + playerId", async () => {
  m.on(QueryCommand).resolves({ Items: [{ pk: "ROOM#KQXM", sk: "PLAYER#p1", connectionId: "c1" }] });
  expect(await findByConnection("c1")).toEqual({ code: "KQXM", playerId: "p1" });
  const i = m.commandCalls(QueryCommand)[0]!.args[0].input;
  expect(i.IndexName).toBe("connectionId-index");
  expect(i.KeyConditionExpression).toBe("connectionId = :c");
  expect(i.ExpressionAttributeValues).toEqual({ ":c": "c1" });
});

test("TV connection has playerId null; unknown is null", async () => {
  m.on(QueryCommand).resolvesOnce({ Items: [{ pk: "ROOM#KQXM", sk: "TV" }] }).resolvesOnce({ Items: [] });
  expect(await findByConnection("tv")).toEqual({ code: "KQXM", playerId: null });
  expect(await findByConnection("zzz")).toBeNull();
});
