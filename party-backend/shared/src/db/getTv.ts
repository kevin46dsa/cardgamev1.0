import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { TV, roomPk } from "./keys";
import type { Tv } from "./types";

export async function getTv(code: string): Promise<Tv | null> {
  const { Item } = await db().send(new GetCommand({ TableName: table(), Key: { pk: roomPk(code), sk: TV } }));
  if (!Item) return null;
  const { pk, sk, ttl, ...tv } = Item;
  return tv as Tv;
}
