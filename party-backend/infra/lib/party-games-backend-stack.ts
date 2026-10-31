import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { createPartyGamesTable } from "./tables/createPartyGamesTable";
import { createGithubDeployRole } from "./ci/createGithubDeployRole";

const WS_DOMAIN = "gamenight-ws.nosenterprise.org";

export class PartyGamesBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = createPartyGamesTable(this);
    createGithubDeployRole(this);

    const fn = new NodejsFunction(this, "WsHandler", {
      entry: path.join(__dirname, "../../ws-handler/src/handler.ts"),
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(10),
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(fn);

    const integration = new WebSocketLambdaIntegration("WsIntegration", fn);
    const api = new apigwv2.WebSocketApi(this, "PartyGamesWsApi", {
      connectRouteOptions: { integration },
      disconnectRouteOptions: { integration },
      defaultRouteOptions: { integration },
    });
    // DNS lives in Cloudflare, so the cert cannot auto-validate: deploy blocks until the validation
    // CNAME is added by hand. Regional API Gateway domains need the cert in this stack's region.
    const certificate = new acm.Certificate(this, "WsCert", {
      domainName: WS_DOMAIN,
      validation: acm.CertificateValidation.fromDns(),
    });
    const domainName = new apigwv2.DomainName(this, "WsDomain", { domainName: WS_DOMAIN, certificate });

    const stage = new apigwv2.WebSocketStage(this, "ProdStage", {
      webSocketApi: api,
      stageName: "prod",
      autoDeploy: true,
      throttle: { rateLimit: 100, burstLimit: 200 },
      domainMapping: { domainName },
    });
    api.grantManageConnections(fn);

    new cdk.CfnOutput(this, "WsUrl", { value: stage.url });
    new cdk.CfnOutput(this, "WsCustomUrl", { value: `wss://${WS_DOMAIN}` });
    new cdk.CfnOutput(this, "WsDomainTarget", { value: domainName.regionalDomainName });
  }
}
