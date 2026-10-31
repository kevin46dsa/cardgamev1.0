import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { dispatch } from "./dispatch";
import { endpointFor } from "./lib/endpointFor";

export async function handler(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> {
  const { routeKey, connectionId } = event.requestContext;
  if (routeKey !== "$default") return { statusCode: 200 }; // $connect / $disconnect: nothing to do yet

  const endpoint = endpointFor(event.requestContext);
  const reply = dispatch(event.body);
  await new ApiGatewayManagementApiClient({ endpoint }).send(
    new PostToConnectionCommand({ ConnectionId: connectionId, Data: JSON.stringify(reply) }),
  );
  return { statusCode: 200 };
}
