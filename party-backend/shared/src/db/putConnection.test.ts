import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { putConnection } from "./putConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("writes CONN#<id> pointing at the room and player, with a ttl", async () => {
  m.on(PutCommand).resolves({});
  await putConnection("c1", "KQXM", "p1");
  const i = m.commandCalls(PutCommand)[0]!.args[0].input;
  expect(i.Item).toMatchObject({ pk: "CONN#c1", sk: "CONN", code: "KQXM", playerId: "p1" });
  expect(i.Item!.ttl).toBeGreaterThan(Date.now() / 1000);
});
