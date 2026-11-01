import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { META, roomPk } from "./keys";
import { ENDED_TTL, ttlIn } from "./ttl";

// Replaces META with a small tombstone for 24h so joiners get ROOM_ENDED instead of ROOM_NOT_FOUND.
// Player/answer/vote items are left to their own ttl (reads of an ended room go through getRoom first).
export async function endRoom(code: string): Promise<void> {
  await db().send(new PutCommand({
    TableName: table(),
    Item: { pk: roomPk(code), sk: META, status: "ended", version: 0, ttl: ttlIn(ENDED_TTL) },
  }));
}
