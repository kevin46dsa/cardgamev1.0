import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { checkFrame, connectionRate, createRoomRate } from "./limits";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("checkFrame accepts JSON up to 2048 bytes only", () => {
  expect(checkFrame('{"action":"ping"}')).toEqual({ ok: true, msg: { action: "ping" } });
  expect(checkFrame(JSON.stringify({ t: "a".repeat(2048) }))).toEqual({ ok: false, error: "BAD_REQUEST" });
  expect(checkFrame("not json")).toEqual({ ok: false, error: "BAD_REQUEST" });
  expect(checkFrame(undefined)).toEqual({ ok: false, error: "BAD_REQUEST" });
});

test("connectionRate: 10 per 1s window, 11th denied", async () => {
  m.on(UpdateCommand).resolvesOnce({ Attributes: { count: 10 } }).resolvesOnce({ Attributes: { count: 11 } });
  expect((await connectionRate("c1")).allowed).toBe(true);
  expect((await connectionRate("c1")).allowed).toBe(false);
  const key = m.commandCalls(UpdateCommand)[0]!.args[0].input.Key!;
  expect(key.pk).toBe("RATE#conn:c1");
});

test("createRoomRate: 10 per hour per IP", async () => {
  m.on(UpdateCommand).resolves({ Attributes: { count: 11 } });
  expect((await createRoomRate("1.2.3.4")).allowed).toBe(false);
  const key = m.commandCalls(UpdateCommand)[0]!.args[0].input.Key!;
  expect(key.pk).toBe("RATE#ip:1.2.3.4");
  expect(key.sk).toBe(String(Math.floor(Date.now() / 1000 / 3600)));
});
