"use strict";
const assert = require("node:assert/strict");

module.exports = async function approval({ github, context, core }) {
  assert.equal(process.env.GITHUB_RUN_ATTEMPT, "1", "Dispatch a new run for fresh approval; do not rerun an old delivery job.");
  const { data: branch } = await github.rest.repos.getBranch({ ...context.repo, branch: "main" });
  assert.ok(branch.protected && branch.commit.sha === context.sha, "Main moved or lost protection: regenerate the plan and approval.");
  const { data: run } = await github.rest.actions.getWorkflowRun({ ...context.repo, run_id: context.runId });
  // The Actions approval history is authoritative, not a participant issue comment.
  const reviews = await github.paginate("GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals", { ...context.repo, run_id: context.runId, per_page: 100 });
  const sourcePRs = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, { ...context.repo, commit_sha: context.sha, per_page: 100 });
  const reviewed = sourcePRs.filter((pr) => pr.merged_at && pr.base.ref === "main" && pr.merge_commit_sha === context.sha);
  assert.ok(reviewed.length > 0, "The deployment commit must be linked to a merged reviewed main PR.");
  const authorIds = new Set(reviewed.map((pr) => pr.user.id));
  const approval = reviews.find((item) => item.state === "approved" && item.environments?.some((environment) => environment.name === "dev-apply") && item.user?.type === "User" && !authorIds.has(item.user.id) && ![run.actor?.login, run.triggering_actor?.login, context.actor].includes(item.user.login));
  assert.ok(approval, "A real independent dev-apply environment approval is required; issue comments/manual dispatch are insufficient.");
  const { pathToFileURL } = require("node:url");
  const { resolve } = require("node:path");
  const { assertEnvironmentProtection } = await import(pathToFileURL(resolve("scripts/plan-policy.mjs")).href);
  const { data: environment } = await github.rest.repos.getEnvironment({ ...context.repo, environment_name: "dev-apply" });
  const branches = await github.paginate(github.rest.repos.listDeploymentBranchPolicies, { ...context.repo, environment_name: "dev-apply", per_page: 100 });
  assertEnvironmentProtection(environment, branches, true);
  core.setOutput("main_sha", branch.commit.sha);
  core.summary.addHeading("Independent approval verified").addRaw(`Reviewer: ${approval.user.login}. Run: ${context.runId}. The saved-plan digest and state identity are checked next.`, true);
  await core.summary.write();
};
