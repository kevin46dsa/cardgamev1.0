# party-backend runbook

Operations guide for the "Funniest Answer" WebSocket backend. Account `887150487951`, region `us-east-2`, stack `PartyGamesBackendStack`.
Endpoint: `wss://gamenight-ws.nosenterprise.org` (raw API Gateway URL is the `WsUrl` stack output). All commands run from `party-backend/` unless noted.

## 1. Architecture

```
 phone / TV browser
        | wss (JSON text frames, <= 2 KB)
        v
 Cloudflare DNS  gamenight-ws.nosenterprise.org  (CNAME -> WsDomainTarget output)
        v
 API Gateway WebSocket API, stage "prod" (throttle 100 rps / burst 200), ACM cert (us-east-2)
        |  routes $connect, $disconnect, $default  (all -> same integration)
        v
 Lambda "WsHandler" (Node 24, 128 MB, 10 s timeout, ws-handler/src/handler.ts)
        |  pure rules engine in shared/src/rules, storage in shared/src/db
        |  pushes to clients via the API Gateway management API (PostToConnection)
        v
 DynamoDB table "PartyGames" (on demand, pk+sk, TTL attribute "ttl", no GSI)
```

There is no server timer: clients send `advance {phaseId}` at each `nextDeadline` and every join/rejoin/disconnect settles overdue
phases (see `ws-handler/README.md`). If every client is asleep the game just waits. Room META expires 30 min after its last write,
other room items after 4 h, an ended room leaves a 24 h tombstone (`shared/src/db/ttl.ts`).

## 2. Deploy

Source of truth is `infra/lib/party-games-backend-stack.ts`. The CDK app reads `CDK_DEFAULT_ACCOUNT`.

**First deploy (manual, once).** The CI role is created by the stack itself, so CI cannot create the stack.

    npm ci && npm run typecheck && npm test
    cd infra && CDK_DEFAULT_ACCOUNT=887150487951 npx cdk deploy PartyGamesBackendStack

The deploy blocks on the ACM certificate until its DNS validation CNAME exists. Add that CNAME in Cloudflare (DNS only, not proxied;
the record is shown in the ACM console or the CloudFormation events), then add the CNAME `gamenight-ws` -> the `WsDomainTarget` output.
Then set the repo secret (already done for this repo):

    gh secret set AWS_ACCOUNT_ID -R kevin46dsa/cardgamev1.0

**Every later deploy (CI).** `.github/workflows/party-backend-deploy.yml` runs on a push to `master` that touches `party-backend/**`, or
by hand (`gh workflow run "Party backend deploy" -R kevin46dsa/cardgamev1.0`). It runs `npm ci`, typecheck, test, assumes
`arn:aws:iam::<AWS_ACCOUNT_ID>:role/PartyGamesGithubActionsDeployRole` through GitHub OIDC (trusts only this repo on `master`), then
`npx cdk deploy PartyGamesBackendStack --require-approval never`. PRs and other branches only run `party-backend-test.yml`.

**Check a deploy.** `npm run smoke` (section 3b). Dry run of the infra without AWS changes: `CDK_DEFAULT_ACCOUNT=887150487951 npm run synth`.

## 3. Operate

**a. Logs.** The Lambda log group name has a generated suffix; find it, then tail:

    aws logs describe-log-groups --region us-east-2 --log-group-name-prefix /aws/lambda/PartyGamesBackendStack-WsHandler --query 'logGroups[].logGroupName' --output text
    aws logs tail <that-name> --region us-east-2 --since 30m --follow
    aws logs tail <that-name> --region us-east-2 --since 1h --filter-pattern '"BAD_REQUEST"'

Clients only ever see `BAD_REQUEST "something went wrong"` for unexpected exceptions; the real error is in these logs.
A DynamoDB `ValidationException` here has meant a reserved word in an expression (see section 7).

**b. Smoke test (live, small).** `npm run smoke` (override the target with `WS_URL=wss://...`). Opens 3 sockets one after another,
plays room creation, join, start, intro to write, checks role fields and that no answer leaks before the vote phase, leaves.
About 15 Lambda invocations, takes about 10 s, exit code non-zero on any failure. Do not loop it or run it in parallel:
the account Lambda concurrency limit is 10, shared with Kanbanboard, OffTheFrame and other apps.

**c. Inspect a room.**

    aws dynamodb query --region us-east-2 --table-name PartyGames --key-condition-expression 'pk = :p' --expression-attribute-values '{":p":{"S":"ROOM#ABCD"}}'

## 4. Cost model and checking spend

Honest play is under 1 US cent per 18-minute 10-player game (about 350 Lambda invocations, 1,500 pushes, 900 DynamoDB ops;
details in `docs/feasibility-and-cost.md`). Prices used there: API Gateway WebSocket about $1.00 per million messages and $0.25 per
million connection-minutes, Lambda $0.20 per million requests (1M/month free, permanent), DynamoDB on demand about $0.625 per million
writes. The API Gateway free tier expires 12 months after account creation. The real risk is abuse or a bug loop, not play.

    # Lambda invocations per hour, last 24 h (a sudden jump is the first sign of a loop or bot)
    aws cloudwatch get-metric-statistics --region us-east-2 --namespace AWS/Lambda --metric-name Invocations \
      --dimensions Name=FunctionName,Value=<function-name> --start-time $(date -u -v-24H +%FT%TZ) --end-time $(date -u +%FT%TZ) \
      --period 3600 --statistics Sum
    # Spend by service this month (Cost Explorer lives in us-east-1; each API call costs $0.01)
    aws ce get-cost-and-usage --region us-east-1 --time-period Start=$(date -u +%Y-%m-01),End=$(date -u -v+1d +%F) \
      --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE

An AWS Budget named "My Zero-Spend Budget" ($1) exists and emails on spend. Keep it.

## 5. Shutdown

    cd infra && CDK_DEFAULT_ACCOUNT=887150487951 npx cdk destroy PartyGamesBackendStack

This deletes the API, Lambda, the CI deploy role and the `PartyGames` table (`RemovalPolicy.DESTROY`: all room data is lost, which is fine,
rooms are ephemeral). Afterwards remove the Cloudflare CNAMEs (cert validation and `gamenight-ws`), and the CI deploy job will fail until the
stack is redeployed by hand (the role is gone). Stopping spend without destroying: lower the stage throttle to 0 in the console, or
`aws lambda put-function-concurrency --function-name <name> --reserved-concurrent-executions 0` (only possible once the account limit is raised, see below).

## 6. Known limits

- **Lambda concurrency is 10 account-wide** (new-account limit, applied value 10). A burst of 10 simultaneous actions throttles the other apps too.
  Quota increases need an AWS Support case (Service Quotas refuses values at or below the default of 1000). Until then, no reserved concurrency.
- **Frames are limited to 2 KB** (inbound frames above are rejected; sender warns above 2 KB). A full 10-player `state` is about 2.2 KB.
- Inbound rate limit 10 msgs/s per connection; room cap 10 players; at most 5 optimistic-lock retries per action ("room is busy, try again").
- API Gateway: 10 min idle timeout, 2 h max connection. Only lobby, pause and TV pairing screens need a ping (every 5 min).
- DynamoDB TTL deletion is lazy (up to about 48 h late) (a room may linger after its TTL).

## 7. Incident checklist

**Runaway cost / abuse suspected**
1. Check invocations and spend (section 4); look at the logs for one connection or IP repeating.
2. Stop the bleeding fast: AWS console > API Gateway > `PartyGamesWsApi` > Stages > prod > lower throttle, or set it to 0.
   Heavier: `cdk destroy` (section 5) and redeploy later.
3. Check the Budget email; confirm the Lambda is not retrying (WebSocket integrations are not retried by API Gateway, so a loop means a client).
4. After the incident, write the root cause here and file the guardrail ticket (rate limits, throttle 30/60, reserved concurrency).

**Stuck room** (game frozen, nobody can continue)
1. Frozen because all clients slept is normal: any `rejoin` settles overdue phases. Ask a player to reload.
2. If it persists, look for `room is busy` or errors in the logs and query the room (3c); compare `phaseEndsAt` with now.
3. Last resort, delete the room's items (META expires on its own 30 min after last write anyway), players get `ROOM_NOT_FOUND` and create a new room:
   query the room's keys, then `aws dynamodb delete-item` per `pk`/`sk`.

**Bad deploy**
1. Symptom: `npm run smoke` fails or logs show `BAD_REQUEST` spikes after a deploy.
2. Roll back by code: `git revert <bad-commit>` on `master` (via PR) and let the deploy workflow run, or from a trusted machine
   `git checkout <last-good-sha> && cd party-backend/infra && CDK_DEFAULT_ACCOUNT=887150487951 npx cdk deploy PartyGamesBackendStack`.
   There is no versioned alias or blue/green; the table is untouched by code rollbacks.
3. If CloudFormation is stuck in `UPDATE_ROLLBACK_FAILED`, fix the blocking resource in the console and run
   `aws cloudformation continue-update-rollback --stack-name PartyGamesBackendStack --region us-east-2`.

**Past bug to remember: DynamoDB reserved words.** `online` is a reserved word; using it bare in an UpdateExpression returned
`ValidationException` from the real service while every mock-based test passed, so it only surfaced against the live table. Fixed by aliasing
(`#o` via ExpressionAttributeNames in `setConnection.ts` and `clearConnection.ts`). Guard: `shared/src/db/reservedWords.test.ts` scans
every db expression for 16 reserved words used unaliased; `npm run smoke` exercises the real table after every deploy. Add new reserved words to that list when found.

## 8. Known gaps

- Abuse guardrails are only partly in place (Lambda-side frame and rate limits exist); stage throttle is still 100/200 instead of 30/60,
  no per-IP `createRoom` limit, no reserved concurrency (blocked by the account quota). Tracked by the "Abuse + cost guardrails" ticket.
- No CloudWatch alarms or dashboards; spend relies on the $1 budget email.
- The smoke test is manual: it is not run by CI after deploy (it would hit production and consume shared Lambda concurrency).
- CI uses Node 22 for build and tests while the Lambda runs Node 24.
- Single environment (production only), no staging stack.
- First deploy and certificate renewal depend on a manual Cloudflare DNS step.
- `roomEnded` reason `idle` is never emitted (idle rooms just expire); a pairing TV with `mode: "tv"` and no `pairCode` cannot be attached later.
- The deploy role has AdministratorAccess; the OIDC trust policy (this repo, `master` only) is the only boundary.
