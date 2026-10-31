import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand, DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { clearTvConnection } from "./clearTvConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("removes connectionId only if it still matches, and drops the CONN# item", async () => {
  m.on(UpdateCommand).resolves({});
  expect(await clearTvConnection("KQXM", "c1")).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "ROOM#KQXM", sk: "TV" });
  expect(i.UpdateExpression).toBe("REMOVE connectionId");
  expect(i.ConditionExpression).toBe("connectionId = :c");
  expect(i.ExpressionAttributeValues).toEqual({ ":c": "c1" });
  expect(m.commandCalls(DeleteCommand)[0]!.args[0].input.Key).toEqual({ pk: "CONN#c1", sk: "CONN" });
});

test("false when the TV already reconnected on a newer socket; old CONN# item still removed", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await clearTvConnection("KQXM", "old")).toBe(false);
  expect(m.commandCalls(DeleteCommand)[0]!.args[0].input.Key).toEqual({ pk: "CONN#old", sk: "CONN" });
});

test("other errors propagate", async () => {
  m.on(UpdateCommand).rejects(new Error("boom"));
  await expect(clearTvConnection("KQXM", "c1")).rejects.toThrow("boom");
});
