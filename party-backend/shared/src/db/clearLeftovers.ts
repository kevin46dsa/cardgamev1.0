import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { META, roomPk } from "./keys";

// A new room may reuse a code whose old room idle-expired: its META is gone but its player/answer/vote
// items live up to ITEM_TTL. Wipe them so the new room never sees ghosts. Runs once per room creation.
// ponytail: one Query page (1 MB) and unprocessed batch items are not retried; a room holds <= ~150 items,
// and anything missed still expires by TTL. Add paging/retry if rooms ever grow.
export async function clearLeftovers(code: string): Promise<void> {
  const pk = roomPk(code);
  const res = await db().send(new QueryCommand({
    TableName: table(),
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": pk },
    ConsistentRead: true,
  }));
  const keys = (res?.Items ?? []).filter((i) => i.sk !== META).map((i) => ({ pk, sk: i.sk as string }));
  for (let n = 0; n < keys.length; n += 25) {
    await db().send(new BatchWriteCommand({
      RequestItems: { [table()]: keys.slice(n, n + 25).map((Key) => ({ DeleteRequest: { Key } })) },
    }));
  }
}
