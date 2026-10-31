import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { CONN, TV, connPk, roomPk } from "./keys";

/**
 * Removes the TV's connectionId only if it is still THIS socket (atomic), so a late $disconnect of an old
 * socket cannot wipe a TV that already reconnected. false = nothing cleared. The CONN# item of this socket is always removed.
 */
export async function clearTvConnection(code: string, connectionId: string): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: TV },
      UpdateExpression: "REMOVE connectionId",
      ConditionExpression: "connectionId = :c",
      ExpressionAttributeValues: { ":c": connectionId },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  } finally {
    await db().send(new DeleteCommand({ TableName: table(), Key: { pk: connPk(connectionId), sk: CONN } }));
  }
}
