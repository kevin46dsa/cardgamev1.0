import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const GITHUB_REPO = "kevin46dsa/cardgamev1.0";
// Account-wide provider (created by the Kanbanboard stack): import it, never create a second one.
const OIDC_PROVIDER_ARN = "arn:aws:iam::887150487951:oidc-provider/token.actions.githubusercontent.com";

export function createGithubDeployRole(scope: Construct): iam.Role {
  const provider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(scope, "GithubOidcProvider", OIDC_PROVIDER_ARN);

  // Pushes to master and workflow_dispatch runs on master both carry this sub claim.
  const role = new iam.Role(scope, "GithubActionsDeployRole", {
    roleName: "PartyGamesGithubActionsDeployRole",
    assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:ref:refs/heads/master`,
      },
    }),
    description: "Assumed by GitHub Actions on master to run `cdk deploy` for the party backend. No long-lived AWS keys.",
  });

  // AdministratorAccess is this account's deliberate convention for personal projects: the trust
  // policy above (one repo, master branch only) is the security boundary, not IAM minimization.
  role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"));

  new cdk.CfnOutput(scope, "GithubDeployRoleArn", { value: role.roleArn });
  return role;
}
