import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { TV, roomPk } from "./keys";
import { ITEM_TTL, ttlIn } from "./ttl";
import type { Tv } from "./types";

export async function putTv(code: string, tv: Tv): Promise<void> {
  await db().send(new PutCommand({ TableName: table(), Item: { ...tv, pk: roomPk(code), sk: TV, ttl: ttlIn(ITEM_TTL) } }));
}
