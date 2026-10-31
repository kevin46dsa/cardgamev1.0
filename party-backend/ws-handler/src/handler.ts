import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { dispatch } from "./dispatch";

export async function handler(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  if (routeKey !== "$default") return { statusCode: 200 }; // $connect / $disconnect: nothing to do yet

  // Raw execute-api host needs the stage in the path; a custom domain mapped at root does not.
  const endpoint = domainName?.endsWith(".amazonaws.com") ? `https://${domainName}/${stage}` : `https://${domainName}`;
  const reply = dispatch(event.body);
  await new ApiGatewayManagementApiClient({ endpoint }).send(
    new PostToConnectionCommand({ ConnectionId: connectionId, Data: JSON.stringify(reply) }),
  );
  return { statusCode: 200 };
}
