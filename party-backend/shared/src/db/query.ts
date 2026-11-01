import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";

// ponytail: single page (1 MB). Rooms hold <= 10 players, so answers/votes/players per query stay tiny.
export async function queryPrefix(pk: string, skPrefix: string): Promise<Record<string, any>[]> {
  const { Items } = await db().send(new QueryCommand({
    TableName: table(),
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :p)",
    ExpressionAttributeValues: { ":pk": pk, ":p": skPrefix },
    ConsistentRead: true,
  }));
  return Items ?? [];
}
