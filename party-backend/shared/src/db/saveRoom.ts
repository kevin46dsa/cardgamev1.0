import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { META, roomPk } from "./keys";
import { IDLE_TTL, ttlIn } from "./ttl";

// Optimistic write: true if saved as expectedVersion+1, false if someone else saved first (or room ended/gone).
export async function saveRoom(code: string, meta: unknown, expectedVersion: number): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: META },
      UpdateExpression: "SET #m = :m, #v = :next, #t = :t",
      ConditionExpression: "#v = :exp AND #s = :active",
      ExpressionAttributeNames: { "#m": "meta", "#v": "version", "#t": "ttl", "#s": "status" },
      ExpressionAttributeValues: { ":m": meta, ":next": expectedVersion + 1, ":exp": expectedVersion, ":t": ttlIn(IDLE_TTL), ":active": "active" },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
