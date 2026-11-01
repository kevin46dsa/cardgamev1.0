# party-backend

Backend for the party games (Funniest Answer and friends): API Gateway WebSocket API, one Lambda, one DynamoDB table, deployed with CDK to us-east-2. Game logic is not built yet.

## Layout

- `shared/` protocol types shared by client and server
- `ws-handler/` the Lambda (`src/handler.ts`, `src/actions/`, `src/content/` prompt bank and word filter)
- `infra/` CDK app (`lib/party-games-backend-stack.ts`, `lib/ci/` GitHub deploy role)
- `docs/` API, rules and cost notes

## Commands (run in this folder)

    npm ci
    npm run typecheck
    npm test
    CDK_DEFAULT_ACCOUNT=887150487951 npm run synth

## CI

- `.github/workflows/party-backend-test.yml` typechecks and tests on PRs and non-master pushes.
- `.github/workflows/party-backend-deploy.yml` deploys on push to master (only when `party-backend/**` changes) or by hand, through GitHub OIDC. No AWS keys are stored.

## First deploy (chicken and egg)

The deploy role is created BY this stack, so CI cannot use it yet. Do the first deploy by hand from a real machine:

    cd party-backend/infra && CDK_DEFAULT_ACCOUNT=887150487951 npx cdk deploy PartyGamesBackendStack

Then set the repo secret so `role-to-assume` resolves:

    gh secret set AWS_ACCOUNT_ID -R kevin46dsa/cardgamev1.0

The role trusts only `kevin46dsa/cardgamev1.0` on `master` and has AdministratorAccess (the trust policy is the boundary, same as the other apps in this account).
