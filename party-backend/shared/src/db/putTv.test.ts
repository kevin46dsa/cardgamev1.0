import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { putTv } from "./putTv";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("writes the TV item with ttl", async () => {
  m.on(PutCommand).resolves({});
  await putTv("KQXM", { connectionId: "c", tvTokenHash: "h" });
  const item = m.commandCalls(PutCommand)[0]!.args[0].input.Item!;
  expect(item).toMatchObject({ pk: "ROOM#KQXM", sk: "TV", connectionId: "c", tvTokenHash: "h" });
  expect(item.ttl).toBeGreaterThan(Date.now() / 1000);
});
