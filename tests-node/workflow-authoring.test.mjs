import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { link, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkWorkflow, CLEANUP_REFERENCE_SHA256, COMPANION_SHA256, normalizeWorkflow, readWorkflowSources, REFERENCE_SHA256, validateWorkflowSources, workflowHash } from "../scripts/check-workflow.mjs";

// Text mutations, disposable filesystem fixtures and this read-only CLI only.
// Never import/execute runtime authorization, policy, encryption or delivery
// drivers. No Git, Terraform, Azure, network or fabricated authorization evidence.
const sources = await readWorkflowSources();
const canonical = normalizeWorkflow(sources.workflows["delivery.yml"]);
const cleanupCanonical = normalizeWorkflow(sources.workflows["cleanup.yml"]);
const fresh = () => structuredClone(sources);
const routes = ["delivery.yml", "cleanup.yml"];
const names = [...routes, ...Object.keys(COMPANION_SHA256)].sort();
const inputs = [...names.map((name) => `.github/workflows/${name}`), ...routes.map((name) => `solutions/${name}`)];
const jobNames = ["preflight", "validation", "plan", "apply", "destroy", "followup", "drift"];
const expectedResult = { deliverySha256: REFERENCE_SHA256, cleanupSha256: CLEANUP_REFERENCE_SHA256, deliveryWorkflows: 1, cleanupWorkflows: 1, companionWorkflows: 3 };
const script = fileURLToPath(new URL("../scripts/check-workflow.mjs", import.meta.url));
const repository = fileURLToPath(new URL("../", import.meta.url));
const directoryLinkType = process.platform === "win32" ? "junction" : "dir";

function section(name, source = canonical) {
  const marker = `\n  ${name}:\n`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, "Mutation must target a real reviewed job");
  const ends = jobNames.map((next) => source.indexOf(`\n  ${next}:\n`, start + marker.length)).filter((end) => end >= 0);
  const end = ends.length ? Math.min(...ends) + 1 : source.length;
  return { start, end, text: source.slice(start, end) };
}

function changed(from, to, jobName, file = "delivery.yml") {
  const source = normalizeWorkflow(sources.workflows[file]);
  const scope = jobName ? section(jobName, source) : { start: 0, end: source.length, text: source };
  assert.ok(scope.text.includes(from) && from !== to, "Mutation must change a real source fragment");
  const input = fresh();
  input.workflows[file] = source.slice(0, scope.start) + scope.text.replace(from, to) + source.slice(scope.end);
  return input;
}
const reject = (from, to, jobName, file) => assert.throws(() => validateWorkflowSources(changed(from, to, jobName, file)), /differs from the trusted reference/);
const rejectCleanup = (from, to, jobName) => reject(from, to, jobName, "cleanup.yml");

async function temporary(t, prefix = "ws2-workflow-authoring-") {
  const root = await mkdtemp(join(await realpath(tmpdir()), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function fixture(t) {
  const root = await temporary(t);
  await mkdir(join(root, ".github/workflows"), { recursive: true });
  await mkdir(join(root, "solutions"));
  for (const [name, text] of Object.entries(sources.workflows)) await writeFile(join(root, ".github/workflows", name), text);
  await writeFile(join(root, "solutions/delivery.yml"), sources.reference);
  await writeFile(join(root, "solutions/cleanup.yml"), sources.cleanupReference);
  return root;
}

async function inputBytes(root) {
  return Promise.all(inputs.map(async (name) => [name, (await readFile(join(root, name))).toString("base64")]));
}

async function fixtureTree(root) {
  const result = [];
  async function walk(folder, prefix = "") {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(prefix, entry.name);
      assert.ok(!entry.isSymbolicLink(), "Read-only CLI snapshots must not traverse links");
      if (entry.isDirectory()) {
        result.push([name, "directory"]);
        await walk(join(folder, entry.name), name);
      } else {
        assert.ok(entry.isFile(), "Read-only CLI snapshots contain only ordinary files");
        result.push([name, (await readFile(join(folder, entry.name))).toString("base64")]);
      }
    }
  }
  await walk(root);
  return result;
}

function cli(file, cwd, args = []) {
  return spawnSync(process.execPath, [file, ...args], { cwd, encoding: "utf8", shell: false, timeout: 30_000 });
}

test("five installed workflows retain independent delivery/cleanup pins and three unchanged companions", async () => {
  assert.equal(REFERENCE_SHA256, "6bdaef1b89a7aba9f764e600e0be3b49bdb55437f66d6928fc7f34247100b826");
  assert.equal(CLEANUP_REFERENCE_SHA256, "2068326ed741518a7bb36778bb708cc2e47d9815289b563c4e296b7f5d6a2ddf");
  assert.notEqual(REFERENCE_SHA256, CLEANUP_REFERENCE_SHA256);
  assert.deepEqual(await checkWorkflow(), expectedResult);
  assert.equal(workflowHash(sources.reference), REFERENCE_SHA256);
  assert.equal(workflowHash(sources.cleanupReference), CLEANUP_REFERENCE_SHA256);
  assert.equal(canonical, normalizeWorkflow(sources.reference));
  assert.equal(cleanupCanonical, normalizeWorkflow(sources.cleanupReference));
  assert.deepEqual(Object.keys(sources.workflows).sort(), names);
  assert.equal(Object.isFrozen(COMPANION_SHA256), true);
  for (const [name, pin] of Object.entries(COMPANION_SHA256)) assert.equal(workflowHash(sources.workflows[name]), pin);
  assert.equal(Object.hasOwn(sources.workflows, "solutions/delivery.yml"), false);
  assert.equal(Object.hasOwn(sources.workflows, "solutions/cleanup.yml"), false);
});

test("workflow normalization accepts CRLF and a missing final newline, but preserves every control byte", () => {
  for (const transform of [(text) => text, (text) => text.replaceAll("\n", "\r\n"), (text) => text.slice(0, -1), (text) => text.slice(0, -1).replaceAll("\n", "\r\n")]) {
    const input = fresh();
    input.reference = transform(normalizeWorkflow(input.reference));
    input.cleanupReference = transform(normalizeWorkflow(input.cleanupReference));
    for (const name of names) input.workflows[name] = transform(normalizeWorkflow(input.workflows[name]));
    assert.doesNotThrow(() => validateWorkflowSources(input));
  }
  const input = fresh();
  input.reference = normalizeWorkflow(input.reference).replaceAll("\n", "\r\n");
  input.cleanupReference = normalizeWorkflow(input.cleanupReference).replaceAll("\n", "\r\n");
  for (const [name, text] of Object.entries(input.workflows)) input.workflows[name] = normalizeWorkflow(text).replaceAll("\n", "\r\n");
  input.workflows["delivery.yml"] = canonical.slice(0, -1);
  input.workflows["cleanup.yml"] = cleanupCanonical.slice(0, -1);
  assert.doesNotThrow(() => validateWorkflowSources(input));
  assert.throws(() => normalizeWorkflow("name:\runsafe"), /control character/);
  assert.throws(() => normalizeWorkflow("name:\0unsafe"), /control character/);
  for (const value of [undefined, null, 1, {}, Buffer.from("name: ignored")]) assert.throws(() => normalizeWorkflow(value), /must be UTF-8 text/);
});

test("malformed YAML and a second YAML document are rejected, not regex-certified", () => {
  reject("    branches: [main]", "    branches: [main");
  reject("jobs:\n", "jobs: [\n");
  const input = fresh();
  input.workflows["delivery.yml"] += "\n---\non: push\njobs: {}\n";
  assert.throws(() => validateWorkflowSources(input), /differs from the trusted reference/);
});

test("pushes to another branch, wildcard branches and PR delivery triggers are rejected", () => {
  for (const branch of ["dev", "main, dev", "'*'", "'lab/**'"]) reject("branches: [main]", `branches: [${branch}]`);
  reject("on:\n", "on:\n  pull_request:\n");
  reject("on:\n", "on:\n  pull_request_target:\n");
});

test("unsafe workflow/job permissions and continue-on-error cannot pass", () => {
  reject("permissions: {}", "permissions: write-all");
  reject("      contents: read", "      contents: write");
  reject("  validation:\n", "  validation:\n    continue-on-error: true\n");
});

test("removed disabled/template/private/branch/protection gates are rejected", () => {
  for (const file of routes) for (const name of ["preflight", "validation"]) {
    for (const gate of ["vars.WORKSHOP_AZURE_ENABLED == 'true' && ", "!github.event.repository.is_template && ", "github.event.repository.private && ", "github.ref == 'refs/heads/main' && ", " && github.ref_protected"]) reject(gate, "", name, file);
  }
});

test("a plan without the validation dependency or with a bypass is rejected", () => {
  reject("    needs: [preflight, validation]", "    needs: preflight");
  reject("  plan:\n", "  plan:\n    if: always()\n");
  reject("    needs: preflight\n", "    needs: []\n");
});

test("validation must check out the immutable event SHA, not a branch or PR head", () => {
  for (const ref of ["main", "${{ github.event.pull_request.head.sha }}", "${{ github.event.repository.default_branch }}"]) reject("ref: ${{ github.sha }}", `ref: ${ref}`);
  reject("persist-credentials: false", "persist-credentials: true");
});

test("validation cannot omit tests, kit/workflow checks or the existing learner helper", () => {
  for (const file of routes) for (const command of ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs"]) {
    reject(`      - run: ${command}\n`, "", "validation", file);
    reject(`      - run: ${command}\n`, `      - run: ${command} || true\n`, "validation", file);
  }
});

test("validation cannot acquire OIDC, secrets, environments or trusted runners", () => {
  for (const extra of ["    permissions: {id-token: write}\n", "    environment: dev-apply\n", "    env: {KEY: '${{ secrets.MODULE_APP_PRIVATE_KEY }}'}\n", "    runs-on: [self-hosted, linux, x64, ws2-trusted]\n"]) reject("  validation:\n", `  validation:\n${extra}`);
});

test("pinned Node, Terraform and action revisions cannot drift", () => {
  reject("node-version: 24.16.0", "node-version: latest");
  reject("terraform_version: 1.16.1", "terraform_version: latest");
  reject("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "actions/checkout@main");
});

test("current-main, rerun, authorization and encryption controls cannot be removed or forged", () => {
  for (const file of routes) {
    const call = "const {operation} = await require('./scripts/approval.cjs')({github,context,core,phase:'preflight'});";
    reject(call, "const operation = 'deploy';", "preflight", file);
    reject("{github,context,core,phase:'preflight'}", "{github,context:{...context,sha:'unbound'},core,phase:'preflight'}", "preflight", file);
    reject("{github,context,core,phase:'preflight'}", "{github,context,core,phase:'preflight',env:{...process.env,GITHUB_RUN_ATTEMPT:'1'}}", "preflight", file);
    reject("scripts/approval.cjs", "scripts/avm-approval.cjs", "preflight", file);
    reject("delivery.configuration({...process.env, OPERATION: operation});", "", "preflight", file);
    reject("delivery.configuration({...process.env, OPERATION: operation});", "delivery.configuration({...process.env, OPERATION: 'deploy'});", "preflight", file);
    reject("operation: ${{ steps.policy.outputs.operation }}", "operation: deploy", "preflight", file);
    reject("await require('./scripts/approval.cjs')({github,context,core});", "", file === "cleanup.yml" ? "destroy" : "apply", file);
  }
  reject("run: node scripts/plan-envelope.mjs seal", "run: echo skip-sealing");
  reject("path: .workshop/sealed/plan.enc", "path: .workshop/private");
});

test("same-run artifact/digest bindings and state concurrency cannot be weakened", () => {
  reject("${{ needs.plan.outputs.artifact }}", "older-artifact");
  reject("${{ needs.plan.outputs.plan_sha256 }}", "unbound-digest");
  reject("${{ needs.plan.outputs.manifest_sha256 }}", "unbound-manifest");
  reject("cancel-in-progress: false", "cancel-in-progress: true");
  reject("environment: dev-apply", "environment: unprotected");
});

test("a second manual deployment or automatic destruction cannot replace the main-push route", () => {
  assert.ok(!canonical.includes("destroy"));
  reject("options: [followup]", "options: [deploy, followup]");
  reject("options: [followup]", "options: [followup, destroy]");
  reject("needs.preflight.outputs.operation == 'deploy'", "github.event_name == 'workflow_dispatch'");
  reject("needs.preflight.outputs.operation == 'deploy'", "needs.preflight.outputs.operation == 'destroy'");
  reject("node scripts/delivery.mjs apply", "node scripts/delivery.mjs destroy", "apply");
  const input = fresh(); input.workflows["delivery.yml"] += section("destroy", cleanupCanonical).text;
  assert.throws(() => validateWorkflowSources(input), /differs from the trusted reference/);
});

test("duplicate live writers fail closed regardless of filename extension or YAML spelling", () => {
  for (const [name, text] of [["second-delivery.yml", canonical], ["deploy.yaml", 'on: push\njobs: {write: {runs-on: ubuntu-24.04, steps: [{run: "terraform apply"}]}}\n'], ["WRITER.YML", "on: [push]\njobs: {}\n"]]) {
    const input = fresh(); input.workflows[name] = text;
    assert.throws(() => validateWorkflowSources(input), /possible duplicate live writer/);
  }
});

test("even an unknown harmless workflow requires review rather than an unsafe heuristic allowlist", () => {
  const input = fresh(); input.workflows["extra-check.yml"] = "on: push\npermissions: {}\njobs: {}\n";
  assert.throws(() => validateWorkflowSources(input), /inventory differs/);
});

test("an existing companion cannot be repurposed into another live writer", () => {
  for (const name of ["quality.yml", "lab-checks.yml", "agentalvine.yml"]) {
    const input = fresh(); input.workflows[name] = canonical;
    assert.throws(() => validateWorkflowSources(input), /Unreviewed companion workflow change/);
  }
});

test("missing or renamed canonical/companion workflows cannot pass", () => {
  for (const name of Object.keys(sources.workflows)) {
    const input = fresh(); delete input.workflows[name];
    assert.throws(() => validateWorkflowSources(input), /inventory differs/);
  }
  const input = fresh(); input.workflows["delivery.yaml"] = input.workflows["delivery.yml"]; delete input.workflows["delivery.yml"];
  assert.throws(() => validateWorkflowSources(input), /inventory differs/);
});

test("reference drift is rejected even when both reference and runnable file change identically", () => {
  const input = fresh();
  input.reference = input.reference.replace("branches: [main]", "branches: [dev]");
  input.workflows["delivery.yml"] = input.reference;
  assert.throws(() => validateWorkflowSources(input), /Reference drift/);
});

test("normalization does not discard indentation, comments or arbitrary prose inside YAML", () => {
  reject("  push:\n", " push:\n");
  reject("# GitHub concurrency is repository-scoped.", "# A changed comment is still a changed reference byte.");
  const input = fresh(); input.reference += "# unreviewed reference change\n";
  assert.throws(() => validateWorkflowSources(input), /Reference drift/);
  assert.equal(normalizeWorkflow("\ufeff  x: y \r\n\r\n"), "\ufeff  x: y \n\n");
  for (const name of names) {
    const input = fresh(); input.workflows[name] = `${normalizeWorkflow(input.workflows[name])}\n`;
    assert.throws(() => validateWorkflowSources(input), /trusted reference|Unreviewed companion/);
  }
});

test("checker errors do not echo injected workflow contents", () => {
  const input = fresh(); input.workflows["delivery.yml"] = "DO-NOT-ECHO-THIS-UNTRUSTED-CONTENT";
  assert.throws(() => validateWorkflowSources(input), (error) => !error.message.includes(input.workflows["delivery.yml"]));
});

test("native file inventory rejects a duplicate writer and missing reference", async (t) => {
  const root = await fixture(t);
  assert.deepEqual(await checkWorkflow(root), expectedResult);
  for (const name of ["extra.yaml", "EXTRA.YML", "notes.txt"]) {
    await writeFile(join(root, ".github/workflows", name), canonical);
    await assert.rejects(checkWorkflow(root), /duplicate live writer/);
    await rm(join(root, ".github/workflows", name));
  }
  for (const [name, text] of [["delivery.yml", sources.reference], ["cleanup.yml", sources.cleanupReference]]) {
    await rm(join(root, "solutions", name));
    await assert.rejects(checkWorkflow(root), /inputs are missing or unreadable/);
    await writeFile(join(root, "solutions", name), text);
  }
});

test("linked workflow directories are rejected instead of reading outside the selected root", async (t) => {
  const root = await fixture(t);
  const target = await fixture(t);
  await rm(join(root, ".github/workflows"), { recursive: true });
  await symlink(join(target, ".github/workflows"), join(root, ".github/workflows"), directoryLinkType);
  await assert.rejects(checkWorkflow(root), /real directories, not symbolic links/);
});

test("the CLI resolves its own repository, stays read-only and offers no bypass/update switch", async (t) => {
  const cwd = await fixture(t);
  await writeFile(join(cwd, ".github/workflows/delivery.yml"), "invalid caller-workflow\n");
  const before = await inputBytes(repository);
  const callerBefore = await fixtureTree(cwd);
  const scriptBefore = await readFile(script);
  const passed = cli(script, cwd);
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /1 canonical delivery workflow; 1 separately authorized cleanup workflow; 3 reviewed companions/);
  assert.match(passed.stdout, /No Azure operations, approvals or live completion claimed/);
  assert.match(passed.stdout, /actionlint separately/);
  for (const flag of ["--update", "--skip", "--fix", "--write", "--root", "--reference", "--help"]) {
    const blocked = cli(script, cwd, [flag]);
    assert.equal(blocked.status, 1); assert.equal(blocked.stdout, "");
    assert.match(blocked.stderr, /no update, skip or override flags/);
  }
  assert.deepEqual(await inputBytes(repository), before);
  assert.deepEqual(await fixtureTree(cwd), callerBefore);
  assert.ok((await readFile(script)).equals(scriptBefore), "The CLI must not rewrite pins");
});

test("both routes retain exact helper job names, metadata read permissions and unique same-run phase checks", () => {
  for (const file of routes) {
    const mutation = file === "cleanup.yml" ? "destroy" : "apply";
    reject("name: Validate reviewed delivery revision", "name: Unbound validation", "validation", file);
    reject("name: Trusted dev plan", "name: Unbound plan", "plan", file);
    for (const name of ["preflight", "plan", mutation]) {
      for (const permission of ["contents", "actions", "pull-requests"]) reject(`      ${permission}: read\n`, "", name, file);
    }
    reject("phase:'preflight'", "phase:'apply'", "preflight", file);
    reject("await require('./scripts/approval.cjs')({github,context,core,phase:'plan'});", "", "plan", file);
    reject("phase:'plan'", "phase:'preflight'", "plan", file);
    reject("{github,context,core,phase:'plan'}", "{github,context,core,phase:'plan',env:{...process.env,GITHUB_SHA:'unbound'}}", "plan", file);
    reject("await require('./scripts/approval.cjs')({github,context,core});", "await require('./scripts/approval.cjs')({github,context,core,phase:'preflight'});", mutation, file);
  }
});

test("plan guards cannot move behind Terraform setup, module credentials or OIDC planning", () => {
  for (const file of routes) {
    const source = normalizeWorkflow(sources.workflows[file]);
    const start = source.indexOf("      - name: Verify current main and same-run validation\n", section("plan", source).start);
    const end = source.indexOf("      - uses: actions/setup-node@", start);
    const afterDriver = source.indexOf("      - name: Encrypt saved state and plan before artifact storage\n", end);
    assert.ok(start >= 0 && end > start && afterDriver > end);
    const input = fresh();
    input.workflows[file] = source.slice(0, start) + source.slice(end, afterDriver) + source.slice(start, end) + source.slice(afterDriver);
    assert.throws(() => validateWorkflowSources(input), /differs from the trusted reference/);
  }
});

test("the verified module snapshot, scoped app, configuration and exported repository cannot be bypassed", () => {
  for (const file of routes) {
    reject("const delivery = await import(pathToFileURL(resolve('scripts/delivery.mjs')).href);", "const delivery = {configuration(){}};", "preflight", file);
    reject("const snapshot = await import(pathToFileURL(resolve('scripts/module-snapshot.mjs')).href);", "const snapshot = {};", "preflight", file);
    reject("const lock = snapshot.validateLock(JSON.parse(fs.readFileSync('module-lock.json','utf8')), snapshot.moduleSource(fs.readFileSync('environments/dev/main.tf','utf8')));", "const lock = {repository:'other/unverified'};", "preflight", file);
    reject("core.setOutput('module_owner',lock.repository.split('/')[0]);", "core.setOutput('module_owner','other');", "preflight", file);
    reject("core.setOutput('module_repo',lock.repository.split('/')[1]);", "core.setOutput('module_repo','unverified');", "preflight", file);
    reject("if (!/^[a-zA-Z0-9-]{3,80}$/.test(process.env.WS2_STATE_LOCK_ID || ''))", "if (false)", "preflight", file);
    for (const name of ["plan", file === "cleanup.yml" ? "destroy" : "apply"]) {
      for (const binding of ["${{ vars.MODULE_APP_CLIENT_ID }}", "${{ secrets.MODULE_APP_PRIVATE_KEY }}", "${{ needs.preflight.outputs.module_owner }}", "${{ needs.preflight.outputs.module_repo }}", "${{ steps.module.outputs.token }}"]) reject(binding, "unbound", name, file);
      reject("permission-contents: read", "permission-contents: write", name, file);
    }
  }
});

test("dedicated cleanup is dispatch-only with required explicit repository/SHA/state authorization and no default", () => {
  assert.equal(cleanupCanonical.slice(cleanupCanonical.indexOf("on:\n"), cleanupCanonical.indexOf("permissions: {}\n")), "on:\n  workflow_dispatch:\n    inputs:\n      authorization:\n        description: 'destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>'\n        required: true\n        type: string\n");
  for (const event of ["push", "pull_request", "pull_request_target", "workflow_run", "workflow_call", "schedule"]) rejectCleanup("on:\n", `on:\n  ${event}:\n`);
  rejectCleanup("on:\n  workflow_dispatch:", "on: [push]\nunreviewed:");
  rejectCleanup("        required: true\n", "        required: false\n");
  rejectCleanup("        type: string\n", "        type: boolean\n");
  rejectCleanup("      authorization:\n", "      operation:\n");
  rejectCleanup("on:\n", "on: *broad-triggers\non:\n");
  rejectCleanup("permissions: {}\n", "permissions: {}\npermissions: write-all\n");
  const extra = fresh(); extra.workflows["cleanup.yml"] += "\n---\non: push\njobs: {}\n";
  assert.throws(() => validateWorkflowSources(extra), /differs from the trusted reference/);
});

test("wrong, stale or synthesized cleanup authorization cannot be embedded in exact workflow bytes", () => {
  const call = "const {operation} = await require('./scripts/approval.cjs')({github,context,core,phase:'preflight'});";
  // Source mutations prove exact-template rejection, not runtime authorization.
  for (const value of ["", "destroy", `destroy:1379147533:${"a".repeat(40)}:owned-state`, `destroy:1379149907:${"b".repeat(40)}:stale-state`]) {
    rejectCleanup("        type: string\n", `        type: string\n        default: '${value}'\n`);
    rejectCleanup(call, `context.payload.inputs.authorization = '${value}';\n            ${call}`, "preflight");
  }
  rejectCleanup("1379149907", "1379147533");
  rejectCleanup("{github,context,core,phase:'preflight'}", "{github,context:{...context,payload:{...context.payload,inputs:{authorization:'destroy'}}},core,phase:'preflight'}", "preflight");
  rejectCleanup("  WS2_STATE_LOCK_ID: ${{ vars.WS2_STATE_LOCK_ID }}\n", "");
  rejectCleanup("WS2_STATE_LOCK_ID: ${{ vars.WS2_STATE_LOCK_ID }}", "WS2_STATE_LOCK_ID: another-state");
});

test("cleanup shares delivery state, validation, fixed identities, main-only environments and bounded trusted jobs", () => {
  const sharedEnv = (text) => text.slice(text.indexOf("\nenv:\n"), text.indexOf("\njobs:\n"));
  assert.equal(sharedEnv(cleanupCanonical), sharedEnv(canonical));
  assert.equal(section("validation", cleanupCanonical).text, section("validation").text);
  rejectCleanup("group: ws2-state-${{ vars.WS2_STATE_LOCK_ID || github.repository }}", "group: separate-cleanup-${{ github.run_id }}");
  rejectCleanup("cancel-in-progress: false", "cancel-in-progress: true");
  for (const binding of ["STATE_STORAGE_ACCOUNT", "STATE_CONTAINER", "STATE_KEY", "WORKLOAD_RG", "ARM_SUBSCRIPTION_ID", "ARM_TENANT_ID", "REPOSITORY_PRIVATE", "REPOSITORY_TEMPLATE"]) rejectCleanup(`  ${binding}:`, `  UNBOUND_${binding}:`);
  for (const name of ["preflight", "validation", "plan", "destroy"]) {
    rejectCleanup("ref: ${{ github.sha }}", "ref: main", name);
    rejectCleanup("persist-credentials: false", "persist-credentials: true", name);
    rejectCleanup(`  ${name}:\n`, `  ${name}:\n    continue-on-error: true\n`, name);
    rejectCleanup("    timeout-minutes:", "    unbounded-timeout:", name);
  }
  for (const name of ["preflight", "validation"]) {
    rejectCleanup("      contents: read\n", "      contents: read\n      id-token: write\n", name);
    rejectCleanup("runs-on: ubuntu-24.04", "runs-on: [self-hosted, linux, x64, ws2-trusted]", name);
    rejectCleanup(`  ${name}:\n`, `  ${name}:\n    environment: dev-apply\n`, name);
  }
  rejectCleanup("needs: [preflight, validation]", "needs: preflight", "plan");
  rejectCleanup("needs: [preflight, plan]", "needs: preflight", "destroy");
  rejectCleanup("environment: dev-plan", "environment: dev-apply", "plan");
  rejectCleanup("environment: dev-apply", "environment: unprotected", "destroy");
  rejectCleanup("${{ vars.AZURE_PLAN_CLIENT_ID }}", "${{ vars.AZURE_APPLY_CLIENT_ID }}", "plan");
  rejectCleanup("${{ vars.AZURE_APPLY_CLIENT_ID }}", "${{ vars.AZURE_PLAN_CLIENT_ID }}", "destroy");
  for (const name of ["plan", "destroy"]) rejectCleanup("if: always()\n        run: node scripts/delivery.mjs clean\n", "if: success()\n        run: node scripts/delivery.mjs clean\n", name);
});

test("each route authorizes before decrypting or acquiring apply credentials and then uses only its exact saved plan", () => {
  for (const file of routes) {
    const cleanup = file === "cleanup.yml";
    const mutation = cleanup ? "destroy" : "apply";
    const source = normalizeWorkflow(sources.workflows[file]);
    reject("run: node scripts/plan-envelope.mjs seal", "run: echo skip-sealing", "plan", file);
    reject("path: .workshop/sealed/plan.enc", "path: .workshop/private", "plan", file);
    reject("retention-days: 1", "retention-days: 90", "plan", file);
    reject("if-no-files-found: error", "if-no-files-found: warn", "plan", file);
    reject("run: node scripts/plan-envelope.mjs open", "run: echo skip-decryption", mutation, file);
    reject(`node scripts/delivery.mjs ${mutation}`, `terraform ${mutation} -auto-approve`, mutation, file);
    for (const binding of ["${{ needs.plan.outputs.artifact }}", "${{ needs.plan.outputs.plan_sha256 }}", "${{ needs.plan.outputs.manifest_sha256 }}", "${{ steps.approval.outputs.main_sha }}", "${{ github.token }}"]) reject(binding, "unbound", mutation, file);
    reject("          path: .workshop/sealed\n", "          path: .workshop/sealed\n          run-id: 123\n", mutation, file);
    const guardLabel = cleanup ? "Recheck explicit cleanup authorization and current main" : "Verify scoped authorization and current main";
    const guard = source.indexOf(`      - name: ${guardLabel}\n`);
    const decrypt = source.indexOf("      - name: Decrypt only after authorization\n", guard);
    const module = source.indexOf("      - id: module\n", decrypt);
    assert.ok(guard >= 0 && decrypt > guard && module > decrypt);
    const input = fresh();
    input.workflows[file] = source.slice(0, guard) + source.slice(decrypt, module) + source.slice(guard, decrypt) + source.slice(module);
    assert.throws(() => validateWorkflowSources(input), /differs from the trusted reference/);
  }
  rejectCleanup("needs.preflight.outputs.operation == 'destroy'", "needs.preflight.outputs.operation == 'deploy'", "destroy");
  rejectCleanup("node scripts/delivery.mjs destroy", "node scripts/delivery.mjs apply", "destroy");
  rejectCleanup("node scripts/delivery.mjs plan", "terraform plan -destroy", "plan");
});

test("cleanup reference equality cannot learn broad triggers, wrong authorization or changed control bytes", () => {
  for (const [from, to] of [["on:\n", "on:\n  push:\n"], ["required: true", "required: false"], ["1379149907", "1379147533"], ["cancel-in-progress: false", "cancel-in-progress: true"], ["phase:'plan'", "phase:'preflight'"]]) {
    const input = changed(from, to, undefined, "cleanup.yml");
    input.cleanupReference = input.workflows["cleanup.yml"];
    assert.throws(() => validateWorkflowSources(input), /Cleanup reference drift/);
  }
  const input = fresh(); input.cleanupReference += "# unreviewed cleanup reference\n";
  assert.throws(() => validateWorkflowSources(input), /Cleanup reference drift/);
});

test("stale delivery or cleanup pins fail on matching workflow/reference fixtures without repairing source", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "scripts"));
  const copied = join(root, "scripts/check-workflow.mjs");
  const source = await readFile(script, "utf8");
  for (const [name, pin, stale, error] of [["REFERENCE_SHA256", REFERENCE_SHA256, "801b5dc3dd009696e3b24cedd251ca873c4425950421fe714107011388eb09ed", /Reference drift/], ["CLEANUP_REFERENCE_SHA256", CLEANUP_REFERENCE_SHA256, "0".repeat(64), /Cleanup reference drift/]]) {
    const from = `export const ${name} = "${pin}";`;
    assert.ok(source.includes(from));
    await writeFile(copied, source.replace(from, `export const ${name} = "${stale}";`));
    const before = await fixtureTree(root);
    const result = cli(copied, root);
    assert.equal(result.status, 1); assert.equal(result.stdout, ""); assert.match(result.stderr, error);
    assert.deepEqual(await fixtureTree(root), before);
  }
});

test("inventories cannot hide unknown files, inherited, symbolic, non-enumerable or accessor entries", () => {
  for (const name of ["notes.txt", "nested/writer.yml", "../escape.yml", "cleanup.yaml", "CLEANUP.YML"]) {
    const input = fresh(); input.workflows[name] = cleanupCanonical;
    assert.throws(() => validateWorkflowSources(input), /inventory differs/);
  }
  for (const value of [null, [], "ignored", undefined]) {
    const input = fresh(); input.workflows = value;
    assert.throws(() => validateWorkflowSources(input), /installed workflow inventory/);
  }
  const inherited = fresh(); Object.setPrototypeOf(inherited.workflows, { hidden: canonical });
  assert.throws(() => validateWorkflowSources(inherited), /without inherited entries/);
  for (const key of [Symbol("extra"), "hidden.yml"]) {
    const input = fresh(); Object.defineProperty(input.workflows, key, { value: canonical, enumerable: false });
    assert.throws(() => validateWorkflowSources(input), /inventory differs/);
  }
  const accessor = fresh(); let called = false;
  Object.defineProperty(accessor.workflows, "quality.yml", { get() { called = true; return sources.workflows["quality.yml"]; } });
  assert.throws(() => validateWorkflowSources(accessor), /not accessors/);
  assert.equal(called, false);
});

test("native inventory rejects directories and every missing installed entry before reading unknown paths", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, ".github/workflows/nested"));
  await writeFile(join(root, ".github/workflows/nested/writer.yml"), canonical);
  await assert.rejects(checkWorkflow(root), /inventory differs/);
  await rm(join(root, ".github/workflows/nested"), { recursive: true });
  for (const name of names) {
    await rm(join(root, ".github/workflows", name));
    await assert.rejects(checkWorkflow(root), /inventory differs/);
    await writeFile(join(root, ".github/workflows", name), sources.workflows[name]);
  }
  const outside = await temporary(t);
  await symlink(outside, join(root, ".github/workflows/EXTRA.YML"), directoryLinkType);
  await assert.rejects(checkWorkflow(root), /inventory differs/);
});

test("every expected workflow/reference file rejects directory replacement", async (t) => {
  for (const name of inputs) {
    const root = await fixture(t);
    await rm(join(root, name)); await mkdir(join(root, name));
    await assert.rejects(checkWorkflow(root), /regular single-link files/);
  }
});

test("workflow/reference symlinks reject even exact pinned targets with no skip or fallback", async (t) => {
  const target = await fixture(t);
  for (const name of inputs) {
    const root = await fixture(t);
    await rm(join(root, name)); await symlink(join(target, name), join(root, name), "file");
    await assert.rejects(checkWorkflow(root), /regular single-link files/);
  }
});

test("hard-linked workflow/reference files cannot share outside mutable bytes", async (t) => {
  const target = await fixture(t);
  for (const name of inputs) {
    const root = await fixture(t);
    await rm(join(root, name)); await link(join(target, name), join(root, name));
    await assert.rejects(checkWorkflow(root), /regular single-link files/);
  }
});

test("linked roots, ancestors and all workflow/reference directories cannot escape the selected repository", async (t) => {
  const target = await fixture(t);
  for (const name of [".github", ".github/workflows", "solutions"]) {
    const root = await fixture(t);
    await rm(join(root, name), { recursive: true });
    await symlink(join(target, name), join(root, name), directoryLinkType);
    await assert.rejects(checkWorkflow(root), /real directories, not symbolic links/);
  }
  const container = await temporary(t);
  const rootLink = join(container, "linked-root");
  await symlink(target, rootLink, directoryLinkType);
  await assert.rejects(checkWorkflow(rootLink), /real directories, not symbolic links/);
  const ancestorLink = join(container, "linked-parent");
  await symlink(dirname(target), ancestorLink, directoryLinkType);
  await assert.rejects(checkWorkflow(join(ancestorLink, basename(target))), /linked ancestors or escape/);
});

test("native reads reject malformed UTF-8 and do not discard BOMs in either route or reference", async (t) => {
  const root = await fixture(t);
  for (const name of inputs) {
    const path = join(root, name);
    const original = await readFile(path);
    await writeFile(path, Buffer.from([0xc3, 0x28]));
    await assert.rejects(checkWorkflow(root), /valid UTF-8 without lossy decoding/);
    await writeFile(path, `\ufeff${original.toString("utf8")}`);
    await assert.rejects(checkWorkflow(root), /trusted reference|reference drift|Reference drift|Unreviewed companion/);
    await writeFile(path, original);
  }
});

test("failure diagnostics never echo untrusted source, inventory names or filesystem paths", async (t) => {
  const sentinel = "PRIVATE-UNTRUSTED-CONTENT-MUST-NOT-BE-ECHOED";
  const privateFailure = (error) => {
    assert.ok(!String(error.stack).includes(sentinel) && !JSON.stringify(error).includes(sentinel));
    return true;
  };
  for (const name of names) {
    const input = fresh(); input.workflows[name] = sentinel;
    assert.throws(() => validateWorkflowSources(input), privateFailure);
  }
  for (const name of ["reference", "cleanupReference"]) {
    const input = fresh(); input[name] = sentinel;
    assert.throws(() => validateWorkflowSources(input), privateFailure);
  }
  const extra = fresh(); extra.workflows[`${sentinel}.yaml`] = sentinel;
  assert.throws(() => validateWorkflowSources(extra), privateFailure);
  const root = await temporary(t);
  await assert.rejects(checkWorkflow(join(root, sentinel)), privateFailure);
});

test("a linked CLI invocation still validates and rejects bypass flags", async (t) => {
  const root = await temporary(t);
  const alias = join(root, "checker-alias.mjs");
  await symlink(script, alias, "file");
  const passed = cli(alias, root);
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /1 canonical delivery workflow; 1 separately authorized cleanup workflow; 3 reviewed companions/);
  const blocked = cli(alias, root, ["--skip"]);
  assert.equal(blocked.status, 1); assert.equal(blocked.stdout, "");
  assert.match(blocked.stderr, /no update, skip or override flags/);
});

test("CLI failures cannot echo injected content, names or arguments and never repair drift", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "scripts"));
  const copied = join(root, "scripts/check-workflow.mjs");
  await writeFile(copied, await readFile(script));
  const sentinel = "CLI-UNTRUSTED-CONTENT-MUST-NOT-APPEAR";
  const blocked = (result) => {
    assert.equal(result.status, 1); assert.equal(result.stdout, "");
    assert.ok(!result.stderr.includes(sentinel));
    assert.match(result.stderr, /Workflow authoring stopped/);
  };
  const before = await fixtureTree(root);
  blocked(cli(copied, root, ["--update", sentinel]));
  assert.deepEqual(await fixtureTree(root), before);
  for (const file of routes) {
    await writeFile(join(root, ".github/workflows", file), sentinel);
    const drifted = await fixtureTree(root);
    blocked(cli(copied, root));
    assert.deepEqual(await fixtureTree(root), drifted);
    await writeFile(join(root, ".github/workflows", file), sources.workflows[file]);
  }
  await writeFile(join(root, ".github/workflows", `${sentinel}.yaml`), sentinel);
  blocked(cli(copied, root));
  await rm(join(root, ".github/workflows", `${sentinel}.yaml`));
  await rm(join(root, "solutions/cleanup.yml"));
  blocked(cli(copied, root));
});
