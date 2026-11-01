#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PartyGamesBackendStack } from "../lib/party-games-backend-stack";

const app = new cdk.App();
new PartyGamesBackendStack(app, "PartyGamesBackendStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-2" },
});
