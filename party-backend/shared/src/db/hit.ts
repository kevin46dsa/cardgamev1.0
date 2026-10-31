import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { ratePk } from "./keys";
import { nowSec } from "./ttl";

// Fixed-window counter: one atomic ADD per call on RATE#<key> / <bucket index>.
// ponytail: a burst of 2x limit is possible across a window boundary; use sliding window if that ever matters.
// Denied calls still increment (harmless, the bucket expires with its window + 60s).
export async function hit(key: string, windowSeconds: number, limit: number): Promise<{ allowed: boolean; count: number }> {
  const bucket = Math.floor(nowSec() / windowSeconds);
  const { Attributes } = await db().send(new UpdateCommand({
    TableName: table(),
    Key: { pk: ratePk(key), sk: String(bucket) },
    UpdateExpression: "ADD #c :one SET #t = :t",
    ExpressionAttributeNames: { "#c": "count", "#t": "ttl" },
    ExpressionAttributeValues: { ":one": 1, ":t": (bucket + 1) * windowSeconds + 60 },
    ReturnValues: "UPDATED_NEW",
  }));
  const count = Attributes?.count as number;
  return { allowed: count <= limit, count };
}

/** Current-window count for `key` without counting a hit (0 when nothing was recorded). */
export async function peekHits(key: string, windowSeconds: number): Promise<number> {
  const { Item } = await db().send(new GetCommand({
    TableName: table(),
    Key: { pk: ratePk(key), sk: String(Math.floor(nowSec() / windowSeconds)) },
  }));
  return (Item?.count as number | undefined) ?? 0;
}
