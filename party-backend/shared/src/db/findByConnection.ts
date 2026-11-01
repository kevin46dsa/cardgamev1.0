import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { CONN, connPk } from "./keys";

// playerId is null when the connection is the room's TV. null result = unknown connection.
export async function findByConnection(connectionId: string): Promise<{ code: string; playerId: string | null } | null> {
  const { Item } = await db().send(new GetCommand({
    TableName: table(),
    Key: { pk: connPk(connectionId), sk: CONN },
    ConsistentRead: true,
  }));
  return Item ? { code: Item.code as string, playerId: (Item.playerId as string | null) ?? null } : null;
}
