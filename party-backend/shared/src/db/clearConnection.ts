import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { playerSk, roomPk } from "./keys";

// Only clears if the player is still on THIS connection, so a late $disconnect of an old socket cannot
// mark a player who already reconnected as offline. false = nothing cleared (reconnected or gone).
export async function clearConnection(code: string, playerId: string, connectionId: string, now = Date.now()): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: playerSk(playerId) },
      UpdateExpression: "SET online = :f, offlineSince = :now REMOVE connectionId",
      ConditionExpression: "connectionId = :c",
      ExpressionAttributeValues: { ":c": connectionId, ":f": false, ":now": now },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
