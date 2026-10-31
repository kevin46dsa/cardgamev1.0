import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { CONN, connPk } from "./keys";
import { ITEM_TTL, ttlIn } from "./ttl";

// Reverse lookup so $disconnect (which only knows the connectionId) can find its room and player
// with one GetItem. No GSI needed. playerId null = the room's TV.
export async function putConnection(connectionId: string, code: string, playerId: string | null): Promise<void> {
  await db().send(new PutCommand({
    TableName: table(),
    Item: { pk: connPk(connectionId), sk: CONN, code, playerId, ttl: ttlIn(ITEM_TTL) },
  }));
}
