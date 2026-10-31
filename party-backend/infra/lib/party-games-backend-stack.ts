import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as sns from "aws-cdk-lib/aws-sns";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { createPartyGamesTable } from "./tables/createPartyGamesTable";
import { createGithubDeployRole } from "./ci/createGithubDeployRole";
import { createAlarms } from "./alarms/createAlarms";

const WS_DOMAIN = "gamenight-ws.nosenterprise.org";
// Cost circuit breaker: requests per second across the whole stage (see docs/feasibility-and-cost.md).
const STAGE_RATE_LIMIT = 30;
const STAGE_BURST_LIMIT = 60;

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
      // No $connect route: API Gateway then accepts every connection without invoking the Lambda
      // (it had nothing to do anyway), which saves one invocation per socket.
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
      throttle: { rateLimit: STAGE_RATE_LIMIT, burstLimit: STAGE_BURST_LIMIT },
      domainMapping: { domainName },
    });
    api.grantManageConnections(fn);

    // No subscriptions on purpose: add an email or chat endpoint by hand once you want to be paged.
    const alarmTopic = new sns.Topic(this, "AlarmTopic");
    createAlarms(this, { topic: alarmTopic, fn, api, stageName: stage.stageName });

    new cdk.CfnOutput(this, "AlarmTopicArn", { value: alarmTopic.topicArn });
    new cdk.CfnOutput(this, "WsUrl", { value: stage.url });
    new cdk.CfnOutput(this, "WsCustomUrl", { value: `wss://${WS_DOMAIN}` });
    new cdk.CfnOutput(this, "WsDomainTarget", { value: domainName.regionalDomainName });
  }
}
