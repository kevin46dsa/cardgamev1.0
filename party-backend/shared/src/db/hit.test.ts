import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { hit } from "./hit";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("atomic ADD on the window bucket with ttl", async () => {
  m.on(UpdateCommand).resolves({ Attributes: { count: 1 } });
  expect(await hit("ip:1.2.3.4", 3600, 10)).toEqual({ allowed: true, count: 1 });
  const i = m.commandCalls(UpdateCommand)[0]!.args[0].input;
  expect(i.Key!.pk).toBe("RATE#ip:1.2.3.4");
  expect(i.Key!.sk).toBe(String(Math.floor(Date.now() / 1000 / 3600)));
  expect(i.UpdateExpression).toBe("ADD #c :one SET #t = :t");
  expect(i.ExpressionAttributeValues![":t"]).toBeGreaterThan(Date.now() / 1000 + 60);
});

test("allowed up to the limit, denied just past it", async () => {
  m.on(UpdateCommand).resolvesOnce({ Attributes: { count: 10 } }).resolvesOnce({ Attributes: { count: 11 } });
  expect((await hit("k", 1, 10)).allowed).toBe(true);
  expect(await hit("k", 1, 10)).toEqual({ allowed: false, count: 11 });
});
