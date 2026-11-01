import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { createPairCode } from "./createPairCode";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());
const conflict = Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" });

test("pads to 4 digits, conditional put, 10 minute ttl", async () => {
  m.on(PutCommand).resolves({});
  expect(await createPairCode("tv1", () => 0.0042)).toBe("0042");
  const i = m.commandCalls(PutCommand)[0]!.args[0].input;
  expect(i.ConditionExpression).toBe("attribute_not_exists(pk) OR #t < :now");
  expect(i.Item).toMatchObject({ pk: "PAIR#0042", sk: "PAIR", tvConnectionId: "tv1" });
  expect(i.Item!.ttl).toBeGreaterThan(Date.now() / 1000 + 590);
  expect(i.Item!.ttl).toBeLessThanOrEqual(Date.now() / 1000 + 601);
});

test("retries on collision then succeeds", async () => {
  m.on(PutCommand).rejectsOnce(conflict).resolves({});
  expect(await createPairCode("tv1", () => 0.5)).toBe("5000");
  expect(m.commandCalls(PutCommand)).toHaveLength(2);
});

test("gives up with null after 10 collisions", async () => {
  m.on(PutCommand).rejects(conflict);
  expect(await createPairCode("tv1")).toBeNull();
  expect(m.commandCalls(PutCommand)).toHaveLength(10);
});
