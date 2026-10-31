import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { answerSk, roomPk } from "./keys";
import { ITEM_TTL, ttlIn } from "./ttl";

// One item per (match, player); a plain overwrite, so editing an answer is free and never contends.
export async function putAnswer(code: string, matchNo: number, playerId: string, text: string, now = Date.now()): Promise<void> {
  await db().send(new PutCommand({
    TableName: table(),
    Item: { pk: roomPk(code), sk: answerSk(matchNo, playerId), playerId, text, submittedAt: now, ttl: ttlIn(ITEM_TTL) },
  }));
}
