import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { listAnswers } from "./listAnswers";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("queries the match prefix", async () => {
  m.on(QueryCommand).resolves({ Items: [{ pk: "x", sk: "ANSWER#2#p1", playerId: "p1", text: "hi", submittedAt: 1, ttl: 9 }] });
  expect(await listAnswers("KQXM", 2)).toEqual([{ playerId: "p1", text: "hi", submittedAt: 1 }]);
  expect(m.commandCalls(QueryCommand)[0]!.args[0].input.ExpressionAttributeValues).toEqual({ ":pk": "ROOM#KQXM", ":p": "ANSWER#2#" });
});
