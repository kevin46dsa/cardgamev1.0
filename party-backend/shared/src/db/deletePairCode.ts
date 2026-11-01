import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db, table } from "./client";
import { PAIR, pairPk } from "./keys";

export async function deletePairCode(code4: string): Promise<void> {
  await db().send(new DeleteCommand({ TableName: table(), Key: { pk: pairPk(code4), sk: PAIR } }));
}
