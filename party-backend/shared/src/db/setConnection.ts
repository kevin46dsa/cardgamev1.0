import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { playerSk, roomPk } from "./keys";
import { putConnection } from "./putConnection";

// Binds the player to this socket and writes the CONN# reverse-lookup item. false = player item does not exist.
export async function setConnection(code: string, playerId: string, connectionId: string): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: playerSk(playerId) },
      UpdateExpression: "SET connectionId = :c, #o = :t REMOVE offlineSince",
      ConditionExpression: "attribute_exists(pk)",
      ExpressionAttributeNames: { "#o": "online" },
      ExpressionAttributeValues: { ":c": connectionId, ":t": true },
    }));
    await putConnection(connectionId, code, playerId);
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
