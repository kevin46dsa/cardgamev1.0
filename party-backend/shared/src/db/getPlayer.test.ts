import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { getPlayer } from "./getPlayer";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("gets by key and strips storage attributes", async () => {
  m.on(GetCommand).resolvesOnce({ Item: { pk: "x", sk: "y", ttl: 1, name: "Ann" } }).resolvesOnce({});
  expect(await getPlayer("KQXM", "p1")).toEqual({ name: "Ann" });
  expect(m.commandCalls(GetCommand)[0]!.args[0].input.Key).toEqual({ pk: "ROOM#KQXM", sk: "PLAYER#p1" });
  expect(await getPlayer("KQXM", "p2")).toBeNull();
});
