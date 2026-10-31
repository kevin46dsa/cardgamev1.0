import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { PAIR, pairPk } from "./keys";
import { PAIR_TTL, nowSec, ttlIn } from "./ttl";

// 4 digits, live for 10 minutes. An expired-but-not-yet-deleted code may be reused. null = 10 collisions in a row.
export async function createPairCode(tvConnectionId: string, rng: () => number = Math.random): Promise<string | null> {
  for (let i = 0; i < 10; i++) {
    const code4 = String(Math.floor(rng() * 10000)).padStart(4, "0");
    try {
      await db().send(new PutCommand({
        TableName: table(),
        Item: { pk: pairPk(code4), sk: PAIR, tvConnectionId, ttl: ttlIn(PAIR_TTL) },
        ConditionExpression: "attribute_not_exists(pk) OR #t < :now",
        ExpressionAttributeNames: { "#t": "ttl" },
        ExpressionAttributeValues: { ":now": nowSec() },
      }));
      return code4;
    } catch (e) {
      if (!isConditionFailed(e)) throw e;
    }
  }
  return null;
}
