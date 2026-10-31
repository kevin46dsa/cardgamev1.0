import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { putVote } from "./putVote";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("unconditional put at VOTE#match#voter with ttl", async () => {
  m.on(PutCommand).resolves({});
  await putVote("KQXM", 2, "p3", "B");
  const i = m.commandCalls(PutCommand)[0]!.args[0].input;
  expect(i.ConditionExpression).toBeUndefined();
  expect(i.Item).toMatchObject({ pk: "ROOM#KQXM", sk: "VOTE#2#p3", voterId: "p3", side: "B" });
  expect(i.Item!.ttl).toBeGreaterThan(Date.now() / 1000);
});
