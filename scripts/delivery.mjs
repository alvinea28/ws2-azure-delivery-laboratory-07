import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, appendFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { bytesHash, moduleSource, validateLock, verifyInstalledModule } from "./module-snapshot.mjs";
import { assertScope, planBinding, makeManifest, planExit, summarizePlan, verifyPlan } from "./plan-policy.mjs";

const root = "environments/dev";
const privateDir = ".workshop/private";
const allowedVars = new Set(["name", "resource_group_name", "location", "address_space", "subnets", "tags"]);

export function classifyTerraformFailure(text) {
  if (/AADSTS70021|AADSTS700213|federated identity credential/i.test(text)) return "OIDC trust mismatch";
  if (/AuthorizationPermissionMismatch|AuthorizationFailed|Forbidden|StatusCode=403/i.test(text)) return "resource or storage RBAC/authorization";
  if (/no such host|dial tcp|i\/o timeout|context deadline exceeded/i.test(text)) return "private DNS/network connectivity";
  if (/state lock|LeaseAlreadyPresent|lease.*conflict/i.test(text)) return "state lease or concurrent writer";
  return "unclassified; request instructor-controlled sanitized diagnostics";
}

export function configuration(env) {
  assert.equal(env.WORKSHOP_AZURE_ENABLED, "true", "Azure delivery is disabled until the instructor preflight is complete");
  assert.equal(env.GITHUB_REF, "refs/heads/main", "Only protected main is deployable");
  assert.equal(env.GITHUB_REF_PROTECTED, "true", "Protect main before enabling delivery");
  assert.equal(env.REPOSITORY_PRIVATE, "true", "Saved plans require the approved private repository");
  assert.equal(env.GITHUB_RUN_ATTEMPT, "1", "Dispatch a new run; job reruns cannot reuse an earlier approval");
  assert.ok(["push", "workflow_dispatch", "schedule"].includes(env.GITHUB_EVENT_NAME));
  assert.equal(env.ARM_USE_OIDC, "true");
  assert.equal(env.ARM_USE_AZUREAD, "true");
  for (const key of ["ARM_CLIENT_SECRET", "ARM_CLIENT_SECRET_FILE_PATH", "ARM_CLIENT_CERTIFICATE", "ARM_CLIENT_CERTIFICATE_PATH", "ARM_CLIENT_CERTIFICATE_PASSWORD", "ARM_ACCESS_KEY", "ARM_SAS_TOKEN", "ARM_USE_MSI", "ARM_USE_AKS_WORKLOAD_IDENTITY", "ARM_OIDC_TOKEN", "ARM_OIDC_TOKEN_FILE_PATH", "ARM_CLIENT_ID_FILE_PATH", "ARM_TENANT_ID_FILE_PATH", "TF_DATA_DIR", "TF_WORKSPACE"]) assert.ok(!env[key], `Remove ambient ${key}; only the explicit workshop OIDC/default-state configuration is allowed`);
  assert.match(env.STATE_STORAGE_ACCOUNT || "", /^[a-z0-9]{3,24}$/);
  assert.match(env.STATE_CONTAINER || "", /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/);
  assert.match(env.STATE_KEY || "", /^[a-zA-Z0-9][a-zA-Z0-9_./-]{0,200}\.tfstate$/);
  assert.ok(!env.STATE_KEY.split("/").includes(".."));
  let inputs;
  try { inputs = JSON.parse(env.WORKLOAD_INPUTS_JSON); } catch { throw new Error("Configure the instructor-approved non-secret WORKLOAD_INPUTS_JSON variable"); }
  assert.ok(inputs && !Array.isArray(inputs) && Object.keys(inputs).every((key) => allowedVars.has(key)));
  assert.ok(Object.keys(inputs).length === allowedVars.size && inputs.tags?.environment === "dev" && inputs.tags?.workshop === "ws2");
  assert.equal(inputs.resource_group_name, env.WORKLOAD_RG, "Inputs must target the assigned workload RG");
  assert.match(env.WORKLOAD_RG || "", /^[a-zA-Z0-9_().-]{1,90}$/);
  const config = {
    repository: env.GITHUB_REPOSITORY, sha: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT,
    root, environment: "dev", operation: env.OPERATION,
    subscription: env.ARM_SUBSCRIPTION_ID, tenant: env.ARM_TENANT_ID,
    planClientId: env.PLAN_CLIENT_ID, applyClientId: env.APPLY_CLIENT_ID,
    resourceGroup: env.WORKLOAD_RG, stateAccount: env.STATE_STORAGE_ACCOUNT,
    stateContainer: env.STATE_CONTAINER, stateKey: env.STATE_KEY,
  };
  return { config, inputsText: `${JSON.stringify(inputs, null, 2)}\n` };
}

export function terraformEnvironment(original) {
  const names = new Set(["PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR", "ARM_CLIENT_ID", "ARM_TENANT_ID", "ARM_SUBSCRIPTION_ID", "ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"]);
  const env = Object.fromEntries(Object.entries(original).filter(([key]) => names.has(key)));
  return { ...env, ARM_USE_OIDC: "true", ARM_USE_AZUREAD: "true", ARM_USE_CLI: "false", TF_WORKSPACE: "default", TF_INPUT: "0", TF_IN_AUTOMATION: "true", TF_CLI_CONFIG_FILE: resolve(privateDir, "terraform.rc"), HOME: resolve(privateDir, "home"), USERPROFILE: resolve(privateDir, "home"), AZURE_CONFIG_DIR: resolve(privateDir, "azure-unused"), GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: resolve(privateDir, "gitconfig"), GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_COUNT: "3", GIT_CONFIG_KEY_0: "credential.helper", GIT_CONFIG_VALUE_0: "", GIT_CONFIG_KEY_1: "core.hooksPath", GIT_CONFIG_VALUE_1: resolve(privateDir, "no-hooks"), GIT_CONFIG_KEY_2: "protocol.file.allow", GIT_CONFIG_VALUE_2: "never" };
}

async function terraform(args, { init = false, allowChanges = false } = {}) {
  const env = terraformEnvironment(process.env);
  // Module token is scoped to one approved repo and only exists in init's child.
  delete env.MODULE_READ_TOKEN;
  if (init) {
    assert.ok(process.env.MODULE_READ_TOKEN, "The approved private-module read token is not configured");
    const lock = JSON.parse(await readFile("module-lock.json", "utf8"));
    validateLock(lock);
    const authorization = Buffer.from(`x-access-token:${process.env.MODULE_READ_TOKEN}`).toString("base64");
    console.log(`::add-mask::${authorization}`);
    env.GIT_CONFIG_COUNT = "4";
    env.GIT_CONFIG_KEY_3 = `http.https://github.com/${lock.repository}.git.extraheader`;
    env.GIT_CONFIG_VALUE_3 = `AUTHORIZATION: basic ${authorization}`;
    env.GIT_TERMINAL_PROMPT = "0";
  }
  const result = spawnSync(process.env.TERRAFORM_BIN || "terraform", [`-chdir=${root}`, ...args], { encoding: "utf8", shell: false, env, timeout: 1_800_000, maxBuffer: 32 * 1024 * 1024 });
  assert.ok(!result.error && !result.signal, "Terraform did not finish normally; investigate the restricted runner diagnostics");
  if (!(result.status === 0 || allowChanges && result.status === 2)) {
    const category = classifyTerraformFailure(`${result.stdout || ""}\n${result.stderr || ""}`);
    throw new Error(`Terraform ${args[0]} failed (exit ${result.status}); category: ${category}. No raw logs/state were published. Follow the recovery runbook; do not broaden access or bypass locks.`);
  }
  return result;
}

export async function currentMain(config, request = fetch) {
  const response = await request(`https://api.github.com/repos/${config.repository}/branches/main`, { headers: { Authorization: `Bearer ${process.env.GH_READ_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, signal: AbortSignal.timeout(30_000) });
  assert.ok(response.ok, "Cannot recheck protected main immediately before apply");
  const branch = await response.json();
  assert.equal(branch.protected, true);
  assert.equal(branch.commit.sha, config.sha, "Main changed during initialization; regenerate the plan and independent approval");
  return branch.commit.sha;
}

async function outputs(values) {
  assert.ok(process.env.GITHUB_OUTPUT, "Actions output channel is required");
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(""));
}

export async function deliver(phase) {
  const { config, inputsText } = configuration(process.env);
  assert.equal(process.env.ARM_CLIENT_ID, ["apply", "destroy"].includes(phase) ? config.applyClientId : config.planClientId, "Incorrect identity for this job phase");
  await mkdir(privateDir, { recursive: true, mode: 0o700 });
  await mkdir(join(privateDir, "home"), { recursive: true, mode: 0o700 });
  await mkdir(join(privateDir, "no-hooks"), { recursive: true, mode: 0o700 });
  await writeFile(join(privateDir, "gitconfig"), "", { mode: 0o600 });
  await writeFile(join(privateDir, "terraform.rc"), "disable_checkpoint = true\n", { mode: 0o600 });
  const inputPath = resolve(privateDir, "inputs.tfvars.json");
  await writeFile(inputPath, inputsText, { mode: 0o600 });
  const lockText = await readFile(`${root}/.terraform.lock.hcl`, "utf8");
  const moduleLockText = await readFile("module-lock.json", "utf8");
  const moduleLock = validateLock(JSON.parse(moduleLockText), moduleSource(await readFile(`${root}/main.tf`, "utf8")));
  const binding = planBinding(config, lockText, moduleLockText, inputsText);
  const planPath = resolve(privateDir, "reviewed.tfplan");
  const manifestPath = resolve(privateDir, "manifest.json");
  if (["apply", "destroy"].includes(phase)) {
    assert.equal(config.operation, phase === "apply" ? "deploy" : "destroy");
    const manifestBytes = await readFile(manifestPath);
    verifyPlan({ manifest: JSON.parse(manifestBytes), manifestBytes, expectedManifestHash: process.env.EXPECTED_MANIFEST_HASH, planBytes: await readFile(planPath), expectedPlanHash: process.env.EXPECTED_PLAN_HASH, binding, currentSha: process.env.CURRENT_MAIN_SHA });
  }
  await terraform(["init", "-input=false", "-lockfile=readonly", "-reconfigure", `-backend-config=storage_account_name=${config.stateAccount}`, `-backend-config=container_name=${config.stateContainer}`, `-backend-config=key=${config.stateKey}`], { init: true });
  assert.equal((await terraform(["workspace", "show"])).stdout.trim(), "default", "Named workspaces are outside this explicit-state-root design");
  await verifyInstalledModule(root, moduleLock);
  await terraform(["validate", "-no-color"]);
  const version = JSON.parse((await terraform(["version", "-json"])).stdout);
  assert.equal(version.terraform_version, "1.16.1");
  assert.equal(version.provider_selections?.["registry.terraform.io/hashicorp/azurerm"], "5.4.0");
  if (phase === "plan") {
    const args = ["plan", "-input=false", "-no-color", "-lock-timeout=5m", "-detailed-exitcode", `-out=${planPath}`, `-var-file=${inputPath}`];
    if (config.operation === "destroy") args.push("-destroy");
    const result = await terraform(args, { allowChanges: true });
    const status = planExit(result.status);
    const plan = JSON.parse((await terraform(["show", "-json", planPath])).stdout);
    const summary = summarizePlan(plan, config);
    const manifest = makeManifest(binding, await readFile(planPath), result.status);
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(manifestPath, manifestBytes, { mode: 0o600 });
    await outputs({ plan_sha256: manifest.planSha256, manifest_sha256: bytesHash(manifestBytes), exitcode: result.status, operation: config.operation, artifact: `ws2-dev-${config.runId}-${config.runAttempt}` });
    const rows = summary.resources.map((item) => `| \`${item.address}\` | ${item.action} |`).join("\n");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## AgentAlvine · trusted dev ${config.operation}\n\n**${status}** · source ${config.sha} · run ${config.runId}/${config.runAttempt}\n\nModule revision: ${moduleLock.revision}; state: ${config.stateAccount}/${config.stateContainer}/${config.stateKey}.\n\nPlan SHA-256: ${manifest.planSha256}\n\nManifest SHA-256: ${bytesHash(manifestBytes)}\n\nReview artifact ws2-dev-${config.runId}-${config.runAttempt}. Private repository readers can download it; retention 1 day; maximum plan age 2 hours.\n\nCreates ${summary.totals.create}; updates ${summary.totals.update}; deletes ${summary.totals.delete}; replacements ${summary.totals.replace}. Output-only changes may also occur.\n\n| Managed address | Action |\n| --- | --- |\n${rows || "| No managed-resource changes | no-change |"}\n\nReviewers must inspect the restricted exact plan for property-level changes and outputs; this sanitized inventory does not replace that review. No raw values, state or plan JSON are published.\n`);
  } else if (["apply", "destroy"].includes(phase)) {
    // Recheck integrity/age after downloads/init, immediately before mutation.
    const freshMain = await currentMain(config);
    const manifestBytes = await readFile(manifestPath);
    verifyPlan({ manifest: JSON.parse(manifestBytes), manifestBytes, expectedManifestHash: process.env.EXPECTED_MANIFEST_HASH, planBytes: await readFile(planPath), expectedPlanHash: process.env.EXPECTED_PLAN_HASH, binding, currentSha: freshMain });
    await terraform(["apply", "-input=false", "-no-color", "-lock-timeout=5m", planPath]);
    if (phase === "destroy") {
      const state = (await terraform(["state", "list"])).stdout.trim();
      assert.equal(state, "", "Workload state is not empty; keep cleanup open");
      await appendFile(process.env.GITHUB_STEP_SUMMARY, "## AgentAlvine · scoped cleanup confirmed\n\nThe reviewed destroy plan was applied and the workload state has no managed addresses. Instructor-owned resource group, backend, identities and runner were not managed by this root. The instructor must confirm retained-resource owners and final Azure inventory; do not delete shared infrastructure.\n");
    } else {
      const all = JSON.parse((await terraform(["output", "-json"])).stdout);
      for (const key of ["vnet_id", "nsg_id"]) assertScope(all[key]?.value, config);
      for (const key of ["subnet_ids", "association_ids"]) {
        assert.ok(Object.keys(all[key]?.value || {}).length >= 2);
        for (const id of Object.values(all[key].value)) assertScope(id, config);
      }
      assert.deepEqual(Object.keys(all.subnet_ids.value).sort(), Object.keys(JSON.parse(inputsText).subnets).sort());
      const safe = Object.fromEntries(["vnet_id", "subnet_ids", "nsg_id", "association_ids"].map((key) => [key, all[key].value]));
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `## AgentAlvine · exact plan applied\n\nVerified workload output IDs (not raw state):\n\n\`\`\`json\n${JSON.stringify(safe, null, 2)}\n\`\`\`\n\nRecord independent approval and verify Azure inventory. Dispatch a separate followup operation; no-change has not yet been claimed.\n`);
    }
  } else throw new Error("Unknown delivery phase");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv[2] === "clean") {
    await rm(privateDir, { recursive: true, force: true });
    await rm(".workshop/sealed", { recursive: true, force: true });
    await rm(`${root}/.terraform`, { recursive: true, force: true });
  } else {
    deliver(process.argv[2]).catch((error) => { console.error(`Delivery stopped: ${error.message}`); process.exitCode = 1; });
  }
}
