import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { META, roomPk } from "./keys";
import { IDLE_TTL, ttlIn } from "./ttl";

// Idle refresh WITHOUT a read and WITHOUT bumping version: a bump would make every concurrent
// withRoom writer retry for no reason, and one blind UpdateItem is cheaper than get+save.
// false = room missing or ended.
export async function touchRoom(code: string): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: META },
      UpdateExpression: "SET #t = :t",
      ConditionExpression: "attribute_exists(pk) AND #s = :active",
      ExpressionAttributeNames: { "#t": "ttl", "#s": "status" },
      ExpressionAttributeValues: { ":t": ttlIn(IDLE_TTL), ":active": "active" },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
