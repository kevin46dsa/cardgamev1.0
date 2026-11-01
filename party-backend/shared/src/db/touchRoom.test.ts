import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { touchRoom } from "./touchRoom";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("only sets ttl, never version, and requires an active room", async () => {
  m.on(UpdateCommand).resolves({});
  expect(await touchRoom("KQXM")).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.UpdateExpression).toBe("SET #t = :t");
  expect(i.ConditionExpression).toBe("attribute_exists(pk) AND #s = :active");
});

test("false when room is gone or ended", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await touchRoom("KQXM")).toBe(false);
});
