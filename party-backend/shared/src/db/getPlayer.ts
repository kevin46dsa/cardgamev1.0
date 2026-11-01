import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { playerSk, roomPk } from "./keys";
import type { Player } from "./types";

export async function getPlayer(code: string, playerId: string): Promise<Player | null> {
  const { Item } = await db().send(new GetCommand({ TableName: table(), Key: { pk: roomPk(code), sk: playerSk(playerId) } }));
  if (!Item) return null;
  const { pk, sk, ttl, ...player } = Item;
  return player as Player;
}
