import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { roomPk, voteSk } from "./keys";
import { ITEM_TTL, ttlIn } from "./ttl";

// One item per (match, voter); overwrite = changing your vote before the deadline.
export async function putVote(code: string, matchNo: number, voterId: string, side: "A" | "B"): Promise<void> {
  await db().send(new PutCommand({
    TableName: table(),
    Item: { pk: roomPk(code), sk: voteSk(matchNo, voterId), voterId, side, ttl: ttlIn(ITEM_TTL) },
  }));
}
