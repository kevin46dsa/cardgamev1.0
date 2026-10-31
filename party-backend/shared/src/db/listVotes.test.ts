import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { listVotes } from "./listVotes";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("queries the match prefix", async () => {
  m.on(QueryCommand).resolves({ Items: [{ sk: "VOTE#2#p3", voterId: "p3", side: "B", ttl: 9 }] });
  expect(await listVotes("KQXM", 2)).toEqual([{ voterId: "p3", side: "B" }]);
  expect(m.commandCalls(QueryCommand)[0]!.args[0].input.ExpressionAttributeValues).toEqual({ ":pk": "ROOM#KQXM", ":p": "VOTE#2#" });
});
