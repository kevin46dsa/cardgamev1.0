import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { endRoom } from "./endRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("writes an ended tombstone with 24h ttl", async () => {
  m.on(PutCommand).resolves({});
  await endRoom("KQXM");
  const item = m.commandCalls(PutCommand)[0]!.args[0].input.Item!;
  expect(item).toMatchObject({ pk: "ROOM#KQXM", sk: "META", status: "ended" });
  expect(item.ttl).toBeGreaterThan(Date.now() / 1000 + 86000);
  expect(item.meta).toBeUndefined();
});
