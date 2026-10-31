import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { createRoom } from "./createRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("puts META v1 with a collision guard and idle ttl", async () => {
  m.on(PutCommand).resolves({});
  expect(await createRoom("KQXM", { a: 1 })).toBe(true);
  const i = m.commandCalls(PutCommand)[0]!.args[0].input;
  expect(i.ConditionExpression).toBe("attribute_not_exists(pk)");
  expect(i.Item).toMatchObject({ pk: "ROOM#KQXM", sk: "META", status: "active", meta: { a: 1 }, version: 1 });
  expect(i.Item!.ttl).toBeGreaterThan(Date.now() / 1000);
});

test("returns false on collision, rethrows other errors", async () => {
  m.on(PutCommand).rejectsOnce(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await createRoom("KQXM", {})).toBe(false);
  m.reset();
  m.on(PutCommand).rejects(new Error("boom"));
  await expect(createRoom("KQXM", {})).rejects.toThrow("boom");
});
