import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { playerSk, roomPk } from "./keys";
import { ITEM_TTL, ttlIn } from "./ttl";
import type { Player } from "./types";

// Full overwrite of the player's own item (each phone owns one item, so no cross-player contention).
export async function putPlayer(code: string, playerId: string, player: Player): Promise<void> {
  await db().send(new PutCommand({
    TableName: table(),
    Item: { ...player, pk: roomPk(code), sk: playerSk(playerId), ttl: ttlIn(ITEM_TTL) },
  }));
}
