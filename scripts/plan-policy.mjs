import assert from "node:assert/strict";
import { textHash, bytesHash } from "./module-snapshot.mjs";

export const TERRAFORM_VERSION = "1.16.1";
export const PROVIDER_VERSION = "5.4.0";
export const MAX_PLAN_AGE_MS = 2 * 60 * 60 * 1000;
const TYPES = new Set(["azurerm_virtual_network", "azurerm_subnet", "azurerm_network_security_group", "azurerm_network_security_rule", "azurerm_subnet_network_security_group_association"]);
const OPERATIONS = new Set(["plan", "deploy", "destroy", "drift", "followup"]);

export function planExit(code) {
  assert.ok([0, 2].includes(code), "Terraform plan failed; no plan may proceed to apply");
  return code === 0 ? "no-change" : "changes";
}

export function operationFor(event, input) {
  const operation = event === "schedule" ? "drift" : event === "push" ? "deploy" : input;
  assert.ok(OPERATIONS.has(operation), "Unsupported operation");
  return operation;
}

export function assertScope(id, config) {
  assert.equal(typeof id, "string", "Expected a resource ID");
  const prefix = `/subscriptions/${config.subscription}/resourceGroups/${config.resourceGroup}/providers/Microsoft.Network/`;
  assert.ok(id.toLowerCase().startsWith(prefix.toLowerCase()), "Resource is outside the assigned workload scope");
}

export function summarizePlan(plan, config) {
  assert.match(String(plan.format_version), /^1\./, "Unsupported plan JSON schema");
  assert.equal(plan.terraform_version, TERRAFORM_VERSION, "Unexpected Terraform version");
  const changes = plan.resource_changes || [];
  assert.ok(Array.isArray(changes));
  const totals = { create: 0, update: 0, delete: 0, replace: 0, noChange: 0 };
  const rows = [];
  for (const resource of changes) {
    assert.equal(resource.mode, "managed", "Unexpected lookup in the workload plan");
    assert.ok(TYPES.has(resource.type), "Plan contains an instructor-owned or unsupported resource type");
    assert.match(resource.address, /^module\.network\.(?:module\.security\.)?azurerm_[a-z_]+\.this(?:\["[a-z][a-z0-9-]*"\])?$/, "Unexpected managed resource address");
    const actions = resource.change?.actions;
    assert.ok(Array.isArray(actions) && actions.length > 0 && actions.every((a) => ["no-op", "create", "update", "delete"].includes(a)), "Unsupported plan action");
    if (resource.change.before?.id) assertScope(resource.change.before.id, config);
    if (resource.change.after?.id) assertScope(resource.change.after.id, config);
    if (resource.change.after?.resource_group_name) assert.equal(resource.change.after.resource_group_name, config.resourceGroup);
    for (const key of ["subnet_id", "network_security_group_id"]) {
      if (resource.change.after?.[key]) assertScope(resource.change.after[key], config);
    }
    if (config.operation === "destroy") assert.ok(actions.every((a) => ["delete", "no-op"].includes(a)), "Destroy plans may only delete this workload's managed resources");
    const action = actions.includes("create") && actions.includes("delete") ? "replace" : actions[0] === "no-op" ? "noChange" : actions[0];
    totals[action] += 1;
    if (action !== "noChange") rows.push({ address: resource.address, action });
  }
  return { totals, resources: rows };
}

export function planBinding(config, lockText, moduleLockText, inputsText) {
  assert.match(config.sha, /^[a-f0-9]{40}$/);
  assert.match(config.repository, /^[\w.-]+\/[\w.-]+$/);
  assert.match(config.subscription, /^[a-f0-9-]{36}$/i);
  assert.ok(OPERATIONS.has(config.operation));
  assert.equal(config.root, "environments/dev");
  assert.equal(config.environment, "dev");
  for (const field of ["runId", "runAttempt", "stateAccount", "stateContainer", "stateKey", "tenant", "planClientId", "applyClientId", "resourceGroup"]) assert.ok(typeof config[field] === "string" && config[field].length > 0, `Missing ${field}`);
  assert.notEqual(config.planClientId, config.applyClientId, "Plan and apply identities must be different");
  return { ...config, terraform: TERRAFORM_VERSION, provider: PROVIDER_VERSION, providerLock: textHash(lockText), moduleLock: textHash(moduleLockText), inputs: textHash(inputsText) };
}

export function makeManifest(binding, planBytes, exitCode, now = Date.now()) {
  planExit(exitCode);
  return { schemaVersion: 1, binding, createdAt: new Date(now).toISOString(), planSha256: bytesHash(planBytes), exitCode };
}

export function verifyPlan({ manifest, manifestBytes, expectedManifestHash, planBytes, expectedPlanHash, binding, currentSha, now = Date.now() }) {
  assert.match(expectedPlanHash, /^[a-f0-9]{64}$/);
  assert.match(expectedManifestHash, /^[a-f0-9]{64}$/);
  assert.equal(bytesHash(manifestBytes), expectedManifestHash, "Plan manifest was altered");
  assert.deepEqual(manifest, JSON.parse(manifestBytes.toString("utf8")), "Manifest object differs from its authenticated bytes");
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.binding, binding, "Commit/run/attempt/state/dependencies/inputs identity mismatch; create a new plan and approval");
  assert.equal(currentSha, binding.sha, "Protected main has moved; replan and obtain fresh approval");
  assert.equal(bytesHash(planBytes), expectedPlanHash, "Saved plan was altered");
  assert.equal(manifest.planSha256, expectedPlanHash);
  const created = Date.parse(manifest.createdAt);
  assert.ok(Number.isFinite(created) && created <= now && now - created <= MAX_PLAN_AGE_MS, "Plan is stale or has an invalid timestamp; replan and obtain fresh approval");
  planExit(manifest.exitCode);
  assert.ok(["deploy", "destroy"].includes(binding.operation), "Plan-only, drift and follow-up operations cannot apply");
  return true;
}

export function assertEnvironmentProtection(environment, branches, requireApproval) {
  assert.equal(environment.deployment_branch_policy?.custom_branch_policies, true, "Use an explicit main-only environment deployment policy");
  assert.equal(environment.deployment_branch_policy?.protected_branches, false);
  assert.ok(branches.length === 1 && branches[0].name === "main" && branches[0].type === "branch", "Only the main branch may access trusted environments");
  if (requireApproval) {
    const rule = environment.protection_rules?.find((item) => item.type === "required_reviewers");
    assert.ok(rule?.reviewers?.length > 0 && rule.prevent_self_review === true, "Independent required reviewers and prevention of self-review must be available and enabled");
    assert.equal(environment.can_admins_bypass, false, "Environment administrator bypass must be disabled");
  }
}
