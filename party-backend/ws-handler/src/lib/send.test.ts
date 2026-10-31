import { mockClient } from "aws-sdk-client-mock";
import { ApiGatewayManagementApiClient, GoneException, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { makeSender } from "./send";

const m = mockClient(ApiGatewayManagementApiClient);
beforeEach(() => m.reset());
afterEach(() => vi.restoreAllMocks());
const gone = new GoneException({ message: "gone", $metadata: {} });

test("send posts the JSON to the connection", async () => {
  m.on(PostToConnectionCommand).resolves({});
  expect(await makeSender("https://x").send("c1", { event: "pong" })).toEqual({ gone: [], failed: 0 });
  expect(m.commandCalls(PostToConnectionCommand)[0]!.args[0].input).toEqual({ ConnectionId: "c1", Data: '{"event":"pong"}' });
});

test("broadcast reports 410s (by name or status) as gone and counts other errors without throwing", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.on(PostToConnectionCommand, { ConnectionId: "dead" }).rejects(gone)
    .on(PostToConnectionCommand, { ConnectionId: "dead2" }).rejects(Object.assign(new Error("x"), { $metadata: { httpStatusCode: 410 } }))
    .on(PostToConnectionCommand, { ConnectionId: "bad" }).rejects(new Error("500"))
    .on(PostToConnectionCommand, { ConnectionId: "ok" }).resolves({});
  const r = await makeSender("https://x").broadcast(["ok", "dead", "bad", "dead2"], { event: "pong" });
  expect(r).toEqual({ gone: ["dead", "dead2"], failed: 1 });
});

test("rejects oversized payloads, warns above 2 KB", async () => {
  m.on(PostToConnectionCommand).resolves({});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const s = makeSender("https://x");
  await expect(s.send("c", { event: "x", pad: "a".repeat(31 * 1024) } as never)).rejects.toThrow(/byte limit/);
  expect(m.commandCalls(PostToConnectionCommand)).toHaveLength(0);
  await s.send("c", { event: "x", pad: "a".repeat(3000) } as never);
  expect(warn).toHaveBeenCalledOnce();
});
