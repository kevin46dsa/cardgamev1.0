import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { putPlayer } from "./putPlayer";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("writes PLAYER#id with ttl", async () => {
  m.on(PutCommand).resolves({});
  await putPlayer("KQXM", "p1", { name: "Ann", tokenHash: "h", online: true, joinedAt: 5, kicked: false });
  const item = m.commandCalls(PutCommand)[0]!.args[0].input.Item!;
  expect(item).toMatchObject({ pk: "ROOM#KQXM", sk: "PLAYER#p1", name: "Ann", tokenHash: "h" });
  expect(item.ttl).toBeGreaterThan(Date.now() / 1000);
});
