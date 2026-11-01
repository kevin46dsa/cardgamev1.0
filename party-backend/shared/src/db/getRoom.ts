import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { META, roomPk } from "./keys";
import { nowSec } from "./ttl";

export type RoomRead<T> = { status: "active"; meta: T; version: number } | { status: "ended" } | null;

// null = NOT_FOUND. Items past their ttl count as gone: DynamoDB deletes lazily (can lag hours).
export async function getRoom<T>(code: string): Promise<RoomRead<T>> {
  const { Item } = await db().send(new GetCommand({ TableName: table(), Key: { pk: roomPk(code), sk: META }, ConsistentRead: true }));
  if (!Item || Item.ttl <= nowSec()) return null;
  return Item.status === "ended" ? { status: "ended" } : { status: "active", meta: Item.meta as T, version: Item.version };
}
