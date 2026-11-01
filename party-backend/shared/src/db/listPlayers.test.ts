import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { listPlayers } from "./listPlayers";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("queries begins_with PLAYER# and adds playerId", async () => {
  m.on(QueryCommand).resolves({ Items: [{ pk: "ROOM#KQXM", sk: "PLAYER#p1", ttl: 1, name: "Ann" }] });
  expect(await listPlayers("KQXM")).toEqual([{ name: "Ann", playerId: "p1" }]);
  const i = m.commandCalls(QueryCommand)[0]!.args[0].input;
  expect(i.KeyConditionExpression).toBe("pk = :pk AND begins_with(sk, :p)");
  expect(i.ExpressionAttributeValues).toEqual({ ":pk": "ROOM#KQXM", ":p": "PLAYER#" });
});
