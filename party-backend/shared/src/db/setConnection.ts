import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { playerSk, roomPk } from "./keys";

// Writes the `connectionId` attribute the GSI indexes. false = player item does not exist.
export async function setConnection(code: string, playerId: string, connectionId: string): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: playerSk(playerId) },
      UpdateExpression: "SET connectionId = :c, online = :t REMOVE offlineSince",
      ConditionExpression: "attribute_exists(pk)",
      ExpressionAttributeValues: { ":c": connectionId, ":t": true },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
