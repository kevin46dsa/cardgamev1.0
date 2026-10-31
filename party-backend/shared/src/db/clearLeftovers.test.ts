import { mockClient } from "aws-sdk-client-mock";
import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { clearLeftovers } from "./clearLeftovers";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("deletes every old child item but never META, in batches of 25", async () => {
  const sks = ["META", "TV", ...Array.from({ length: 30 }, (_, i) => `PLAYER#p${i}`)];
  m.on(QueryCommand).resolves({ Items: sks.map((sk) => ({ pk: "ROOM#KQXM", sk })) });
  m.on(BatchWriteCommand).resolves({});
  await clearLeftovers("KQXM");
  const calls = m.commandCalls(BatchWriteCommand).map((c) => Object.values(c.args[0].input.RequestItems!)[0]!);
  expect(calls.map((c) => c.length)).toEqual([25, 6]);
  const deleted = calls.flat().map((r) => r.DeleteRequest!.Key!.sk);
  expect(deleted).not.toContain("META");
  expect(deleted).toContain("TV");
  expect(m.commandCalls(QueryCommand)[0]!.args[0].input.ExpressionAttributeValues).toEqual({ ":pk": "ROOM#KQXM" });
});

test("does nothing when there are no leftovers", async () => {
  m.on(QueryCommand).resolves({ Items: [{ pk: "ROOM#KQXM", sk: "META" }] });
  await clearLeftovers("KQXM");
  expect(m.commandCalls(BatchWriteCommand)).toHaveLength(0);
});
