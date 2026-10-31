import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

// Single table (deliberate exception to the account's table-per-entity rule): everything for a
// room shares pk = ROOM#<code>; sk = META | PLAYER#<id> | ROUND#<nn> | STROKE#<seq>.
export function createPartyGamesTable(scope: Construct): dynamodb.Table {
  const table = new dynamodb.Table(scope, "PartyGamesTable", {
    tableName: "PartyGames",
    partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
    sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: "ttl",
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // $disconnect only knows the connectionId; sparse, only items carrying one are indexed.
  table.addGlobalSecondaryIndex({
    indexName: "connectionId-index",
    partitionKey: { name: "connectionId", type: dynamodb.AttributeType.STRING },
  });

  return table;
}
