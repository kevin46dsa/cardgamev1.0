import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { isConditionFailed } from "./isConditionFailed";
import { PAIR, pairPk } from "./keys";
import { nowSec } from "./ttl";

// Attaches the room to a live pair code and returns the TV's connectionId to notify; null = unknown/expired code.
export async function bindPairCode(code4: string, roomCode: string): Promise<string | null> {
  try {
    const { Attributes } = await db().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: pairPk(code4), sk: PAIR },
      UpdateExpression: "SET roomCode = :r",
      ConditionExpression: "attribute_exists(pk) AND #t > :now",
      ExpressionAttributeNames: { "#t": "ttl" },
      ExpressionAttributeValues: { ":r": roomCode, ":now": nowSec() },
      ReturnValues: "ALL_NEW",
    }));
    return Attributes?.tvConnectionId ?? null;
  } catch (e) {
    if (isConditionFailed(e)) return null;
    throw e;
  }
}
