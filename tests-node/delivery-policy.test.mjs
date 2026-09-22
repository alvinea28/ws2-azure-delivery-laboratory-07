import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { configuration } from "../scripts/delivery.mjs";
import {
  MAX_PLAN_AGE_MS, PROVIDER_VERSION, TERRAFORM_VERSION, assertEnvironmentProtection,
  assertScope, makeManifest, operationFor, planBinding, planExit, summarizePlan, verifyPlan,
} from "../scripts/plan-policy.mjs";
import { bytesHash, moduleFiles, moduleSource, textHash, validateLock, verifySnapshot } from "../scripts/module-snapshot.mjs";

// This suite exercises pure policy exports, injected GitHub responses and files
// under mkdtemp only. It never calls deliver(), Terraform, Azure, git or a network
// client. The approved repository allowlist is modelled locally; synthetic runs,
// hashes and plan bytes are never live GitHub or cloud evidence.
const REPOSITORY = "alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07";
const WORKFLOW_REF = `${REPOSITORY}/.github/workflows/delivery.yml@refs/heads/main`;
const CLEANUP_REF = `${REPOSITORY}/.github/workflows/cleanup.yml@refs/heads/main`;
const NOW = Date.parse("2026-09-07T12:00:00.000Z");
const SHA = "a".repeat(40);
const OTHER_SHA = "b".repeat(40);
const SUBSCRIPTION = "11111111-1111-4111-8111-111111111111";
const OTHER_SUBSCRIPTION = "99999999-9999-4999-8999-999999999999";
const clone = (value) => structuredClone(value);
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const rejected = (pattern = /./s) => (error) => error instanceof assert.AssertionError && pattern.test(error.message);
const PROVIDER_LOCK = '# Synthetic policy fixture, not an installable provider lock.\nprovider "registry.terraform.io/hashicorp/azurerm" {\n  version = "5.4.0"\n}\n';
const HCL = {
  "main.tf": 'module "security" {\n  source = "./modules/subnet-security"\n}\n',
  "variables.tf": 'variable "name" {\n  type = string\n}\n',
  "outputs.tf": 'output "name" {\n  value = var.name\n}\n',
  "versions.tf": 'terraform {\n  required_version = "= 1.16.1"\n}\n',
  "modules/subnet-security/main.tf": 'locals {\n  fixture_only = true\n}\n',
  "modules/subnet-security/variables.tf": 'variable "name" {\n  default = "offline-only"\n}\n',
  "modules/subnet-security/outputs.tf": 'output "name" {\n  value = var.name\n}\n',
  "modules/subnet-security/versions.tf": 'terraform {\n  required_version = "= 1.16.1"\n}\n',
};

function moduleLock(subdirectory = "") {
  const repository = "offline-fixtures/network-module";
  const revision = "d".repeat(40);
  return {
    schemaVersion: 1, repository, revision, subdirectory,
    source: `git::https://github.com/${repository}.git${subdirectory ? `//${subdirectory}` : ""}?ref=${revision}`,
    files: Object.entries(HCL).map(([path, text]) => ({ path, sha256: textHash(text) })),
  };
}
const MODULE_LOCK_TEXT = jsonBytes(moduleLock()).toString("utf8");

function inputs() {
  return {
    name: "vnet-ws2-unit-dev", resource_group_name: "rg-ws2-unit", location: "westeurope", address_space: ["10.42.0.0/16"],
    subnets: { web: { address_prefixes: ["10.42.1.0/24"] }, data: { address_prefixes: ["10.42.2.0/24"] } },
    tags: { owner: "offline-test", environment: "dev", cost_center: "training", workshop: "ws2" },
  };
}
const INPUTS_TEXT = jsonBytes(inputs()).toString("utf8");

function config(patch = {}) {
  return {
    repository: REPOSITORY, repositoryId: "1379149907", workflowRef: patch.operation === "destroy" ? CLEANUP_REF : WORKFLOW_REF,
    sha: SHA, runId: "901", runAttempt: "1",
    root: "environments/dev", environment: "dev", operation: "deploy",
    subscription: SUBSCRIPTION, tenant: "22222222-2222-4222-8222-222222222222",
    planClientId: "33333333-3333-4333-8333-333333333333", applyClientId: "44444444-4444-4444-8444-444444444444",
    resourceGroup: "rg-ws2-unit", stateAccount: "ws2unitstate", stateContainer: "team-unit", stateKey: "dev/network.tfstate", stateLockId: "unit-dev",
    ...patch,
  };
}

function environmentVariables(patch = {}) {
  const c = config();
  return {
    WORKSHOP_AZURE_ENABLED: "true", GITHUB_REF: "refs/heads/main", GITHUB_REF_PROTECTED: "true", REPOSITORY_PRIVATE: "true", REPOSITORY_TEMPLATE: "false",
    GITHUB_EVENT_NAME: "push", ARM_USE_OIDC: "true", ARM_USE_AZUREAD: "true", ARM_USE_CLI: "false",
    GITHUB_REPOSITORY: c.repository, GITHUB_SHA: c.sha, GITHUB_RUN_ID: c.runId, GITHUB_RUN_ATTEMPT: c.runAttempt,
    GITHUB_REPOSITORY_ID: c.repositoryId, GITHUB_WORKFLOW_REF: c.workflowRef,
    OPERATION: c.operation, ARM_SUBSCRIPTION_ID: c.subscription, ARM_TENANT_ID: c.tenant,
    PLAN_CLIENT_ID: c.planClientId, APPLY_CLIENT_ID: c.applyClientId, WORKLOAD_RG: c.resourceGroup,
    STATE_STORAGE_ACCOUNT: c.stateAccount, STATE_CONTAINER: c.stateContainer, STATE_KEY: c.stateKey, WS2_STATE_LOCK_ID: c.stateLockId,
    WORKLOAD_INPUTS_JSON: JSON.stringify(inputs()), ...patch,
  };
}

function planFixture({ operation = "deploy", exitCode = 2, createdAt = NOW } = {}) {
  const binding = planBinding(config({ operation }), PROVIDER_LOCK, MODULE_LOCK_TEXT, INPUTS_TEXT);
  const planBytes = Buffer.from("OFFLINE POLICY FIXTURE\0not a Terraform saved plan\n");
  // Independent trusted expectations prevent mutations of the artifact binding
  // from silently mutating the expected binding in the same test fixture.
  const manifest = makeManifest(clone(binding), planBytes, exitCode, createdAt);
  const manifestBytes = jsonBytes(manifest);
  return {
    manifest, manifestBytes, expectedManifestHash: bytesHash(manifestBytes), planBytes, expectedPlanHash: bytesHash(planBytes),
    binding, currentSha: SHA, now: NOW,
  };
}

function sealManifest(f) {
  f.manifestBytes = jsonBytes(f.manifest);
  f.expectedManifestHash = bytesHash(f.manifestBytes);
}

const networkId = (suffix) => `/subscriptions/${SUBSCRIPTION}/resourceGroups/rg-ws2-unit/providers/Microsoft.Network/${suffix}`;
function resource(type = "azurerm_virtual_network", actions = ["create"]) {
  const definitions = {
    azurerm_virtual_network: ["module.network.azurerm_virtual_network.this", "virtualNetworks/vnet-ws2-unit-dev"],
    azurerm_subnet: ['module.network.azurerm_subnet.this["web"]', "virtualNetworks/vnet-ws2-unit-dev/subnets/web"],
    azurerm_network_security_group: ["module.network.module.security.azurerm_network_security_group.this", "networkSecurityGroups/nsg-ws2-unit-dev"],
    azurerm_network_security_rule: ['module.network.module.security.azurerm_network_security_rule.this["https"]', "networkSecurityGroups/nsg-ws2-unit-dev/securityRules/https"],
    azurerm_subnet_network_security_group_association: ['module.network.module.security.azurerm_subnet_network_security_group_association.this["web"]', "virtualNetworks/vnet-ws2-unit-dev/subnets/web"],
  };
  const [address, suffix] = definitions[type];
  const values = { id: networkId(suffix), resource_group_name: "rg-ws2-unit", name: "synthetic-network-resource" };
  if (type === "azurerm_subnet_network_security_group_association") {
    values.subnet_id = networkId("virtualNetworks/vnet-ws2-unit-dev/subnets/web");
    values.network_security_group_id = networkId("networkSecurityGroups/nsg-ws2-unit-dev");
  }
  return {
    address, mode: "managed", type, name: "this", provider_name: "registry.terraform.io/hashicorp/azurerm",
    change: { actions, before: actions.length === 1 && actions[0] === "create" ? null : clone(values), after: actions.length === 1 && actions[0] === "delete" ? null : clone(values) },
  };
}
const plan = (changes = []) => ({ format_version: "1.2", terraform_version: "1.16.1", resource_changes: changes });

function protection() {
  return {
    name: "dev-apply", can_admins_bypass: false,
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
    protection_rules: [],
  };
}
const mainBranches = () => [{ id: 1, name: "main", type: "branch" }];

async function snapshotFixture(t, crlf = false) {
  const directory = await mkdtemp(join(tmpdir(), "ws2-policy-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(HCL)) {
    const destination = join(directory, name);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, crlf ? text.replaceAll("\n", "\r\n") : text, "utf8");
  }
  return { directory, lock: moduleLock() };
}

test("operationFor binds delivery and cleanup to their exact protected-main paths and supported events", () => {
  assert.equal(operationFor("push", "destroy", WORKFLOW_REF), "deploy");
  assert.equal(operationFor("schedule", "deploy", WORKFLOW_REF), "drift");
  assert.equal(operationFor("workflow_dispatch", "followup", WORKFLOW_REF), "followup");
  for (const input of [undefined, "destroy"]) assert.equal(operationFor("workflow_dispatch", input, CLEANUP_REF), "destroy");
  for (const value of [undefined, null, "", "plan", "deploy", "destroy", "drift", "apply", "Deploy", "plan;destroy"]) assert.throws(() => operationFor("workflow_dispatch", value, WORKFLOW_REF), rejected(), String(value));
  for (const event of ["pull_request", "pull_request_target", "workflow_run", "repository_dispatch"]) assert.throws(() => operationFor(event, "deploy", WORKFLOW_REF), rejected());
  for (const event of ["push", "schedule"]) assert.throws(() => operationFor(event, "destroy", CLEANUP_REF), rejected());
  for (const ref of [undefined, WORKFLOW_REF.replace("main", "dev"), WORKFLOW_REF.replace("delivery.yml", "avm-delivery.yml"), "other/repo/.github/workflows/delivery.yml@refs/heads/main"]) assert.throws(() => operationFor("push", "deploy", ref), rejected());
});

test("planExit recognizes exit 0/2 but rejects error 1, signals and unexpected statuses before manifest creation", () => {
  assert.equal(planExit(0), "no-change");
  assert.equal(planExit(2), "changes");
  for (const value of [1, -1, 3, 127, null, undefined, "0", "2", NaN]) {
    assert.throws(() => planExit(value), rejected(/no plan may proceed to apply/), String(value));
    assert.throws(() => makeManifest({}, Buffer.from("offline"), value, NOW), rejected(/no plan may proceed to apply/), String(value));
  }
});

test("planBinding pins toolchain and normalized lock/input digests without mutating configuration", () => {
  const c = config();
  const before = clone(c);
  const binding = planBinding(c, PROVIDER_LOCK, MODULE_LOCK_TEXT, INPUTS_TEXT);
  assert.equal(TERRAFORM_VERSION, "1.16.1");
  assert.equal(PROVIDER_VERSION, "5.4.0");
  assert.deepEqual(binding, { ...c, terraform: "1.16.1", provider: "5.4.0", providerLock: textHash(PROVIDER_LOCK), moduleLock: textHash(MODULE_LOCK_TEXT), inputs: textHash(INPUTS_TEXT) });
  assert.deepEqual(c, before);
  assert.deepEqual(planBinding(c, PROVIDER_LOCK.replaceAll("\n", "\r\n"), MODULE_LOCK_TEXT.replaceAll("\n", "\r\n"), INPUTS_TEXT.replaceAll("\n", "\r\n")), binding);
  for (const patch of [{ sha: "main" }, { repository: "missing-owner" }, { subscription: "not-a-subscription-id" }, { operation: "apply" }, { root: "../dev" }, { environment: "prod" }, ...["repositoryId", "workflowRef", "runId", "runAttempt", "stateAccount", "stateContainer", "stateKey", "stateLockId", "tenant", "planClientId", "applyClientId", "resourceGroup"].map((field) => ({ [field]: "" }))]) {
    assert.throws(() => planBinding(config(patch), PROVIDER_LOCK, MODULE_LOCK_TEXT, INPUTS_TEXT), rejected(), JSON.stringify(patch));
  }
});

test("makeManifest and verifyPlan accept exact deploy/destroy bytes for exit 0/2 through the two-hour boundary", () => {
  assert.equal(MAX_PLAN_AGE_MS, 7_200_000);
  for (const operation of ["deploy", "destroy"]) {
    for (const exitCode of [0, 2]) {
      const f = planFixture({ operation, exitCode });
      assert.equal(f.manifest.schemaVersion, 1);
      assert.equal(f.manifest.createdAt, "2026-09-07T12:00:00.000Z");
      assert.equal(f.manifest.exitCode, exitCode);
      assert.deepEqual(f.manifest.binding, f.binding);
      assert.equal(f.manifest.planSha256, bytesHash(f.planBytes));
      assert.equal(verifyPlan(f), true);
      assert.equal(verifyPlan({ ...f, now: NOW + MAX_PLAN_AGE_MS }), true);
    }
  }
});

test("verifyPlan rejects manifest tampering, malformed expected SHA-256, wrong schema and failed exit codes", () => {
  const tampered = planFixture();
  tampered.manifestBytes = Buffer.concat([tampered.manifestBytes, Buffer.from(" ")]);
  assert.throws(() => verifyPlan(tampered), rejected(/Plan manifest was altered/));
  for (const field of ["expectedManifestHash", "expectedPlanHash"]) {
    for (const value of ["", "a".repeat(63), "g".repeat(64), "A".repeat(64)]) {
      assert.throws(() => verifyPlan({ ...planFixture(), [field]: value }), rejected(), `${field}: ${value}`);
    }
  }
  for (const patch of [{ schemaVersion: 2 }, { exitCode: 1 }, { exitCode: "2" }]) {
    const f = planFixture(); Object.assign(f.manifest, patch); sealManifest(f);
    assert.throws(() => verifyPlan(f), rejected(), JSON.stringify(patch));
  }
});

test("verifyPlan rejects altered saved-plan bytes, wrong expected plan digest and inconsistent recorded digest", () => {
  const tampered = planFixture();
  tampered.planBytes[0] ^= 1;
  assert.throws(() => verifyPlan(tampered), rejected(/Saved plan was altered/));
  const wrongExpected = planFixture(); wrongExpected.expectedPlanHash = "f".repeat(64);
  assert.throws(() => verifyPlan(wrongExpected), rejected(/Saved plan was altered/));
  const wrongRecord = planFixture(); wrongRecord.manifest.planSha256 = "f".repeat(64); sealManifest(wrongRecord);
  assert.throws(() => verifyPlan(wrongRecord), rejected());
});

test("verifyPlan must validate the manifest object against its authenticated bytes, not an independently replaced object", () => {
  const f = planFixture({ createdAt: NOW - MAX_PLAN_AGE_MS - 1 });
  // The approved bytes still describe an expired plan. Replacing only the
  // decoded object must not bypass the bytes/digest or expiry contract.
  f.manifest = { ...f.manifest, createdAt: new Date(NOW).toISOString() };
  assert.throws(() => verifyPlan(f), rejected(/manifest|timestamp|stale/i));
});

test("verifyPlan rejects independent commit/run/attempt/repository/state/identity/root/toolchain binding mismatches", () => {
  const patches = {
    sha: OTHER_SHA, runId: "902", runAttempt: "3", repository: "other/environment", operation: "destroy",
    repositoryId: "1379147533", workflowRef: CLEANUP_REF, stateLockId: "other-state",
    root: "environments/other", environment: "prod", stateAccount: "otherstate", stateContainer: "other-team", stateKey: "other/network.tfstate",
    subscription: OTHER_SUBSCRIPTION, tenant: "55555555-5555-4555-8555-555555555555", planClientId: "other-plan", applyClientId: "other-apply",
    resourceGroup: "rg-other", terraform: "1.16.0", provider: "5.3.0",
  };
  for (const [field, value] of Object.entries(patches)) {
    const f = planFixture(); f.binding = { ...f.binding, [field]: value };
    if (field === "sha") f.currentSha = value;
    assert.throws(() => verifyPlan(f), rejected(/identity mismatch/), field);
  }
  for (const field of ["repositoryId", "workflowRef", "stateLockId"]) {
    const f = planFixture(); delete f.manifest.binding[field]; sealManifest(f);
    assert.throws(() => verifyPlan(f), rejected(/identity mismatch/), `old manifest without ${field}`);
  }
});

test("verifyPlan rejects changed provider lock, module revision/snapshot lock and workload inputs", () => {
  const changedLock = moduleLock();
  changedLock.revision = "e".repeat(40);
  changedLock.source = changedLock.source.replace("d".repeat(40), changedLock.revision);
  const changedInputs = inputs(); changedInputs.subnets.web.address_prefixes = ["10.42.3.0/24"];
  for (const [label, provider, module, values] of [
    ["provider lock", `${PROVIDER_LOCK}# changed selection\n`, MODULE_LOCK_TEXT, INPUTS_TEXT],
    ["module lock", PROVIDER_LOCK, jsonBytes(changedLock).toString("utf8"), INPUTS_TEXT],
    ["workload inputs", PROVIDER_LOCK, MODULE_LOCK_TEXT, jsonBytes(changedInputs).toString("utf8")],
  ]) {
    const f = planFixture(); f.binding = planBinding(config(), provider, module, values);
    assert.throws(() => verifyPlan(f), rejected(/identity mismatch/), label);
  }
});

test("verifyPlan rejects plans older than two hours and invalid timestamps", () => {
  const stale = planFixture({ createdAt: NOW - MAX_PLAN_AGE_MS - 1 });
  assert.throws(() => verifyPlan(stale), rejected(/stale or has an invalid timestamp/));
  for (const createdAt of ["not-a-date", "", null]) {
    const f = planFixture(); f.manifest.createdAt = createdAt; sealManifest(f);
    assert.throws(() => verifyPlan(f), rejected(/stale or has an invalid timestamp/), String(createdAt));
  }
});

test("verifyPlan rejects future timestamps, including one millisecond ahead of the trusted clock", () => {
  // The documented contract rejects future timestamps; do not mask a clock-skew
  // allowance by testing only a timestamp more than one minute in the future.
  for (const offset of [1, 60_000, 60_001]) {
    assert.throws(() => verifyPlan(planFixture({ createdAt: NOW + offset })), rejected(/stale|timestamp|future/i), `future offset ${offset}ms`);
  }
});

test("verifyPlan rejects protected main moving after planning even with otherwise authentic artifacts", () => {
  assert.throws(() => verifyPlan({ ...planFixture(), currentSha: OTHER_SHA }), rejected(/Protected main has moved/));
});

test("verifyPlan forbids apply for plan-only, drift and follow-up operations even with valid exit 0/2 artifacts", () => {
  for (const operation of ["plan", "drift", "followup"]) {
    for (const exitCode of [0, 2]) assert.throws(() => verifyPlan(planFixture({ operation, exitCode })), rejected(/cannot apply/), `${operation}/${exitCode}`);
  }
});

test("summarizePlan counts only allowed workload resources and emits no raw values or outputs", () => {
  const changes = [
    resource("azurerm_virtual_network", ["create"]), resource("azurerm_subnet", ["update"]),
    resource("azurerm_network_security_group", ["no-op"]), resource("azurerm_network_security_rule", ["create"]),
    resource("azurerm_subnet_network_security_group_association", ["update"]),
  ];
  changes[0].change.after.description = "SYNTHETIC-SENSITIVE-VALUE";
  const data = { ...plan(changes), output_changes: { secret: { sensitive: true, after: "SYNTHETIC-OUTPUT" } } };
  assert.deepEqual(summarizePlan(data, config()), {
    totals: { create: 2, update: 2, delete: 0, replace: 0, noChange: 1 },
    resources: [0, 1, 3, 4].map((index, n) => ({ address: changes[index].address, action: ["create", "update", "create", "update"][n] })),
  });
  assert.doesNotMatch(JSON.stringify(summarizePlan(data, config())), /SYNTHETIC-|subscriptions|resource_group_name/);
  assert.deepEqual(summarizePlan(plan(), config()), { totals: { create: 0, update: 0, delete: 0, replace: 0, noChange: 0 }, resources: [] });
});

test("summarizePlan rejects resource-group creation, other infrastructure, forbidden addresses/actions and invalid schema", () => {
  for (const type of ["azurerm_resource_group", "azurerm_storage_account", "azurerm_role_assignment", "azurerm_linux_virtual_machine"]) {
    const item = resource(); item.type = type;
    assert.throws(() => summarizePlan(plan([item]), config()), rejected(/instructor-owned or unsupported/), type);
  }
  for (const address of ["azurerm_virtual_network.this", "module.other.azurerm_virtual_network.this", "module.network.module.other.azurerm_virtual_network.this", "module.network.azurerm_virtual_network.unreviewed", "module.network.azurerm_subnet.this[0]", 'module.network.azurerm_subnet.this["../escape"]']) {
    assert.throws(() => summarizePlan(plan([{ ...resource(), address }]), config()), rejected(/Unexpected managed resource address/), address);
  }
  for (const actions of [[], ["read"], ["forget"], ["create", "execute"], "create"]) {
    const item = resource(); item.change.actions = actions;
    assert.throws(() => summarizePlan(plan([item]), config()), rejected(/Unsupported plan action/), JSON.stringify(actions));
  }
  for (const patch of [{ format_version: "2.0" }, { terraform_version: "1.15.0" }, { resource_changes: {} }, { resource_changes: [{ ...resource(), mode: "data" }] }]) {
    assert.throws(() => summarizePlan({ ...plan([resource()]), ...patch }, config()), rejected(), JSON.stringify(patch));
  }
});

test("scope and summary reject other-subscription/RG IDs and NSG/subnet references instead of trusting matching names", () => {
  const good = networkId("networkSecurityGroups/nsg-ws2-unit-dev");
  assert.doesNotThrow(() => assertScope(good.toUpperCase(), config()));
  for (const bad of [good.replace(SUBSCRIPTION, OTHER_SUBSCRIPTION), good.replace("rg-ws2-unit/", "rg-ws2-unit-extra/"), good.replace("Microsoft.Network/", "Microsoft.Storage/"), "not-an-id"]) {
    assert.throws(() => assertScope(bad, config()), rejected(/outside the assigned workload scope/), bad);
  }
  for (const field of ["id", "subnet_id", "network_security_group_id"]) {
    for (const bad of [good.replace(SUBSCRIPTION, OTHER_SUBSCRIPTION), good.replace("rg-ws2-unit/", "rg-other/")]) {
      const item = resource("azurerm_subnet_network_security_group_association"); item.change.after[field] = bad;
      assert.throws(() => summarizePlan(plan([item]), config()), rejected(/outside the assigned workload scope/), field);
    }
  }
  const before = resource("azurerm_network_security_group", ["delete"]); before.change.before.id = good.replace(SUBSCRIPTION, OTHER_SUBSCRIPTION);
  assert.throws(() => summarizePlan(plan([before]), config()), rejected(/outside the assigned workload scope/));
  const wrongGroup = resource(); wrongGroup.change.after.resource_group_name = "rg-other";
  assert.throws(() => summarizePlan(plan([wrongGroup]), config()), rejected());
});

test("destroy summaries allow only scoped delete/no-op actions and reject creates, updates and replacement", () => {
  const c = config({ operation: "destroy" });
  const summary = summarizePlan(plan([resource("azurerm_virtual_network", ["delete"]), resource("azurerm_subnet", ["no-op"])]), c);
  assert.deepEqual(summary.totals, { create: 0, update: 0, delete: 1, replace: 0, noChange: 1 });
  for (const actions of [["create"], ["update"], ["delete", "create"], ["create", "delete"]]) {
    assert.throws(() => summarizePlan(plan([resource("azurerm_virtual_network", actions)]), c), rejected(/Destroy plans may only delete/), actions.join(","));
  }
  const all = ["azurerm_virtual_network", "azurerm_subnet", "azurerm_network_security_group", "azurerm_network_security_rule", "azurerm_subnet_network_security_group_association"].map((type) => resource(type, ["delete"]));
  assert.deepEqual(summarizePlan(plan(all), c).totals, { create: 0, update: 0, delete: 5, replace: 0, noChange: 0 });
});

test("ordinary deploy, plan, drift and followup reject every deletion and replacement action ordering", () => {
  for (const operation of ["deploy", "plan", "drift", "followup"]) {
    for (const actions of [["delete"], ["delete", "create"], ["create", "delete"], ["no-op", "delete"], ["update", "delete"]]) {
      assert.throws(() => summarizePlan(plan([resource("azurerm_virtual_network", actions)]), config({ operation })), rejected(/separately authorized cleanup/), `${operation}/${actions.join(",")}`);
    }
  }
});

test("configuration accepts explicit private protected-main OIDC settings without reading ambient environment or mutating inputs", () => {
  for (const [GITHUB_EVENT_NAME, OPERATION, GITHUB_WORKFLOW_REF] of [["push", "deploy", WORKFLOW_REF], ["workflow_dispatch", "followup", WORKFLOW_REF], ["schedule", "drift", WORKFLOW_REF], ["workflow_dispatch", "destroy", CLEANUP_REF]]) {
    const env = environmentVariables({ GITHUB_EVENT_NAME, OPERATION, GITHUB_WORKFLOW_REF }); const before = clone(env);
    assert.deepEqual(configuration(env), { config: config({ operation: OPERATION }), inputsText: INPUTS_TEXT });
    assert.deepEqual(env, before);
  }
});

test("configuration fails closed when enablement, main branch, privacy, protection or trusted event is missing", () => {
  for (const patch of [
    { WORKSHOP_AZURE_ENABLED: "false" }, { WORKSHOP_AZURE_ENABLED: undefined }, { WORKSHOP_AZURE_ENABLED: true },
    { GITHUB_REF: "refs/heads/dev" }, { GITHUB_REF: "refs/pull/17/merge" }, { GITHUB_REF_PROTECTED: "false" }, { GITHUB_REF_PROTECTED: undefined },
    { REPOSITORY_PRIVATE: "false" }, { REPOSITORY_PRIVATE: undefined }, { GITHUB_EVENT_NAME: "pull_request" }, { GITHUB_EVENT_NAME: "pull_request_target" },
    { REPOSITORY_TEMPLATE: "true" }, { REPOSITORY_TEMPLATE: undefined },
  ]) assert.throws(() => configuration(environmentVariables(patch)), rejected(), JSON.stringify(patch));
});

test("configuration rejects same-name recreation, cross-lab IDs, renamed copies and missing workflow identity", () => {
  for (const GITHUB_REPOSITORY_ID of [undefined, "1379149908", "1379147533", "01379149907", 1379149907]) assert.throws(() => configuration(environmentVariables({ GITHUB_REPOSITORY_ID })), rejected());
  for (const GITHUB_REPOSITORY of [undefined, "other-owner/ws2-sim-20260921-azure-delivery-laboratory-07", "alvine-aurelio-org/other-copy", "alvine-aurelio-org/ws2-sim-20260921-network-module-laboratory-02"]) assert.throws(() => configuration(environmentVariables({ GITHUB_REPOSITORY })), rejected());
  for (const GITHUB_WORKFLOW_REF of [undefined, WORKFLOW_REF.replace("main", "dev"), WORKFLOW_REF.replace("delivery.yml", "other.yml")]) assert.throws(() => configuration(environmentVariables({ GITHUB_WORKFLOW_REF })), rejected());
});

test("configuration never accepts an OPERATION inconsistent with its event and dedicated workflow", () => {
  for (const patch of [
    ...[undefined, "destroy", "followup", "drift", "plan"].map((OPERATION) => ({ OPERATION })),
    { GITHUB_EVENT_NAME: "schedule", OPERATION: "deploy" },
    ...["deploy", "plan", "drift", "destroy"].map((OPERATION) => ({ GITHUB_EVENT_NAME: "workflow_dispatch", OPERATION })),
    { GITHUB_WORKFLOW_REF: CLEANUP_REF, OPERATION: "destroy" },
    { GITHUB_EVENT_NAME: "schedule", GITHUB_WORKFLOW_REF: CLEANUP_REF, OPERATION: "destroy" },
    { GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_WORKFLOW_REF: CLEANUP_REF, OPERATION: "followup" },
  ]) assert.throws(() => configuration(environmentVariables(patch)), rejected(), JSON.stringify(patch));
});

test("configuration rejects missing OIDC/Entra auth and any client secret, storage key, SAS or MSI fallback", () => {
  for (const patch of [
    { ARM_USE_OIDC: undefined }, { ARM_USE_OIDC: "false" }, { ARM_USE_AZUREAD: undefined }, { ARM_USE_AZUREAD: "false" },
    ...["ARM_CLIENT_SECRET", "ARM_ACCESS_KEY", "ARM_SAS_TOKEN", "ARM_USE_MSI", "ARM_CLIENT_SECRET_FILE_PATH", "ARM_CLIENT_CERTIFICATE", "ARM_CLIENT_CERTIFICATE_PATH", "TF_WORKSPACE", "TF_DATA_DIR"].map((field) => ({ [field]: "synthetic-not-a-credential" })),
    { GITHUB_RUN_ATTEMPT: "2" },
  ]) assert.throws(() => configuration(environmentVariables(patch)), rejected(), JSON.stringify(patch));
});

test("configuration rejects malformed state/input scope and binding rejects the same plan/apply identity", () => {
  for (const patch of [
    { STATE_STORAGE_ACCOUNT: "UPPERCASE" }, { STATE_STORAGE_ACCOUNT: "ab" }, { STATE_STORAGE_ACCOUNT: "a".repeat(25) },
    { STATE_CONTAINER: "x" }, { STATE_CONTAINER: "Bad_Container" }, { STATE_KEY: "dev/../other.tfstate" }, { STATE_KEY: "dev/plan.json" },
    { WS2_STATE_LOCK_ID: undefined }, { WS2_STATE_LOCK_ID: "ab" }, { WS2_STATE_LOCK_ID: "state/other" }, { WS2_STATE_LOCK_ID: "a".repeat(81) },
    { WORKLOAD_RG: "rg/other" }, { WORKLOAD_RG: "rg-other" },
  ]) assert.throws(() => configuration(environmentVariables(patch)), rejected(), JSON.stringify(patch));
  assert.throws(() => configuration(environmentVariables({ WORKLOAD_INPUTS_JSON: "{broken" })), /instructor-approved non-secret/);
  const missing = inputs(); delete missing.location;
  const wrongEnvironment = inputs(); wrongEnvironment.tags.environment = "prod";
  const wrongWorkshop = inputs(); wrongWorkshop.tags.workshop = "other";
  for (const value of [null, [], missing, wrongEnvironment, wrongWorkshop, { ...inputs(), arbitrary_variable: "denied" }]) {
    assert.throws(() => configuration(environmentVariables({ WORKLOAD_INPUTS_JSON: JSON.stringify(value) })), rejected(), JSON.stringify(value));
  }
  const env = environmentVariables(); env.APPLY_CLIENT_ID = env.PLAN_CLIENT_ID;
  const configured = configuration(env);
  assert.throws(() => planBinding(configured.config, PROVIDER_LOCK, MODULE_LOCK_TEXT, configured.inputsText), rejected(/Plan and apply identities must be different/));
});

test("environment protection always requires no reviewers and disabled administrator bypass", () => {
  assert.doesNotThrow(() => assertEnvironmentProtection(protection(), mainBranches()));
  for (const mutate of [
    (e) => { delete e.protection_rules; },
    (e) => { e.protection_rules = [{ type: "required_reviewers", prevent_self_review: true, reviewers: [{}] }]; },
    (e) => { e.protection_rules = [{ type: "required_reviewers", reviewers: [] }]; },
    (e) => { e.can_admins_bypass = true; }, (e) => { delete e.can_admins_bypass; },
  ]) {
    const environment = protection(); mutate(environment);
    for (const legacyFlag of [undefined, false, true]) assert.throws(() => assertEnvironmentProtection(environment, mainBranches(), legacyFlag), rejected());
  }
});

test("both trusted environments use the shared main-only policy without an optional bypass flag", () => {
  const planning = { ...protection(), name: "dev-plan" };
  assert.doesNotThrow(() => assertEnvironmentProtection(planning, mainBranches()));
  for (const legacyFlag of [undefined, false, true]) {
    for (const branches of [[], [{ name: "*", type: "branch" }], [{ name: "dev", type: "branch" }], [{ name: "main", type: "tag" }], [...mainBranches(), { name: "feature/*", type: "branch" }]]) {
      assert.throws(() => assertEnvironmentProtection(protection(), branches, legacyFlag), rejected(/Only main/), JSON.stringify(branches));
    }
    for (const policy of [null, { custom_branch_policies: false, protected_branches: true }, { custom_branch_policies: true, protected_branches: true }]) {
      assert.throws(() => assertEnvironmentProtection({ ...protection(), deployment_branch_policy: policy }, mainBranches(), legacyFlag), rejected(), JSON.stringify(policy));
    }
  }
});

// The scoped automatic authorization and dedicated cleanup cases are exercised
// in deployment-authorization.test.mjs with a wholly in-memory GitHub client.

test("validateLock accepts exact full-SHA source equality and moduleSource extracts one network source", () => {
  for (const subdirectory of ["", "checkpoints/v1.0.0"]) {
    const lock = moduleLock(subdirectory);
    assert.equal(validateLock(lock, lock.source), lock);
    const main = `module "network" {\n  source = "${lock.source}"\n}\n`;
    assert.equal(moduleSource(main), lock.source);
    assert.equal(moduleSource(main.replaceAll("\n", "\r\n")), lock.source);
    assert.throws(() => moduleSource(`${main}\nmodule "other" {\n  source = "./unreviewed"\n}\n`), rejected(/one exact module source/));
    assert.throws(() => moduleSource(main.replace('module "network"', 'module "other"')), rejected());
  }
  assert.throws(() => moduleSource('module "network" {}'), rejected(/one exact module source/));
});

test("validateLock rejects mutable/placeholder refs, wrong source/repository/schema and escaping subdirectories", () => {
  for (const patch of [
    { schemaVersion: 2 }, { revision: "main" }, { revision: "v1.0.0" }, { revision: "REPLACE_ME" }, { revision: "g".repeat(40) }, { revision: "0".repeat(40) },
    { repository: "owner/repo/extra" }, { source: "./vendor/network-baseline" }, { source: moduleLock().source.replace("d".repeat(40), OTHER_SHA) },
    { subdirectory: "../outside" }, { subdirectory: "modules/../outside" }, { subdirectory: "/absolute" }, { subdirectory: "modules\\outside" },
  ]) {
    assert.throws(() => validateLock({ ...moduleLock(), ...patch }), rejected(), JSON.stringify(patch));
  }
  const lock = moduleLock();
  assert.throws(() => validateLock(lock, lock.source.replace("d".repeat(40), OTHER_SHA)), rejected(/Consumer and dependency lock disagree/));
});

test("validateLock rejects traversing/duplicate file paths, missing inventory and invalid SHA-256 values", () => {
  const maximum = moduleLock();
  maximum.files.push(...Array.from({ length: 92 }, (_, i) => ({ path: `extra-${i}.tf`, sha256: "f".repeat(64) })));
  assert.equal(validateLock(maximum), maximum);
  const duplicate = moduleLock(); duplicate.files.push(clone(duplicate.files[0]));
  assert.throws(() => validateLock(duplicate), rejected(/Duplicate module paths/));
  const missing = moduleLock(); missing.files[0].path = "other.tf";
  assert.throws(() => validateLock(missing), rejected(/Missing main.tf/));
  for (const files of [moduleLock().files.slice(0, 7), [...maximum.files, { path: "overflow.tf", sha256: "f".repeat(64) }]]) {
    assert.throws(() => validateLock({ ...moduleLock(), files }), rejected());
  }
  for (const name of ["../main.tf", "/main.tf", "modules/../../main.tf", "modules/subnet-security/../main.tf", "modules\\subnet-security\\main.tf", ".terraform/main.tf", "main.tf.json", "examples/basic/main.tf"]) {
    const lock = moduleLock(); lock.files[0].path = name;
    assert.throws(() => validateLock(lock), rejected(), name);
  }
  for (const value of ["a".repeat(63), "A".repeat(64), "g".repeat(64)]) {
    const lock = moduleLock(); lock.files[0].sha256 = value;
    assert.throws(() => validateLock(lock), rejected(), value);
  }
});

test("verifySnapshot checks exact temporary HCL inventory and normalizes CRLF text without normalizing binary digests", async (t) => {
  const f = await snapshotFixture(t, true);
  assert.deepEqual(await moduleFiles(f.directory), Object.keys(HCL).sort());
  assert.equal(await verifySnapshot(f.directory, f.lock), true);
  await writeFile(join(f.directory, "README.md"), "Synthetic untracked documentation, not HCL.\n");
  assert.equal(await verifySnapshot(f.directory, f.lock), true);
  assert.equal(textHash("line\r\n"), textHash("line\n"));
  assert.notEqual(bytesHash(Buffer.from("line\r\n")), bytesHash(Buffer.from("line\n")));
});

test("verifySnapshot rejects altered temporary module data even when its inventory and source lock still match", async (t) => {
  const f = await snapshotFixture(t);
  assert.equal(await verifySnapshot(f.directory, f.lock), true);
  await writeFile(join(f.directory, "main.tf"), `${HCL["main.tf"]}# Unreviewed synthetic change\n`);
  await assert.rejects(verifySnapshot(f.directory, f.lock), rejected(/Module snapshot changed: main.tf/));
});

test("verifySnapshot rejects missing/extra HCL, injected JSON Terraform and linked module directories", async (t) => {
  for (const [label, mutate, pattern] of [
    ["missing", (directory) => rm(join(directory, "outputs.tf")), /inventory differs/],
    ["extra child HCL", (directory) => writeFile(join(directory, "modules/subnet-security/extra.tf"), "locals {}\n"), /inventory differs/],
    ["JSON Terraform", (directory) => writeFile(join(directory, "extra.tf.json"), "{}\n"), /auditable HCL/],
    ["linked directory", async (directory) => {
      const target = join(directory, "untracked-target");
      await mkdir(target);
      await symlink(target, join(directory, "modules/linked"), process.platform === "win32" ? "junction" : "dir");
    }, /cannot contain symlinks/],
  ]) {
    const f = await snapshotFixture(t); await mutate(f.directory);
    await assert.rejects(verifySnapshot(f.directory, f.lock), rejected(pattern), label);
  }
});
