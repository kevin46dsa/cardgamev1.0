import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { setTvConnection } from "./setTvConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("updates connectionId on the TV item only if it exists", async () => {
  m.on(UpdateCommand).resolves({});
  expect(await setTvConnection("KQXM", "c9")).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "ROOM#KQXM", sk: "TV" });
  expect(i.ConditionExpression).toBe("attribute_exists(pk)");
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await setTvConnection("KQXM", "c9")).toBe(false);
});
