import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { setConnection } from "./setConnection";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("sets connectionId + online, clears offlineSince, never creates the item", async () => {
  m.on(UpdateCommand).resolves({});
  m.on(PutCommand).resolves({});
  expect(await setConnection("KQXM", "p1", "c1")).toBe(true);
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key).toEqual({ pk: "ROOM#KQXM", sk: "PLAYER#p1" });
  expect(i.UpdateExpression).toBe("SET connectionId = :c, online = :t REMOVE offlineSince");
  expect(i.ConditionExpression).toBe("attribute_exists(pk)");
  expect(i.ExpressionAttributeValues).toEqual({ ":c": "c1", ":t": true });
  expect(m.commandCalls(PutCommand)[0]!.args[0].input.Item).toMatchObject({ pk: "CONN#c1", code: "KQXM", playerId: "p1" });
});

test("false when the player is missing", async () => {
  m.on(UpdateCommand).rejects(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }));
  expect(await setConnection("KQXM", "p1", "c1")).toBe(false);
  expect(m.commandCalls(PutCommand)).toHaveLength(0);
});
