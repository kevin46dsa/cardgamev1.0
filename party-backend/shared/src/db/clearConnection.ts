import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { CONN, connPk, playerSk, roomPk } from "./keys";

// Only clears if the player is still on THIS connection, so a late $disconnect of an old socket cannot
// mark a player who already reconnected as offline. false = nothing cleared (reconnected or gone).
// The CONN# reverse-lookup item of this socket is always removed.
export async function clearConnection(code: string, playerId: string, connectionId: string, now = Date.now()): Promise<boolean> {
  try {
    return await clear(code, playerId, connectionId, now);
  } finally {
    await db().send(new DeleteCommand({ TableName: table(), Key: { pk: connPk(connectionId), sk: CONN } }));
  }
}

async function clear(code: string, playerId: string, connectionId: string, now: number): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: playerSk(playerId) },
      UpdateExpression: "SET #o = :f, offlineSince = :now REMOVE connectionId",
      ConditionExpression: "connectionId = :c",
      ExpressionAttributeNames: { "#o": "online" },
      ExpressionAttributeValues: { ":c": connectionId, ":f": false, ":now": now },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
