import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";

// playerId is null when the connection is the room's TV. null result = unknown connection.
export async function findByConnection(connectionId: string): Promise<{ code: string; playerId: string | null } | null> {
  const { Items } = await db().send(new QueryCommand({
    TableName: table(),
    IndexName: "connectionId-index",
    KeyConditionExpression: "connectionId = :c",
    ExpressionAttributeValues: { ":c": connectionId },
    Limit: 1,
  }));
  const item = Items?.[0];
  if (!item) return null;
  const sk = item.sk as string;
  return { code: (item.pk as string).slice("ROOM#".length), playerId: sk.startsWith("PLAYER#") ? sk.slice("PLAYER#".length) : null };
}
