import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { getTv } from "./getTv";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("gets the TV item without storage attributes; null when absent", async () => {
  m.on(GetCommand).resolvesOnce({ Item: { pk: "a", sk: "TV", ttl: 1, connectionId: "c" } }).resolvesOnce({});
  expect(await getTv("KQXM")).toEqual({ connectionId: "c" });
  expect(m.commandCalls(GetCommand)[0]!.args[0].input.Key).toEqual({ pk: "ROOM#KQXM", sk: "TV" });
  expect(await getTv("KQXM")).toBeNull();
});
