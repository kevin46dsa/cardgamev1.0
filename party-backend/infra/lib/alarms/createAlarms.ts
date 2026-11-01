import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as cw from "aws-cdk-lib/aws-cloudwatch";
import * as cwActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

const PERIOD = cdk.Duration.minutes(5);
// Normal traffic has none of these, so a handful in 5 minutes means something is wrong or being abused.
const LAMBDA_ERRORS_THRESHOLD = 5;
const LAMBDA_THROTTLES_THRESHOLD = 1;
const API_ERRORS_THRESHOLD = 5;

interface AlarmTargets { topic: sns.ITopic; fn: lambda.IFunction; api: apigwv2.IWebSocketApi; stageName: string }

/**
 * Alarms that publish to `topic` when the handler errors or is throttled, or API Gateway reports
 * integration or execution errors. Four standard-resolution alarms: effectively free.
 */
export function createAlarms(scope: Construct, { topic, fn, api, stageName }: AlarmTargets): cw.Alarm[] {
  const apiMetric = (metricName: string) => new cw.Metric({
    namespace: "AWS/ApiGateway",
    metricName,
    dimensionsMap: { ApiId: api.apiId, Stage: stageName },
    statistic: "Sum",
    period: PERIOD,
  });
  const defs: [string, cw.IMetric, number][] = [
    ["LambdaErrors", fn.metricErrors({ period: PERIOD }), LAMBDA_ERRORS_THRESHOLD],
    ["LambdaThrottles", fn.metricThrottles({ period: PERIOD }), LAMBDA_THROTTLES_THRESHOLD],
    ["ApiIntegrationErrors", apiMetric("IntegrationError"), API_ERRORS_THRESHOLD],
    ["ApiExecutionErrors", apiMetric("ExecutionError"), API_ERRORS_THRESHOLD],
  ];
  return defs.map(([id, metric, threshold]) => {
    const alarm = new cw.Alarm(scope, `${id}Alarm`, {
      metric,
      threshold,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });
    alarm.addAlarmAction(new cwActions.SnsAction(topic));
    return alarm;
  });
}
