import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { bindPairCode } from "./bindPairCode";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("sets roomCode on a live code and returns the TV connection", async () => {
  m.on(UpdateCommand).resolves({ Attributes: { tvConnectionId: "tv1" } });
  expect(await bindPairCode("0042", "KQXM")).toBe("tv1");
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "PAIR#0042", sk: "PAIR" });
  expect(i.ConditionExpression).toBe("attribute_exists(pk) AND #t > :now");
  expect(i.ExpressionAttributeValues).toMatchObject({ ":r": "KQXM" });
});

test("null for unknown or expired code", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await bindPairCode("9999", "KQXM")).toBeNull();
});
