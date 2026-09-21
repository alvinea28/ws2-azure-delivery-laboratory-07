import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkWorkflow, normalizeWorkflow, readWorkflowSources, REFERENCE_SHA256, validateWorkflowSources, workflowHash } from "../scripts/check-workflow.mjs";

// Text mutations and disposable files only: no Git, Terraform, Azure or network.
const sources = await readWorkflowSources();
const canonical = normalizeWorkflow(sources.workflows["delivery.yml"]);
const fresh = () => structuredClone(sources);
const changed = (from, to) => {
  assert.ok(canonical.includes(from), "Mutation must hit a real source fragment");
  const input = fresh();
  input.workflows["delivery.yml"] = canonical.replace(from, to);
  return input;
};
const reject = (from, to) => assert.throws(() => validateWorkflowSources(changed(from, to)), /differs from the trusted reference/);

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "ws2-workflow-authoring-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, ".github/workflows"), { recursive: true });
  await mkdir(join(root, "solutions"));
  for (const [name, text] of Object.entries(sources.workflows)) await writeFile(join(root, ".github/workflows", name), text);
  await writeFile(join(root, "solutions/delivery.yml"), sources.reference);
  return root;
}

test("workflow authoring accepts the actual complete reference and one canonical writer", async () => {
  assert.deepEqual(await checkWorkflow(), { deliverySha256: REFERENCE_SHA256, deliveryWorkflows: 1, companionWorkflows: 3 });
  assert.equal(workflowHash(sources.reference), REFERENCE_SHA256);
  assert.equal(Object.hasOwn(sources.workflows, "solutions/delivery.yml"), false);
});

test("workflow normalization accepts CRLF and a missing final newline, but preserves every control byte", () => {
  const input = fresh();
  input.reference = normalizeWorkflow(input.reference).replaceAll("\n", "\r\n");
  for (const [name, text] of Object.entries(input.workflows)) input.workflows[name] = normalizeWorkflow(text).replaceAll("\n", "\r\n");
  input.workflows["delivery.yml"] = canonical.slice(0, -1);
  assert.doesNotThrow(() => validateWorkflowSources(input));
  assert.throws(() => normalizeWorkflow("name:\runsafe"), /control character/);
  assert.throws(() => normalizeWorkflow("name:\0unsafe"), /control character/);
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
  for (const gate of ["vars.WORKSHOP_AZURE_ENABLED == 'true' && ", "!github.event.repository.is_template && ", "github.event.repository.private && ", "github.ref == 'refs/heads/main' && ", " && github.ref_protected"]) reject(gate, "");
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
  for (const command of ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs"]) reject(`      - run: ${command}\n`, "");
});

test("validation cannot acquire OIDC, secrets, environments or trusted runners", () => {
  for (const extra of ["    permissions: {id-token: write}\n", "    environment: dev-apply\n", "    env: {KEY: '${{ secrets.MODULE_APP_PRIVATE_KEY }}'}\n", "    runs-on: [self-hosted, linux, x64, ws2-trusted]\n"]) reject("  validation:\n", `  validation:\n${extra}`);
});

test("pinned Node, Terraform and action revisions cannot drift", () => {
  reject("node-version: 24.16.0", "node-version: latest");
  reject("terraform_version: 1.16.1", "terraform_version: latest");
  reject("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "actions/checkout@main");
});

test("current-main, rerun, approval and encryption controls cannot be removed", () => {
  reject("branch.commit.sha !== context.sha", "false");
  reject("process.env.GITHUB_RUN_ATTEMPT !== '1'", "false");
  reject("policy.assertEnvironmentProtection(environment, branches, name === 'dev-apply');", "");
  reject("await require('./scripts/approval.cjs')({github,context,core});", "");
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
  reject("options: [followup, destroy]", "options: [deploy, followup, destroy]");
  reject("needs.preflight.outputs.operation == 'deploy'", "github.event_name == 'workflow_dispatch'");
  reject("needs.preflight.outputs.operation == 'destroy'", "needs.preflight.outputs.operation == 'deploy'");
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
});

test("checker errors do not echo injected workflow contents", () => {
  const input = fresh(); input.workflows["delivery.yml"] = "DO-NOT-ECHO-THIS-UNTRUSTED-CONTENT";
  assert.throws(() => validateWorkflowSources(input), (error) => !error.message.includes(input.workflows["delivery.yml"]));
});

test("native file inventory rejects a duplicate writer and missing reference", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, ".github/workflows/extra.yaml"), canonical);
  await assert.rejects(checkWorkflow(root), /duplicate live writer/);
  await rm(join(root, ".github/workflows/extra.yaml"));
  await rm(join(root, "solutions/delivery.yml"));
  await assert.rejects(checkWorkflow(root), { code: "ENOENT" });
});

test("linked workflow directories are rejected instead of reading outside the selected root", async (t) => {
  const root = await fixture(t);
  const target = await fixture(t);
  await rm(join(root, ".github/workflows"), { recursive: true });
  await symlink(join(target, ".github/workflows"), join(root, ".github/workflows"), "junction");
  await assert.rejects(checkWorkflow(root), /must not be symbolic links/);
});

test("the CLI resolves its own repository, stays read-only and offers no bypass/update switch", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "ws2-checker-cwd-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const script = fileURLToPath(new URL("../scripts/check-workflow.mjs", import.meta.url));
  const before = await readWorkflowSources();
  const run = (args) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", shell: false });
  const passed = run([]); assert.equal(passed.status, 0, passed.stderr); assert.match(passed.stdout, /No Azure operations/);
  const blocked = run(["--update"]); assert.equal(blocked.status, 1); assert.match(blocked.stderr, /no update, skip or override/);
  assert.deepEqual(await readWorkflowSources(), before);
  assert.deepEqual(await readdir(cwd), []);
});
