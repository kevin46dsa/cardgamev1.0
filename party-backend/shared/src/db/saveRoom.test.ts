import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { saveRoom } from "./saveRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("conditional on version, bumps it and refreshes ttl", async () => {
  m.on(UpdateCommand).resolves({});
  expect(await saveRoom("KQXM", { a: 2 }, 3)).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "ROOM#KQXM", sk: "META" });
  expect(i.ConditionExpression).toBe("#v = :exp AND #s = :active");
  expect(i.ExpressionAttributeValues).toMatchObject({ ":m": { a: 2 }, ":exp": 3, ":next": 4 });
  expect(i.ExpressionAttributeValues![":t"]).toBeGreaterThan(Date.now() / 1000 + 1700);
});

test("false on version conflict", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await saveRoom("KQXM", {}, 3)).toBe(false);
});
