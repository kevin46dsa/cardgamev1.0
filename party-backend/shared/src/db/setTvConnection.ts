import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { TV, roomPk } from "./keys";

// false = no TV item yet (use putTv).
export async function setTvConnection(code: string, connectionId: string): Promise<boolean> {
  try {
    await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: roomPk(code), sk: TV },
      UpdateExpression: "SET connectionId = :c",
      ConditionExpression: "attribute_exists(pk)",
      ExpressionAttributeValues: { ":c": connectionId },
    }));
    return true;
  } catch (e) {
    if (isConditionFailed(e)) return false;
    throw e;
  }
}
