import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, expect, test } from "vitest";
import { deletePairCode } from "./deletePairCode";

const m = mockClient(DynamoDBDocumentClient);
beforeEach(() => m.reset());

test("deletes the PAIR item", async () => {
  m.on(DeleteCommand).resolves({});
  await deletePairCode("0042");
  expect(m.commandCalls(DeleteCommand)[0]!.args[0].input.Key).toEqual({ pk: "PAIR#0042", sk: "PAIR" });
});
