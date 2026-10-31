import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { PAIR, pairPk } from "./keys";
import { nowSec } from "./ttl";

export async function getPairCode(code4: string): Promise<{ tvConnectionId: string; roomCode?: string } | null> {
  const { Item } = await db().send(new GetCommand({ TableName: table(), Key: { pk: pairPk(code4), sk: PAIR }, ConsistentRead: true }));
  if (!Item || Item.ttl <= nowSec()) return null;
  return { tvConnectionId: Item.tvConnectionId, roomCode: Item.roomCode };
}
