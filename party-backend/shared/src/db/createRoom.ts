import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { clearLeftovers } from "./clearLeftovers";
import { isConditionFailed } from "./isConditionFailed";
import { META, roomPk } from "./keys";
import { IDLE_TTL, ttlIn } from "./ttl";

// false = code already taken (even by an ENDED tombstone), caller picks another code.
export async function createRoom(code: string, meta: unknown): Promise<boolean> {
  try {
    await db().send(new PutCommand({
      TableName: table(),
      Item: { pk: roomPk(code), sk: META, status: "active", meta, version: 1, ttl: ttlIn(IDLE_TTL) },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
    await clearLeftovers(code); // ghosts from an idle-expired room that used this code
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
