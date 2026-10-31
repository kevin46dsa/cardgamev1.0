import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand, DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { clearConnection } from "./clearConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("removes connectionId only if it still matches, stamps offlineSince", async () => {
  m.on(UpdateCommand).resolves({});
  expect(await clearConnection("KQXM", "p1", "c1", 99)).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.UpdateExpression).toBe("SET online = :f, offlineSince = :now REMOVE connectionId");
  expect(i.ConditionExpression).toBe("connectionId = :c");
  expect(i.ExpressionAttributeValues).toEqual({ ":c": "c1", ":f": false, ":now": 99 });
  expect(m.commandCalls(DeleteCommand)[0]!.args[0].input.Key).toEqual({ pk: "CONN#c1", sk: "CONN" });
});

test("false when a newer connection replaced it", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await clearConnection("KQXM", "p1", "old")).toBe(false);
  expect(m.commandCalls(DeleteCommand)[0]!.args[0].input.Key).toEqual({ pk: "CONN#old", sk: "CONN" }); // old socket item still removed
});
