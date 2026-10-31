import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { getPairCode } from "./getPairCode";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());
const future = Math.floor(Date.now() / 1000) + 100;

test("returns live codes, null for missing or expired", async () => {
  m.on(GetCommand)
    .resolvesOnce({ Item: { tvConnectionId: "tv1", roomCode: "KQXM", ttl: future } })
    .resolvesOnce({ Item: { tvConnectionId: "tv1", ttl: 1 } })
    .resolvesOnce({});
  expect(await getPairCode("0042")).toEqual({ tvConnectionId: "tv1", roomCode: "KQXM" });
  expect(m.commandCalls(GetCommand)[0]!.args[0].input.Key).toEqual({ pk: "PAIR#0042", sk: "PAIR" });
  expect(await getPairCode("0042")).toBeNull();
  expect(await getPairCode("0042")).toBeNull();
});
