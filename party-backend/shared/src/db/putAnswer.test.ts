import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { putAnswer } from "./putAnswer";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("unconditional put at ANSWER#match#player with ttl", async () => {
  m.on(PutCommand).resolves({});
  await putAnswer("KQXM", 2, "p1", "hello", 123);
  const i = m.commandCalls(PutCommand)[0]!.args[0].input;
  expect(i.ConditionExpression).toBeUndefined();
  expect(i.Item).toMatchObject({ pk: "ROOM#KQXM", sk: "ANSWER#2#p1", playerId: "p1", text: "hello", submittedAt: 123 });
  expect(i.Item!.ttl).toBeGreaterThan(Date.now() / 1000);
});
